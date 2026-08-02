import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';

export default function BudgetProgressBar({ budget }) {
  const { theme } = useTheme();
  const { currency } = useSettings();

  const percentage = budget.amount > 0
    ? Math.min((budget.spent / budget.amount) * 100, 100)
    : 0;

  const overBudget = budget.spent > budget.amount;

  // Color based on percentage
  const getBarColor = () => {
    if (overBudget) return theme.danger;
    if (percentage >= 80) return theme.warning;
    if (percentage >= 60) return '#F59E0B';
    return theme.success;
  };

  const barColor = getBarColor();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: budget.category_color + '20' }]}>
            <Ionicons name={budget.category_icon} size={16} color={budget.category_color} />
          </View>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {budget.category_name}
          </Text>
        </View>
        <Text style={[styles.percentText, { color: overBudget ? theme.danger : theme.textSecondary }]}>
          {overBudget ? 'Over!' : `${Math.round(percentage)}%`}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: theme.borderLight }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.spentText, { color: theme.textSecondary }]}>
          {formatCurrency(budget.spent, currency)}
        </Text>
        <Text style={[styles.budgetText, { color: theme.textTertiary }]}>
          of {formatCurrency(budget.amount, currency)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  spentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  budgetText: {
    fontSize: 11,
  },
});
