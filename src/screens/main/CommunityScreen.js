/**
 * CommunityScreen — Social feed with infinite scroll
 * Post types: catch shares, tips, questions
 * Features: like, comment, share catch, post tip, post question
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import communityService, { POST_TYPES } from '../../services/communityService';

// ── Post Card Component ──────────────────────────────────
function PostCard({ post, onLike, onComment, onReport, onProfile, t }) {
  const isLiked = post._isLiked || false;
  const typeIcon =
    post.type === POST_TYPES.CATCH_SHARE
      ? '🐟'
      : post.type === POST_TYPES.TIP
      ? '💡'
      : '❓';

  return (
    <View style={styles.postCard}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <TouchableOpacity
          onPress={() => onProfile && onProfile(post.author?.uid)}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
        >
          {post.author?.photoURL ? (
            <Image
              source={{ uri: post.author.photoURL }}
              style={styles.authorAvatar}
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>🎣</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {post.author?.displayName || 'Angler'}
            </Text>
            <Text style={styles.postTime}>
              {typeIcon} {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReport && onReport(post.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ color: '#666', fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.postContent}>{post.content}</Text>
      ) : null}

      {/* Catch data card (for catch shares) */}
      {post.catchData && (
        <View style={styles.catchEmbed}>
          {post.catchData.photo && (
            <Image
              source={{ uri: post.catchData.photo }}
              style={styles.catchPhoto}
              resizeMode="cover"
            />
          )}
          <View style={styles.catchEmbedInfo}>
            <Text style={styles.catchSpecies}>
              {post.catchData.species || 'Unknown'}
            </Text>
            <View style={styles.catchStats}>
              {post.catchData.weight && (
                <Text style={styles.catchStat}>
                  ⚖️ {post.catchData.weight.toFixed(1)} kg
                </Text>
              )}
              {post.catchData.length && (
                <Text style={styles.catchStat}>
                  📏 {post.catchData.length.toFixed(0)} cm
                </Text>
              )}
              {post.catchData.bait && (
                <Text style={styles.catchStat}>🪝 {post.catchData.bait}</Text>
              )}
            </View>
            {post.catchData.released && (
              <Text style={styles.releasedTag}>
                🏷️ {t('community.released', 'Catch & Release')}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Media (non-catch photos) */}
      {!post.catchData &&
        post.media &&
        post.media.length > 0 &&
        post.media[0].uri && (
          <Image
            source={{ uri: post.media[0].uri }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

      {/* Location */}
      {post.location?.name ? (
        <Text style={styles.postLocation}>📍 {post.location.name}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
        >
          <Text style={[styles.actionIcon, isLiked && styles.actionLiked]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.actionText, isLiked && styles.actionLiked]}>
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────
export default function CommunityScreen({ navigation }) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState(POST_TYPES.TIP);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      const feed = await communityService.getFeed({ refresh: true });
      setPosts(feed);
      setHasMore(feed.length >= 20);
    } catch (e) {
      console.warn('[Community] Load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed();
  }, [loadFeed]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await communityService.loadMore();
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...more]);
      }
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const handleLike = useCallback(async postId => {
    // Optimistic UI update
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const wasLiked = p._isLiked;
        return {
          ...p,
          _isLiked: !wasLiked,
          likeCount: wasLiked
            ? Math.max(0, (p.likeCount || 0) - 1)
            : (p.likeCount || 0) + 1,
        };
      }),
    );
    await communityService.toggleLike(postId);
  }, []);

  const handleComment = useCallback(
    post => {
      Alert.prompt
        ? Alert.prompt(
            t('community.addComment', 'Add Comment'),
            '',
            async text => {
              if (text?.trim()) {
                await communityService.addComment(post.id, text);
                setPosts(prev =>
                  prev.map(p =>
                    p.id === post.id
                      ? { ...p, commentCount: (p.commentCount || 0) + 1 }
                      : p,
                  ),
                );
              }
            },
          )
        : Alert.alert(
            t('community.comments', 'Comments'),
            t('community.commentComingSoon', 'Full comments coming soon!'),
          );
    },
    [t],
  );

  const handlePost = useCallback(async () => {
    if (!composeText.trim()) return;
    setPosting(true);
    try {
      if (composeType === POST_TYPES.TIP) {
        await communityService.postTip({ content: composeText });
      } else {
        await communityService.postQuestion({ content: composeText });
      }
      setComposeText('');
      setShowCompose(false);
      loadFeed();
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message);
    } finally {
      setPosting(false);
    }
  }, [composeText, composeType, loadFeed, t]);

  const handleReport = useCallback(
    postId => {
      Alert.alert(
        t('community.reportPost', 'Report Post'),
        t('community.reportPostConfirm', 'Report this post as inappropriate?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('community.report', 'Report'),
            style: 'destructive',
            onPress: async () => {
              const ok = await communityService.reportPost(postId, {
                reason: 'inappropriate',
              });
              if (ok) {
                Alert.alert(
                  t('community.reported', 'Reported'),
                  t(
                    'community.reportedDesc',
                    'Thank you. We will review this report.',
                  ),
                );
              }
            },
          },
        ],
      );
    },
    [t],
  );

  const handleProfile = useCallback(
    uid => {
      if (uid) {
        navigation.navigate('UserProfile', { uid });
      }
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        onReport={handleReport}
        onProfile={handleProfile}
        t={t}
      />
    ),
    [handleLike, handleComment, handleReport, handleProfile, t],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#0080FF" />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎣</Text>
          <Text style={styles.emptyTitle}>
            {t('community.emptyTitle', 'No Posts Yet')}
          </Text>
          <Text style={styles.emptyText}>
            {t(
              'community.emptyText',
              'Be the first to share a catch or tip with the community!',
            )}
          </Text>
        </View>
      ) : null,
    [loading, t],
  );

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('community.title', 'Community')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => navigation.navigate('Leaderboard')}
            accessibilityLabel={t('leaderboard.title', 'Leaderboard')}
            accessibilityRole="button"
          >
            <Text style={styles.composeBtnText}>🏆</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => setShowCompose(true)}
            accessibilityLabel={t('community.newPost', 'New post')}
            accessibilityRole="button"
          >
            <Text style={styles.composeBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Post type filters */}
      <View style={styles.typeRow}>
        <TouchableOpacity style={styles.typeChip}>
          <Text style={styles.typeChipText}>
            {t('community.all', '🌊 All')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.typeChip}>
          <Text style={styles.typeChipText}>
            {t('community.catches', '🐟 Catches')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.typeChip}>
          <Text style={styles.typeChipText}>
            {t('community.tips', '💡 Tips')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.typeChip}>
          <Text style={styles.typeChipText}>
            {t('community.questions', '❓ Q&A')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0080FF"
          />
        }
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.composeOverlay}
        >
          <View style={styles.composeSheet}>
            <View style={styles.composeHeader}>
              <TouchableOpacity onPress={() => setShowCompose(false)}>
                <Text style={styles.composeCancel}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.composeTitle}>
                {t('community.newPost', 'New Post')}
              </Text>
              <TouchableOpacity onPress={handlePost} disabled={posting}>
                <Text style={[styles.composePost, posting && { opacity: 0.5 }]}>
                  {posting ? '...' : t('community.post', 'Post')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Post type selector */}
            <View style={styles.composeTypeRow}>
              <TouchableOpacity
                style={[
                  styles.composeTypeBtn,
                  composeType === POST_TYPES.TIP && styles.composeTypeBtnActive,
                ]}
                onPress={() => setComposeType(POST_TYPES.TIP)}
              >
                <Text style={styles.composeTypeText}>
                  💡 {t('community.tip', 'Tip')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.composeTypeBtn,
                  composeType === POST_TYPES.QUESTION &&
                    styles.composeTypeBtnActive,
                ]}
                onPress={() => setComposeType(POST_TYPES.QUESTION)}
              >
                <Text style={styles.composeTypeText}>
                  ❓ {t('community.question', 'Question')}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.composeInput}
              placeholder={
                composeType === POST_TYPES.TIP
                  ? t('community.tipPlaceholder', 'Share a fishing tip...')
                  : t('community.questionPlaceholder', 'Ask the community...')
              }
              placeholderTextColor="#555"
              value={composeText}
              onChangeText={setComposeText}
              multiline
              autoFocus
              maxLength={1000}
            />
            <Text style={styles.charCount}>{composeText.length}/1000</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  centerLoader: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0080FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeBtnText: { fontSize: 18 },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
  },
  typeChipText: { color: '#ccc', fontSize: 13 },
  feedContent: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },

  // Post Card
  postCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20 },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: { fontSize: 18 },
  authorInfo: { marginLeft: 10, flex: 1 },
  authorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  postTime: { color: '#666', fontSize: 12, marginTop: 2 },
  postContent: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  catchEmbed: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  catchPhoto: { width: '100%', height: 200 },
  catchEmbedInfo: { padding: 12 },
  catchSpecies: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  catchStats: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  catchStat: { color: '#0080FF', fontSize: 13, fontWeight: '600' },
  releasedTag: { color: '#4CAF50', fontSize: 12, marginTop: 4 },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postLocation: { color: '#888', fontSize: 12, marginBottom: 8 },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 16 },
  actionText: { color: '#888', fontSize: 13 },
  actionLiked: { color: '#F44336' },

  // Compose Modal
  composeOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  composeSheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  composeCancel: { color: '#888', fontSize: 16 },
  composeTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  composePost: { color: '#0080FF', fontSize: 16, fontWeight: '700' },
  composeTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  composeTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
  },
  composeTypeBtnActive: {
    backgroundColor: '#0080FF20',
    borderWidth: 1,
    borderColor: '#0080FF',
  },
  composeTypeText: { color: '#ccc', fontSize: 14 },
  composeInput: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    color: '#555',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});
