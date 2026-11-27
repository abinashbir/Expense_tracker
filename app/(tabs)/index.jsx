import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetProgressBar from '../../components/BudgetProgressBar';
import EmptyState from '../../components/EmptyState';
import ExpenseCard from '../../components/ExpenseCard';
import FilterSheet from '../../components/FilterSheet';
import { useExpenses } from '../../context/ExpenseContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, getCurrentMonth, getMonthName, getNextMonth, getPreviousMonth } from '../../utils/formatters';
import { lightImpact, successNotification } from '../../utils/haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { currency } = useSettings();
  const {
    expenses, incomes, budgets, monthlyTotal, monthlyIncome, totalMonthlyBudget,
    selectedMonth, setSelectedMonth, loading, filters, setFilters,
    clearFilters, deleteExpense, deleteIncome, refreshData, saveTotalMonthlyBudget,
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
  const monthlyBalance = monthlyIncome - monthlyTotal;

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

  const handleDelete = useCallback((id, type = 'expense') => {
    const isIncome = type === 'income';
    // Resolve true once the item is deleted, false if the user cancels, so the
    // card can restore itself instead of staying swiped away.
    return new Promise((resolve) => {
      Alert.alert(
        isIncome ? 'Delete Income' : 'Delete Expense',
        `Are you sure you want to delete this ${isIncome ? 'income' : 'expense'}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await (isIncome ? deleteIncome(id) : deleteExpense(id));
                resolve(true);
              } catch (e) {
                console.error('Delete failed:', e);
                resolve(false);
              }
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }, [deleteExpense, deleteIncome]);

  // Incomes are loaded for the whole month, so apply the same filters used for
  // expenses. Category filters only make sense for expenses, so they exclude
  // income entries entirely.
  const filteredIncomes = incomes.filter((income) => {
    if (filters.categoryId) return false;
    if (filters.minAmount !== undefined && filters.minAmount !== null && income.amount < filters.minAmount) return false;
    if (filters.maxAmount !== undefined && filters.maxAmount !== null && income.amount > filters.maxAmount) return false;
    if (filters.searchText) {
      const haystack = `${income.source || ''} ${income.notes || ''}`.toLowerCase();
      if (!haystack.includes(filters.searchText.toLowerCase())) return false;
    }
    return true;
  });

  // Merge expenses and incomes into a single sorted list
  const transactions = [
    ...expenses.map(e => ({ ...e, _type: 'expense' })),
    ...filteredIncomes.map(i => ({
      ...i,
      _type: 'income',
      category_name: i.source || 'Income',
      category_icon: 'arrow-up-circle',
      category_color: '#22C55E',
    })),
  ].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
    if (isOverBudget) return theme.danger;
    if (budgetPercentage >= 85) return '#CCCCCC';
    return '#FFFFFF';
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
            <Text style={[styles.todayHint, { color: theme.textSecondary }]}>Tap for current</Text>
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
            backgroundColor: theme.primaryDark,
            borderColor: theme.primary,
            borderWidth: 1,
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
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={[styles.balanceAmount, { color: monthlyBalance >= 0 ? '#A3A3A3' : '#D4D4D4' }]}>
                  {formatCurrency(monthlyBalance, currency)}
                </Text>
              </View>
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
                    { fontWeight: '700', color: isOverBudget ? theme.danger : 'rgba(255,255,255,0.9)' },
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
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in {getMonthName(selectedMonth)}
          </Text>
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
              <Text style={[styles.manageBudgetsText, { color: theme.textSecondary }]}>Manage</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
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
          {hasFilters ? 'Filtered Results' : 'Recent Transactions'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            setShowFilters(true);
          }}
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasFilters ? theme.primary : theme.surfaceElevated,
              borderColor: hasFilters ? theme.primary : theme.border,
            },
          ]}
        >
          <Ionicons
            name="filter"
            size={16}
            color={hasFilters ? (isDark ? '#000000' : '#FFFFFF') : theme.textSecondary}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: hasFilters ? (isDark ? '#000000' : '#FFFFFF') : theme.textSecondary },
            ]}
          >
            {hasFilters ? 'Filtered' : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Staggered animation for list items
  const AnimatedExpenseCard = useCallback(({ item, index }) => {
    const isIncome = item._type === 'income';
    const editRoute = isIncome ? `/edit-income/${item.id}` : `/edit/${item.id}`;
    return <StaggeredItem index={index} item={item} onPress={() => router.push(editRoute)} onDelete={(id) => handleDelete(id, item._type)} />;
  }, [handleDelete, router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => `${item._type}-${item.id}`}
        renderItem={AnimatedExpenseCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="receipt-outline"
              title={hasFilters ? 'No matches found' : 'No transactions yet'}
              message={hasFilters ? 'Try adjusting your filters' : 'Tap the + button to add your first expense or income'}
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
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {hasBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
              </Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>

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
                <Text style={[styles.modalSaveText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 120,
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
    paddingBottom: 12,
    maxHeight: '90%',
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
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalContentContainer: {
    paddingBottom: 8,
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
    paddingHorizontal: 20,
    paddingTop: 12,
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
