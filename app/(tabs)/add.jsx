import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Switch, Alert, KeyboardAvoidingView,
  Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useExpenses } from '../../context/ExpenseContext';
import { getCurrentDate, getCurrentMonth } from '../../utils/formatters';
import { checkBudgetAndNotify } from '../../utils/notifications';
import { RECURRENCE_OPTIONS } from '../../utils/constants';
import CategoryPicker from '../../components/CategoryPicker';
import { successNotification, errorNotification, lightImpact } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_CONFETTI = 24;

// Pre-generate confetti particle configs
const CONFETTI_CONFIGS = Array.from({ length: NUM_CONFETTI }, (_, i) => ({
  color: ['#6C5CE7', '#A78BFA', '#FF6B6B', '#4ECDC4', '#FFEAA7', '#10B981', '#F59E0B', '#45B7D1'][i % 8],
  left: Math.random() * SCREEN_WIDTH,
  size: 6 + Math.random() * 6,
  rotation: Math.random() * 360,
  delay: Math.random() * 300,
}));

export default function AddExpenseScreen() {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const { addExpense, categories, db } = useExpenses();

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animations
  const successAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    CONFETTI_CONFIGS.map(() => ({
      progress: new Animated.Value(0),
    }))
  ).current;

  // Staggered form entry animations
  const formAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = formAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 80,
        useNativeDriver: true,
      })
    );
    Animated.stagger(0, animations).start();
  }, []);

  const getFormItemStyle = (index) => ({
    opacity: formAnims[index],
    transform: [
      {
        translateY: formAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  });

  const formatDateDisplay = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const resetForm = () => {
    setAmount('');
    setSelectedCategory(null);
    setDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setRecurrenceInterval('monthly');
  };

  const showSuccess = () => {
    // Toast animation
    successAnim.setValue(0);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    // Confetti burst
    confettiAnims.forEach((anim) => {
      anim.progress.setValue(0);
    });
    const confettiAnimations = confettiAnims.map((anim, i) =>
      Animated.timing(anim.progress, {
        toValue: 1,
        duration: 1200 + Math.random() * 600,
        delay: CONFETTI_CONFIGS[i].delay,
        useNativeDriver: true,
      })
    );
    Animated.parallel(confettiAnimations).start();
  };

  const handleSave = async () => {
    // Validate
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errorNotification();
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!selectedCategory) {
      errorNotification();
      Alert.alert('Select Category', 'Please select a category for this expense.');
      return;
    }

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    try {
      await addExpense({
        amount: parsedAmount,
        category_id: selectedCategory.id,
        date: dateStr,
        notes: notes.trim(),
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
      });

      // Check budget limit
      const yearMonth = dateStr.substring(0, 7);
      await checkBudgetAndNotify(db, selectedCategory.id, yearMonth, selectedCategory.name);

      successNotification();
      showSuccess();
      resetForm();
    } catch (e) {
      console.error('Save error:', e);
      errorNotification();
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={getFormItemStyle(0)}>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Add Expense</Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Track where your money goes
            </Text>
          </Animated.View>

          {/* Amount Input */}
          <Animated.View style={getFormItemStyle(1)}>
            <View style={[styles.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency}</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </Animated.View>

          {/* Category */}
          <Animated.View style={getFormItemStyle(2)}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[
                styles.selectField,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedCategory ? selectedCategory.color : theme.border,
                },
              ]}
              onPress={() => {
                lightImpact();
                setShowCategoryPicker(true);
              }}
            >
              {selectedCategory ? (
                <View style={styles.selectedCategory}>
                  <View style={[styles.catIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                    <Ionicons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                  </View>
                  <Text style={[styles.selectText, { color: theme.text }]}>{selectedCategory.name}</Text>
                </View>
              ) : (
                <Text style={[styles.selectPlaceholder, { color: theme.textTertiary }]}>
                  Select a category
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Date */}
          <Animated.View style={getFormItemStyle(3)}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
            <TouchableOpacity
              style={[styles.selectField, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectedCategory}>
                <View style={[styles.catIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.selectText, { color: theme.text }]}>
                  {formatDateDisplay(date)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
                maximumDate={new Date()}
                themeVariant={theme === 'dark' ? 'dark' : 'light'}
              />
            )}
          </Animated.View>

          {/* Notes */}
          <Animated.View style={getFormItemStyle(4)}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="What was this expense for?"
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Recurring */}
          <Animated.View style={getFormItemStyle(5)}>
            <View style={[styles.recurringRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.recurringLeft}>
                <Ionicons name="repeat" size={22} color={theme.primary} />
                <View style={styles.recurringInfo}>
                  <Text style={[styles.recurringTitle, { color: theme.text }]}>Recurring Expense</Text>
                  <Text style={[styles.recurringSubtitle, { color: theme.textSecondary }]}>
                    Auto-repeating payment
                  </Text>
                </View>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={(val) => {
                  lightImpact();
                  setIsRecurring(val);
                }}
                trackColor={{ false: theme.border, true: theme.primaryLight }}
                thumbColor={isRecurring ? theme.primary : theme.textTertiary}
              />
            </View>

            {isRecurring && (
              <View style={styles.intervalRow}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.intervalChip,
                      {
                        backgroundColor: recurrenceInterval === opt.value ? theme.primaryLight : theme.surface,
                        borderColor: recurrenceInterval === opt.value ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      lightImpact();
                      setRecurrenceInterval(opt.value);
                    }}
                  >
                    <Text
                      style={[
                        styles.intervalText,
                        { color: recurrenceInterval === opt.value ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Expense</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Toast */}
      <Animated.View
        style={[
          styles.successToast,
          {
            backgroundColor: theme.success,
            opacity: successAnim,
            transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
        <Text style={styles.successText}>Expense saved!</Text>
      </Animated.View>

      {/* Confetti particles */}
      {confettiAnims.map((anim, i) => {
        const config = CONFETTI_CONFIGS[i];
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.confettiPiece,
              {
                left: config.left,
                width: config.size,
                height: config.size * 1.5,
                backgroundColor: config.color,
                borderRadius: config.size * 0.3,
                opacity: anim.progress.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: anim.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, SCREEN_HEIGHT * 0.6],
                    }),
                  },
                  {
                    translateX: anim.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (Math.random() - 0.5) * 100],
                    }),
                  },
                  {
                    rotate: anim.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${config.rotation}deg`, `${config.rotation + 360 + Math.random() * 360}deg`],
                    }),
                  },
                  {
                    scale: anim.progress.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 1.2, 1, 0.6],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}

      <CategoryPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={setSelectedCategory}
        selectedId={selectedCategory?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 24,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  selectPlaceholder: {
    fontSize: 15,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectText: {
    fontSize: 15,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    marginBottom: 20,
    minHeight: 80,
    borderWidth: 1,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  recurringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recurringInfo: {
    marginLeft: 12,
  },
  recurringTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  recurringSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  intervalText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  successText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confettiPiece: {
    position: 'absolute',
    top: 40,
  },
});
