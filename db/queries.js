// =====================================================
// EXPENSE QUERIES
// =====================================================

/**
 * Get all expenses with optional filters.
 * Joins with categories to get category name, icon, and color.
 */
export async function getAllExpenses(db, filters = {}) {
  let query = `
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.startDate) {
    query += ` AND e.date >= ?`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND e.date <= ?`;
    params.push(filters.endDate);
  }
  if (filters.categoryId) {
    query += ` AND e.category_id = ?`;
    params.push(filters.categoryId);
  }
  if (filters.minAmount !== undefined && filters.minAmount !== null) {
    query += ` AND e.amount >= ?`;
    params.push(filters.minAmount);
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
    query += ` AND e.amount <= ?`;
    params.push(filters.maxAmount);
  }
  if (filters.searchText) {
    query += ` AND (e.notes LIKE ? OR c.name LIKE ?)`;
    params.push(`%${filters.searchText}%`, `%${filters.searchText}%`);
  }

  query += ` ORDER BY e.date DESC, e.created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT ?`;
    params.push(filters.limit);
  }

  return await db.getAllAsync(query, params);
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(db, id) {
  return await db.getFirstAsync(
    `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.id = ?`,
    [id]
  );
}

/**
 * Add a new expense
 */
export async function addExpense(db, expense) {
  const result = await db.runAsync(
    `INSERT INTO expenses (amount, category_id, date, notes, is_recurring, recurrence_interval)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      expense.amount,
      expense.category_id,
      expense.date,
      expense.notes || '',
      expense.is_recurring ? 1 : 0,
      expense.recurrence_interval || null,
    ]
  );
  return result.lastInsertRowId;
}

/**
 * Update an existing expense
 */
export async function updateExpense(db, id, expense) {
  await db.runAsync(
    `UPDATE expenses SET
      amount = ?, category_id = ?, date = ?, notes = ?,
      is_recurring = ?, recurrence_interval = ?,
      updated_at = datetime('now')
     WHERE id = ?`,
    [
      expense.amount,
      expense.category_id,
      expense.date,
      expense.notes || '',
      expense.is_recurring ? 1 : 0,
      expense.recurrence_interval || null,
      id,
    ]
  );
}

/**
 * Delete an expense
 */
export async function deleteExpense(db, id) {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// =====================================================
// AGGREGATION QUERIES
// =====================================================

/**
 * Get total spending for a month (YYYY-MM)
 */
export async function getMonthlyTotal(db, yearMonth) {
  const result = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date LIKE ?`,
    [`${yearMonth}%`]
  );
  return result?.total ?? 0;
}

/**
 * Get total spending for a date range
 */
export async function getRangeTotal(db, startDate, endDate) {
  const result = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date >= ? AND date <= ?`,
    [startDate, endDate]
  );
  return result?.total ?? 0;
}

/**
 * Get daily spending for a date range (for bar charts)
 */
export async function getDailySpending(db, startDate, endDate) {
  return await db.getAllAsync(
    `SELECT date, COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date ASC`,
    [startDate, endDate]
  );
}

/**
 * Get category-wise breakdown for a month
 */
export async function getCategoryBreakdown(db, yearMonth) {
  return await db.getAllAsync(
    `SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND e.date LIKE ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY total DESC`,
    [`${yearMonth}%`]
  );
}

/**
 * Get spending per category for a date range
 */
export async function getCategoryBreakdownRange(db, startDate, endDate) {
  return await db.getAllAsync(
    `SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND e.date >= ? AND e.date <= ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY total DESC`,
    [startDate, endDate]
  );
}

/**
 * Get expense count
 */
export async function getExpenseCount(db) {
  const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM expenses');
  return result?.count ?? 0;
}

// =====================================================
// CATEGORY QUERIES
// =====================================================

/**
 * Get all categories
 */
export async function getAllCategories(db) {
  return await db.getAllAsync(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC'
  );
}

/**
 * Add a custom category
 */
export async function addCategory(db, name, icon, color) {
  const result = await db.runAsync(
    'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 0)',
    [name, icon, color]
  );
  return result.lastInsertRowId;
}

/**
 * Delete a custom category (only non-default)
 */
export async function deleteCategory(db, id) {
  // Check if it's default
  const cat = await db.getFirstAsync(
    'SELECT is_default FROM categories WHERE id = ?',
    [id]
  );
  if (cat?.is_default) {
    throw new Error('Cannot delete default categories');
  }

  // Check for existing expenses
  const expenseCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
    [id]
  );
  if (expenseCount?.count > 0) {
    // Move expenses to "Other" category
    const other = await db.getFirstAsync(
      "SELECT id FROM categories WHERE name = 'Other'"
    );
    if (other) {
      await db.runAsync(
        'UPDATE expenses SET category_id = ? WHERE category_id = ?',
        [other.id, id]
      );
    }
  }

  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// =====================================================
// BUDGET QUERIES
// =====================================================

/**
 * Get budgets for a month
 */
export async function getBudgets(db, yearMonth) {
  return await db.getAllAsync(
    `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
            COALESCE((SELECT SUM(e.amount) FROM expenses e
                      WHERE e.category_id = b.category_id AND e.date LIKE ?), 0) as spent
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month = ?
     ORDER BY c.name ASC`,
    [`${yearMonth}%`, yearMonth]
  );
}

/**
 * Set (upsert) a budget for a category+month
 */
export async function setBudget(db, categoryId, yearMonth, amount) {
  await db.runAsync(
    `INSERT INTO budgets (category_id, month, amount)
     VALUES (?, ?, ?)
     ON CONFLICT(category_id, month)
     DO UPDATE SET amount = excluded.amount`,
    [categoryId, yearMonth, amount]
  );
}

/**
 * Delete a budget
 */
export async function deleteBudget(db, categoryId, yearMonth) {
  await db.runAsync(
    'DELETE FROM budgets WHERE category_id = ? AND month = ?',
    [categoryId, yearMonth]
  );
}

/**
 * Get budget status for a category in a month (spent / budget)
 */
export async function getBudgetStatus(db, categoryId, yearMonth) {
  const budget = await db.getFirstAsync(
    'SELECT amount FROM budgets WHERE category_id = ? AND month = ?',
    [categoryId, yearMonth]
  );
  const spent = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
     WHERE category_id = ? AND date LIKE ?`,
    [categoryId, `${yearMonth}%`]
  );

  return {
    budget: budget?.amount ?? 0,
    spent: spent?.total ?? 0,
    percentage: budget?.amount ? ((spent?.total ?? 0) / budget.amount) * 100 : 0,
  };
}

// =====================================================
// SETTINGS QUERIES
// =====================================================

/**
 * Get all settings as key-value object
 */
export async function getSettings(db) {
  const rows = await db.getAllAsync('SELECT * FROM settings');
  const settings = {};
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

/**
 * Set a setting value
 */
export async function setSetting(db, key, value) {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

// =====================================================
// RECURRING EXPENSE QUERIES
// =====================================================

/**
 * Get all recurring expenses
 */
export async function getRecurringExpenses(db) {
  return await db.getAllAsync(
    `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.is_recurring = 1
     ORDER BY e.date DESC`
  );
}

// =====================================================
// EXPORT / BACKUP QUERIES
// =====================================================

/**
 * Get all data for backup
 */
export async function getAllData(db) {
  const expenses = await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC');
  const categories = await db.getAllAsync('SELECT * FROM categories ORDER BY id');
  const budgets = await db.getAllAsync('SELECT * FROM budgets ORDER BY month DESC');
  const settings = await getSettings(db);

  return { expenses, categories, budgets, settings, exportDate: new Date().toISOString() };
}

/**
 * Restore data from backup
 */
export async function restoreData(db, data) {
  // Clear existing data
  await db.execAsync('DELETE FROM expenses');
  await db.execAsync('DELETE FROM budgets');
  await db.execAsync('DELETE FROM categories');
  await db.execAsync('DELETE FROM settings');

  // Restore categories
  for (const cat of data.categories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.color, cat.is_default, cat.created_at]
    );
  }

  // Restore expenses
  for (const exp of data.expenses) {
    await db.runAsync(
      `INSERT INTO expenses (id, amount, category_id, date, notes, is_recurring, recurrence_interval, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exp.id, exp.amount, exp.category_id, exp.date, exp.notes, exp.is_recurring, exp.recurrence_interval, exp.created_at, exp.updated_at]
    );
  }

  // Restore budgets
  for (const bud of data.budgets) {
    await db.runAsync(
      'INSERT INTO budgets (id, category_id, month, amount) VALUES (?, ?, ?, ?)',
      [bud.id, bud.category_id, bud.month, bud.amount]
    );
  }

  // Restore settings
  if (data.settings) {
    for (const [key, value] of Object.entries(data.settings)) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    }
  }
}
