// Default categories with Ionicons names and colors
export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'fast-food', color: '#FF6B6B', is_default: 1 },
  { name: 'Transport', icon: 'car', color: '#4ECDC4', is_default: 1 },
  { name: 'Bills', icon: 'receipt', color: '#45B7D1', is_default: 1 },
  { name: 'Shopping', icon: 'bag-handle', color: '#96CEB4', is_default: 1 },
  { name: 'Entertainment', icon: 'game-controller', color: '#FFEAA7', is_default: 1 },
  { name: 'Health', icon: 'medkit', color: '#DDA0DD', is_default: 1 },
  { name: 'Other', icon: 'ellipsis-horizontal', color: '#888888', is_default: 1 },
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

// Theme color palettes
export const LIGHT_THEME = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#6C5CE7',
  primaryLight: '#E8E5FF',
  primaryDark: '#5A4BD1',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  statusBar: 'dark',
};

export const DARK_THEME = {
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2128',
  primary: '#A78BFA',
  primaryLight: '#2D2654',
  primaryDark: '#8B6FE0',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  border: '#30363D',
  borderLight: '#21262D',
  danger: '#F87171',
  dangerLight: '#3B1A1A',
  success: '#34D399',
  successLight: '#1A3B2A',
  warning: '#FBBF24',
  warningLight: '#3B351A',
  tabBar: '#161B22',
  tabBarBorder: '#30363D',
  card: '#161B22',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
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

// Category color options for custom categories
export const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#888888', '#FF8A65', '#7986CB', '#4DB6AC',
  '#FFD54F', '#AED581', '#F06292', '#BA68C8', '#4DD0E1',
  '#9575CD', '#FF7043', '#66BB6A', '#42A5F5', '#EC407A',
];
