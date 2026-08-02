import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Switch, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useExpenses } from '../../context/ExpenseContext';
import { getExpenseById } from '../../db/queries';
import { RECURRENCE_OPTIONS } from '../../utils/constants';
import CategoryPicker from '../../components/CategoryPicker';

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { currency } = useSettings();
  const { updateExpense, deleteExpense, categories } = useExpenses();

  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    try {
      const expense = await getExpenseById(db, parseInt(id));
      if (!expense) {
        Alert.alert('Error', 'Expense not found');
        router.back();
        return;
      }

      setAmount(expense.amount.toString());
      setSelectedCategory({
        id: expense.category_id,
        name: expense.category_name,
        icon: expense.category_icon,
        color: expense.category_color,
      });
      setDate(new Date(expense.date + 'T00:00:00'));
      setNotes(expense.notes || '');
      setIsRecurring(expense.is_recurring === 1);
      setRecurrenceInterval(expense.recurrence_interval || 'monthly');
    } catch (e) {
      console.error('Load expense error:', e);
      Alert.alert('Error', 'Failed to load expense');
      router.back();
    }
    setLoading(false);
  };

  const formatDateDisplay = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleUpdate = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category.');
      return;
    }

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    try {
      await updateExpense(parseInt(id), {
        amount: parsedAmount,
        category_id: selectedCategory.id,
        date: dateStr,
        notes: notes.trim(),
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
      });
      router.back();
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', 'Failed to update expense.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(parseInt(id));
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Expense</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount */}
          <View style={[styles.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency}</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <TouchableOpacity
            style={[styles.selectField, {
              backgroundColor: theme.surface,
              borderColor: selectedCategory ? selectedCategory.color : theme.border,
            }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedRow}>
                <View style={[styles.catIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                  <Ionicons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                </View>
                <Text style={[styles.selectText, { color: theme.text }]}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={[{ color: theme.textTertiary }]}>Select a category</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          {/* Date */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
          <TouchableOpacity
            style={[styles.selectField, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectedRow}>
              <View style={[styles.catIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.selectText, { color: theme.text }]}>{formatDateDisplay(date)}</Text>
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
            />
          )}

          {/* Notes */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Recurring */}
          <View style={[styles.recurringRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.recurringLeft}>
              <Ionicons name="repeat" size={22} color={theme.primary} />
              <Text style={[styles.recurringTitle, { color: theme.text, marginLeft: 12 }]}>Recurring</Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: theme.border, true: theme.primaryLight }}
              thumbColor={isRecurring ? theme.primary : theme.textTertiary}
            />
          </View>

          {isRecurring && (
            <View style={styles.intervalRow}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.intervalChip, {
                    backgroundColor: recurrenceInterval === opt.value ? theme.primaryLight : theme.surface,
                    borderColor: recurrenceInterval === opt.value ? theme.primary : theme.border,
                  }]}
                  onPress={() => setRecurrenceInterval(opt.value)}
                >
                  <Text style={[styles.intervalText, {
                    color: recurrenceInterval === opt.value ? theme.primary : theme.textSecondary,
                  }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateBtn, { backgroundColor: theme.primary }]}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
            <Text style={styles.updateBtnText}>Update Expense</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: theme.danger }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
            <Text style={[styles.deleteBtnText, { color: theme.danger }]}>Delete Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
  safeArea: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  deleteHeaderBtn: { padding: 4 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  amountCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 20, marginBottom: 24, borderWidth: 1 },
  currencySymbol: { fontSize: 32, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1 },
  selectedRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectText: { fontSize: 15, fontWeight: '600' },
  notesInput: { borderRadius: 14, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 15, marginBottom: 20, minHeight: 80, borderWidth: 1 },
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1 },
  recurringLeft: { flexDirection: 'row', alignItems: 'center' },
  recurringTitle: { fontSize: 15, fontWeight: '600' },
  intervalRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  intervalChip: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  intervalText: { fontSize: 13, fontWeight: '600' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, marginTop: 12, gap: 8 },
  updateBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginTop: 12, borderWidth: 1.5, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
