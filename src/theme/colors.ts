// CCB (Connect Communicate Belong) design tokens
// Swiss-influenced grid with a heavily-colored canvas.

export const light = {
  primary: '#0D5740',      // deep emerald
  primaryLight: '#1A6B4A', // lighter emerald for gradients
  gold: '#F5A623',         // warm gold accent
  charcoal: '#1C1C2E',     // primary text / dark surfaces
  offWhite: '#F8F6F2',     // app background
  card: '#FFFFFF',
  border: '#E7E2D9',
  textPrimary: '#1C1C2E',
  textSecondary: '#6B7280',
  success: '#1A6B4A',
  danger: '#D64545',
  online: '#3FBF6F',
};

export const dark = {
  primary: '#1A6B4A',
  primaryLight: '#22855C',
  gold: '#F5A623',
  charcoal: '#F8F6F2',
  offWhite: '#12141A',
  card: '#1C1E27',
  border: '#2A2D38',
  textPrimary: '#F8F6F2',
  textSecondary: '#9CA3AF',
  success: '#3FBF6F',
  danger: '#E57373',
  online: '#3FBF6F',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export type ThemeColors = typeof light;
