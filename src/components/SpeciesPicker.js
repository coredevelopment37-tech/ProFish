/**
 * SpeciesPicker — Autocomplete species search for catch logging
 * Searches local species database with fuzzy matching
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import speciesDatabase from '../services/speciesDatabase';

export default function SpeciesPicker({ value, onSelect, placeholder }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(text => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const matches = speciesDatabase.search(text).slice(0, 8);
    setResults(matches);
    setShowResults(matches.length > 0);
  }, []);

  const handleSelect = species => {
    const displayName = species.id.replace(/_/g, ' ');
    setQuery(displayName);
    setShowResults(false);
    onSelect(displayName, species);
  };

  const handleBlur = () => {
    // Delay to allow tap on result
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleSearch}
        onFocus={() => query.length >= 2 && setShowResults(results.length > 0)}
        onBlur={handleBlur}
        placeholder={
          placeholder || t('catch.speciesPlaceholder', 'e.g. Largemouth Bass')
        }
        placeholderTextColor="#555"
        autoCapitalize="words"
      />

      {showResults && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.result}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {item.id.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.resultScientific}>{item.scientific}</Text>
                </View>
                <View style={styles.resultBadges}>
                  <Text style={styles.habitatBadge}>
                    {getHabitatEmoji(item.habitat)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

function getHabitatEmoji(habitat) {
  switch (habitat) {
    case 'freshwater':
      return '🏞️';
    case 'saltwater':
      return '🌊';
    case 'brackish':
      return '🏝️';
    default:
      return '🐟';
  }
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 100 },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 240,
    zIndex: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262640',
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultScientific: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultBadges: { flexDirection: 'row', gap: 6 },
  habitatBadge: { fontSize: 16 },
});
