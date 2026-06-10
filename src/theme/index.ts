import { useColorScheme } from 'react-native';

export const colors = {
  light: {
    primary:       '#5B6AF0',
    primaryMuted:  '#7C8FF5',
    accent:        '#4ECDC4',
    background:    '#F8F8FB',
    surface:       '#FFFFFF',
    textPrimary:   '#1A1A2E',
    textSecondary: '#6B6B8A',
    success:       '#2ECC71',
    error:         '#E74C3C',
    border:        '#E8E8F0',
    shadow:        'rgba(91, 106, 240, 0.12)',
  },
  dark: {
    primary:       '#7C8FF5',
    primaryMuted:  '#5B6AF0',
    accent:        '#5ED9D1',
    background:    '#0F0F14',
    surface:       '#1A1A24',
    textPrimary:   '#EEEEF5',
    textSecondary: '#9090A8',
    success:       '#2ECC71',
    error:         '#E74C3C',
    border:        '#2A2A38',
    shadow:        'rgba(0, 0, 0, 0.4)',
  },
} as const;

export type ColorScheme = typeof colors.light;

export const typography = {
  body:       { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label:      { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  subheading: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  title:      { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  caption:    { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const animation = {
  spring:     { damping: 15, stiffness: 150 },
  timing:     { duration: 250 },
  pulse:      { duration: 800 },
  slideIn:    { duration: 300, translateY: 24 },
  pressScale: 0.96,
} as const;

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  return { colors: colors[scheme], scheme };
}
