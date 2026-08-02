import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Switch, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useExpenses } from '../../context/ExpenseContext';
import { CURRENCIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../utils/constants';
import { formatCurrency, getCurrentMonth } from '../../utils/formatters';
import { exportCSV } from '../../utils/csvExport';
import { exportBackup } from '../../utils/backup';
import { requestNotificationPermissions } from '../../utils/notifications';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { theme, isDark, mode, setThemeMode, toggleTheme } = useTheme();
  const { currency, setCurrency } = useSettings();
  const {
    categories, budgets, addCategory, deleteCategory,
    saveBudget, removeBudget, selectedMonth,
  } = useExpenses();

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('ellipsis-horizontal');
  const [newCatColor, setNewCatColor] = useState('#888888');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Export CSV
  const handleExportCSV = async () => {
    try {
      await exportCSV(db, currency);
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    }
  };

  // Export Backup
  const handleExportBackup = async () => {
    try {
      await exportBackup(db);
    } catch (e) {
      Alert.alert('Backup Failed', e.message);
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await addCategory(newCatName.trim(), newCatIcon, newCatColor);
      setNewCatName('');
      setShowAddCategory(false);
    } catch (e) {
      Alert.alert('Error', 'Category name already exists');
    }
  };

  // Delete category
  const handleDeleteCategory = (cat) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Existing expenses will be moved to "Other".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteCategory(cat.id),
        },
      ]
    );
  };

  // Save budget
  const handleSaveBudget = async (categoryId) => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }
    await saveBudget(categoryId, amount);
    setBudgetAmount('');
    setShowBudgetInput(null);
  };

  // Notification permission
  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermissions();
    Alert.alert(
      granted ? 'Enabled' : 'Not Enabled',
      granted
        ? 'You will receive alerts when approaching budget limits.'
        : 'Please enable notifications in your device settings.'
    );
  };

  const SettingsRow = ({ icon, iconColor, title, subtitle, right, onPress, last }) => (
    <TouchableOpacity
      style={[
        styles.settingsRow,
        !last && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingsIconWrap, { backgroundColor: (iconColor || theme.primary) + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor || theme.primary} />
      </View>
      <View style={styles.settingsInfo}>
        <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="moon"
            iconColor="#6C5CE7"
            title="Dark Mode"
            subtitle={mode === 'system' ? 'Following system' : isDark ? 'On' : 'Off'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primaryLight }}
                thumbColor={isDark ? theme.primary : theme.textTertiary}
              />
            }
            last
          />
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="cash"
            iconColor="#10B981"
            title="Currency"
            subtitle={CURRENCIES.find(c => c.symbol === currency)?.name || 'Indian Rupee'}
            onPress={() => setShowCurrencyPicker(true)}
          />
          <SettingsRow
            icon="notifications"
            iconColor="#F59E0B"
            title="Budget Notifications"
            subtitle="Get alerts when nearing limits"
            onPress={handleNotificationPermission}
            last
          />
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Data Management</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="grid"
            iconColor="#4ECDC4"
            title="Manage Categories"
            subtitle={`${categories.length} categories`}
            onPress={() => setShowCategoryManager(true)}
          />
          <SettingsRow
            icon="wallet"
            iconColor="#FF6B6B"
            title="Monthly Budgets"
            subtitle={`${budgets.length} budgets set`}
            onPress={() => setShowBudgetManager(true)}
          />
          <SettingsRow
            icon="download-outline"
            iconColor="#45B7D1"
            title="Export as CSV"
            subtitle="Share your expense data"
            onPress={handleExportCSV}
          />
          <SettingsRow
            icon="cloud-upload-outline"
            iconColor="#96CEB4"
            title="Backup Data"
            subtitle="Export as JSON file"
            onPress={handleExportBackup}
            last
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>About</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow
            icon="information-circle"
            iconColor="#888"
            title="Version"
            subtitle="1.0.0"
            last
          />
        </View>

        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          Made with ❤️ • All data stored locally
        </Text>
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyItem,
                    {
                      backgroundColor: currency === c.symbol ? theme.primaryLight : 'transparent',
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                  onPress={() => { setCurrency(c.symbol); setShowCurrencyPicker(false); }}
                >
                  <Text style={[styles.currencySymbol, { color: theme.primary }]}>{c.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.currencyName, { color: theme.text }]}>{c.name}</Text>
                    <Text style={[styles.currencyCode, { color: theme.textSecondary }]}>{c.code}</Text>
                  </View>
                  {currency === c.symbol && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Manager Modal */}
      <Modal visible={showCategoryManager} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Manage Categories</Text>
              <TouchableOpacity onPress={() => { setShowCategoryManager(false); setShowAddCategory(false); }}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {!showAddCategory ? (
              <ScrollView>
                {categories.map((cat) => (
                  <View
                    key={cat.id}
                    style={[styles.catManagerItem, { borderBottomColor: theme.borderLight }]}
                  >
                    <View style={[styles.catManagerIcon, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={[styles.catManagerName, { color: theme.text }]}>{cat.name}</Text>
                    {cat.is_default ? (
                      <Text style={[styles.catManagerDefault, { color: theme.textTertiary }]}>Default</Text>
                    ) : (
                      <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.addCatBtn, { backgroundColor: theme.primaryLight }]}
                  onPress={() => setShowAddCategory(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <Text style={[styles.addCatBtnText, { color: theme.primary }]}>Add Category</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView style={{ padding: 20 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surfaceElevated, color: theme.text, borderColor: theme.border }]}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder="Category name"
                  placeholderTextColor={theme.textTertiary}
                  autoFocus
                />
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Icon</Text>
                <View style={styles.pickerGrid}>
                  {CATEGORY_ICONS.slice(0, 20).map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.pickerItem, {
                        backgroundColor: newCatIcon === icon ? newCatColor + '25' : theme.surfaceElevated,
                        borderColor: newCatIcon === icon ? newCatColor : theme.border,
                      }]}
                      onPress={() => setNewCatIcon(icon)}
                    >
                      <Ionicons name={icon} size={20} color={newCatIcon === icon ? newCatColor : theme.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Color</Text>
                <View style={styles.pickerGrid}>
                  {CATEGORY_COLORS.slice(0, 10).map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorDot, { backgroundColor: color }, newCatColor === color && styles.colorDotSelected]}
                      onPress={() => setNewCatColor(color)}
                    >
                      {newCatColor === color && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.formCancelBtn, { borderColor: theme.border }]}
                    onPress={() => setShowAddCategory(false)}
                  >
                    <Text style={[styles.formCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formSaveBtn, { backgroundColor: theme.primary, opacity: newCatName.trim() ? 1 : 0.5 }]}
                    onPress={handleAddCategory}
                    disabled={!newCatName.trim()}
                  >
                    <Text style={styles.formSaveText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Budget Manager Modal */}
      <Modal visible={showBudgetManager} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Monthly Budgets</Text>
              <TouchableOpacity onPress={() => { setShowBudgetManager(false); setShowBudgetInput(null); }}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => {
                const existing = budgets.find((b) => b.category_id === cat.id);
                const isEditing = showBudgetInput === cat.id;

                return (
                  <View key={cat.id} style={[styles.budgetItem, { borderBottomColor: theme.borderLight }]}>
                    <View style={styles.budgetItemLeft}>
                      <View style={[styles.budgetItemIcon, { backgroundColor: cat.color + '20' }]}>
                        <Ionicons name={cat.icon} size={18} color={cat.color} />
                      </View>
                      <Text style={[styles.budgetItemName, { color: theme.text }]}>{cat.name}</Text>
                    </View>

                    {isEditing ? (
                      <View style={styles.budgetInputRow}>
                        <TextInput
                          style={[styles.budgetInput, { backgroundColor: theme.surfaceElevated, color: theme.text, borderColor: theme.border }]}
                          value={budgetAmount}
                          onChangeText={setBudgetAmount}
                          placeholder="Amount"
                          placeholderTextColor={theme.textTertiary}
                          keyboardType="numeric"
                          autoFocus
                        />
                        <TouchableOpacity
                          style={[styles.budgetSaveBtn, { backgroundColor: theme.primary }]}
                          onPress={() => handleSaveBudget(cat.id)}
                        >
                          <Ionicons name="checkmark" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.budgetItemRight}
                        onPress={() => {
                          setShowBudgetInput(cat.id);
                          setBudgetAmount(existing ? existing.amount.toString() : '');
                        }}
                      >
                        {existing ? (
                          <Text style={[styles.budgetAmountText, { color: theme.primary }]}>
                            {formatCurrency(existing.amount, currency)}
                          </Text>
                        ) : (
                          <Text style={[styles.budgetSetText, { color: theme.textTertiary }]}>Set budget</Text>
                        )}
                        <Ionicons name="pencil-outline" size={16} color={theme.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingBottom: 120 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 8, marginTop: 8 },
  section: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingsIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingsInfo: { flex: 1 },
  settingsTitle: { fontSize: 15, fontWeight: '600' },
  settingsSubtitle: { fontSize: 12, marginTop: 2 },
  footerText: { textAlign: 'center', fontSize: 13, marginTop: 20, marginBottom: 20 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  // Currency
  currencyItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 14 },
  currencySymbol: { fontSize: 22, fontWeight: '700', width: 36, textAlign: 'center' },
  currencyName: { fontSize: 15, fontWeight: '600' },
  currencyCode: { fontSize: 12, marginTop: 2 },

  // Category manager
  catManagerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  catManagerIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  catManagerName: { flex: 1, fontSize: 15, fontWeight: '600' },
  catManagerDefault: { fontSize: 12 },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginVertical: 16, paddingVertical: 14, borderRadius: 12, gap: 8 },
  addCatBtnText: { fontSize: 14, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  textInput: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  colorDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  colorDotSelected: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  formCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  formCancelText: { fontSize: 15, fontWeight: '600' },
  formSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formSaveText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  // Budget manager
  budgetItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  budgetItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  budgetItemIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  budgetItemName: { fontSize: 14, fontWeight: '600' },
  budgetItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetAmountText: { fontSize: 14, fontWeight: '600' },
  budgetSetText: { fontSize: 13 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetInput: { width: 100, height: 38, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1 },
  budgetSaveBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
