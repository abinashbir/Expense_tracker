import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const TAB_CONFIG = {
  index: { label: 'Home', active: 'home', inactive: 'home-outline' },
  add: { label: 'Add', active: 'add-circle', inactive: 'add-circle-outline' },
  stats: { label: 'Stats', active: 'bar-chart', inactive: 'bar-chart-outline' },
  settings: { label: 'Settings', active: 'settings', inactive: 'settings-outline' },
};

const TelegramTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Floating clearance above Android / iOS gesture navigation bar
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const dockBg = theme.tabBar;
  const dockBorder = theme.tabBarBorder;
  const activePillBg = theme.primary;
  const activeColor = theme.primaryText;
  const inactiveColor = theme.textSecondary;

  return (
    <View style={[styles.dockContainer, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.dockSurface,
          {
            backgroundColor: dockBg,
            borderColor: dockBorder,
            shadowOpacity: isDark ? 0.35 : 0.12,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const config = TAB_CONFIG[route.name] || {
            label: options.title || route.name,
            active: 'ellipse',
            inactive: 'ellipse-outline',
          };

          const label = options.title || config.label;
          const iconName = isFocused ? config.active : config.inactive;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItemWrapper}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.tabItem,
                  isFocused && [styles.tabItemActive, { backgroundColor: activePillBg }],
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? activeColor : inactiveColor}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? activeColor : inactiveColor,
                      fontWeight: isFocused ? '600' : '500',
                      opacity: isFocused ? 1 : 0.9,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  dockSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 64,
    borderRadius: 32, // Floating capsule / pill shape
    paddingHorizontal: 8,
    borderWidth: 1,
    // Elevation for Android
    elevation: 12,
    // Drop shadow for iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  tabItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 88,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  tabItemActive: {
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});

export default TelegramTabBar;

