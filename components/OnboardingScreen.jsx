import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { successNotification } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'wallet',
    iconBg: '#1A1A1A',
    decorIcons: ['card', 'cash', 'receipt'],
    decorColors: ['#333333', '#4D4D4D', '#666666'],
    title: 'Track Every Rupee',
    description:
      'Effortlessly log your daily expenses with crisp category icons, notes, and recurring tracking. Know exactly where your money goes.',
  },
  {
    id: '2',
    icon: 'shield-checkmark',
    iconBg: '#222222',
    decorIcons: ['trending-up', 'notifications', 'pie-chart'],
    decorColors: ['#3D3D3D', '#545454', '#6E6E6E'],
    title: 'Set Budgets, Stay on Track',
    description:
      'Create monthly budgets for each category and get real-time alerts when you\'re approaching your limits. Stay in control of your finances.',
  },
  {
    id: '3',
    icon: 'bar-chart',
    iconBg: '#2A2A2A',
    decorIcons: ['analytics', 'calendar', 'download'],
    decorColors: ['#474747', '#5E5E5E', '#757575'],
    title: 'Insights at a Glance',
    description:
      'Clean graphs, weekly breakdowns, and category insights help you understand your spending patterns. Export anytime as CSV or JSON.',
  },
];

export default function OnboardingScreen({ visible, onComplete }) {
  const { theme, isDark } = useTheme();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      successNotification();
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        {/* Background decorative shapes */}
        <Animated.View
          style={[
            styles.bgCircle,
            styles.bgCircle1,
            {
              backgroundColor: item.iconBg + '12',
              transform: [
                {
                  scale: scrollX.interpolate({
                    inputRange: [
                      (index - 1) * SCREEN_WIDTH,
                      index * SCREEN_WIDTH,
                      (index + 1) * SCREEN_WIDTH,
                    ],
                    outputRange: [0.6, 1, 0.6],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bgCircle,
            styles.bgCircle2,
            {
              backgroundColor: item.decorColors[0] + '15',
              transform: [
                {
                  scale: scrollX.interpolate({
                    inputRange: [
                      (index - 1) * SCREEN_WIDTH,
                      index * SCREEN_WIDTH,
                      (index + 1) * SCREEN_WIDTH,
                    ],
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />

        {/* Central icon */}
        <Animated.View
          style={[
            styles.mainIcon,
            {
              backgroundColor: item.iconBg,
              transform: [
                {
                  scale: scrollX.interpolate({
                    inputRange: [
                      (index - 1) * SCREEN_WIDTH,
                      index * SCREEN_WIDTH,
                      (index + 1) * SCREEN_WIDTH,
                    ],
                    outputRange: [0.5, 1, 0.5],
                    extrapolate: 'clamp',
                  }),
                },
              ],
              opacity: scrollX.interpolate({
                inputRange: [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Ionicons name={item.icon} size={56} color="#FFFFFF" />
        </Animated.View>

        {/* Orbiting decor icons */}
        {item.decorIcons.map((decorIcon, i) => {
          const angle = (i * 120) * (Math.PI / 180);
          const radius = 100;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <Animated.View
              key={decorIcon}
              style={[
                styles.decorIcon,
                {
                  backgroundColor: item.decorColors[i] + '25',
                  left: SCREEN_WIDTH / 2 + x - 24,
                  top: SCREEN_HEIGHT * 0.18 + y - 24,
                  transform: [
                    {
                      scale: scrollX.interpolate({
                        inputRange: [
                          (index - 1) * SCREEN_WIDTH,
                          index * SCREEN_WIDTH,
                          (index + 1) * SCREEN_WIDTH,
                        ],
                        outputRange: [0, 1, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                  opacity: scrollX.interpolate({
                    inputRange: [
                      (index - 1) * SCREEN_WIDTH,
                      index * SCREEN_WIDTH,
                      (index + 1) * SCREEN_WIDTH,
                    ],
                    outputRange: [0, 0.8, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Ionicons name={decorIcon} size={22} color={item.decorColors[i]} />
            </Animated.View>
          );
        })}
      </View>

      {/* Text content */}
      <Animated.View
        style={[
          styles.textArea,
          {
            opacity: scrollX.interpolate({
              inputRange: [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: scrollX.interpolate({
                  inputRange: [
                    (index - 1) * SCREEN_WIDTH,
                    index * SCREEN_WIDTH,
                    (index + 1) * SCREEN_WIDTH,
                  ],
                  outputRange: [30, 0, 30],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Skip button */}
        {!isLastSlide && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {/* Bottom area: dots + button */}
        <View style={styles.bottomArea}>
          {/* Pagination dots */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ],
                outputRange: [8, 28, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Next / Get Started button */}
          <TouchableOpacity
            style={[
              styles.nextBtn,
              {
                backgroundColor: theme.primary,
                borderColor: theme.border,
                borderWidth: isDark ? 0 : 1,
              },
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            {isLastSlide ? (
              <>
                <Text style={[styles.nextBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Get Started</Text>
                <Ionicons name="rocket" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
              </>
            ) : (
              <>
                <Text style={[styles.nextBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  illustrationArea: {
    height: SCREEN_HEIGHT * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgCircle1: {
    width: 260,
    height: 260,
  },
  bgCircle2: {
    width: 180,
    height: 180,
    top: SCREEN_HEIGHT * 0.1,
    left: SCREEN_WIDTH * 0.6,
  },
  mainIcon: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  decorIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
    gap: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
