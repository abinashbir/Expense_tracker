import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../../context/ExpenseContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { getIncomeById } from '../../db/queries';

export default function EditIncomeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const { theme, isDark } = useTheme();
  const { currency } = useSettings();
  const { updateIncome, deleteIncome } = useExpenses();

  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadIncome();
  }, [id]);

  const loadIncome = async () => {
    try {
      const income = await getIncomeById(db, parseInt(id));
      if (!income) {
        Alert.alert('Error', 'Income not found');
        router.back();
        return;
      }

      setAmount(income.amount.toString());
      setSource(income.source || '');
      setDate(new Date(income.date + 'T00:00:00'));
      setNotes(income.notes || '');
    } catch (e) {
      console.error('Load income error:', e);
      Alert.alert('Error', 'Failed to load income');
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

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    try {
      await updateIncome(parseInt(id), {
        amount: parsedAmount,
        date: dateStr,
        source: source.trim(),
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      console.error('Update income error:', e);
      Alert.alert('Error', 'Failed to update income.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteIncome(parseInt(id));
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Income</Text>
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
            <Text style={[styles.currencySymbol, { color: theme.success }]}>{currency}</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Source */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Income Source</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={source}
            onChangeText={setSource}
            placeholder="Salary, freelance, refund..."
            placeholderTextColor={theme.textTertiary}
          />

          {/* Date */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
          <TouchableOpacity
            style={[styles.selectField, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectedRow}>
              <View style={[styles.catIcon, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: 1 }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.text} />
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
              maximumDate={new Date()}
              themeVariant={isDark ? 'dark' : 'light'}
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

          {/* Update Button */}
          <TouchableOpacity
            style={[
              styles.updateBtn,
              {
                backgroundColor: theme.primary,
                borderColor: theme.border,
                borderWidth: isDark ? 0 : 1,
              },
            ]}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
            <Text style={[styles.updateBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Update Income</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.deleteBtnText, { color: theme.danger }]}>Delete Income</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  textInput: { height: 56, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, marginBottom: 20 },
  selectField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1 },
  selectedRow: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectText: { fontSize: 15, fontWeight: '600' },
  notesInput: { borderRadius: 14, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 15, marginBottom: 20, minHeight: 80, borderWidth: 1 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, marginTop: 12, gap: 8 },
  updateBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginTop: 12, borderWidth: 1.5, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
