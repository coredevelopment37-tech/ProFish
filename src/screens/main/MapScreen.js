/**
 * MapScreen — ProFish main map view
 *
 * Mapbox GL with fishing layer overlays, GPS tracking,
 * catch markers, LayerPicker, and weather overlay.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Platform,
  PermissionsAndroid,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import { MAPBOX_ACCESS_TOKEN } from '../../config/env';
import {
  getDefaultLayers,
  getAvailableLayers,
  getActiveTileLayers,
} from '../../config/layerRegistry';
import { useApp } from '../../store/AppContext';
import catchService from '../../services/catchService';
import spotService from '../../services/spotService';
import weatherService from '../../services/weatherService';
import LayerPicker from '../../components/LayerPicker';
import WeatherCard from '../../components/WeatherCard';
import tideService from '../../services/tideService';
import { calculateFishCast } from '../../services/fishCastService';

// Mapbox will be initialized once native modules are linked
let MapboxGL = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  // Set access token at module scope — MUST happen before any MapView renders
  if (MapboxGL && MAPBOX_ACCESS_TOKEN) {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }
} catch (e) {
  // Not linked yet
}

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const [catches, setCatches] = useState([]);
  const [spots, setSpots] = useState([]);
  const [weather, setWeather] = useState(null);

  // Layer management
  const [activeLayers, setActiveLayers] = useState(getDefaultLayers());
  const [layerPickerVisible, setLayerPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatch, setSelectedCatch] = useState(null);
  const [tideModalVisible, setTideModalVisible] = useState(false);
  const [tideData, setTideData] = useState(null);
  const [tideLoading, setTideLoading] = useState(false);
  const [fishCastScore, setFishCastScore] = useState(null);
  const [tilesLoading, setTilesLoading] = useState(false);
  const [hotspotModal, setHotspotModal] = useState(null);
  const [distanceMode, setDistanceMode] = useState(false);
  const [distancePoints, setDistancePoints] = useState([]);
  const [rainViewerTs, setRainViewerTs] = useState(null);
  const [tideStations, setTideStations] = useState([]);

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

      // Calculate FishCast score for location badge
      calculateFishCast(userCoords.latitude, userCoords.longitude)
        .then(result => setFishCastScore(result))
        .catch(() => {});
    }
  }, [userCoords]);

  // Fetch RainViewer latest radar timestamp (free, no key needed)
  useEffect(() => {
    if (!activeLayers.includes('weather')) return;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => r.json())
      .then(data => {
        const past = data?.radar?.past;
        if (past?.length) {
          setRainViewerTs(past[past.length - 1].path);
        }
      })
      .catch(() => {});
    // Refresh every 5 minutes
    const iv = setInterval(() => {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
          const past = data?.radar?.past;
          if (past?.length) setRainViewerTs(past[past.length - 1].path);
        })
        .catch(() => {});
    }, 300000);
    return () => clearInterval(iv);
  }, [activeLayers]);

  // Load nearby tide stations when layer active
  useEffect(() => {
    if (!activeLayers.includes('tide_stations') || !userCoords) return;
    // Use WorldTides nearby stations endpoint (free tier: 5 calls/day)
    const { latitude, longitude } = userCoords;
    fetch(
      `https://www.worldtides.info/api/v3?stations&lat=${latitude}&lon=${longitude}&stationDistance=100&key=${require('../../config/env').WORLDTIDES_API_KEY || ''}`,
    )
      .then(r => r.json())
      .then(data => {
        if (data.stations?.length) {
          setTideStations(data.stations.slice(0, 20));
        }
      })
      .catch(() => {
        // Fallback: just show a message, no crash
        setTideStations([]);
      });
  }, [activeLayers, userCoords]);

  async function loadCatches() {
    try {
      const [catchData, spotData] = await Promise.all([
        catchService.getCatches(),
        spotService.getSpots(),
      ]);
      setCatches(catchData.filter(c => c.latitude && c.longitude));
      setSpots(spotData.filter(s => s.latitude && s.longitude));
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

  // Handle map long-press — drop pin, offer to log catch or save spot
  const handleMapLongPress = useCallback(
    event => {
      const coords = event.geometry?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;
      Alert.alert(
        '📍 Location Selected',
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '📌 Save Spot',
            onPress: () => {
              Alert.prompt
                ? Alert.prompt('Spot Name', 'Give this spot a name:', name => {
                    if (name?.trim()) {
                      spotService
                        .addSpot({
                          name: name.trim(),
                          latitude: lat,
                          longitude: lng,
                        })
                        .then(() => loadCatches());
                    }
                  })
                : // Android fallback — prompt not available
                  spotService
                    .addSpot({
                      name: `Spot ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
                      latitude: lat,
                      longitude: lng,
                    })
                    .then(() => loadCatches());
            },
          },
          {
            text: '🎣 Log Catch Here',
            onPress: () =>
              navigation.navigate('LogCatch', {
                latitude: lat,
                longitude: lng,
              }),
          },
        ],
      );
    },
    [navigation],
  );

  // Handle catch marker tap (individual or cluster)
  const handleCatchPress = useCallback(
    event => {
      const feature = event.features?.[0];
      if (!feature) return;

      // If it's a cluster, show hotspot species breakdown modal
      if (
        feature.properties?.cluster === true ||
        feature.properties?.point_count
      ) {
        const coords = feature.geometry?.coordinates;
        const clusterCount = feature.properties?.point_count || 0;

        // Find catches near this cluster center for species breakdown
        if (coords) {
          const [cLng, cLat] = coords;
          const nearby = catches.filter(c => {
            const dist = Math.sqrt(
              Math.pow(c.latitude - cLat, 2) + Math.pow(c.longitude - cLng, 2),
            );
            return dist < 0.5; // ~50km rough bounding
          });

          // Species breakdown
          const speciesCount = {};
          const hourCount = {};
          nearby.forEach(c => {
            const sp = c.species || 'Unknown';
            speciesCount[sp] = (speciesCount[sp] || 0) + 1;
            if (c.createdAt) {
              const h = new Date(c.createdAt).getHours();
              const period =
                h >= 5 && h < 9
                  ? 'Dawn (5-9)'
                  : h >= 9 && h < 12
                  ? 'Morning (9-12)'
                  : h >= 12 && h < 17
                  ? 'Afternoon (12-17)'
                  : h >= 17 && h < 21
                  ? 'Evening (17-21)'
                  : 'Night';
              hourCount[period] = (hourCount[period] || 0) + 1;
            }
          });

          const speciesRanked = Object.entries(speciesCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

          const bestTimes = Object.entries(hourCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          setHotspotModal({
            coords,
            total: nearby.length || clusterCount,
            species: speciesRanked,
            bestTimes,
          });
        }
        return;
      }

      // Individual marker tap
      if (!feature.properties?.id) return;
      const catchItem = catches.find(c => c.id === feature.properties.id);
      if (catchItem) {
        setSelectedCatch(catchItem);
      }
    },
    [catches],
  );

  // Handle tide station tap → open tide chart modal
  const handleTideStationTap = useCallback(async (lat, lng, stationName) => {
    setTideModalVisible(true);
    setTideLoading(true);
    setTideData(null);
    try {
      const data = await tideService.getTides(lat, lng);
      setTideData({ ...data, stationName: stationName || 'Tide Station' });
    } catch (e) {
      console.warn('[Map] Tide fetch error:', e);
      setTideData({ error: true, stationName: stationName || 'Tide Station' });
    } finally {
      setTideLoading(false);
    }
  }, []);

  // Handle distance measurement taps
  const handleMapPress = useCallback(
    event => {
      if (!distanceMode) return;
      const coords = event.geometry?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;

      setDistancePoints(prev => {
        if (prev.length >= 2) {
          // Reset to new first point
          return [{ lat, lng }];
        }
        return [...prev, { lat, lng }];
      });
    },
    [distanceMode],
  );

  // Calculate haversine distance between two points (km)
  const measureDistance = useCallback(() => {
    if (distancePoints.length !== 2) return null;
    const [a, b] = distancePoints;
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const sin2 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
  }, [distancePoints]);

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

  // Build spots GeoJSON
  const spotGeoJSON = {
    type: 'FeatureCollection',
    features: spots.map(s => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [s.longitude, s.latitude],
      },
      properties: {
        id: s.id,
        name: s.name,
        icon: s.icon || '📌',
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
        onLongPress={handleMapLongPress}
        onPress={handleMapPress}
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
          getActiveTileLayers(activeLayers)
            .filter(layer => layer.id !== 'weather') // weather handled separately
            .map(layer => (
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

        {/* Weather radar — RainViewer dynamic tiles */}
        {mapReady &&
          activeLayers.includes('weather') &&
          rainViewerTs && (
            <MapboxGL.RasterSource
              id="source-weather"
              tileUrlTemplates={[
                `https://tilecache.rainviewer.com${rainViewerTs}/256/{z}/{x}/{y}/2/1_1.png`,
              ]}
              tileSize={256}
            >
              <MapboxGL.RasterLayer
                id="layer-weather"
                style={{ rasterOpacity: 0.5 }}
                belowLayerID="catch-circles"
              />
            </MapboxGL.RasterSource>
          )}

        {/* Catch markers — clustered */}
        {activeLayers.includes('catch_markers') && catches.length > 0 && (
          <MapboxGL.ShapeSource
            id="catches"
            shape={catchGeoJSON}
            onPress={handleCatchPress}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={14}
          >
            {/* Cluster circles */}
            <MapboxGL.CircleLayer
              id="catch-clusters"
              filter={['has', 'point_count']}
              style={{
                circleRadius: [
                  'step',
                  ['get', 'point_count'],
                  18, // default radius
                  5,
                  22, // 5+ points
                  15,
                  28, // 15+ points
                  30,
                  34, // 30+ points
                ],
                circleColor: [
                  'step',
                  ['get', 'point_count'],
                  '#FF9800', // default
                  5,
                  '#FF6B00', // 5+
                  15,
                  '#F44336', // 15+
                  30,
                  '#D32F2F', // 30+
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
                circleOpacity: 0.9,
              }}
            />
            {/* Cluster count labels */}
            <MapboxGL.SymbolLayer
              id="catch-cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: 13,
                textColor: '#fff',
                textFont: ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                textAllowOverlap: true,
              }}
            />
            {/* Individual catch markers */}
            <MapboxGL.CircleLayer
              id="catch-circles"
              filter={['!', ['has', 'point_count']]}
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

        {/* Saved fishing spots */}
        {spots.length > 0 && (
          <MapboxGL.ShapeSource id="spots" shape={spotGeoJSON}>
            <MapboxGL.CircleLayer
              id="spot-circles"
              style={{
                circleRadius: 7,
                circleColor: '#4CAF50',
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
                circleOpacity: 0.85,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Fish Hotspots — heatmap layer from aggregated catch data */}
        {activeLayers.includes('fish_hotspots') && catches.length > 0 && (
          <MapboxGL.ShapeSource id="fish-hotspots" shape={catchGeoJSON}>
            <MapboxGL.HeatmapLayer
              id="fish-hotspots-heat"
              style={{
                heatmapRadius: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  2,
                  9,
                  20,
                  15,
                  40,
                ],
                heatmapWeight: 1,
                heatmapIntensity: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  0.3,
                  9,
                  1,
                  15,
                  3,
                ],
                heatmapColor: [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(0,0,0,0)',
                  0.2,
                  'rgba(0,128,255,0.4)',
                  0.4,
                  'rgba(0,210,170,0.6)',
                  0.6,
                  'rgba(255,200,0,0.7)',
                  0.8,
                  'rgba(255,120,0,0.85)',
                  1.0,
                  'rgba(255,50,50,1)',
                ],
                heatmapOpacity: 0.7,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Boat Ramps — points from local spots tagged as ramps */}
        {activeLayers.includes('boat_ramps') && spots.length > 0 && (
          <MapboxGL.ShapeSource
            id="boat-ramps"
            shape={{
              type: 'FeatureCollection',
              features: spots
                .filter(
                  s =>
                    (s.type || '').toLowerCase().includes('ramp') ||
                    (s.name || '').toLowerCase().includes('ramp'),
                )
                .map(s => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [s.longitude, s.latitude],
                  },
                  properties: { name: s.name },
                })),
            }}
          >
            <MapboxGL.SymbolLayer
              id="boat-ramp-icons"
              style={{
                textField: '⛵',
                textSize: 22,
                textAllowOverlap: true,
                textAnchor: 'center',
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Tide Stations — markers for nearby tidal stations */}
        {activeLayers.includes('tide_stations') && tideStations.length > 0 && (
          <MapboxGL.ShapeSource
            id="tide-stations"
            shape={{
              type: 'FeatureCollection',
              features: tideStations.map((s, idx) => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [s.lng || s.lon || 0, s.lat || 0],
                },
                properties: { name: s.name || `Station ${idx + 1}`, id: s.id || idx },
              })),
            }}
            onPress={event => {
              const feat = event.features?.[0];
              if (feat) {
                const [lng, lat] = feat.geometry.coordinates;
                handleTideStationTap(lat, lng, feat.properties?.name);
              }
            }}
          >
            <MapboxGL.CircleLayer
              id="tide-station-circles"
              style={{
                circleRadius: 10,
                circleColor: '#0080FF',
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
                circleOpacity: 0.9,
              }}
            />
            <MapboxGL.SymbolLayer
              id="tide-station-labels"
              style={{
                textField: '🌊',
                textSize: 14,
                textAllowOverlap: true,
                textAnchor: 'center',
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Distance measurement line */}
        {distanceMode && distancePoints.length >= 1 && (
          <>
            <MapboxGL.ShapeSource
              id="distance-points"
              shape={{
                type: 'FeatureCollection',
                features: distancePoints.map((p, i) => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                  properties: { idx: i },
                })),
              }}
            >
              <MapboxGL.CircleLayer
                id="distance-point-circles"
                style={{
                  circleRadius: 8,
                  circleColor: '#FF4081',
                  circleStrokeWidth: 2,
                  circleStrokeColor: '#fff',
                }}
              />
            </MapboxGL.ShapeSource>
            {distancePoints.length === 2 && (
              <MapboxGL.ShapeSource
                id="distance-line"
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: distancePoints.map(p => [p.lng, p.lat]),
                  },
                }}
              >
                <MapboxGL.LineLayer
                  id="distance-line-layer"
                  style={{
                    lineColor: '#FF4081',
                    lineWidth: 3,
                    lineDasharray: [2, 2],
                  }}
                />
              </MapboxGL.ShapeSource>
            )}
          </>
        )}
      </MapboxGL.MapView>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('map.search', 'Search location...')}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (!searchQuery.trim()) return;
            Keyboard.dismiss();
            // Mapbox geocoding: search for the location
            fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                searchQuery,
              )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`,
            )
              .then(r => r.json())
              .then(data => {
                const feat = data.features?.[0];
                if (feat && cameraRef.current) {
                  const [lng, lat] = feat.center;
                  cameraRef.current.setCamera({
                    centerCoordinate: [lng, lat],
                    zoomLevel: 12,
                    animationDuration: 800,
                  });
                  setFollowUser(false);
                }
              })
              .catch(() => {});
          }}
          returnKeyType="search"
        />
      </View>

      {/* Compact weather overlay */}
      {weather && (
        <View style={styles.weatherOverlay}>
          <WeatherCard weather={weather} compact />
        </View>
      )}

      {/* Catch detail popup */}
      {selectedCatch && (
        <TouchableOpacity
          style={styles.catchPopup}
          activeOpacity={0.9}
          onPress={() => {
            navigation.navigate('CatchDetail', { catchData: selectedCatch });
            setSelectedCatch(null);
          }}
        >
          <View style={styles.popupRow}>
            <Text style={styles.popupSpecies}>
              {selectedCatch.species || 'Unknown'}
            </Text>
            <TouchableOpacity onPress={() => setSelectedCatch(null)}>
              <Text style={styles.popupClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popupStats}>
            {selectedCatch.weight && (
              <Text style={styles.popupStat}>⚖️ {selectedCatch.weight} kg</Text>
            )}
            {selectedCatch.method && (
              <Text style={styles.popupStat}>🎣 {selectedCatch.method}</Text>
            )}
            {selectedCatch.released && (
              <Text style={styles.popupStat}>🔄 Released</Text>
            )}
          </View>
          <Text style={styles.popupHint}>Tap for details →</Text>
        </TouchableOpacity>
      )}

      {/* Tile loading indicator */}
      {tilesLoading && (
        <View style={styles.tileLoadingBanner}>
          <ActivityIndicator size="small" color="#0080FF" />
          <Text style={styles.tileLoadingText}>
            {t('map.loadingTiles', 'Loading map tiles...')}
          </Text>
        </View>
      )}

      {/* ── Right-side control panel ── */}
      <View style={styles.controlPanel}>
        {/* FishCast score badge — top of panel */}
        {fishCastScore && (
          <TouchableOpacity
            style={styles.controlBadge}
            onPress={() => navigation.navigate('FishCast')}
          >
            <Text style={styles.controlBadgeScore}>{fishCastScore.score}</Text>
            <Text style={styles.controlBadgeLabel}>{fishCastScore.label}</Text>
          </TouchableOpacity>
        )}

        {/* Separator */}
        {fishCastScore && <View style={styles.controlSep} />}

        {/* Layers */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setLayerPickerVisible(true)}
          accessibilityLabel={t('map.layers', 'Map layers')}
        >
          <Text style={styles.controlIcon}>🗂️</Text>
          <Text style={styles.controlLabel}>Layers</Text>
        </TouchableOpacity>

        {/* Center on me */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={centerOnUser}
          accessibilityLabel={t('map.centerOnMe', 'Center on my location')}
        >
          <Text style={styles.controlIcon}>📍</Text>
          <Text style={styles.controlLabel}>Center</Text>
        </TouchableOpacity>

        {/* Follow mode */}
        <TouchableOpacity
          style={[styles.controlBtn, followUser && styles.controlBtnActive]}
          onPress={() => setFollowUser(!followUser)}
          accessibilityLabel={t('map.followMe', 'Follow my location')}
        >
          <Text style={styles.controlIcon}>🧭</Text>
          <Text style={styles.controlLabel}>
            {followUser ? 'Follow' : 'Free'}
          </Text>
        </TouchableOpacity>

        {/* Distance measurement */}
        <TouchableOpacity
          style={[styles.controlBtn, distanceMode && styles.controlBtnActive]}
          onPress={() => {
            setDistanceMode(!distanceMode);
            setDistancePoints([]);
          }}
          accessibilityLabel={t('map.measureDistance', 'Measure distance')}
        >
          <Text style={styles.controlIcon}>📏</Text>
          <Text style={styles.controlLabel}>Ruler</Text>
        </TouchableOpacity>
      </View>

      {/* FAB: Log Catch */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogCatch')}
        accessibilityLabel={t('map.logCatch', 'Log a catch')}
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>🎣</Text>
      </TouchableOpacity>

      {/* Distance measurement result */}
      {distanceMode && (
        <View style={styles.distanceBanner}>
          {distancePoints.length === 2 ? (
            <Text style={styles.distanceText}>
              📏{' '}
              {measureDistance() < 1
                ? `${Math.round(measureDistance() * 1000)} m`
                : `${measureDistance().toFixed(2)} km`}
              {'  '}({(measureDistance() * 0.539957).toFixed(2)} nm)
            </Text>
          ) : (
            <Text style={styles.distanceHint}>
              {distancePoints.length === 0
                ? t('map.tapFirstPoint', 'Tap map to set first point')
                : t('map.tapSecondPoint', 'Tap map to set second point')}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => {
              setDistanceMode(false);
              setDistancePoints([]);
            }}
          >
            <Text style={styles.distanceClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hotspot Species Breakdown Modal */}
      <Modal
        visible={!!hotspotModal}
        animationType="slide"
        transparent
        onRequestClose={() => setHotspotModal(null)}
      >
        <View style={styles.hotspotOverlay}>
          <View style={styles.hotspotSheet}>
            <View style={styles.hotspotHeader}>
              <Text style={styles.hotspotTitle}>
                🔥 {t('map.hotspot', 'Catch Hotspot')}
              </Text>
              <TouchableOpacity onPress={() => setHotspotModal(null)}>
                <Text style={styles.hotspotClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hotspotCount}>
              {hotspotModal?.total || 0}{' '}
              {t('map.catchesHere', 'catches in this area')}
            </Text>

            {/* Species Breakdown */}
            {hotspotModal?.species?.length > 0 && (
              <View style={styles.hotspotSection}>
                <Text style={styles.hotspotSectionTitle}>
                  🐟 {t('map.speciesBreakdown', 'Species Breakdown')}
                </Text>
                {hotspotModal.species.map(([name, count], i) => {
                  const pct = hotspotModal.total
                    ? Math.round((count / hotspotModal.total) * 100)
                    : 0;
                  return (
                    <View key={i} style={styles.hotspotBarRow}>
                      <Text style={styles.hotspotBarLabel} numberOfLines={1}>
                        {name}
                      </Text>
                      <View style={styles.hotspotBarTrack}>
                        <View
                          style={[
                            styles.hotspotBarFill,
                            { width: `${Math.max(5, pct)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.hotspotBarValue}>
                        {count} ({pct}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Best Times */}
            {hotspotModal?.bestTimes?.length > 0 && (
              <View style={styles.hotspotSection}>
                <Text style={styles.hotspotSectionTitle}>
                  ⏰ {t('map.bestTimes', 'Best Times')}
                </Text>
                {hotspotModal.bestTimes.map(([period, count], i) => (
                  <View key={i} style={styles.hotspotTimeRow}>
                    <Text style={styles.hotspotTimeLabel}>{period}</Text>
                    <Text style={styles.hotspotTimeCount}>{count} catches</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Zoom in button */}
            {hotspotModal?.coords && (
              <TouchableOpacity
                style={styles.hotspotZoomBtn}
                onPress={() => {
                  if (cameraRef.current && hotspotModal.coords) {
                    cameraRef.current.setCamera({
                      centerCoordinate: hotspotModal.coords,
                      zoomLevel: 14,
                      animationDuration: 500,
                    });
                    setFollowUser(false);
                  }
                  setHotspotModal(null);
                }}
              >
                <Text style={styles.hotspotZoomText}>
                  🔍 {t('map.zoomIn', 'Zoom In')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Layer Picker Modal */}
      <LayerPicker
        visible={layerPickerVisible}
        onClose={() => setLayerPickerVisible(false)}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        tier={state.subscriptionTier}
      />

      {/* Tide Station Modal */}
      <Modal
        visible={tideModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTideModalVisible(false)}
      >
        <View style={styles.tideModalOverlay}>
          <View style={styles.tideModalSheet}>
            <View style={styles.tideModalHeader}>
              <Text style={styles.tideModalTitle}>
                🌊{' '}
                {tideData?.stationName || t('map.tideStation', 'Tide Station')}
              </Text>
              <TouchableOpacity onPress={() => setTideModalVisible(false)}>
                <Text style={styles.tideModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {tideLoading ? (
              <View style={styles.tideModalLoading}>
                <ActivityIndicator size="large" color="#0080FF" />
                <Text style={styles.tideModalLoadText}>
                  {t('common.loading', 'Loading...')}
                </Text>
              </View>
            ) : tideData?.error ? (
              <Text style={styles.tideModalError}>
                {t(
                  'map.tideError',
                  'Unable to load tide data for this station.',
                )}
              </Text>
            ) : tideData?.predictions ? (
              <ScrollView style={styles.tideModalContent}>
                {/* Current state */}
                {tideData.current && (
                  <View style={styles.tideCurrentRow}>
                    <Text style={styles.tideCurrentLabel}>
                      {t('map.currentTide', 'Current')}
                    </Text>
                    <Text style={styles.tideCurrentValue}>
                      {tideData.current.height?.toFixed(1) || '--'} m
                    </Text>
                    <Text style={styles.tideCurrentState}>
                      {tideData.current.state === 'rising'
                        ? '↑ Rising'
                        : '↓ Falling'}
                    </Text>
                  </View>
                )}

                {/* Tide chart — simple bar visualization */}
                <Text style={styles.tideSectionTitle}>
                  {t('map.todaysTides', "Today's Tides")}
                </Text>
                {tideData.predictions.slice(0, 8).map((pred, idx) => {
                  const time = new Date(pred.t || pred.time);
                  const h = parseFloat(pred.v || pred.height || 0);
                  const maxH = Math.max(
                    ...tideData.predictions
                      .slice(0, 8)
                      .map(p => Math.abs(parseFloat(p.v || p.height || 0))),
                    1,
                  );
                  return (
                    <View key={idx} style={styles.tideBarRow}>
                      <Text style={styles.tideBarTime}>
                        {time.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <View style={styles.tideBarTrack}>
                        <View
                          style={[
                            styles.tideBarFill,
                            {
                              width: `${Math.max(
                                5,
                                (Math.abs(h) / maxH) * 100,
                              )}%`,
                              backgroundColor: h >= 0 ? '#0080FF' : '#FF6B00',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.tideBarValue}>{h.toFixed(2)} m</Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.tideModalError}>
                {t('map.noTideData', 'No tide data available.')}
              </Text>
            )}
          </View>
        </View>
      </Modal>
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
    top: Platform.OS === 'ios' ? 116 : 72,
    left: 12,
    right: 68,
  },

  // ── Clean right-side control panel ──
  controlPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    right: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 16, 32, 0.88)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  controlBadge: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  controlBadgeScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00D4AA',
  },
  controlBadgeLabel: {
    fontSize: 8,
    color: '#6688aa',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlSep: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.18)',
  },
  controlIcon: { fontSize: 18 },
  controlLabel: {
    fontSize: 8,
    color: '#6688aa',
    fontWeight: '600',
    marginTop: 1,
  },
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
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 16,
    left: 12,
    right: 70,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  catchPopup: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  popupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupSpecies: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  popupClose: { fontSize: 18, color: '#888', padding: 4 },
  popupStats: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  popupStat: { fontSize: 14, color: '#ccc' },
  popupHint: { fontSize: 12, color: '#0080FF' },

  // Tile loading
  tileLoadingBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tileLoadingText: {
    color: '#888',
    fontSize: 12,
  },

  // Tide Modal
  tideModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tideModalSheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  tideModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tideModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tideModalClose: { color: '#888', fontSize: 22, padding: 4 },
  tideModalLoading: { alignItems: 'center', padding: 40 },
  tideModalLoadText: { color: '#888', marginTop: 12, fontSize: 14 },
  tideModalError: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    padding: 30,
  },
  tideModalContent: { maxHeight: 400 },
  tideCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  tideCurrentLabel: { color: '#888', fontSize: 13 },
  tideCurrentValue: {
    color: '#0080FF',
    fontSize: 24,
    fontWeight: '800',
  },
  tideCurrentState: { color: '#ccc', fontSize: 14 },
  tideSectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  tideBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tideBarTime: { width: 55, color: '#888', fontSize: 12 },
  tideBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  tideBarFill: { height: 16, borderRadius: 8, minWidth: 4 },
  tideBarValue: { width: 55, color: '#ccc', fontSize: 12, textAlign: 'right' },

  // Distance measurement
  distanceBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,64,129,0.92)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  distanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  distanceHint: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  distanceClose: {
    color: '#fff',
    fontSize: 18,
    padding: 4,
    fontWeight: '700',
  },

  // Hotspot modal
  hotspotOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hotspotSheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '65%',
  },
  hotspotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hotspotTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  hotspotClose: { color: '#888', fontSize: 22, padding: 4 },
  hotspotCount: { color: '#888', fontSize: 14, marginBottom: 16 },
  hotspotSection: { marginBottom: 18 },
  hotspotSectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  hotspotBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotspotBarLabel: { width: 100, color: '#ccc', fontSize: 13 },
  hotspotBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#0a0a1a',
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  hotspotBarFill: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF6B00',
  },
  hotspotBarValue: {
    width: 72,
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
  hotspotTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  hotspotTimeLabel: { color: '#ccc', fontSize: 14 },
  hotspotTimeCount: { color: '#888', fontSize: 14 },
  hotspotZoomBtn: {
    backgroundColor: '#0080FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  hotspotZoomText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
