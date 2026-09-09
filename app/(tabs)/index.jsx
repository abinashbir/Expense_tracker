import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, RefreshControl, Animated, Modal, TextInput,
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
import { lightImpact, successNotification } from '../../utils/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { currency } = useSettings();
  const {
    expenses, budgets, monthlyTotal, totalMonthlyBudget,
    selectedMonth, setSelectedMonth, loading, filters, setFilters,
    clearFilters, deleteExpense, refreshData, saveTotalMonthlyBudget,
  } = useExpenses();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [inputBudget, setInputBudget] = useState('');

  // Animations
  const totalCardScale = useRef(new Animated.Value(0.92)).current;
  const totalCardOpacity = useRef(new Animated.Value(0)).current;

  const isCurrentMonth = selectedMonth === getCurrentMonth();
  const hasFilters = Object.keys(filters).length > 0;

  // Budget calculations
  const hasBudget = totalMonthlyBudget > 0;
  const budgetPercentage = hasBudget ? Math.min((monthlyTotal / totalMonthlyBudget) * 100, 100) : 0;
  const remainingBudget = totalMonthlyBudget - monthlyTotal;
  const isOverBudget = hasBudget && remainingBudget < 0;

  // Animate total card on mount / month change
  useEffect(() => {
    totalCardScale.setValue(0.92);
    totalCardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(totalCardScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(totalCardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDelete = useCallback((id) => {
    deleteExpense(id);
  }, [deleteExpense]);

  const handleMonthNav = useCallback((direction) => {
    lightImpact();
    if (direction === 'prev') {
      setSelectedMonth(getPreviousMonth(selectedMonth));
    } else {
      setSelectedMonth(getNextMonth(selectedMonth));
    }
  }, [selectedMonth, setSelectedMonth]);

  const handleSaveBudget = async () => {
    const amount = parseFloat(inputBudget);
    if (!isNaN(amount) && amount >= 0) {
      await saveTotalMonthlyBudget(amount);
      successNotification();
      setShowBudgetModal(false);
    }
  };

  const getProgressBarColor = () => {
    if (isOverBudget) return '#FF4757';
    if (budgetPercentage >= 85) return '#FFA502';
    return '#2ED573';
  };

  const renderHeader = () => (
    <View>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => handleMonthNav('prev')}
          style={[styles.monthArrow, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            lightImpact();
            setSelectedMonth(getCurrentMonth());
          }}
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
          onPress={() => handleMonthNav('next')}
          style={[styles.monthArrow, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Main Budget & Spend Overview Card */}
      <Animated.View
        style={[
          styles.totalCard,
          {
            backgroundColor: theme.primary,
            transform: [{ scale: totalCardScale }],
            opacity: totalCardOpacity,
          },
        ]}
      >
        <View style={styles.totalCardInner}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.totalLabel}>Total Spent</Text>
              <Text style={styles.totalAmount}>{formatCurrency(monthlyTotal, currency)}</Text>
            </View>

            <TouchableOpacity
              style={styles.budgetBadge}
              onPress={() => {
                lightImpact();
                setInputBudget(totalMonthlyBudget > 0 ? totalMonthlyBudget.toString() : '');
                setShowBudgetModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={hasBudget ? 'pencil' : 'add-circle'} size={14} color="#FFF" />
              <Text style={styles.budgetBadgeText}>
                {hasBudget ? `Budget: ${formatCurrency(totalMonthlyBudget, currency)}` : 'Set Budget'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Budget Progress Bar */}
          {hasBudget ? (
            <View style={styles.budgetBarContainer}>
              <View style={styles.budgetTrack}>
                <View
                  style={[
                    styles.budgetFill,
                    {
                      width: `${budgetPercentage}%`,
                      backgroundColor: getProgressBarColor(),
                    },
                  ]}
                />
              </View>
              <View style={styles.budgetInfoRow}>
                <Text style={styles.budgetInfoText}>
                  {Math.round(budgetPercentage)}% spent
                </Text>
                <Text
                  style={[
                    styles.budgetInfoText,
                    { fontWeight: '700', color: isOverBudget ? '#FF6B6B' : 'rgba(255,255,255,0.9)' },
                  ]}
                >
                  {isOverBudget
                    ? `Over by ${formatCurrency(Math.abs(remainingBudget), currency)}`
                    : `${formatCurrency(remainingBudget, currency)} left`}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.noBudgetPrompt}
              onPress={() => {
                lightImpact();
                setInputBudget('');
                setShowBudgetModal(true);
              }}
            >
              <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.noBudgetText}>Set a monthly budget to track your spending limit</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.totalSub}>
            {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} in {getMonthName(selectedMonth)}
          </Text>
        </View>

        <View style={styles.totalCardDecor}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>
      </Animated.View>

      {/* Category Budget Tracking */}
      {budgets.length > 0 && (
        <View style={styles.budgetSection}>
          <View style={styles.budgetHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 0, marginBottom: 0 }]}>
              Category Budgets
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.manageBudgetsBtn}
            >
              <Text style={[styles.manageBudgetsText, { color: theme.primary }]}>Manage</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.budgetScroll}>
            {budgets.map((b) => (
              <BudgetProgressBar key={b.id} budget={b} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Expenses Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {hasFilters ? 'Filtered Results' : 'Recent Expenses'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            setShowFilters(true);
          }}
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

  // Staggered animation for list items
  const AnimatedExpenseCard = useCallback(({ item, index }) => {
    return <StaggeredItem index={index} item={item} onPress={() => router.push(`/edit/${item.id}`)} onDelete={handleDelete} />;
  }, [handleDelete, router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AnimatedExpenseCard}
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

      {/* Set/Edit Monthly Budget Modal */}
      <Modal visible={showBudgetModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {hasBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
              </Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Target spending for {getMonthName(selectedMonth)}
              </Text>

              <View style={[styles.budgetInputCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.budgetInputCurrency, { color: theme.primary }]}>{currency}</Text>
                <TextInput
                  style={[styles.budgetInput, { color: theme.text }]}
                  value={inputBudget}
                  onChangeText={setInputBudget}
                  placeholder="e.g. 25000"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.presetChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                    onPress={() => {
                      lightImpact();
                      setInputBudget(amt.toString());
                    }}
                  >
                    <Text style={[styles.presetText, { color: theme.text }]}>
                      {formatCurrency(amt, currency)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                  onPress={() => setShowBudgetModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveBudget}
                >
                  <Text style={styles.modalSaveText}>Save Budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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

/** Individual list item with staggered fade-in + slide-up */
function StaggeredItem({ item, index, onPress, onDelete }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index * 60, 400),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      <ExpenseCard
        expense={item}
        onPress={onPress}
        onDelete={onDelete}
      />
    </Animated.View>
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
    padding: 22,
    marginBottom: 20,
    overflow: 'hidden',
  },
  totalCardInner: {
    zIndex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  budgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  budgetBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetBarContainer: {
    marginTop: 16,
    marginBottom: 10,
  },
  budgetTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  budgetInfoText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  noBudgetPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 8,
    gap: 8,
  },
  noBudgetText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  totalSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 4,
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
    marginBottom: 16,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  manageBudgetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageBudgetsText: {
    fontSize: 13,
    fontWeight: '600',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  budgetInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
  },
  budgetInputCurrency: {
    fontSize: 26,
    fontWeight: '700',
    marginRight: 10,
  },
  budgetInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
