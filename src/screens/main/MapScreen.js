/**
 * MapScreen — ProFish main map view
 *
 * Mapbox GL with fishing layer overlays:
 * - Nautical charts (NOAA)
 * - Bathymetry (GEBCO)
 * - SST (Copernicus)
 * - Tide stations
 * - Catch markers
 * - Fish hotspots
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MAPBOX_ACCESS_TOKEN } from '../../config/env';

// Mapbox will be initialized once native modules are linked
let MapboxGL = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
} catch (e) {
  // Not linked yet
}

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (MapboxGL && MAPBOX_ACCESS_TOKEN) {
      MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
    }
  }, []);

  if (!MapboxGL) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            🗺️ {t('map.title', 'Map')}
          </Text>
          <Text style={styles.placeholderText}>
            {t(
              'map.setupRequired',
              'Mapbox not configured yet. Run npm install and link native modules.',
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.SatelliteStreet}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <MapboxGL.Camera
          defaultSettings={{
            centerCoordinate: [0, 20],
            zoomLevel: 2,
          }}
          followUserLocation={false}
        />
        {location && <MapboxGL.UserLocation visible animated />}
      </MapboxGL.MapView>

      {/* FAB: Log Catch */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogCatch')}
      >
        <Text style={styles.fabText}>🎣</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  map: { flex: 1 },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: { fontSize: 28, color: '#fff', marginBottom: 16 },
  placeholderText: { fontSize: 16, color: '#888', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0080FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 28 },
});
