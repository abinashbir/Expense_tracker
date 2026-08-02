import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrencyCompact } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BarChartView({ data, labels, title }) {
  const { theme } = useTheme();
  const { currency } = useSettings();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No data to display</Text>
      </View>
    );
  }

  const barData = data.map((item, index) => ({
    value: item.value || item.total || 0,
    label: labels ? labels[index] : item.label || '',
    frontColor: theme.primary,
    gradientColor: theme.primaryDark,
    topLabelComponent: () => (
      <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
        {formatCurrencyCompact(item.value || item.total || 0, currency)}
      </Text>
    ),
  }));

  const maxValue = Math.max(...barData.map(d => d.value), 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {title && (
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      )}
      <View style={styles.chartWrapper}>
        <BarChart
          data={barData}
          barWidth={SCREEN_WIDTH > 400 ? 30 : 24}
          spacing={SCREEN_WIDTH > 400 ? 20 : 14}
          roundedTop
          roundedBottom
          noOfSections={4}
          maxValue={maxValue * 1.2}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={theme.border}
          yAxisTextStyle={{ color: theme.textTertiary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          hideRules
          isAnimated
          animationDuration={600}
          barBorderRadius={6}
          frontColor={theme.primary}
          gradientColor={theme.primaryLight}
          showGradient
          formatYLabel={(val) => formatCurrencyCompact(Number(val), currency)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 9,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
});
