import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility.
 * All methods silently no-op on web or if haptics are unavailable.
 */

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap — selection changes, toggles, small UI interactions */
export async function lightImpact() {
  if (!isNative) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics not available (emulator, etc.)
  }
}

/** Medium tap — button presses, card taps */
export async function mediumImpact() {
  if (!isNative) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics not available
  }
}

/** Heavy tap — swipe threshold reached, destructive actions */
export async function heavyImpact() {
  if (!isNative) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Haptics not available
  }
}

/** Success — expense saved, budget set, etc. */
export async function successNotification() {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available
  }
}

/** Warning — approaching budget limit, destructive confirmation */
export async function warningNotification() {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Haptics not available
  }
}

/** Error — validation failure, operation error */
export async function errorNotification() {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not available
  }
}

/** Selection tick — scrolling through pickers, toggles */
export async function selectionFeedback() {
  if (!isNative) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics not available
  }
}
