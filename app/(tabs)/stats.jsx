import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useExpenses } from '../../context/ExpenseContext';
import {
  getMonthName, getPreviousMonth, getNextMonth,
  getCurrentMonth, getWeekRange, getCurrentDate,
  getWeekDayLabels, formatDateISO,
} from '../../utils/formatters';
import { getDailySpending, getCategoryBreakdown } from '../../db/queries';
import PieChartView from '../../components/PieChartView';
import BarChartView from '../../components/BarChartView';
import EmptyState from '../../components/EmptyState';

export default function StatsScreen() {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { currency } = useSettings();
  const { selectedMonth, setSelectedMonth, monthlyTotal, categoryBreakdown } = useExpenses();

  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'weekly'
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);

  const isCurrentMonth = selectedMonth === getCurrentMonth();

  // Load weekly data
  const loadWeeklyData = useCallback(async (dateStr) => {
    const week = getWeekRange(dateStr || getCurrentDate());
    setCurrentWeekStart(week.start);

    const daily = await getDailySpending(db, week.start, week.end);
    const labels = getWeekDayLabels();

    // Fill in all 7 days
    const startDate = new Date(week.start + 'T00:00:00');
    const fullWeek = labels.map((label, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = formatDateISO(d);
      const found = daily.find((r) => r.date === dateKey);
      return {
        label,
        value: found ? found.total : 0,
      };
    });

    setWeeklyData(fullWeek);
    setWeeklyTotal(fullWeek.reduce((s, d) => s + d.value, 0));
  }, [db]);

  React.useEffect(() => {
    if (viewMode === 'weekly') {
      loadWeeklyData();
    }
  }, [viewMode, loadWeeklyData]);

  const navigateWeek = (direction) => {
    if (!currentWeekStart) return;
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    loadWeeklyData(formatDateISO(d));
  };

  const getWeekLabel = () => {
    if (!currentWeekStart) return '';
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.pageTitle, { color: theme.text }]}>Statistics</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          Analyze your spending patterns
        </Text>

        {/* View Mode Toggle */}
        <View style={[styles.toggleRow, { backgroundColor: theme.surfaceElevated }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'monthly' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'monthly' ? '#FFF' : theme.textSecondary }]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'weekly' && { backgroundColor: theme.primary }]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'weekly' ? '#FFF' : theme.textSecondary }]}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            onPress={() =>
              viewMode === 'monthly'
                ? setSelectedMonth(getPreviousMonth(selectedMonth))
                : navigateWeek('prev')
            }
            style={[styles.periodArrow, { backgroundColor: theme.surfaceElevated }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.periodText, { color: theme.text }]}>
            {viewMode === 'monthly' ? getMonthName(selectedMonth) : getWeekLabel()}
          </Text>

          <TouchableOpacity
            onPress={() =>
              viewMode === 'monthly'
                ? setSelectedMonth(getNextMonth(selectedMonth))
                : navigateWeek('next')
            }
            style={[styles.periodArrow, { backgroundColor: theme.surfaceElevated }]}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {viewMode === 'monthly' ? (
          <>
            {/* Pie Chart */}
            {categoryBreakdown.length > 0 ? (
              <>
                <Text style={[styles.chartTitle, { color: theme.text }]}>Category Breakdown</Text>
                <PieChartView data={categoryBreakdown} totalAmount={monthlyTotal} />

                {/* Top categories list */}
                <Text style={[styles.chartTitle, { color: theme.text }]}>Top Categories</Text>
                <View style={[styles.topCatList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {categoryBreakdown.map((cat, index) => {
                    const pct = monthlyTotal > 0 ? (cat.total / monthlyTotal) * 100 : 0;
                    return (
                      <View key={cat.id} style={[styles.topCatItem, index < categoryBreakdown.length - 1 && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 }]}>
                        <View style={styles.topCatLeft}>
                          <Text style={[styles.topCatRank, { color: theme.textTertiary }]}>#{index + 1}</Text>
                          <View style={[styles.topCatIcon, { backgroundColor: cat.color + '20' }]}>
                            <Ionicons name={cat.icon} size={18} color={cat.color} />
                          </View>
                          <Text style={[styles.topCatName, { color: theme.text }]}>{cat.name}</Text>
                        </View>
                        <View style={styles.topCatRight}>
                          <View style={styles.topCatBarTrack}>
                            <View style={[styles.topCatBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                          </View>
                          <Text style={[styles.topCatPct, { color: theme.textSecondary }]}>
                            {Math.round(pct)}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <EmptyState
                icon="pie-chart-outline"
                title="No spending data"
                message="Add expenses to see your category breakdown"
              />
            )}
          </>
        ) : (
          <>
            {/* Weekly Bar Chart */}
            {weeklyData.some((d) => d.value > 0) ? (
              <BarChartView data={weeklyData} title="Daily Spending" />
            ) : (
              <EmptyState
                icon="bar-chart-outline"
                title="No spending this week"
                message="Add expenses to see your daily breakdown"
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageSubtitle: {
    fontSize: 15,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 17,
    fontWeight: '700',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  topCatList: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  topCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topCatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCatRank: {
    fontSize: 12,
    fontWeight: '600',
    width: 24,
  },
  topCatIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topCatName: {
    fontSize: 14,
    fontWeight: '600',
  },
  topCatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topCatBarTrack: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  topCatBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  topCatPct: {
    fontSize: 13,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
