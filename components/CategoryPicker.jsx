import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ScrollView, TextInput, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CategoryPicker({ visible, onClose, onSelect, selectedId }) {
  const { theme } = useTheme();
  const { categories, addCategory } = useExpenses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('ellipsis-horizontal');
  const [newColor, setNewColor] = useState('#888888');

  const handleSelect = (cat) => {
    onSelect(cat);
    onClose();
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    try {
      const id = await addCategory(newName.trim(), newIcon, newColor);
      handleSelect({ id, name: newName.trim(), icon: newIcon, color: newColor });
      setNewName('');
      setShowAddForm(false);
    } catch (e) {
      console.error('Failed to add category:', e);
    }
  };

  const renderCategory = ({ item }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { backgroundColor: isSelected ? item.color + '25' : theme.surfaceElevated, borderColor: isSelected ? item.color : theme.border },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={item.color} style={styles.checkmark} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Select Category</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {!showAddForm ? (
            <>
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
              />

              {/* Add custom category button */}
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.primaryLight }]}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.addBtnText, { color: theme.primary }]}>Add Custom Category</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView style={styles.addForm} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Category Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.text, borderColor: theme.border }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Groceries"
                placeholderTextColor={theme.textTertiary}
                autoFocus
              />

              {/* Icon picker */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: newIcon === icon ? newColor + '25' : theme.surfaceElevated,
                        borderColor: newIcon === icon ? newColor : theme.border,
                      },
                    ]}
                    onPress={() => setNewIcon(icon)}
                  >
                    <Ionicons name={icon} size={22} color={newIcon === icon ? newColor : theme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color picker */}
              <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newColor === color && styles.colorSelected,
                    ]}
                    onPress={() => setNewColor(color)}
                  >
                    {newColor === color && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.addFormActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: newName.trim() ? 1 : 0.5 }]}
                  onPress={handleAddCategory}
                  disabled={!newName.trim()}
                >
                  <Text style={styles.saveBtnText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ITEM_WIDTH = (SCREEN_WIDTH - 64 - 24) / 3;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
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
  grid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  categoryItem: {
    width: ITEM_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  addFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
