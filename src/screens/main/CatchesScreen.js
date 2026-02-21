/**
 * CatchesScreen — Catch log list view
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';

export default function CatchesScreen({ navigation }) {
  const { t } = useTranslation();
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    await catchService.init();
    const data = await catchService.getCatches();
    setCatches(data);
    setLoading(false);
  }

  function renderCatch({ item }) {
    return (
      <TouchableOpacity style={styles.card}>
        <Text style={styles.species}>
          {item.species || t('catches.unknownSpecies', 'Unknown species')}
        </Text>
        <View style={styles.row}>
          {item.weight && <Text style={styles.detail}>{item.weight} kg</Text>}
          {item.length && <Text style={styles.detail}>{item.length} cm</Text>}
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  }

  if (catches.length === 0 && !loading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🎣</Text>
        <Text style={styles.emptyTitle}>
          {t('catches.empty', 'No catches yet')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t(
            'catches.emptyHint',
            'Tap the fish button on the map to log your first catch!',
          )}
        </Text>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => navigation.navigate('LogCatch')}
        >
          <Text style={styles.logButtonText}>
            {t('catches.logFirst', 'Log First Catch')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('catches.title', 'My Catches')}</Text>
      <FlatList
        data={catches}
        renderItem={renderCatch}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  list: { padding: 16 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  species: { fontSize: 18, fontWeight: '600', color: '#fff' },
  row: { flexDirection: 'row', marginTop: 8, gap: 16 },
  detail: { fontSize: 14, color: '#0080FF' },
  date: { fontSize: 12, color: '#666', marginTop: 8 },
  empty: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  logButton: {
    backgroundColor: '#0080FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
