/**
 * MapScreen — ProFish main map view
 *
 * Mapbox GL with fishing layer overlays, GPS tracking,
 * catch markers, LayerPicker, and weather overlay.
 */

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import { MAPBOX_ACCESS_TOKEN } from '../../config/env';
import {
  getDefaultLayers,
  getAvailableLayers,
  getActiveTileLayers,
} from '../../config/layerRegistry';
import { AppContext } from '../../store/AppContext';
import catchService from '../../services/catchService';
import weatherService from '../../services/weatherService';
import LayerPicker from '../../components/LayerPicker';
import WeatherCard from '../../components/WeatherCard';

// Mapbox will be initialized once native modules are linked
let MapboxGL = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
} catch (e) {
  // Not linked yet
}

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useContext(AppContext);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const [catches, setCatches] = useState([]);
  const [weather, setWeather] = useState(null);

  // Layer management
  const [activeLayers, setActiveLayers] = useState(getDefaultLayers());
  const [layerPickerVisible, setLayerPickerVisible] = useState(false);

  // Init Mapbox token
  useEffect(() => {
    if (MapboxGL && MAPBOX_ACCESS_TOKEN) {
      MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
    }
  }, []);

  // Request location permission and start tracking
  useEffect(() => {
    let watchId;
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
        }
        watchId = Geolocation.watchPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            setUserCoords({ latitude, longitude });
          },
          () => {},
          { enableHighAccuracy: true, distanceFilter: 20, interval: 10000 },
        );
      } catch (e) {
        console.warn('[Map] Location error:', e);
      }
    })();
    return () => {
      if (watchId !== undefined) Geolocation.clearWatch(watchId);
    };
  }, []);

  // Load catches for markers
  useEffect(() => {
    loadCatches();
    const unsubscribe = navigation.addListener('focus', loadCatches);
    return unsubscribe;
  }, [navigation]);

  // Load weather for user location
  useEffect(() => {
    if (userCoords) {
      weatherService
        .getWeather(userCoords.latitude, userCoords.longitude)
        .then(setWeather)
        .catch(() => {});
    }
  }, [userCoords]);

  async function loadCatches() {
    try {
      const data = await catchService.getCatches();
      setCatches(data.filter(c => c.latitude && c.longitude));
    } catch {}
  }

  const toggleLayer = useCallback(layerId => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId],
    );
  }, []);

  const centerOnUser = useCallback(() => {
    if (userCoords && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userCoords.longitude, userCoords.latitude],
        zoomLevel: 13,
        animationDuration: 500,
      });
    }
  }, [userCoords]);

  // Build catch GeoJSON
  const catchGeoJSON = {
    type: 'FeatureCollection',
    features: catches.map(c => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.longitude, c.latitude],
      },
      properties: {
        id: c.id,
        species: c.species,
        weight: c.weight,
        released: c.released,
      },
    })),
  };

  if (!MapboxGL) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🗺️</Text>
          <Text style={styles.placeholderTitle}>{t('map.title', 'Map')}</Text>
          <Text style={styles.placeholderText}>
            {t(
              'map.setupRequired',
              'Add your Mapbox token to .env to enable the map.',
            )}
          </Text>
          <Text style={styles.setupStep}>MAPBOX_ACCESS_TOKEN=pk.xxx</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={
          activeLayers.includes('satellite')
            ? MapboxGL.StyleURL.SatelliteStreet
            : MapboxGL.StyleURL.Dark
        }
        onDidFinishLoadingMap={() => setMapReady(true)}
        compassEnabled
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: userCoords
              ? [userCoords.longitude, userCoords.latitude]
              : [18.0686, 59.3293],
            zoomLevel: userCoords ? 12 : 2,
          }}
          followUserLocation={followUser}
          followZoomLevel={13}
        />

        <MapboxGL.UserLocation visible animated renderMode="native" />

        {/* Raster tile layers (bathymetry, nautical charts, etc.) */}
        {mapReady &&
          getActiveTileLayers(activeLayers).map(layer => (
            <MapboxGL.RasterSource
              key={layer.id}
              id={`source-${layer.id}`}
              tileUrlTemplates={[layer.tileUrl]}
              tileSize={256}
            >
              <MapboxGL.RasterLayer
                id={`layer-${layer.id}`}
                style={{ rasterOpacity: layer.opacity || 0.7 }}
                belowLayerID="catch-circles"
              />
            </MapboxGL.RasterSource>
          ))}

        {/* Catch markers */}
        {activeLayers.includes('catch_markers') && catches.length > 0 && (
          <MapboxGL.ShapeSource
            id="catches"
            shape={catchGeoJSON}
            onPress={e => {
              const feature = e.features?.[0];
              if (feature) {
                // Could navigate to catch detail
              }
            }}
          >
            <MapboxGL.CircleLayer
              id="catch-circles"
              style={{
                circleRadius: 8,
                circleColor: '#FF6B00',
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
                circleOpacity: 0.9,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Compact weather overlay */}
      {weather && (
        <View style={styles.weatherOverlay}>
          <WeatherCard weather={weather} compact />
        </View>
      )}

      {/* Map controls */}
      <View style={styles.controls}>
        {/* Layers button */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setLayerPickerVisible(true)}
        >
          <Text style={styles.controlIcon}>🗂️</Text>
        </TouchableOpacity>

        {/* Center on user */}
        <TouchableOpacity style={styles.controlBtn} onPress={centerOnUser}>
          <Text style={styles.controlIcon}>📍</Text>
        </TouchableOpacity>

        {/* Toggle follow */}
        <TouchableOpacity
          style={[styles.controlBtn, followUser && styles.controlBtnActive]}
          onPress={() => setFollowUser(!followUser)}
        >
          <Text style={styles.controlIcon}>🧭</Text>
        </TouchableOpacity>
      </View>

      {/* FAB: Log Catch */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogCatch')}
      >
        <Text style={styles.fabText}>🎣</Text>
      </TouchableOpacity>

      {/* Layer Picker Modal */}
      <LayerPicker
        visible={layerPickerVisible}
        onClose={() => setLayerPickerVisible(false)}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        tier={state.subscriptionTier}
      />
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
  placeholderIcon: { fontSize: 56, marginBottom: 16 },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  setupStep: {
    fontSize: 14,
    color: '#0080FF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  weatherOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 16,
    left: 12,
    right: 80,
  },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 16,
    right: 12,
    gap: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  controlBtnActive: {
    borderColor: '#0080FF',
    backgroundColor: 'rgba(0, 128, 255, 0.2)',
  },
  controlIcon: { fontSize: 20 },
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
