/**
 * Offline Queue — ProFish
 * Queues Firestore writes when offline, syncs when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@profish_offline_queue';

const offlineQueue = {
  /**
   * Add an operation to the queue
   * @param {string} type - 'ADD_CATCH' | 'UPDATE_CATCH' | 'DELETE_CATCH' | 'ADD_SPOT'
   * @param {object} payload - Data to write
   */
  async enqueue(type, payload) {
    const queue = await this.getQueue();
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queue.length;
  },

  /**
   * Get all queued operations
   */
  async getQueue() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Get count of pending operations
   */
  async getPendingCount() {
    const queue = await this.getQueue();
    return queue.length;
  },

  /**
   * Process queue — call this when network is available
   * @param {object} handlers - { ADD_CATCH: fn, UPDATE_CATCH: fn, DELETE_CATCH: fn, ADD_SPOT: fn }
   * @returns {{ processed: number, failed: number, remaining: number }}
   */
  async processQueue(handlers) {
    const queue = await this.getQueue();
    if (queue.length === 0) return { processed: 0, failed: 0, remaining: 0 };

    let processed = 0;
    let failed = 0;
    const remaining = [];

    for (const item of queue) {
      const handler = handlers[item.type];
      if (!handler) {
        // Unknown type — discard
        continue;
      }

      try {
        await handler(item.payload);
        processed++;
      } catch (e) {
        item.retries++;
        if (item.retries < 5) {
          item.lastError = e.message;
          remaining.push(item);
        }
        failed++;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

    return { processed, failed, remaining: remaining.length };
  },

  /**
   * Clear the entire queue (after account deletion etc)
   */
  async clearQueue() {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  /**
   * Remove a specific item from the queue
   */
  async dequeue(itemId) {
    const queue = await this.getQueue();
    const filtered = queue.filter(q => q.id !== itemId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },
};

export default offlineQueue;
