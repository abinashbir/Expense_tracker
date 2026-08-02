import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useExpenses } from '../../context/ExpenseContext';
import { formatCurrency, getMonthName, getPreviousMonth, getNextMonth, getCurrentMonth } from '../../utils/formatters';
import ExpenseCard from '../../components/ExpenseCard';
import BudgetProgressBar from '../../components/BudgetProgressBar';
import FilterSheet from '../../components/FilterSheet';
import EmptyState from '../../components/EmptyState';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currency } = useSettings();
  const {
    expenses, budgets, monthlyTotal, selectedMonth,
    setSelectedMonth, loading, filters, setFilters,
    clearFilters, deleteExpense, refreshData,
  } = useExpenses();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isCurrentMonth = selectedMonth === getCurrentMonth();
  const hasFilters = Object.keys(filters).length > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(id),
        },
      ]
    );
  }, [deleteExpense]);

  const renderHeader = () => (
    <View>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
          style={[styles.monthArrow, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedMonth(getCurrentMonth())}
          style={styles.monthCenter}
        >
          <Text style={[styles.monthText, { color: theme.text }]}>
            {getMonthName(selectedMonth)}
          </Text>
          {!isCurrentMonth && (
            <Text style={[styles.todayHint, { color: theme.primary }]}>Tap for current</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedMonth(getNextMonth(selectedMonth))}
          style={[styles.monthArrow, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: theme.primary }]}>
        <View style={styles.totalCardInner}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>{formatCurrency(monthlyTotal, currency)}</Text>
          <Text style={styles.totalSub}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''} this month</Text>
        </View>
        <View style={styles.totalCardDecor}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>
      </View>

      {/* Budget Progress (horizontal scroll) */}
      {budgets.length > 0 && (
        <View style={styles.budgetSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Tracking</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.budgetScroll}>
            {budgets.map((b) => (
              <BudgetProgressBar key={b.id} budget={b} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {hasFilters ? 'Filtered Results' : 'Recent Expenses'}
        </Text>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasFilters ? theme.primaryLight : theme.surfaceElevated,
              borderColor: hasFilters ? theme.primary : theme.border,
            },
          ]}
        >
          <Ionicons name="filter" size={16} color={hasFilters ? theme.primary : theme.textSecondary} />
          <Text style={[styles.filterBtnText, { color: hasFilters ? theme.primary : theme.textSecondary }]}>
            {hasFilters ? 'Filtered' : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onPress={() => router.push(`/edit/${item.id}`)}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="receipt-outline"
              title={hasFilters ? 'No matches found' : 'No expenses yet'}
              message={hasFilters ? 'Try adjusting your filters' : 'Tap the + button to add your first expense'}
            />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(f) => {
          if (Object.keys(f).length === 0) {
            clearFilters();
          } else {
            setFilters(f);
          }
        }}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCenter: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
  },
  todayHint: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  totalCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  totalCardInner: {
    zIndex: 1,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  totalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 6,
  },
  totalCardDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 120,
    height: 120,
    right: 0,
    top: 0,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    right: 60,
    top: 60,
  },
  budgetSection: {
    marginBottom: 12,
  },
  budgetScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
