import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon = 'wallet-outline', title, message }) {
  const { theme } = useTheme();

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Floating / breathing animation for the icon
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite floating loop
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floating.start();

    return () => floating.stop();
  }, []);

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const floatScale = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.04, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            borderWidth: 1,
            transform: [
              { translateY: floatTranslateY },
              { scale: floatScale },
            ],
          },
        ]}
      >
        <Ionicons name={icon} size={42} color={theme.text} />
      </Animated.View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
