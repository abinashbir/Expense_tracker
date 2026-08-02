import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllData, restoreData } from '../db/queries';

/**
 * Export all data as JSON and open the share sheet.
 */
export async function exportBackup(db) {
  try {
    const data = await getAllData(db);
    const jsonContent = JSON.stringify(data, null, 2);

    const fileName = `expense_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Backup Expense Data',
    });

    return true;
  } catch (error) {
    console.error('Backup Export Error:', error);
    throw error;
  }
}

/**
 * Restore data from a JSON backup string.
 * @param {object} db - SQLite database instance
 * @param {string} jsonString - JSON string to restore from
 */
export async function restoreBackup(db, jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.expenses || !data.categories || !data.budgets) {
      throw new Error('Invalid backup file format');
    }

    await restoreData(db, data);
    return true;
  } catch (error) {
    console.error('Backup Restore Error:', error);
    throw error;
  }
}
