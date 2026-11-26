import { getRecurringExpenses } from '../db/queries';

// Safety valve so a very old daily series can never lock up the app.
const MAX_OCCURRENCES_PER_RUN = 1000;

/**
 * Process recurring expenses: check all recurring templates and auto-generate
 * any entries that are due based on their recurrence_interval.
 *
 * Called once on app startup.
 */
export async function processRecurringExpenses(db) {
  try {
    const recurring = await getRecurringExpenses(db);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const expense of recurring) {
      const lastDate = new Date(expense.date + 'T00:00:00');
      // Remember the original day-of-month so month-end dates don't drift
      // (e.g. Jan 31 -> Feb 28 -> Mar 28 would be wrong).
      const anchorDay = lastDate.getDate();
      const nextDate = getNextOccurrence(lastDate, expense.recurrence_interval, anchorDay);

      // Generate all missing occurrences up to today
      let generated = 0;
      while (nextDate <= today && generated < MAX_OCCURRENCES_PER_RUN) {
        const dateStr = formatDate(nextDate);

        // Only this series can own a given date, so instances never collide
        // with a different recurring expense.
        const existing = await db.getFirstAsync(
          `SELECT id FROM expenses WHERE recurring_id = ? AND date = ?`,
          [expense.id, dateStr]
        );

        if (!existing) {
          await db.runAsync(
            `INSERT INTO expenses (amount, category_id, date, notes, is_recurring, recurrence_interval, recurring_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))`,
            [
              expense.amount,
              expense.category_id,
              dateStr,
              expense.notes || '',
              expense.recurrence_interval,
              expense.id,
            ]
          );
        }

        // Move to next occurrence
        advanceDate(nextDate, expense.recurrence_interval, anchorDay);
        generated += 1;
      }
    }
  } catch (error) {
    console.error('Failed to process recurring expenses:', error);
  }
}

/**
 * Get the next occurrence date after the given date.
 */
function getNextOccurrence(date, interval, anchorDay) {
  const next = new Date(date);
  advanceDate(next, interval, anchorDay);
  return next;
}

/**
 * Advance a Date object in-place by the given interval.
 * For monthly/yearly intervals the day is clamped to the anchor day when the
 * target month is shorter (Jan 31 -> Feb 28 -> Mar 31).
 */
function advanceDate(date, interval, anchorDay) {
  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly': {
      const day = anchorDay ?? date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, daysInMonth));
      break;
    }
    case 'yearly': {
      const day = anchorDay ?? date.getDate();
      date.setDate(1);
      date.setFullYear(date.getFullYear() + 1);
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, daysInMonth));
      break;
    }
    default: {
      const day = anchorDay ?? date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, daysInMonth));
    }
  }
}

/**
 * Format a Date as YYYY-MM-DD.
 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
