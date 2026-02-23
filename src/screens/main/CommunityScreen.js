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
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

// ── Post Card Component ──────────────────────────────────
function PostCard({ post, onLike, onComment, onReport, onProfile, t, styles, colors }) {
  const isLiked = post._isLiked || false;
  const typeIconName =
    post.type === POST_TYPES.CATCH_SHARE
      ? 'fish'
      : post.type === POST_TYPES.TIP
      ? 'lightbulb'
      : 'helpCircle';

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
              <AppIcon name="fish" size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {post.author?.displayName || 'Angler'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppIcon name={typeIconName} size={12} color={colors.textTertiary} />
              <Text style={styles.postTime}>
                {formatTimeAgo(post.createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReport && onReport(post.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>⋯</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <AppIcon name="scale" size={13} color={colors.primary} />
                  <Text style={styles.catchStat}>
                    {post.catchData.weight.toFixed(1)} kg
                  </Text>
                </View>
              )}
              {post.catchData.length && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <AppIcon name="ruler" size={13} color={colors.primary} />
                  <Text style={styles.catchStat}>
                    {post.catchData.length.toFixed(0)} cm
                  </Text>
                </View>
              )}
              {post.catchData.bait && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <AppIcon name="anchor" size={13} color={colors.primary} />
                  <Text style={styles.catchStat}>{post.catchData.bait}</Text>
                </View>
              )}
            </View>
            {post.catchData.released && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppIcon name="fish" size={12} color={colors.success} />
                <Text style={styles.releasedTag}>
                  {t('community.released', 'Catch & Release')}
                </Text>
              </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <AppIcon name="mapPin" size={14} color={colors.textTertiary} />
          <Text style={styles.postLocation}>{post.location.name}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
        >
          <AppIcon
            name="heart"
            size={18}
            color={isLiked ? colors.error : colors.textTertiary}
            fill={isLiked ? colors.error : 'none'}
          />
          <Text style={[styles.actionText, isLiked && styles.actionLiked]}>
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post)}
        >
          <AppIcon name="messageCircle" size={18} color={colors.textTertiary} />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────
export default function CommunityScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
        styles={styles}
        colors={colors}
      />
    ),
    [handleLike, handleComment, handleReport, handleProfile, t],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <View style={styles.emptyState}>
          <AppIcon name="fish" size={48} color={colors.textTertiary} />
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
        <ActivityIndicator size="large" color={colors.primary} />
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
            onPress={() => navigation.navigate('NotificationCenter')}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <AppIcon name="bell" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => navigation.navigate('Leaderboard')}
            accessibilityLabel={t('leaderboard.title', 'Leaderboard')}
            accessibilityRole="button"
          >
            <AppIcon name="trophy" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => setShowCompose(true)}
            accessibilityLabel={t('community.newPost', 'New post')}
            accessibilityRole="button"
          >
            <AppIcon name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post type filters */}
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <AppIcon name="waves" size={14} color={colors.textSecondary} />
          <Text style={styles.typeChipText}>
            {t('community.all', 'All')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <AppIcon name="fish" size={14} color={colors.textSecondary} />
          <Text style={styles.typeChipText}>
            {t('community.catches', 'Catches')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <AppIcon name="lightbulb" size={14} color={colors.textSecondary} />
          <Text style={styles.typeChipText}>
            {t('community.tips', 'Tips')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <AppIcon name="helpCircle" size={14} color={colors.textSecondary} />
          <Text style={styles.typeChipText}>
            {t('community.questions', 'Q&A')}
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
            tintColor={colors.primary}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppIcon name="lightbulb" size={16} color={colors.textSecondary} />
                  <Text style={styles.composeTypeText}>
                    {t('community.tip', 'Tip')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.composeTypeBtn,
                  composeType === POST_TYPES.QUESTION &&
                    styles.composeTypeBtnActive,
                ]}
                onPress={() => setComposeType(POST_TYPES.QUESTION)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppIcon name="helpCircle" size={16} color={colors.textSecondary} />
                  <Text style={styles.composeTypeText}>
                    {t('community.question', 'Question')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.composeInput}
              placeholder={
                composeType === POST_TYPES.TIP
                  ? t('community.tipPlaceholder', 'Share a fishing tip...')
                  : t('community.questionPlaceholder', 'Ask the community...')
              }
              placeholderTextColor={colors.textDisabled}
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

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerLoader: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.surface,
  },
  typeChipText: { color: colors.textSecondary, fontSize: 13 },
  feedContent: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: colors.textTertiary, textAlign: 'center' },

  // Post Card
  postCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: { fontSize: 18 },
  authorInfo: { marginLeft: 10, flex: 1 },
  authorName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  postTime: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  postContent: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  catchEmbed: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  catchPhoto: { width: '100%', height: 200 },
  catchEmbedInfo: { padding: 12 },
  catchSpecies: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  catchStats: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  catchStat: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  releasedTag: { color: colors.success, fontSize: 12, marginTop: 4 },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postLocation: { color: colors.textTertiary, fontSize: 12 },
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 16 },
  actionText: { color: colors.textTertiary, fontSize: 13 },
  actionLiked: { color: colors.error },

  // Compose Modal
  composeOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  composeSheet: {
    backgroundColor: colors.surface,
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
  composeCancel: { color: colors.textTertiary, fontSize: 16 },
  composeTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  composePost: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  composeTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  composeTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  composeTypeBtnActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  composeTypeText: { color: colors.textSecondary, fontSize: 14 },
  composeInput: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    color: colors.textDisabled,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});
