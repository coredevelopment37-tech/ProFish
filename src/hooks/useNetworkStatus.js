/**
 * useNetworkStatus — Hook for network connectivity state
 * Uses @react-native-community/netinfo if available, otherwise assumes online
 */

import { useState, useEffect, useRef, useCallback } from 'react';

let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // Not installed
}

export default function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!NetInfo) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      const prevConnected = isConnected;
      setIsConnected(connected);
      setConnectionType(state.type || 'unknown');

      // Fire reconnect listeners when coming back online
      if (connected && !prevConnected) {
        listenersRef.current.forEach(fn => {
          try {
            fn();
          } catch {}
        });
      }
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type || 'unknown');
    });

    return () => unsubscribe();
  }, []);

  /**
   * Register a callback to run when connectivity is restored
   */
  const onReconnect = useCallback(callback => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter(fn => fn !== callback);
    };
  }, []);

  return { isConnected, connectionType, onReconnect };
}
