import React, { useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, getRelativeDate } from '../utils/formatters';
import { heavyImpact, mediumImpact } from '../utils/haptics';

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -160;

export default function ExpenseCard({ expense, onPress, onDelete }) {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const isIncome = expense._type === 'income';

  const translateX = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);

  // Keep the latest props available to the long-lived PanResponder.
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;
  const expenseIdRef = useRef(expense.id);
  expenseIdRef.current = expense.id;

  const resetSwipe = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }, [translateX]);

  const requestDelete = useCallback(async () => {
    heavyImpact();
    const shouldDelete = onDeleteRef.current
      ? await onDeleteRef.current(expenseIdRef.current)
      : true;
    // The parent may ask for confirmation; restore the card if it was canceled.
    if (shouldDelete === false) resetSwipe();
  }, [resetSwipe]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (left)
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          gestureState.dx < 0
        );
      },
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);

          // Trigger haptic when crossing the delete threshold
          if (gestureState.dx <= DELETE_THRESHOLD && !hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = true;
            heavyImpact();
          } else if (gestureState.dx > DELETE_THRESHOLD && hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= DELETE_THRESHOLD) {
          // Swiped far enough — ask the parent to confirm and delete
          requestDelete();
        } else if (gestureState.dx <= SWIPE_THRESHOLD) {
          // Partial swipe — snap to reveal delete button
          mediumImpact();
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        } else {
          resetSwipe();
        }
      },
      onPanResponderTerminate: resetSwipe,
    })
  ).current;

  // Interpolate delete background opacity
  const deleteOpacity = translateX.interpolate({
    inputRange: [DELETE_THRESHOLD, SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.85, 0],
    extrapolate: 'clamp',
  });

  const deleteScale = translateX.interpolate({
    inputRange: [DELETE_THRESHOLD, SWIPE_THRESHOLD, 0],
    outputRange: [1.15, 1, 0.6],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      {/* Delete action behind the card */}
      <Animated.View
        style={[
          styles.deleteAction,
          {
            backgroundColor: theme.danger,
            opacity: deleteOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteActionInner}
          onPress={requestDelete}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
            <Ionicons name="trash" size={24} color="#FFF" />
          </Animated.View>
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Foreground card */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name={expense.category_icon} size={20} color={theme.text} />
          </View>

          <View style={styles.details}>
            <Text style={[styles.category, { color: theme.text }]} numberOfLines={1}>
              {expense.category_name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {getRelativeDate(expense.date)}
              </Text>
              {expense.is_recurring === 1 && (
                <View style={[styles.recurringBadge, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 }]}>
                  <Ionicons name="repeat" size={10} color={theme.textSecondary} />
                  <Text style={[styles.recurringText, { color: theme.textSecondary }]}>
                    {expense.recurrence_interval}
                  </Text>
                </View>
              )}
            </View>
            {expense.notes ? (
              <Text style={[styles.notes, { color: theme.textTertiary }]} numberOfLines={1}>
                {expense.notes}
              </Text>
            ) : null}
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: isIncome ? theme.success : theme.text }]}>
              {isIncome ? '+' : ''}{formatCurrency(expense.amount, currency)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteActionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 24,
    width: 100,
    height: '100%',
    position: 'absolute',
    right: 0,
  },
  deleteActionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notes: {
    fontSize: 12,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
