import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../context/ExpenseContext';

export default function FilterSheet({ visible, onClose, onApply, currentFilters = {} }) {
  const { theme } = useTheme();
  const { categories } = useExpenses();
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categoryId || null);
  const [minAmount, setMinAmount] = useState(currentFilters.minAmount?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(currentFilters.maxAmount?.toString() || '');
  const [searchText, setSearchText] = useState(currentFilters.searchText || '');

  const handleApply = () => {
    const filters = {};
    if (selectedCategory) filters.categoryId = selectedCategory;
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (searchText.trim()) filters.searchText = searchText.trim();
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setMinAmount('');
    setMaxAmount('');
    setSearchText('');
    onApply({});
    onClose();
  };

  const hasFilters = selectedCategory || minAmount || maxAmount || searchText.trim();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Filter Expenses</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Search</Text>
            <View style={[styles.searchRow, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search notes or categories..."
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            {/* Category filter */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <TouchableOpacity
                style={[
                  styles.catChip,
                  {
                    backgroundColor: !selectedCategory ? theme.primary : theme.surfaceElevated,
                    borderColor: !selectedCategory ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.catChipText, { color: !selectedCategory ? '#FFF' : theme.text }]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: selectedCategory === cat.id ? cat.color + '25' : theme.surfaceElevated,
                      borderColor: selectedCategory === cat.id ? cat.color : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.id ? cat.color : theme.textSecondary} />
                  <Text style={[styles.catChipText, { color: selectedCategory === cat.id ? cat.color : theme.text }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Amount range */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount Range</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, { backgroundColor: theme.surfaceElevated, color: theme.text, borderColor: theme.border }]}
                value={minAmount}
                onChangeText={setMinAmount}
                placeholder="Min"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numeric"
              />
              <Text style={[styles.amountDash, { color: theme.textTertiary }]}>—</Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: theme.surfaceElevated, color: theme.text, borderColor: theme.border }]}
                value={maxAmount}
                onChangeText={setMaxAmount}
                placeholder="Max"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {hasFilters ? (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: theme.border }]}
                onPress={handleClear}
              >
                <Text style={[styles.clearBtnText, { color: theme.textSecondary }]}>Clear All</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: theme.primary }]}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    gap: 6,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  amountDash: {
    fontSize: 18,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
