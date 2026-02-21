/**
 * SpeciesDetailScreen — Fish species information
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import speciesDatabase from '../../services/speciesDatabase';

export default function SpeciesDetailScreen({ route }) {
  const { t } = useTranslation();
  const { speciesId } = route.params || {};
  const species = speciesDatabase.getById(speciesId);

  if (!species) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          {t('species.notFound', 'Species not found')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{species.id.replace(/_/g, ' ')}</Text>
        <Text style={styles.scientific}>{species.scientific}</Text>
      </View>

      <View style={styles.section}>
        <DetailRow
          label={t('species.family', 'Family')}
          value={species.family}
        />
        <DetailRow
          label={t('species.habitat', 'Habitat')}
          value={species.habitat}
        />
        <DetailRow
          label={t('species.regions', 'Regions')}
          value={species.regions.join(', ')}
        />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { padding: 20, paddingTop: 60, alignItems: 'center' },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  scientific: { fontSize: 16, color: '#888', fontStyle: 'italic' },
  section: { padding: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  rowLabel: { fontSize: 16, color: '#888' },
  rowValue: { fontSize: 16, color: '#fff', textTransform: 'capitalize' },
  error: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
