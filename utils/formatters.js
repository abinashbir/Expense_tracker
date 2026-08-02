/**
 * Format a number as currency with the given symbol
 */
export function formatCurrency(amount, symbol = '₹') {
  if (amount === null || amount === undefined) return `${symbol}0`;
  const num = parseFloat(amount);
  if (isNaN(num)) return `${symbol}0`;

  // Format with commas and 2 decimal places
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Format a number as compact currency (no decimals for whole numbers)
 */
export function formatCurrencyCompact(amount, symbol = '₹') {
  if (amount === null || amount === undefined) return `${symbol}0`;
  const num = parseFloat(amount);
  if (isNaN(num)) return `${symbol}0`;

  if (num >= 100000) {
    return `${symbol}${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `${symbol}${(num / 1000).toFixed(1)}K`;
  }

  const hasDecimals = num % 1 !== 0;
  const formatted = hasDecimals ? num.toFixed(2) : num.toString();
  return `${symbol}${formatted}`;
}

/**
 * Format a date string (YYYY-MM-DD) as readable date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string as short date (Aug 2)
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get month name from YYYY-MM string
 */
export function getMonthName(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get short month name from YYYY-MM string
 */
export function getMonthNameShort(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get relative date string (Today, Yesterday, N days ago)
 */
export function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');

  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDateShort(dateStr);
}

/**
 * Get current date as YYYY-MM-DD
 */
export function getCurrentDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get current month as YYYY-MM
 */
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous month as YYYY-MM
 */
export function getPreviousMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/**
 * Get next month as YYYY-MM
 */
export function getNextMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Get start and end date of a week containing the given date
 */
export function getWeekRange(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday

  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  };
}

/**
 * Format a Date object as YYYY-MM-DD
 */
export function formatDateISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get an array of day labels for a week (Sun, Mon, ...)
 */
export function getWeekDayLabels() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}
