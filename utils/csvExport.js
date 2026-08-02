import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllExpenses } from '../db/queries';

/**
 * Export expenses as CSV and open the share sheet.
 * @param {object} db - SQLite database instance
 * @param {string} currencySymbol - Currency symbol to use
 * @param {object} filters - Optional filters to apply
 */
export async function exportCSV(db, currencySymbol = '₹', filters = {}) {
  try {
    const expenses = await getAllExpenses(db, filters);

    if (expenses.length === 0) {
      throw new Error('No expenses to export');
    }

    // Build CSV
    const headers = ['Date', 'Category', 'Amount', 'Notes', 'Recurring', 'Recurrence Interval'];
    const rows = expenses.map((e) => [
      e.date,
      `"${e.category_name}"`,
      e.amount.toFixed(2),
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      e.is_recurring ? 'Yes' : 'No',
      e.recurrence_interval || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    // Write file
    const fileName = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Expenses',
      UTI: 'public.comma-separated-values-text',
    });

    return true;
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw error;
  }
}
