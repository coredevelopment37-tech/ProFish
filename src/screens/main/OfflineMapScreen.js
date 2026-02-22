/**
 * OfflineMapScreen — ProFish (#142-146)
 *
 * Features:
 *   - UI for downloading offline region packs (#142)
 *   - Download progress bar (#143)
 *   - List downloaded packs with delete option (#144)
 *   - Auto-download home region on Pro subscribe (#145)
 *   - Cap offline pack size 500MB, warn at 80% (#146)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import offlineManager from '../../services/offlineManager';
import subscriptionService from '../../services/subscriptionService';
import regionGatingService from '../../services/regionGatingService';
import { canAccess, requireFeature } from '../../services/featureGate';
import { MAP } from '../../config/constants';

const MAX_STORAGE_MB = MAP.MAX_OFFLINE_PACK_SIZE_MB || 500;
const WARN_THRESHOLD = 0.8; // 80%

// ── Predefined region packs ─────────────────────────────

const REGION_PACKS = [
  {
    id: 'na_east',
    name: 'North America — East Coast',
    region: 'NA',
    bounds: { sw: { lat: 24.5, lng: -87.6 }, ne: { lat: 47.0, lng: -66.9 } },
    estimatedMB: 120,
  },
  {
    id: 'na_west',
    name: 'North America — West Coast',
    region: 'NA',
    bounds: { sw: { lat: 32.5, lng: -124.8 }, ne: { lat: 49.0, lng: -117.0 } },
    estimatedMB: 95,
  },
  {
    id: 'na_gulf',
    name: 'North America — Gulf of Mexico',
    region: 'NA',
    bounds: { sw: { lat: 18.0, lng: -98.0 }, ne: { lat: 31.0, lng: -80.0 } },
    estimatedMB: 110,
  },
  {
    id: 'eu_mediterranean',
    name: 'Europe — Mediterranean',
    region: 'EU',
    bounds: { sw: { lat: 30.0, lng: -6.0 }, ne: { lat: 46.0, lng: 36.2 } },
    estimatedMB: 140,
  },
  {
    id: 'eu_atlantic',
    name: 'Europe — Atlantic',
    region: 'EU',
    bounds: { sw: { lat: 43.0, lng: -10.0 }, ne: { lat: 60.0, lng: 3.0 } },
    estimatedMB: 110,
  },
  {
    id: 'nordics',
    name: 'Scandinavia & Baltic',
    region: 'NORDICS',
    bounds: { sw: { lat: 54.0, lng: 4.0 }, ne: { lat: 71.2, lng: 31.6 } },
    estimatedMB: 130,
  },
  {
    id: 'sea',
    name: 'Southeast Asia',
    region: 'SEA',
    bounds: { sw: { lat: -11.0, lng: 92.0 }, ne: { lat: 23.5, lng: 142.0 } },
    estimatedMB: 160,
  },
  {
    id: 'oc',
    name: 'Australia & New Zealand',
    region: 'OC',
    bounds: { sw: { lat: -47.0, lng: 112.0 }, ne: { lat: -10.0, lng: 179.0 } },
    estimatedMB: 150,
  },
  {
    id: 'sa_brazil',
    name: 'South America — Brazil Coast',
    region: 'SA',
    bounds: { sw: { lat: -33.8, lng: -53.1 }, ne: { lat: -1.0, lng: -34.0 } },
    estimatedMB: 100,
  },
  {
    id: 'gcc',
    name: 'Gulf States — Arabian Gulf',
    region: 'GCC',
    bounds: { sw: { lat: 22.0, lng: 48.0 }, ne: { lat: 30.5, lng: 60.0 } },
    estimatedMB: 45,
  },
  {
    id: 'ea_japan',
    name: 'Japan & Korea',
    region: 'EA',
    bounds: { sw: { lat: 30.0, lng: 124.0 }, ne: { lat: 46.0, lng: 146.0 } },
    estimatedMB: 90,
  },
  {
    id: 'af_south',
    name: 'Southern Africa',
    region: 'AF',
    bounds: { sw: { lat: -35.0, lng: 16.0 }, ne: { lat: -22.0, lng: 41.0 } },
    estimatedMB: 55,
  },
];

export default function OfflineMapScreen({ navigation }) {
  const { t } = useTranslation();
  const [downloadedPacks, setDownloadedPacks] = useState([]);
  const [downloading, setDownloading] = useState({}); // { packId: progress }
  const [loading, setLoading] = useState(true);
  const [totalSizeMB, setTotalSizeMB] = useState(0);

  useEffect(() => {
    loadPacks();
  }, []);

  // Auto-download home region on Pro subscribe (#145)
  useEffect(() => {
    checkAutoDownload();
  }, []);

  async function loadPacks() {
    setLoading(true);
    try {
      await offlineManager.init();
      const packs = await offlineManager.getPacks();
      setDownloadedPacks(packs);
      const total = packs.reduce((sum, p) => sum + (p.sizeMB || 0), 0);
      setTotalSizeMB(total);
    } catch (e) {
      console.warn('[OfflineMap] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function checkAutoDownload() {
    try {
      const isPro = subscriptionService.isPro();
      if (!isPro) return;

      const { region } = regionGatingService.detect();
      if (!region) return;

      const packs = await offlineManager.getPacks();
      const homeRegion = REGION_PACKS.find(p => p.region === region);
      if (!homeRegion) return;

      const alreadyDownloaded = packs.some(p => p.name === homeRegion.name);
      if (alreadyDownloaded) return;

      // Auto-download home region
      handleDownload(homeRegion);
    } catch {}
  }

  async function handleDownload(regionPack) {
    // Feature gate (#142)
    if (!canAccess('offlineMaps')) {
      const upgrade = await requireFeature('offlineMaps');
      if (upgrade) navigation.navigate('Paywall');
      return;
    }

    // Storage cap check (#146)
    const projectedTotal = totalSizeMB + regionPack.estimatedMB;
    if (projectedTotal > MAX_STORAGE_MB) {
      Alert.alert(
        '⚠️ Storage Limit',
        `This pack would exceed the ${MAX_STORAGE_MB}MB limit. Delete existing packs to free space.`,
      );
      return;
    }

    // Warn at 80% (#146)
    if (projectedTotal > MAX_STORAGE_MB * WARN_THRESHOLD) {
      const proceed = await new Promise(resolve => {
        Alert.alert(
          '⚠️ Storage Warning',
          `You're using ${Math.round(
            (projectedTotal / MAX_STORAGE_MB) * 100,
          )}% of your ${MAX_STORAGE_MB}MB offline storage.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Download Anyway', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    // Start download (#143)
    setDownloading(prev => ({ ...prev, [regionPack.id]: 0 }));

    try {
      const pack = await offlineManager.downloadPack({
        name: regionPack.name,
        bounds: regionPack.bounds,
        minZoom: 6,
        maxZoom: 14,
      });

      // Listen for progress
      offlineManager.onProgress(pack.id, progress => {
        setDownloading(prev => ({ ...prev, [regionPack.id]: progress }));
        if (progress >= 100) {
          setDownloading(prev => {
            const next = { ...prev };
            delete next[regionPack.id];
            return next;
          });
          loadPacks(); // Refresh list
        }
      });
    } catch (e) {
      Alert.alert('Download Failed', e.message || 'Please try again later.');
      setDownloading(prev => {
        const next = { ...prev };
        delete next[regionPack.id];
        return next;
      });
    }
  }

  async function handleDelete(pack) {
    Alert.alert('Delete Pack?', `Remove "${pack.name}" from offline storage?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await offlineManager.deletePack(pack.id);
          loadPacks();
        },
      },
    ]);
  }

  const storagePercent = Math.round((totalSizeMB / MAX_STORAGE_MB) * 100);
  const isNearLimit = storagePercent >= WARN_THRESHOLD * 100;

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
        <Text style={styles.title}>
          {t('offlineMaps.title', 'Offline Maps')}
        </Text>
      </View>

      {/* Storage bar (#146) */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageLabel}>
            {t('offlineMaps.storage', 'Storage Used')}
          </Text>
          <Text
            style={[styles.storageValue, isNearLimit && styles.storageWarning]}
          >
            {totalSizeMB}MB / {MAX_STORAGE_MB}MB
          </Text>
        </View>
        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageFill,
              { width: `${Math.min(storagePercent, 100)}%` },
              isNearLimit && styles.storageFillWarning,
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Downloaded packs (#144) */}
        {downloadedPacks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📥 {t('offlineMaps.downloaded', 'Downloaded Packs')}
            </Text>
            {downloadedPacks.map(pack => (
              <View key={pack.id} style={styles.packCard}>
                <View style={styles.packInfo}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packMeta}>
                    {pack.status === 'complete' ? '✓ Ready' : pack.status} •{' '}
                    {pack.sizeMB || '~'}MB
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(pack)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Available region packs (#142) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🌍 {t('offlineMaps.available', 'Available Regions')}
          </Text>
          {REGION_PACKS.map(regionPack => {
            const isDownloaded = downloadedPacks.some(
              p => p.name === regionPack.name,
            );
            const progress = downloading[regionPack.id];
            const isDownloading = progress !== undefined;

            return (
              <View key={regionPack.id} style={styles.regionCard}>
                <View style={styles.regionInfo}>
                  <Text style={styles.regionName}>{regionPack.name}</Text>
                  <Text style={styles.regionSize}>
                    ~{regionPack.estimatedMB}MB
                  </Text>
                </View>

                {isDownloading ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                ) : isDownloaded ? (
                  <View style={styles.downloadedBadge}>
                    <Text style={styles.downloadedText}>✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(regionPack)}
                  >
                    <Text style={styles.downloadBtnText}>↓</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 8 },

  storageCard: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: { color: '#888', fontSize: 13 },
  storageValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  storageWarning: { color: '#FF9800' },
  storageBar: {
    height: 8,
    backgroundColor: '#0a0a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageFill: {
    height: 8,
    backgroundColor: '#0080FF',
    borderRadius: 4,
  },
  storageFillWarning: { backgroundColor: '#FF9800' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  section: { marginBottom: 20 },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  packInfo: { flex: 1 },
  packName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  packMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 18 },

  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  regionInfo: { flex: 1 },
  regionName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  regionSize: { color: '#888', fontSize: 12, marginTop: 2 },

  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0080FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  downloadedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76,175,80,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadedText: { color: '#4CAF50', fontSize: 18, fontWeight: '700' },

  progressContainer: { alignItems: 'center', width: 80 },
  progressBar: {
    height: 6,
    width: 60,
    backgroundColor: '#0a0a1a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#0080FF',
    borderRadius: 3,
  },
  progressText: { color: '#0080FF', fontSize: 10, fontWeight: '600' },
});
