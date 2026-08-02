import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getBudgetStatus } from '../db/queries';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'Budget Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    });
  }

  return true;
}

/**
 * Check if a category's budget is nearing the limit and send notification
 * @param {object} db - SQLite database instance
 * @param {number} categoryId - Category ID to check
 * @param {string} yearMonth - Month to check (YYYY-MM)
 * @param {string} categoryName - Category name for the notification
 */
export async function checkBudgetAndNotify(db, categoryId, yearMonth, categoryName) {
  try {
    const status = await getBudgetStatus(db, categoryId, yearMonth);

    if (status.budget <= 0) return; // No budget set

    const percentage = status.percentage;

    if (percentage >= 100) {
      await scheduleNotification(
        '🚨 Budget Exceeded!',
        `You've exceeded your ${categoryName} budget! Spent ${Math.round(percentage)}% of your limit.`,
      );
    } else if (percentage >= 80) {
      await scheduleNotification(
        '⚠️ Budget Warning',
        `You've used ${Math.round(percentage)}% of your ${categoryName} budget. Consider slowing down!`,
      );
    }
  } catch (error) {
    console.error('Budget notification error:', error);
  }
}

/**
 * Schedule a local notification immediately
 */
async function scheduleNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'budget-alerts' }),
    },
    trigger: null, // Show immediately
  });
}
