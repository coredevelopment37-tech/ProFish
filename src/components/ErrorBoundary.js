/**
 * ErrorBoundary — Global crash recovery UI
 * Catches JS errors anywhere in the component tree.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import crashReporter from '../services/crashReporter';
import { COLORS } from '../config/theme';
import { AppIcon } from '../constants/icons';

// Fallback colors — ErrorBoundary sits ABOVE AppProvider so useTheme() is unavailable
const FALLBACK_COLORS = COLORS;

class ErrorBoundaryClass extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    crashReporter.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const styles = createStyles(this.props.colors);
      return (
        <View style={styles.container}>
          <AppIcon name="alertTriangle" size={48} color={this.props.colors?.error || '#FF5252'} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => {
              crashReporter.captureException(this.state.error, {
                extra: { userReported: true },
              });
            }}
          >
            <Text style={styles.reportText}>Report Problem</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary(props) {
  return <ErrorBoundaryClass colors={FALLBACK_COLORS} {...props} />;
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: { fontSize: 64, marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  reportBtn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  reportText: {
    color: colors.textDisabled,
    fontSize: 14,
  },
});
