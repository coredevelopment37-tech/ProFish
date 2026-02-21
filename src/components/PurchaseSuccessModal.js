/**
 * PurchaseSuccessModal — Animated celebration after successful subscription
 * Shows confetti-like effect with tier badge
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TIER_META } from '../services/subscriptionService';

const { width } = Dimensions.get('window');

// Confetti particle positions (pre-computed for perf)
const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  left: Math.random() * width,
  delay: Math.random() * 600,
  color: ['#FF9800', '#4CAF50', '#2196F3', '#E040FB', '#FF5722', '#FFEB3B'][
    i % 6
  ],
  size: 6 + Math.random() * 8,
}));

function ConfettiParticle({ particle }) {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: Dimensions.get('window').height + 20,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start();
    }, particle.delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: particle.left,
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          opacity: fadeAnim,
          transform: [{ translateY: fallAnim }],
        },
      ]}
    />
  );
}

export default function PurchaseSuccessModal({
  visible,
  tier = 'pro',
  onClose,
}) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const tierMeta = TIER_META[tier] || TIER_META.pro;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {CONFETTI.map((p, i) => (
          <ConfettiParticle key={i} particle={p} />
        ))}

        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.emoji}>{tierMeta.icon}</Text>
          <Text style={styles.title}>
            {t('purchase.welcome', 'Welcome to {{tier}}!', {
              tier: tierMeta.label,
            })}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              'purchase.thankYou',
              'Thank you for upgrading. All premium features are now unlocked.',
            )}
          </Text>

          <View style={styles.features}>
            <Text style={styles.featureItem}>
              ✅ {t('purchase.unlimited', 'Unlimited catch logging')}
            </Text>
            <Text style={styles.featureItem}>
              ✅ {t('purchase.allLayers', 'All map layers unlocked')}
            </Text>
            <Text style={styles.featureItem}>
              ✅ {t('purchase.offline', 'Offline maps available')}
            </Text>
            <Text style={styles.featureItem}>
              ✅ {t('purchase.stats', 'Advanced catch statistics')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: tierMeta.color }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {t('purchase.getStarted', 'Get Started')} 🎣
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#0a0a1a',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    maxWidth: 360,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  confetti: {
    position: 'absolute',
    top: -10,
  },
});
