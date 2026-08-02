import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, getRelativeDate } from '../utils/formatters';

export default function ExpenseCard({ expense, onPress, onDelete }) {
  const { theme } = useTheme();
  const { currency } = useSettings();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: expense.category_color + '20' }]}>
        <Ionicons name={expense.category_icon} size={22} color={expense.category_color} />
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
            <View style={[styles.recurringBadge, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="repeat" size={10} color={theme.primary} />
              <Text style={[styles.recurringText, { color: theme.primary }]}>
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
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatCurrency(expense.amount, currency)}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: theme.dangerLight }]}
          onPress={() => onDelete(expense.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={theme.danger} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
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
  deleteBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
  },
});
