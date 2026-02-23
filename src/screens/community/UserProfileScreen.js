/**
 * UserProfileScreen — View another user's public profile
 * Shows bio, stats, follow button, and their posts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import communityService from '../../services/communityService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

export default function UserProfileScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { uid, displayName: routeName } = route.params || {};
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (uid) loadProfile();
  }, [uid]);

  async function loadProfile() {
    setLoading(true);
    const [p, isFollowing] = await Promise.all([
      communityService.getUserProfile(uid),
      communityService.isFollowing(uid),
    ]);
    setProfile(p);
    setFollowing(isFollowing);
    setLoading(false);
  }

  const handleFollow = useCallback(async () => {
    setFollowLoading(true);
    if (following) {
      await communityService.unfollowUser(uid);
      setFollowing(false);
      if (profile) {
        setProfile(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev?.followersCount || 0) - 1),
        }));
      }
    } else {
      await communityService.followUser(uid);
      setFollowing(true);
      if (profile) {
        setProfile(prev => ({
          ...prev,
          followersCount: (prev?.followersCount || 0) + 1,
        }));
      }
    }
    setFollowLoading(false);
  }, [following, uid, profile]);

  const handleReport = useCallback(() => {
    Alert.alert(
      t('community.reportUser', 'Report User'),
      t(
        'community.reportUserConfirm',
        'Report this user for inappropriate behavior?',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('community.report', 'Report'),
          style: 'destructive',
          onPress: async () => {
            const ok = await communityService.reportUser(uid, {
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
  }, [uid, t]);

  const handleBlock = useCallback(() => {
    Alert.alert(
      t('community.blockUser', 'Block User'),
      t(
        'community.blockConfirm',
        'You will no longer see their posts. Continue?',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('community.block', 'Block'),
          style: 'destructive',
          onPress: async () => {
            await communityService.blockUser(uid);
            navigation.goBack();
          },
        },
      ],
    );
  }, [uid, navigation, t]);

  const renderPost = useCallback(
    ({ item }) => (
      <View style={styles.postCard}>
        <Text style={styles.postContent} numberOfLines={4}>
          {item.content}
        </Text>
        {item.catchData && (
          <View style={styles.catchEmbed}>
            <Text style={styles.catchSpecies}>{item.catchData.species}</Text>
            {item.catchData.weight && (
              <Text style={styles.catchDetail}>
                {item.catchData.weight} lbs
              </Text>
            )}
          </View>
        )}
        <View style={styles.postMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name="heart" size={14} color={colors.textTertiary} />
            <Text style={styles.postMetaText}>{item.likeCount || 0}</Text>
            <Text style={styles.postMetaText}> · </Text>
            <AppIcon name="messageCircle" size={14} color={colors.textTertiary} />
            <Text style={styles.postMetaText}>{item.commentCount || 0}</Text>
          </View>
          <Text style={styles.postDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          {t('community.profileNotFound', 'Profile not found')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            {t('common.goBack', 'Go Back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {profile.displayName}
        </Text>
        <TouchableOpacity onPress={handleReport} style={styles.menuBtn}>
          <Text style={styles.menuText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={profile.posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        ListHeaderComponent={() => (
          <>
            {/* Profile card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                {profile.photoURL ? (
                  <Image
                    source={{ uri: profile.photoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarLetter}>
                      {(profile.displayName || 'A')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>{profile.postCount || 0}</Text>
                    <Text style={styles.statLabel}>
                      {t('community.posts', 'Posts')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>
                      {profile.followersCount || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('community.followers', 'Followers')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>
                      {profile.followingCount || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('community.following', 'Following')}
                    </Text>
                  </View>
                </View>
              </View>

              {profile.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.followBtn, following && styles.followingBtn]}
                  onPress={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.followBtnText,
                        following && styles.followingBtnText,
                      ]}
                    >
                      {following
                        ? t('community.following', 'Following')
                        : t('community.follow', 'Follow')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.blockBtn} onPress={handleBlock}>
                  <Text style={styles.blockBtnText}>
                    {t('community.block', 'Block')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Posts header */}
            <Text style={styles.postsHeader}>
              {t('community.recentPosts', 'Recent Posts')}
            </Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyPostsText}>
              {t('community.noPosts', 'No posts yet')}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: colors.textTertiary, fontSize: 16 },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  menuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuText: { fontSize: 24, color: colors.textTertiary },
  listContent: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNum: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  followingBtnText: {
    color: colors.primary,
  },
  blockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#331111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockBtnText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  postsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  postCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
  },
  postContent: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  catchEmbed: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 12,
  },
  catchSpecies: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  catchDetail: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postMetaText: { color: colors.textTertiary, fontSize: 12 },
  postDate: { color: colors.textTertiary, fontSize: 12 },
  emptyPosts: {
    alignItems: 'center',
    padding: 40,
  },
  emptyPostsText: { color: colors.textTertiary, fontSize: 14 },
});
