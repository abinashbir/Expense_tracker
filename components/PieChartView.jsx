import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PieChartView({ data, totalAmount }) {
  const { theme } = useTheme();
  const { currency } = useSettings();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No data to display</Text>
      </View>
    );
  }

  const pieData = data.map((item) => ({
    value: item.total,
    color: item.color,
    text: `${Math.round((item.total / totalAmount) * 100)}%`,
    textColor: theme.text,
    focused: false,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.chartWrapper}>
        <PieChart
          data={pieData}
          donut
          radius={SCREEN_WIDTH * 0.22}
          innerRadius={SCREEN_WIDTH * 0.13}
          innerCircleColor={theme.surface}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[styles.centerAmount, { color: theme.text }]}>
                {formatCurrency(totalAmount, currency)}
              </Text>
              <Text style={[styles.centerSubtext, { color: theme.textSecondary }]}>
                Total
              </Text>
            </View>
          )}
          textColor={theme.text}
          textSize={10}
          showText={false}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={item.id || index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.legendAmount, { color: theme.textSecondary }]}>
              {formatCurrency(item.total, currency)}
            </Text>
            <Text style={[styles.legendPercent, { color: theme.textTertiary }]}>
              {Math.round((item.total / totalAmount) * 100)}%
            </Text>
          </View>
        ))}
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
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  centerSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  legend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    fontVariant: ['tabular-nums'],
  },
  legendPercent: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
});
