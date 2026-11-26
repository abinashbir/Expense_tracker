import { Platform } from 'react-native';
import { getBudgetStatus } from '../db/queries';

// expo-notifications throws at import time in Expo Go (SDK 53+ removed Android
// push notifications there). Load it lazily so the rest of the app still works.
// A development build loads it normally and gets full local notifications.
let notifications = null;
let loadFailed = false;

function getNotifications() {
  if (notifications) return notifications;
  if (loadFailed) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notifications = mod;
    return notifications;
  } catch (e) {
    console.warn('Notifications are not available in this build:', e?.message || e);
    loadFailed = true;
    return null;
  }
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

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
      lightColor: '#FFFFFF',
    });
  }

  return true;
}

export async function scheduleDailyReminder() {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.filter((notification) => notification.content.data?.type === 'daily-reminder');

  await Promise.all(
    existing.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log today\'s spending',
      body: 'Keep your expense tracker up to date in a few seconds.',
      data: { type: 'daily-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      ...(Platform.OS === 'android' && { channelId: 'budget-alerts' }),
    },
  });
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
  const Notifications = getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    // A channel-aware trigger is delivered immediately on Android.
    trigger: Platform.OS === 'android' ? { channelId: 'budget-alerts' } : null,
  });
}
