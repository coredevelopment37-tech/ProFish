/**
 * CastingGameScreen — The casting mini-game
 *
 * Accelerometer-based (or gesture fallback) casting simulator.
 * Power meter → flick to cast → animated line arc → splash → score.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Vibration,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  G,
} from 'react-native-svg';
import {
  TECHNIQUES,
  SCENE_CONFIG,
  DIFFICULTY_COLORS,
  calculateCast,
  getCastTrajectory,
  saveResult,
  generateWind,
} from '../../services/castingService';

const { width: W, height: H } = Dimensions.get('window');
const SVG_W = W;
const SVG_H = H * 0.45;
const WATER_Y = SVG_H * 0.65;

// ── Game states
const PHASE = {
  READY: 'ready',
  CHARGING: 'charging',
  CASTING: 'casting',
  RESULT: 'result',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CastingGameScreen({ navigation, route }) {
  const { techniqueId } = route.params;
  const technique = TECHNIQUES.find(t => t.id === techniqueId) || TECHNIQUES[0];
  const scene = SCENE_CONFIG[technique.scene] || SCENE_CONFIG.lake;

  // Game state
  const [phase, setPhase] = useState(PHASE.READY);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState([]); // array of cast results
  const [wind, setWind] = useState(generateWind());
  const [castResult, setCastResult] = useState(null);
  const [trajectory, setTrajectory] = useState([]);
  const [showTip, setShowTip] = useState(true);

  // Animated values
  const powerAnim = useRef(new Animated.Value(0)).current;
  const lineProgress = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const rodAngle = useRef(new Animated.Value(0)).current;
  const scorePopup = useRef(new Animated.Value(0)).current;
  const castBtnPulse = useRef(new Animated.Value(1)).current;

  // Refs
  const powerRef = useRef(0);
  const chargeStart = useRef(0);
  const chargeTimer = useRef(null);

  // Pulse animation for button
  useEffect(() => {
    if (phase === PHASE.READY) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(castBtnPulse, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(castBtnPulse, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase]);

  // ── Charging (hold button) ──
  const startCharge = useCallback(() => {
    if (phase !== PHASE.READY) return;
    setPhase(PHASE.CHARGING);
    setShowTip(false);
    chargeStart.current = Date.now();
    powerRef.current = 0;

    // Rod pulls back
    Animated.timing(rodAngle, {
      toValue: -35,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Power fills over 2 seconds
    Animated.timing(powerAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Track power via interval (for when released)
    chargeTimer.current = setInterval(() => {
      const elapsed = Date.now() - chargeStart.current;
      powerRef.current = Math.min(1, elapsed / 2000);
    }, 16);
  }, [phase]);

  // ── Release (cast!) ──
  const releaseCast = useCallback(() => {
    if (phase !== PHASE.CHARGING) return;
    clearInterval(chargeTimer.current);

    const power = powerRef.current;
    const elapsed = Date.now() - chargeStart.current;
    // Timing: 0-1 based on charge duration. 0.5 = perfect (around 1 second)
    const timing = Math.min(1, elapsed / 2000);

    setPhase(PHASE.CASTING);
    Vibration.vibrate(50);

    // Rod swings forward
    Animated.timing(rodAngle, {
      toValue: 45,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Calculate result
    const result = calculateCast(
      { power, timing, angle: 0 },
      technique,
      wind.speed,
      wind.direction,
    );
    setCastResult(result);

    // Generate trajectory
    const traj = getCastTrajectory(
      power,
      result.distance,
      technique.maxDistance,
      result.drift,
    );
    setTrajectory(traj);

    // Animate line flying out
    Animated.timing(lineProgress, {
      toValue: 1,
      duration: 800 + power * 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // Splash!
      Vibration.vibrate([0, 30, 30, 50]);
      Animated.parallel([
        Animated.spring(splashScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(splashOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade splash
        Animated.timing(splashOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });

      // Score popup
      Animated.spring(scorePopup, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Record result
      const newResults = [...results, result];
      setResults(newResults);
      setPhase(PHASE.RESULT);

      // Save best to storage
      saveResult(techniqueId, result.score, result.stars);
    });
  }, [phase, results, wind, technique, techniqueId]);

  // ── Swipe gesture handler (alternative to hold+release) ──
  const onGesture = useCallback(
    ({ nativeEvent }) => {
      if (nativeEvent.state === State.END && phase === PHASE.READY) {
        const vy = nativeEvent.velocityY;
        // Upward swipe
        if (vy < -500) {
          const power = Math.min(1, Math.abs(vy) / 4000);
          const timing = 0.4 + Math.random() * 0.2; // approximate
          powerRef.current = power;

          setPhase(PHASE.CASTING);
          Vibration.vibrate(50);
          setShowTip(false);

          // Animate power bar flash
          Animated.timing(powerAnim, {
            toValue: power,
            duration: 100,
            useNativeDriver: false,
          }).start();

          // Rod swing
          Animated.sequence([
            Animated.timing(rodAngle, {
              toValue: -25,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(rodAngle, {
              toValue: 45,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();

          const result = calculateCast(
            { power, timing, angle: 0 },
            technique,
            wind.speed,
            wind.direction,
          );
          setCastResult(result);

          const traj = getCastTrajectory(
            power,
            result.distance,
            technique.maxDistance,
            result.drift,
          );
          setTrajectory(traj);

          Animated.timing(lineProgress, {
            toValue: 1,
            duration: 600 + power * 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            Vibration.vibrate([0, 30, 30, 50]);
            Animated.parallel([
              Animated.spring(splashScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
              }),
              Animated.timing(splashOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              Animated.timing(splashOpacity, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }).start();
            });

            Animated.spring(scorePopup, {
              toValue: 1,
              friction: 5,
              tension: 80,
              useNativeDriver: true,
            }).start();

            const newResults = [...results, result];
            setResults(newResults);
            setPhase(PHASE.RESULT);
            saveResult(techniqueId, result.score, result.stars);
          });
        }
      }
    },
    [phase, results, wind, technique, techniqueId],
  );

  // ── Next attempt / finish ──
  const nextCast = () => {
    const nextAttempt = attempt + 1;
    if (nextAttempt >= 3) {
      // Show final
      return;
    }
    setAttempt(nextAttempt);
    resetAnimations();
    setWind(generateWind());
    setPhase(PHASE.READY);
    setCastResult(null);
    setTrajectory([]);
  };

  const resetAnimations = () => {
    powerAnim.setValue(0);
    lineProgress.setValue(0);
    splashScale.setValue(0);
    splashOpacity.setValue(0);
    rodAngle.setValue(0);
    scorePopup.setValue(0);
  };

  const restart = () => {
    setAttempt(0);
    setResults([]);
    resetAnimations();
    setWind(generateWind());
    setPhase(PHASE.READY);
    setCastResult(null);
    setTrajectory([]);
  };

  // ── Derived ──
  const bestResult =
    results.length > 0
      ? results.reduce(
          (best, r) => (r.score > best.score ? r : best),
          results[0],
        )
      : null;
  const isFinished = attempt >= 3 && phase === PHASE.RESULT;

  // Power bar color
  const powerColor = powerAnim.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: ['#4CAF50', '#FFD700', '#FF9800', '#F44336'],
  });

  // Build SVG trajectory path
  const buildTrajPath = () => {
    if (trajectory.length < 2) return '';
    const startX = SVG_W * 0.08;
    const rangeX = SVG_W * 0.85;
    let d = '';
    trajectory.forEach((p, i) => {
      const x = startX + p.x * rangeX;
      const y = WATER_Y - p.y * SVG_H * 0.5;
      d += i === 0 ? `M${x},${WATER_Y}` : ` L${x},${y}`;
    });
    return d;
  };

  // Landing spot
  const landingX =
    trajectory.length > 0
      ? SVG_W * 0.08 + trajectory[trajectory.length - 1].x * SVG_W * 0.85
      : SVG_W * 0.5;

  // Target zone SVG
  const targetMinX =
    SVG_W * 0.08 +
    (technique.targetZone.min / technique.maxDistance) * SVG_W * 0.85;
  const targetMaxX =
    SVG_W * 0.08 +
    (technique.targetZone.max / technique.maxDistance) * SVG_W * 0.85;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onHandlerStateChange={onGesture}>
        <View style={[styles.container, { backgroundColor: scene.bg1 }]}>
          <StatusBar barStyle="light-content" />

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.topCenter}>
              <Text style={styles.techTitle}>
                {technique.emoji} {technique.name}
              </Text>
              <Text
                style={[
                  styles.diffLabel,
                  { color: DIFFICULTY_COLORS[technique.difficulty] },
                ]}
              >
                {technique.difficulty.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.attemptText}>{Math.min(attempt + 1, 3)}/3</Text>
          </View>

          {/* Wind indicator */}
          <View style={styles.windBar}>
            <Text style={styles.windText}>
              {wind.direction === -1 ? '←' : '→'} {wind.label}
              {wind.speed > 0.15
                ? ` (${Math.round(wind.speed * 30)} km/h)`
                : ''}
            </Text>
          </View>

          {/* SVG Scene */}
          <View style={styles.sceneContainer}>
            <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
              <Defs>
                <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={scene.bg1} />
                  <Stop offset="1" stopColor={scene.bg2} />
                </LinearGradient>
                <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={scene.water} />
                  <Stop offset="1" stopColor={scene.bg1} />
                </LinearGradient>
              </Defs>

              {/* Sky */}
              <Rect
                x={0}
                y={0}
                width={SVG_W}
                height={WATER_Y}
                fill="url(#sky)"
              />
              {/* Water */}
              <Rect
                x={0}
                y={WATER_Y}
                width={SVG_W}
                height={SVG_H - WATER_Y}
                fill="url(#water)"
              />
              {/* Water line */}
              <Line
                x1={0}
                y1={WATER_Y}
                x2={SVG_W}
                y2={WATER_Y}
                stroke="#4488aa30"
                strokeWidth={1.5}
              />

              {/* Distance markers */}
              {[0.25, 0.5, 0.75, 1].map(pct => {
                const x = SVG_W * 0.08 + pct * SVG_W * 0.85;
                const dist = Math.round(pct * technique.maxDistance);
                return (
                  <G key={pct}>
                    <Line
                      x1={x}
                      y1={WATER_Y - 4}
                      x2={x}
                      y2={WATER_Y + 4}
                      stroke="#4488aa50"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={x}
                      y={WATER_Y + 16}
                      fill="#4488aa80"
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {dist}m
                    </SvgText>
                  </G>
                );
              })}

              {/* Target zone */}
              <Rect
                x={targetMinX}
                y={WATER_Y - 3}
                width={targetMaxX - targetMinX}
                height={6}
                fill="#00D4AA30"
                rx={3}
              />
              <SvgText
                x={(targetMinX + targetMaxX) / 2}
                y={WATER_Y - 8}
                fill="#00D4AA60"
                fontSize={10}
                textAnchor="middle"
              >
                TARGET
              </SvgText>

              {/* Rod (at left) */}
              <Line
                x1={SVG_W * 0.06}
                y1={WATER_Y + 10}
                x2={SVG_W * 0.08}
                y2={WATER_Y - 40}
                stroke="#8B7355"
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Trajectory line */}
              {trajectory.length > 0 && (
                <Path
                  d={buildTrajPath()}
                  fill="none"
                  stroke="#FFFFFF40"
                  strokeWidth={1.5}
                  strokeDasharray="4,4"
                />
              )}

              {/* Landing splash */}
              {castResult && (
                <>
                  <Circle
                    cx={landingX}
                    cy={WATER_Y}
                    r={12}
                    fill={castResult.inZone ? '#00D4AA40' : '#FF660040'}
                    stroke={castResult.inZone ? '#00D4AA80' : '#FF660080'}
                    strokeWidth={1.5}
                  />
                  <SvgText
                    x={landingX}
                    y={WATER_Y + 30}
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {castResult.distance}m
                  </SvgText>
                </>
              )}

              {/* Fisher position */}
              <SvgText
                x={SVG_W * 0.06}
                y={WATER_Y + 30}
                fontSize={22}
                textAnchor="middle"
              >
                🧑‍🎣
              </SvgText>
            </Svg>
          </View>

          {/* Tip */}
          {showTip && phase === PHASE.READY && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {technique.tip}</Text>
            </View>
          )}

          {/* Power Meter */}
          <View style={styles.powerSection}>
            <Text style={styles.powerLabel}>POWER</Text>
            <View style={styles.powerBarBg}>
              <Animated.View
                style={[
                  styles.powerBarFill,
                  {
                    width: powerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: powerColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.powerHint}>
              {phase === PHASE.CHARGING
                ? 'Release to cast!'
                : phase === PHASE.READY
                ? 'Hold button or swipe up ↑'
                : ''}
            </Text>
          </View>

          {/* Cast Result */}
          {phase === PHASE.RESULT && castResult && (
            <Animated.View
              style={[
                styles.resultCard,
                {
                  transform: [{ scale: scorePopup }],
                  opacity: scorePopup,
                },
              ]}
            >
              <View style={styles.resultTop}>
                <Text style={styles.resultScore}>{castResult.score}</Text>
                <View>
                  <View style={styles.resultStarsRow}>
                    {[1, 2, 3].map(i => (
                      <Text
                        key={i}
                        style={[
                          styles.resultStar,
                          castResult.stars >= i && styles.resultStarEarned,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.resultDist}>
                    {castResult.distance}m · Acc: {castResult.accuracy}%
                  </Text>
                </View>
              </View>
              {castResult.inZone && (
                <Text style={styles.zoneText}>🎯 In the zone!</Text>
              )}
              {wind.speed > 0.35 && castResult.drift !== 0 && (
                <Text style={styles.driftText}>
                  Wind drift: {castResult.drift > 0 ? '+' : ''}
                  {castResult.drift}m
                </Text>
              )}
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {phase === PHASE.READY && (
              <Animated.View style={{ transform: [{ scale: castBtnPulse }] }}>
                <TouchableOpacity
                  style={styles.castBtn}
                  activeOpacity={0.7}
                  onPressIn={startCharge}
                  onPressOut={releaseCast}
                >
                  <Text style={styles.castBtnEmoji}>🎣</Text>
                  <Text style={styles.castBtnText}>HOLD TO CAST</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {phase === PHASE.CHARGING && (
              <TouchableOpacity
                style={[styles.castBtn, styles.castBtnCharging]}
                activeOpacity={1}
                onPressOut={releaseCast}
              >
                <Text style={styles.castBtnEmoji}>💪</Text>
                <Text style={styles.castBtnText}>LOADING POWER...</Text>
              </TouchableOpacity>
            )}

            {phase === PHASE.CASTING && (
              <View style={styles.castingPlaceholder}>
                <Text style={styles.castingText}>✨ Casting...</Text>
              </View>
            )}

            {phase === PHASE.RESULT && !isFinished && (
              <TouchableOpacity style={styles.nextBtn} onPress={nextCast}>
                <Text style={styles.nextBtnText}>
                  Next Cast ({attempt + 1}/3) →
                </Text>
              </TouchableOpacity>
            )}

            {isFinished && bestResult && (
              <View style={styles.finalCard}>
                <Text style={styles.finalTitle}>🏁 Round Complete!</Text>
                <Text style={styles.finalScore}>
                  Best Score: {bestResult.score}
                </Text>
                <View style={styles.resultStarsRow}>
                  {[1, 2, 3].map(i => (
                    <Text
                      key={i}
                      style={[
                        styles.finalStar,
                        bestResult.stars >= i && styles.resultStarEarned,
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.finalDetail}>
                  Best: {bestResult.distance}m · Accuracy: {bestResult.accuracy}
                  %
                </Text>
                <View style={styles.finalButtons}>
                  <TouchableOpacity style={styles.retryBtn} onPress={restart}>
                    <Text style={styles.retryText}>🔄 Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.doneText}>✅ Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Attempts indicator */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < results.length && styles.dotFilled,
                  i === attempt && phase !== PHASE.RESULT && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backText: {
    color: '#00D4AA',
    fontSize: 15,
    fontWeight: '600',
  },
  topCenter: {
    alignItems: 'center',
  },
  techTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  diffLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  attemptText: {
    color: '#6688aa',
    fontSize: 14,
    fontWeight: '600',
  },

  // Wind
  windBar: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  windText: {
    color: '#88aacc',
    fontSize: 12,
    fontWeight: '500',
  },

  // Scene
  sceneContainer: {
    marginTop: 4,
  },

  // Tip
  tipBox: {
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#00D4AA15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00D4AA30',
  },
  tipText: {
    color: '#88ccbb',
    fontSize: 13,
    textAlign: 'center',
  },

  // Power meter
  powerSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  powerLabel: {
    color: '#6688aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  powerBarBg: {
    height: 14,
    backgroundColor: '#1a2540',
    borderRadius: 7,
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  powerHint: {
    color: '#4466aa',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  // Result
  resultCard: {
    marginHorizontal: 24,
    marginTop: 10,
    backgroundColor: '#111830',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00D4AA40',
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resultScore: {
    color: '#FFD700',
    fontSize: 48,
    fontWeight: '900',
  },
  resultStarsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  resultStar: {
    fontSize: 24,
    color: '#2a3550',
  },
  resultStarEarned: {
    color: '#FFD700',
  },
  resultDist: {
    color: '#88aacc',
    fontSize: 13,
    marginTop: 4,
  },
  zoneText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  driftText: {
    color: '#88776650',
    fontSize: 12,
    marginTop: 4,
  },

  // Buttons
  buttonRow: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  castBtn: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 8,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  castBtnCharging: {
    backgroundColor: '#FF9800',
    shadowColor: '#FF9800',
  },
  castBtnEmoji: {
    fontSize: 24,
  },
  castBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  castingPlaceholder: {
    paddingVertical: 16,
  },
  castingText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
  },
  nextBtn: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a5a8c',
  },
  nextBtnText: {
    color: '#88ccff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Final
  finalCard: {
    backgroundColor: '#111830',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD70050',
    width: '100%',
  },
  finalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  finalScore: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 6,
  },
  finalStar: {
    fontSize: 30,
    color: '#2a3550',
  },
  finalDetail: {
    color: '#88aacc',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  finalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a5a8c',
  },
  retryText: {
    color: '#88ccff',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#00D4AA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  doneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a2540',
    borderWidth: 1,
    borderColor: '#2a3560',
  },
  dotFilled: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  dotActive: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
});
