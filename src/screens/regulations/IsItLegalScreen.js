/**
 * IsItLegalScreen — Quick legality checker for catches
 * #532 — Enter species + size + region → instant answer
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  checkLegality,
  getAvailableRegions,
  getRegionRules,
} from '../../services/regulationsService';

const THEME = {
  bg: '#0A0A1A',
  card: '#1A1A2E',
  primary: '#0080FF',
  accent: '#00D4AA',
  text: '#FFF',
  muted: '#8A8A9A',
  border: '#2A2A40',
  danger: '#FF4444',
  warning: '#FFA500',
};

export default function IsItLegalScreen({ navigation }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [fishLength, setFishLength] = useState('');
  const [result, setResult] = useState(null);

  const regions = useMemo(() => getAvailableRegions(), []);
  const regionRules = useMemo(
    () => (selectedRegion ? getRegionRules(selectedRegion) : null),
    [selectedRegion],
  );

  const speciesList = useMemo(() => {
    if (!regionRules) return [];
    return regionRules.rules.map(r => ({
      id: r.species,
      label: r.species
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }, [regionRules]);

  const handleCheck = () => {
    if (!selectedRegion || !selectedSpecies) return;
    const length = fishLength ? parseFloat(fishLength) : null;
    const res = checkLegality(selectedRegion, selectedSpecies, length);
    setResult(res);
  };

  const getStatusColor = status => {
    if (status === 'LEGAL') return THEME.accent;
    if (status === 'ILLEGAL') return THEME.danger;
    return THEME.warning;
  };

  const getStatusEmoji = status => {
    if (status === 'LEGAL') return '✅';
    if (status === 'ILLEGAL') return '🚫';
    return '⚠️';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚖️ Is It Legal?</Text>
        <Text style={styles.headerDesc}>
          Check if your catch meets local regulations
        </Text>
      </View>

      {/* Region picker */}
      <Text style={styles.sectionLabel}>1. Select Your Region</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {regions.map(r => (
          <TouchableOpacity
            key={r.code}
            style={[
              styles.chip,
              selectedRegion === r.code && styles.chipActive,
            ]}
            onPress={() => {
              setSelectedRegion(r.code);
              setSelectedSpecies(null);
              setResult(null);
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedRegion === r.code && styles.chipTextActive,
              ]}
            >
              {r.country} — {r.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Species picker */}
      {selectedRegion && (
        <>
          <Text style={styles.sectionLabel}>2. Select Species</Text>
          <View style={styles.speciesGrid}>
            {speciesList.map(sp => (
              <TouchableOpacity
                key={sp.id}
                style={[
                  styles.speciesChip,
                  selectedSpecies === sp.id && styles.speciesChipActive,
                ]}
                onPress={() => {
                  setSelectedSpecies(sp.id);
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.speciesText,
                    selectedSpecies === sp.id && styles.speciesTextActive,
                  ]}
                >
                  🐟 {sp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Length input */}
      {selectedSpecies && (
        <>
          <Text style={styles.sectionLabel}>
            3. Fish Length (optional, inches)
          </Text>
          <TextInput
            style={styles.input}
            value={fishLength}
            onChangeText={setFishLength}
            placeholder="e.g. 22"
            placeholderTextColor={THEME.muted}
            keyboardType="numeric"
          />
        </>
      )}

      {/* Check button */}
      {selectedSpecies && (
        <TouchableOpacity style={styles.checkBtn} onPress={handleCheck}>
          <Text style={styles.checkBtnText}>⚖️ Check Legality</Text>
        </TouchableOpacity>
      )}

      {/* Result */}
      {result && (
        <View
          style={[
            styles.resultCard,
            { borderColor: getStatusColor(result.status) },
          ]}
        >
          <Text style={styles.resultEmoji}>
            {getStatusEmoji(result.status)}
          </Text>
          <Text
            style={[
              styles.resultStatus,
              { color: getStatusColor(result.status) },
            ]}
          >
            {result.status.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.resultMessage}>{result.message}</Text>

          {result.rule && (
            <View style={styles.ruleDetails}>
              {result.rule.minSize && (
                <View style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>Min Size:</Text>
                  <Text style={styles.ruleValue}>
                    {result.rule.minSize} inches
                  </Text>
                </View>
              )}
              {result.rule.maxSize && (
                <View style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>Max Size:</Text>
                  <Text style={styles.ruleValue}>
                    {result.rule.maxSize} inches
                  </Text>
                </View>
              )}
              {result.rule.bagLimit !== null && (
                <View style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>Bag Limit:</Text>
                  <Text style={styles.ruleValue}>
                    {result.rule.bagLimit === 0
                      ? 'Catch & Release Only'
                      : `${result.rule.bagLimit} per day`}
                  </Text>
                </View>
              )}
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Season:</Text>
                <Text style={styles.ruleValue}>{result.rule.season}</Text>
              </View>
              {result.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>📝 {result.notes}</Text>
                </View>
              )}
            </View>
          )}

          {result.region?.licenseUrl && (
            <View style={styles.licenseLink}>
              <Text style={styles.licenseLinkText}>
                🔗 Get License: {result.region.licenseUrl}
              </Text>
            </View>
          )}

          {result.issues.length > 0 && (
            <View style={styles.issuesBox}>
              {result.issues.map((issue, i) => (
                <Text
                  key={i}
                  style={[
                    styles.issueText,
                    {
                      color:
                        issue.severity === 'illegal'
                          ? THEME.danger
                          : THEME.warning,
                    },
                  ]}
                >
                  {issue.severity === 'illegal' ? '🚫' : '⚠️'} {issue.message}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ Regulations change frequently. Always verify with your local fish &
          wildlife agency before keeping any catch. This tool is for educational
          purposes only.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { paddingBottom: 100 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { fontSize: 16, color: THEME.primary, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: THEME.text },
  headerDesc: { fontSize: 14, color: THEME.muted, marginTop: 4 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  chipScroll: { paddingLeft: 16, maxHeight: 42 },
  chip: {
    backgroundColor: THEME.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipActive: { borderColor: THEME.primary, backgroundColor: '#0080FF15' },
  chipText: { fontSize: 13, color: THEME.muted },
  chipTextActive: { color: THEME.primary },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  speciesChip: {
    backgroundColor: THEME.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  speciesChipActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.accent + '15',
  },
  speciesText: { fontSize: 13, color: THEME.muted },
  speciesTextActive: { color: THEME.accent },
  input: {
    marginHorizontal: 16,
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  checkBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  checkBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  resultCard: {
    margin: 16,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  resultEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  resultStatus: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 15,
    color: THEME.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  ruleDetails: { backgroundColor: THEME.bg, borderRadius: 12, padding: 14 },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  ruleLabel: { fontSize: 14, color: THEME.muted },
  ruleValue: { fontSize: 14, fontWeight: '600', color: THEME.text },
  notesBox: {
    marginTop: 10,
    backgroundColor: THEME.card,
    padding: 10,
    borderRadius: 8,
  },
  notesText: { fontSize: 13, color: THEME.accent, lineHeight: 18 },
  issuesBox: { marginTop: 12, gap: 6 },
  issueText: { fontSize: 14, lineHeight: 20 },
  licenseLink: {
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.primary + '15',
    borderRadius: 8,
  },
  licenseLinkText: { fontSize: 13, color: THEME.primary },
  disclaimer: {
    margin: 16,
    padding: 14,
    backgroundColor: '#FFA50010',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFA50030',
  },
  disclaimerText: { fontSize: 12, color: THEME.warning, lineHeight: 18 },
});
