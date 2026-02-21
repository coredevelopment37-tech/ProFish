/**
 * NotificationCenterScreen — ProFish
 *
 * In-app notification center showing recent notifications
 * with type icons, read/unread state, swipe-to-delete,
 * and bulk mark-all-read.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import notificationService from '../../services/notificationService';

const TYPE_CONFIG = {
  follower: { icon: '👤', color: '#4A90D9' },
  comment: { icon: '💬', color: '#50C878' },
  like: { icon: '❤️', color: '#FF6B6B' },
  fishcast: { icon: '🎯', color: '#FFB347' },
  leaderboard: { icon: '🏆', color: '#FFD700' },
  system: { icon: '🔔', color: '#888' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function NotificationCenterScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(() => {
    const all = notificationService.getNotifications();
    setNotifications(all);
  }, []);

  useEffect(() => {
    loadNotifications();
    const unsub = notificationService.addListener(() => loadNotifications());
    return unsub;
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handlePress = useCallback(
    item => {
      notificationService.markAsRead(item.id);

      // Navigate based on type
      switch (item.type) {
        case 'follower':
          if (item.data?.followerUid) {
            navigation.navigate('UserProfile', {
              userId: item.data.followerUid,
            });
          }
          break;
        case 'comment':
        case 'like':
          // Navigate to community post
          navigation.navigate('MainTabs', { screen: 'Community' });
          break;
        case 'fishcast':
          navigation.navigate('MainTabs', { screen: 'FishCast' });
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  const handleDelete = useCallback(id => {
    notificationService.deleteNotification(id);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const handleClearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = useCallback(
    ({ item }) => {
      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
      return (
        <TouchableOpacity
          style={[styles.item, !item.read && styles.itemUnread]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleDelete(item.id)}
          accessibilityLabel={`${item.title}: ${item.body}`}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: config.color + '22' },
            ]}
          >
            <Text style={styles.icon}>{config.icon}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            {!item.read && (
              <View style={[styles.dot, { backgroundColor: config.color }]} />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress, handleDelete],
  );

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationPrefs')}
        >
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Action bar */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleClearAll} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: '#FF6B6B' }]}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification list */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0 && styles.emptyContainer
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You&apos;re all caught up! Notifications about followers,
              comments, and FishCast alerts will appear here.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0080FF"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#1a1a2e',
  },
  backBtn: { padding: 8 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  gearIcon: { fontSize: 20 },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  actionBtn: { padding: 4 },
  actionText: { color: '#0080FF', fontSize: 13, fontWeight: '600' },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  itemUnread: {
    backgroundColor: '#0080FF08',
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 20 },

  content: { flex: 1, marginRight: 8 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  body: { color: '#aaa', fontSize: 13, lineHeight: 18 },

  meta: { alignItems: 'flex-end', gap: 4 },
  time: { color: '#666', fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
