// Default categories with distinct solid colors
export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'fast-food', color: '#E76F51', is_default: 1 },
  { name: 'Transport', icon: 'car', color: '#F4A261', is_default: 1 },
  { name: 'Bills', icon: 'receipt', color: '#E9C46A', is_default: 1 },
  { name: 'Shopping', icon: 'bag-handle', color: '#5B5BD6', is_default: 1 },
  { name: 'Entertainment', icon: 'game-controller', color: '#8B5CF6', is_default: 1 },
  { name: 'Health', icon: 'medkit', color: '#DB2777', is_default: 1 },
  { name: 'Other', icon: 'ellipsis-horizontal', color: '#334155', is_default: 1 },
];

export const CHART_COLORS = [
  '#2563EB', '#7C3AED', '#CA8A04', '#EA580C',
  '#DB2777', '#475569', '#D95D39', '#4F46E5',
];

// Recurrence interval options
export const RECURRENCE_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

// Currency options
export const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
];

// Warm coral theme palettes
export const LIGHT_THEME = {
  background: '#FFF8F3',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF0E8',
  primary: '#D95D39',
  primaryLight: '#FFE1D6',
  primaryDark: '#9C3D28',
  primaryText: '#FFFFFF',
  text: '#2D2530',
  textSecondary: '#6B5E67',
  textTertiary: '#9B8F96',
  border: '#E8DCD7',
  borderLight: '#F2E9E5',
  danger: '#B42318',
  dangerLight: '#FEE4E2',
  success: '#2563EB',
  successLight: '#DBEAFE',
  warning: '#B7791F',
  warningLight: '#FEF3C7',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8DCD7',
  card: '#FFFFFF',
  shadow: 'rgba(156, 61, 40, 0.14)',
  overlay: 'rgba(45, 37, 48, 0.45)',
  statusBar: 'dark',
};

export const DARK_THEME = {
  background: '#21161B',
  surface: '#302027',
  surfaceElevated: '#3E2830',
  primary: '#FF8A6B',
  primaryLight: '#643124',
  primaryDark: '#8F3425',
  primaryText: '#FFFFFF',
  text: '#FFF5F1',
  textSecondary: '#D3B7AD',
  textTertiary: '#A98E86',
  border: '#5A3C42',
  borderLight: '#442F36',
  danger: '#FCA5A1',
  dangerLight: '#5B2928',
  success: '#60A5FA',
  successLight: '#1E3A5F',
  warning: '#FCD34D',
  warningLight: '#57451B',
  tabBar: '#2A1B22',
  tabBarBorder: '#5A3C42',
  card: '#302027',
  shadow: 'rgba(0, 0, 0, 0.35)',
  overlay: 'rgba(22, 12, 17, 0.78)',
  statusBar: 'light',
};

// Category icon options for custom categories
export const CATEGORY_ICONS = [
  'fast-food', 'car', 'receipt', 'bag-handle', 'game-controller',
  'medkit', 'ellipsis-horizontal', 'home', 'school', 'airplane',
  'wifi', 'gift', 'heart', 'paw', 'musical-notes',
  'book', 'camera', 'fitness', 'cafe', 'beer',
  'pizza', 'bicycle', 'bus', 'train', 'construct',
  'cut', 'shirt', 'watch', 'laptop', 'phone-portrait',
];

// Solid category color options
export const CATEGORY_COLORS = [
  '#E76F51', '#F4A261', '#E9C46A', '#5B5BD6', '#8B5CF6',
  '#DB2777', '#334155', '#2563EB', '#4F46E5', '#CA8A04',
  '#EA580C', '#C026D3', '#BE123C', '#7C3AED', '#475569',
];
