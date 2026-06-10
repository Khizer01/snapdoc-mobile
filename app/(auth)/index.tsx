import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeOutUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../../src/components/Logo';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { AlertModal, AlertConfig } from '../../src/components/AlertModal';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme, spacing, radius, typography } from '../../src/theme';

const LOGO_SIZE = 110;
const LOGO_H = LOGO_SIZE * 1.2;
const DOC_W = LOGO_SIZE * 0.72;
const DOC_H = LOGO_H * 0.78;
const DOC_X = (LOGO_SIZE - DOC_W) / 2;
const DOC_Y = (LOGO_H - DOC_H) / 2;

function AnimatedLogo() {
  const scanY = useSharedValue(DOC_Y);

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(DOC_Y + DOC_H - 2, { duration: 2800, easing: Easing.inOut(Easing.cubic) }),
        withDelay(600, withTiming(DOC_Y, { duration: 2800, easing: Easing.inOut(Easing.cubic) })),
        withDelay(600, withTiming(DOC_Y, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({ top: scanY.value }));

  return (
    <View style={{ width: LOGO_SIZE, height: LOGO_H }}>
      <Logo size={LOGO_SIZE} color="#FFFFFF" />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: DOC_X,
            width: DOC_W,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.95)',
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 4,
          },
          scanStyle,
        ]}
      />
    </View>
  );
}

function FieldError({ text, errorColor }: { text?: string; errorColor: string }) {
  if (!text) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={13} color={errorColor} />
      <Text style={[styles.errorText, { color: errorColor }]}>{text}</Text>
    </View>
  );
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function parseServerError(message: string): { field: keyof FormErrors | null; text: string } {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return { field: 'password', text: 'Incorrect email or password' };
  }
  if (m.includes('already registered') || m.includes('already in use') || m.includes('already exists')) {
    return { field: 'email', text: 'An account with this email already exists' };
  }
  if (m.includes('user not found') || m.includes('no user')) {
    return { field: 'email', text: 'No account found with this email address' };
  }
  if (m.includes('password') && (m.includes('6') || m.includes('short') || m.includes('weak'))) {
    return { field: 'password', text: 'Password must be at least 6 characters' };
  }
  return { field: null, text: message };
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const eyeAnim = useSharedValue(1);

  function togglePassword() {
    eyeAnim.value = withSequence(
      withTiming(0, { duration: 80, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 130, easing: Easing.out(Easing.back(1.8)) }),
    );
    setShowPassword(p => !p);
  }

  const eyeAnimStyle = useAnimatedStyle(() => ({
    opacity: eyeAnim.value,
    transform: [{ scale: 0.65 + eyeAnim.value * 0.35 }],
  }));

  function clearFieldError(field: keyof FormErrors) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (isSignUp) {
      if (!firstName.trim()) next.firstName = 'Please enter your first name';
      if (!lastName.trim()) next.lastName = 'Please enter your last name';
    }

    if (!email.trim()) {
      next.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      next.email = 'Enter a valid email address';
    }

    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, firstName.trim(), lastName.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err: any) {
      const msg: string = err.message ?? 'Something went wrong';
      const parsed = parseServerError(msg);
      if (parsed.field) {
        setErrors(prev => ({ ...prev, [parsed.field!]: parsed.text }));
      } else {
        setAlertConfig({ type: 'error', title: 'Something went wrong', message: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    setIsSignUp(v => !v);
    setFirstName('');
    setLastName('');
    setErrors({});
  }

  const inputStyle = (focused: boolean, hasError?: boolean) => [
    styles.input,
    {
      backgroundColor: colors.background,
      borderColor: hasError ? colors.error : focused ? colors.primary : colors.border,
      color: colors.textPrimary,
    },
  ];

  return (
    <View style={[styles.flex, styles.outerBg]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
      >
        <ScrollView
          style={[styles.flex, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          bounces={false}
        >
          {/* Branding: gradient lives here so it never bleeds below the card */}
          <View style={[styles.branding, { paddingTop: insets.top + spacing.xxl }]}>
            <LinearGradient
              colors={['#4A5BE8', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View entering={FadeIn.duration(600)} style={styles.brandingContent}>
              <AnimatedLogo />
              <Text style={styles.appName}>SnapDoc AI</Text>
              <Text style={styles.tagline}>Scan · Summarise · Ask anything</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.duration(450).delay(150)} style={styles.cardWrapper}>
            <View style={[styles.card, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.xl }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>

              {/* First name */}
              {isSignUp && (
                <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOutUp.duration(200)}>
                  <TextInput
                    style={inputStyle(firstNameFocused, !!errors.firstName)}
                    placeholder="First Name"
                    placeholderTextColor={colors.textSecondary}
                    value={firstName}
                    onChangeText={v => { setFirstName(v); clearFieldError('firstName'); }}
                    autoCapitalize="words"
                    onFocus={() => setFirstNameFocused(true)}
                    onBlur={() => setFirstNameFocused(false)}
                  />
                  <FieldError text={errors.firstName} errorColor={colors.error} />
                </Animated.View>
              )}

              {/* Last name */}
              {isSignUp && (
                <Animated.View
                  entering={FadeInDown.duration(250).delay(60)}
                  exiting={FadeOutUp.duration(200)}
                  style={{ marginTop: errors.firstName ? spacing.xs : spacing.md }}
                >
                  <TextInput
                    style={inputStyle(lastNameFocused, !!errors.lastName)}
                    placeholder="Last Name"
                    placeholderTextColor={colors.textSecondary}
                    value={lastName}
                    onChangeText={v => { setLastName(v); clearFieldError('lastName'); }}
                    autoCapitalize="words"
                    onFocus={() => setLastNameFocused(true)}
                    onBlur={() => setLastNameFocused(false)}
                  />
                  <FieldError text={errors.lastName} errorColor={colors.error} />
                </Animated.View>
              )}

              {/* Email */}
              <View style={{ marginTop: isSignUp ? (errors.lastName ? spacing.xs : spacing.md) : 0 }}>
                <TextInput
                  style={inputStyle(emailFocused, !!errors.email)}
                  placeholder="Email address"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={v => { setEmail(v); clearFieldError('email'); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                <FieldError text={errors.email} errorColor={colors.error} />
              </View>

              {/* Password */}
              <View style={{ marginTop: errors.email ? spacing.xs : spacing.md }}>
                <TextInput
                  style={[inputStyle(passwordFocused, !!errors.password), { paddingRight: 52 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={v => { setPassword(v); clearFieldError('password'); }}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <Pressable onPress={togglePassword} hitSlop={12} style={styles.eyeBtn}>
                  <Animated.View style={eyeAnimStyle}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Animated.View>
                </Pressable>
                <FieldError text={errors.password} errorColor={colors.error} />
              </View>

              <AnimatedButton
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitButton, { marginTop: errors.password ? spacing.md : spacing.xl }]}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </AnimatedButton>

              <AnimatedButton onPress={handleToggle} style={styles.toggle}>
                <Text style={[typography.label, { color: colors.primary, fontSize: 15 }]}>
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </Text>
              </AnimatedButton>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal config={alertConfig} onDismiss={() => setAlertConfig(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outerBg: { backgroundColor: '#4A5BE8' },
  scrollContent: { flexGrow: 1 },
  branding: {
    flex: 1,
    minHeight: 220,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  brandingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Inter_400Regular',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cardWrapper: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    marginTop: -36,
  },
  card: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#5B6AF0',
    paddingVertical: 17,
    borderRadius: radius.full,
    alignItems: 'center',
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  toggle: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.md },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
