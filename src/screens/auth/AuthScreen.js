/**
 * AuthScreen — ProFish sign-in / sign-up
 * Google, Apple, Anonymous auth via Firebase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import firebaseAuthService from '../../services/firebaseAuthService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

export default function AuthScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const mode = route?.params?.mode; // 'anonymous' or undefined

  // If navigated with mode=anonymous, auto-sign-in
  React.useEffect(() => {
    if (mode === 'anonymous') {
      handleAnonymous();
    }
  }, [mode]);

  const providers = firebaseAuthService.getAvailableProviders();

  async function handleGoogle() {
    setLoading(true);
    setLoadingProvider('google');
    try {
      await firebaseAuthService.signInWithGoogle();
      // Navigation handled by auth state listener in AppContext
    } catch (e) {
      Alert.alert(
        t('auth.error', 'Sign-in Error'),
        e.message ||
          t('auth.errorGeneric', 'Something went wrong. Please try again.'),
      );
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleApple() {
    setLoading(true);
    setLoadingProvider('apple');
    try {
      await firebaseAuthService.signInWithApple();
    } catch (e) {
      Alert.alert(
        t('auth.error', 'Sign-in Error'),
        e.message ||
          t('auth.errorGeneric', 'Something went wrong. Please try again.'),
      );
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleAnonymous() {
    setLoading(true);
    setLoadingProvider('anonymous');
    try {
      await firebaseAuthService.signInAnonymously();
    } catch (e) {
      Alert.alert(
        t('auth.error', 'Sign-in Error'),
        e.message ||
          t('auth.errorGeneric', 'Something went wrong. Please try again.'),
      );
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        t('auth.error', 'Error'),
        t('auth.fillFields', 'Please fill in all fields'),
      );
      return;
    }
    setLoading(true);
    setLoadingProvider('email');
    try {
      if (isSignUp) {
        await firebaseAuthService.createAccountWithEmail(
          email.trim(),
          password,
          displayName.trim() || undefined,
        );
      } else {
        await firebaseAuthService.signInWithEmail(email.trim(), password);
      }
    } catch (e) {
      let msg = e.message;
      if (e.code === 'auth/email-already-in-use')
        msg = t(
          'auth.emailInUse',
          'This email is already registered. Try signing in.',
        );
      else if (e.code === 'auth/invalid-email')
        msg = t('auth.invalidEmail', 'Invalid email address.');
      else if (e.code === 'auth/weak-password')
        msg = t('auth.weakPassword', 'Password must be at least 6 characters.');
      else if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password'
      )
        msg = t('auth.wrongCredentials', 'Invalid email or password.');
      Alert.alert(t('auth.error', 'Sign-in Error'), msg);
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        t('auth.error', 'Error'),
        t('auth.enterEmail', 'Enter your email first'),
      );
      return;
    }
    try {
      await firebaseAuthService.sendPasswordReset(email.trim());
      Alert.alert(
        t('auth.resetSent', 'Reset Email Sent'),
        t(
          'auth.resetSentMsg',
          'Check your inbox for password reset instructions.',
        ),
      );
    } catch (e) {
      Alert.alert(t('auth.error', 'Error'), e.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.signIn', 'Sign In')}</Text>
        </View>

        {/* Branding */}
        <View style={styles.branding}>
          <AppIcon name="fish" size={48} color={colors.primary} />
          <Text style={styles.title}>ProFish</Text>
          <Text style={styles.subtitle}>
            {t(
              'auth.signInSubtitle',
              'Sign in to sync your catches across devices',
            )}
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {/* Google */}
          {providers.google && (
            <TouchableOpacity
              style={[styles.authBtn, styles.googleBtn]}
              onPress={handleGoogle}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loadingProvider === 'google' ? (
                <ActivityIndicator color={colors.border} size="small" />
              ) : (
                <>
                  <Text style={styles.authBtnIcon}>G</Text>
                  <Text style={[styles.authBtnText, styles.googleText]}>
                    {t('auth.continueGoogle', 'Continue with Google')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Apple (iOS primarily) */}
          {providers.apple && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.authBtn, styles.appleBtn]}
              onPress={handleApple}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={[styles.authBtnIcon, { color: '#fff' }]}>
                    🍎
                  </Text>
                  <Text style={[styles.authBtnText, styles.appleText]}>
                    {t('auth.continueApple', 'Continue with Apple')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or', 'or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Anonymous / Guest */}
          <TouchableOpacity
            style={[styles.authBtn, styles.anonBtn]}
            onPress={handleAnonymous}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loadingProvider === 'anonymous' ? (
              <ActivityIndicator color={colors.textTertiary} size="small" />
            ) : (
              <>
                <AppIcon name="user" size={20} color={colors.text} />
                <Text style={[styles.authBtnText, styles.anonText]}>
                  {t('auth.continueGuest', 'Continue as Guest')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.guestNote}>
            {t('auth.guestNote', 'You can sign in later to sync your data')}
          </Text>

          {/* Email/Password */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or', 'or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {!showEmail ? (
            <TouchableOpacity
              style={[styles.authBtn, styles.emailToggleBtn]}
              onPress={() => setShowEmail(true)}
              disabled={loading}
            >
              <AppIcon name="mail" size={20} color={colors.text} />
              <Text style={[styles.authBtnText, styles.anonText]}>
                {t('auth.continueEmail', 'Continue with Email')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emailForm}>
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.displayName', 'Display Name')}
                  placeholderTextColor={colors.textDisabled}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              )}
              <TextInput
                style={styles.input}
                placeholder={t('auth.email', 'Email')}
                placeholderTextColor={colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password', 'Password')}
                placeholderTextColor={colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleEmail}
              />

              <TouchableOpacity
                style={[styles.authBtn, styles.emailSubmitBtn]}
                onPress={handleEmail}
                disabled={loading}
              >
                {loadingProvider === 'email' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.authBtnText, { color: '#fff' }]}>
                    {isSignUp
                      ? t('auth.createAccount', 'Create Account')
                      : t('auth.signInEmail', 'Sign In')}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.emailLinks}>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.linkText}>
                    {isSignUp
                      ? t(
                          'auth.haveAccount',
                          'Already have an account? Sign In',
                        )
                      : t('auth.noAccount', "Don't have an account? Sign Up")}
                  </Text>
                </TouchableOpacity>

                {!isSignUp && (
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.linkText}>
                      {t('auth.forgotPassword', 'Forgot Password?')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Legal */}
        <Text style={styles.legal}>
          {t(
            'auth.legal',
            'By continuing, you agree to our Terms & Privacy Policy',
          )}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingBottom: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      marginBottom: 20,
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backBtnText: {
      fontSize: 28,
      color: colors.text,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    branding: {
      alignItems: 'center',
      marginBottom: 40,
      marginTop: 20,
    },
    logo: {
      fontSize: 54,
      marginBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textTertiary,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    buttons: {
      gap: 12,
    },
    authBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      gap: 10,
      minHeight: 56,
    },
    googleBtn: {
      backgroundColor: '#fff',
    },
    appleBtn: {
      backgroundColor: '#000',
      borderWidth: 1,
      borderColor: colors.border,
    },
    anonBtn: {
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    authBtnIcon: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4285F4',
    },
    authBtnText: {
      fontSize: 16,
      fontWeight: '600',
    },
    googleText: {
      color: colors.border,
    },
    appleText: {
      color: '#fff',
    },
    anonText: {
      color: colors.textTertiary,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textDisabled,
      paddingHorizontal: 16,
      fontSize: 14,
    },
    guestNote: {
      fontSize: 13,
      color: colors.textDisabled,
      textAlign: 'center',
      marginTop: 4,
    },
    legal: {
      fontSize: 12,
      color: colors.textDisabled,
      textAlign: 'center',
    },
    emailToggleBtn: {
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    emailForm: {
      gap: 10,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.surfaceLight,
    },
    emailSubmitBtn: {
      backgroundColor: colors.primary,
      marginTop: 4,
    },
    emailLinks: {
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
    },
  });
