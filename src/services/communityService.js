/**
 * Community Service — ProFish
 *
 * Social feed with Firestore-backed posts, likes, comments.
 * Data model: posts/{postId} with author, content, media, location,
 * species, likes, comments, timestamps.
 *
 * Post types: catch_share, tip, question
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_FEED_KEY = '@profish_community_feed';
const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Post Data Model ──────────────────────────────────────

export const POST_TYPES = {
  CATCH_SHARE: 'catch_share',
  TIP: 'tip',
  QUESTION: 'question',
};

export function createPost({
  type = POST_TYPES.CATCH_SHARE,
  content = '',
  media = [],
  species = '',
  catchId = null,
  catchData = null,
  location = null,
  tags = [],
}) {
  const user = auth?.().currentUser;
  return {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    author: {
      uid: user?.uid || 'anonymous',
      displayName: user?.displayName || 'Angler',
      photoURL: user?.photoURL || null,
    },
    content,
    media, // Array of { uri, width, height }
    species,
    catchId,
    catchData, // Embedded catch snapshot: { species, weight, length, photo, bait, method }
    location, // { latitude, longitude, name }
    tags,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const communityService = {
  _feedCache: null,
  _lastFetch: 0,
  _lastDoc: null, // Cursor for pagination

  /**
   * Get feed posts with cursor-based pagination
   */
  async getFeed({ limit = 20, refresh = false } = {}) {
    // If refreshing, reset cursor
    if (refresh) {
      this._lastDoc = null;
      this._feedCache = null;
    }

    // Return cache if fresh
    if (
      !refresh &&
      this._feedCache &&
      Date.now() - this._lastFetch < FEED_CACHE_TTL
    ) {
      return this._feedCache;
    }

    if (!firestore) {
      // Fallback: return cached feed from AsyncStorage
      return this._loadLocalFeed();
    }

    try {
      let query = firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (this._lastDoc) {
        query = query.startAfter(this._lastDoc);
      }

      const snapshot = await query.get();
      const posts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      if (snapshot.docs.length > 0) {
        this._lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      if (refresh || !this._feedCache) {
        this._feedCache = posts;
      } else {
        this._feedCache = [...this._feedCache, ...posts];
      }

      this._lastFetch = Date.now();

      // Cache locally
      await this._saveLocalFeed(this._feedCache.slice(0, 50));

      return this._feedCache;
    } catch (e) {
      console.warn('[Community] Feed fetch error:', e);
      return this._loadLocalFeed();
    }
  },

  /**
   * Load more posts (next page)
   */
  async loadMore({ limit = 20 } = {}) {
    if (!firestore || !this._lastDoc) return [];

    try {
      const snapshot = await firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .startAfter(this._lastDoc)
        .limit(limit)
        .get();

      const posts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      if (snapshot.docs.length > 0) {
        this._lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      if (this._feedCache) {
        this._feedCache = [...this._feedCache, ...posts];
      }

      return posts;
    } catch (e) {
      console.warn('[Community] Load more error:', e);
      return [];
    }
  },

  /**
   * Create a new post
   */
  async createPost(postData) {
    const post = createPost(postData);

    if (firestore) {
      try {
        await firestore().collection('posts').doc(post.id).set(post);
      } catch (e) {
        console.warn('[Community] Post creation error:', e);
        // Store locally for later sync
        await this._queuePost(post);
      }
    } else {
      await this._queuePost(post);
    }

    // Prepend to local cache
    if (this._feedCache) {
      this._feedCache = [post, ...this._feedCache];
    }

    return post;
  },

  /**
   * Share a catch as a community post
   */
  async shareCatch(catchItem, content = '') {
    const post = await this.createPost({
      type: POST_TYPES.CATCH_SHARE,
      content:
        content ||
        `Caught a ${catchItem.species}! ${
          catchItem.weight ? `${catchItem.weight} kg` : ''
        }`,
      media: catchItem.photo ? [{ uri: catchItem.photo }] : [],
      species: catchItem.species,
      catchId: catchItem.id,
      catchData: {
        species: catchItem.species,
        weight: catchItem.weight,
        length: catchItem.length,
        photo: catchItem.photo,
        bait: catchItem.bait,
        method: catchItem.method,
        waterType: catchItem.waterType,
        released: catchItem.released,
      },
      location:
        catchItem.latitude && catchItem.longitude
          ? {
              latitude: catchItem.latitude,
              longitude: catchItem.longitude,
              name: catchItem.locationName || '',
            }
          : null,
    });

    return post;
  },

  /**
   * Create a tip post
   */
  async postTip({ content, species = '', tags = [], photo = null }) {
    return this.createPost({
      type: POST_TYPES.TIP,
      content,
      species,
      tags,
      media: photo ? [{ uri: photo }] : [],
    });
  },

  /**
   * Create a question post
   */
  async postQuestion({ content, species = '', tags = [] }) {
    return this.createPost({
      type: POST_TYPES.QUESTION,
      content,
      species,
      tags,
    });
  },

  /**
   * Toggle like on a post (optimistic UI)
   */
  async toggleLike(postId) {
    const user = auth?.().currentUser;
    if (!user) return;

    if (firestore) {
      try {
        const postRef = firestore().collection('posts').doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) return;

        const data = postDoc.data();
        const likes = data.likes || [];
        const isLiked = likes.includes(user.uid);

        if (isLiked) {
          await postRef.update({
            likes: firestore.FieldValue.arrayRemove(user.uid),
            likeCount: firestore.FieldValue.increment(-1),
          });
        } else {
          await postRef.update({
            likes: firestore.FieldValue.arrayUnion(user.uid),
            likeCount: firestore.FieldValue.increment(1),
          });
        }

        // Update local cache
        if (this._feedCache) {
          const cached = this._feedCache.find(p => p.id === postId);
          if (cached) {
            if (isLiked) {
              cached.likes = cached.likes.filter(uid => uid !== user.uid);
              cached.likeCount = Math.max(0, (cached.likeCount || 0) - 1);
            } else {
              cached.likes = [...(cached.likes || []), user.uid];
              cached.likeCount = (cached.likeCount || 0) + 1;
            }
          }
        }

        return !isLiked;
      } catch (e) {
        console.warn('[Community] Like error:', e);
      }
    }
  },

  /**
   * Add a comment to a post
   */
  async addComment(postId, text) {
    const user = auth?.().currentUser;
    if (!user || !text.trim()) return null;

    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorUid: user.uid,
      authorName: user.displayName || 'Angler',
      authorPhoto: user.photoURL || null,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    if (firestore) {
      try {
        await firestore()
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(comment.id)
          .set(comment);

        await firestore()
          .collection('posts')
          .doc(postId)
          .update({
            commentCount: firestore.FieldValue.increment(1),
          });

        // Update local cache
        if (this._feedCache) {
          const cached = this._feedCache.find(p => p.id === postId);
          if (cached) {
            cached.commentCount = (cached.commentCount || 0) + 1;
          }
        }
      } catch (e) {
        console.warn('[Community] Comment error:', e);
      }
    }

    return comment;
  },

  /**
   * Get comments for a post
   */
  async getComments(postId, { limit = 50 } = {}) {
    if (!firestore) return [];

    try {
      const snapshot = await firestore()
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .orderBy('createdAt', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (e) {
      console.warn('[Community] Comments fetch error:', e);
      return [];
    }
  },

  /**
   * Get user's own posts
   */
  async getMyPosts({ limit = 50 } = {}) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return [];

    try {
      const snapshot = await firestore()
        .collection('posts')
        .where('author.uid', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (e) {
      console.warn('[Community] My posts error:', e);
      return [];
    }
  },

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return;

    try {
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();
      if (postDoc.exists && postDoc.data().author?.uid === user.uid) {
        await postRef.delete();
      }

      // Remove from cache
      if (this._feedCache) {
        this._feedCache = this._feedCache.filter(p => p.id !== postId);
      }
    } catch (e) {
      console.warn('[Community] Delete error:', e);
    }
  },

  // ── Internal ──────────────────────────────────────────

  async _loadLocalFeed() {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_FEED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async _saveLocalFeed(posts) {
    try {
      await AsyncStorage.setItem(LOCAL_FEED_KEY, JSON.stringify(posts));
    } catch {}
  },

  async _queuePost(post) {
    try {
      const key = '@profish_post_queue';
      const stored = await AsyncStorage.getItem(key);
      const queue = stored ? JSON.parse(stored) : [];
      queue.push(post);
      await AsyncStorage.setItem(key, JSON.stringify(queue));
    } catch {}
  },
};

export default communityService;
