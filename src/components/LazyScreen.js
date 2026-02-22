/**
 * LazyScreen — Lazy loading wrapper for React Navigation screens
 * #501 — React.lazy() + Suspense for all non-critical screen imports
 *
 * Usage:
 *   const LazySettings = lazyScreen(() => import('../screens/main/SettingsScreen'));
 *   <Stack.Screen name="Settings" component={LazySettings} />
 */

import React, { Suspense } from 'react';
import SkeletonScreen from './SkeletonScreen';

/**
 * Creates a lazy-loaded screen component compatible with React Navigation.
 * Shows a skeleton shimmer while the screen JS bundle chunk loads.
 *
 * @param {Function} importFn — () => import('./SomeScreen')
 * @param {string} [variant] — skeleton variant: 'list' | 'map' | 'detail' | 'form' | 'profile'
 * @returns {React.ComponentType}
 */
export default function lazyScreen(importFn, variant = 'list') {
  const LazyComponent = React.lazy(importFn);

  function LazyScreenWrapper(props) {
    return (
      <Suspense fallback={<SkeletonScreen variant={variant} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  // Copy display name for debugging
  LazyScreenWrapper.displayName = `Lazy(${importFn.name || 'Screen'})`;

  return LazyScreenWrapper;
}
