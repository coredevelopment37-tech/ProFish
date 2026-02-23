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
  ScrollView,
} from 'react-native';
import {
  checkLegality,
  getAvailableRegions,
  getRegionRules,
} from '../../services/regulationsService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Button, Card, Input, ScreenHeader } from '../../components/Common';

export default function IsItLegalScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
    if (status === 'LEGAL') return colors.accent;
    if (status === 'ILLEGAL') return colors.error;
    return colors.warning;
  };

  const getStatusIcon = status => {
    if (status === 'LEGAL') return <AppIcon name="circleCheck" size={20} color={colors.success || colors.accent} />;
    if (status === 'ILLEGAL') return <AppIcon name="ban" size={20} color={colors.error} />;
    return <AppIcon name="alertTriangle" size={20} color={colors.accent} />;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <ScreenHeader
        variant="large"
        title="Is It Legal?"
        subtitle="Check if your catch meets local regulations"
        onBack={() => navigation.goBack()}
      />

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
                  <AppIcon name="fish" size={14} color={selectedSpecies === sp.id ? colors.accent : colors.textTertiary} /> {sp.label}
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
          <Input
            value={fishLength}
            onChangeText={setFishLength}
            placeholder="e.g. 22"
            keyboardType="numeric"
            style={{ marginHorizontal: 16 }}
          />
        </>
      )}

      {/* Check button */}
      {selectedSpecies && (
        <Button
          title="Check Legality"
          onPress={handleCheck}
          variant="primary"
          size="lg"
          icon="scale"
          style={{ marginHorizontal: 16, borderRadius: 24 }}
        />
      )}

      {/* Result */}
      {result && (
        <Card variant="outlined" radius={16} padding={20} style={{ margin: 16, borderWidth: 2, borderColor: getStatusColor(result.status) }}>
          <Text style={styles.resultEmoji}>
            {getStatusIcon(result.status)}
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
                  <Text style={styles.notesText}><AppIcon name="fileText" size={13} color={colors.accent} /> {result.notes}</Text>
                </View>
              )}
            </View>
          )}

          {result.region?.licenseUrl && (
            <View style={styles.licenseLink}>
              <Text style={styles.licenseLinkText}>
                <AppIcon name="link" size={13} color={colors.primary} /> Get License: {result.region.licenseUrl}
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
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  {issue.severity === 'illegal' ? <AppIcon name="ban" size={14} color={colors.error} /> : <AppIcon name="alertTriangle" size={14} color={colors.warning} />} {issue.message}
                </Text>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          <AppIcon name="alertTriangle" size={12} color={colors.warning} /> Regulations change frequently. Always verify with your local fish &
          wildlife agency before keeping any catch. This tool is for educational
          purposes only.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  chipScroll: { paddingLeft: 16, maxHeight: 42 },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipText: { fontSize: 13, color: colors.textTertiary },
  chipTextActive: { color: colors.primary },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  speciesChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speciesChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },
  speciesText: { fontSize: 13, color: colors.textTertiary },
  speciesTextActive: { color: colors.accent },

  resultEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  resultStatus: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  ruleDetails: { backgroundColor: colors.background, borderRadius: 12, padding: 14 },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ruleLabel: { fontSize: 14, color: colors.textTertiary },
  ruleValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  notesBox: {
    marginTop: 10,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
  },
  notesText: { fontSize: 13, color: colors.accent, lineHeight: 18 },
  issuesBox: { marginTop: 12, gap: 6 },
  issueText: { fontSize: 14, lineHeight: 20 },
  licenseLink: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  licenseLinkText: { fontSize: 13, color: colors.primary },
  disclaimer: {
    margin: 16,
    padding: 14,
    backgroundColor: colors.warning + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  disclaimerText: { fontSize: 12, color: colors.warning, lineHeight: 18 },
});
