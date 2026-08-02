import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as queries from '../db/queries';
import { getCurrentMonth } from '../utils/formatters';

// Action types
const ACTIONS = {
  SET_EXPENSES: 'SET_EXPENSES',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_BUDGETS: 'SET_BUDGETS',
  SET_MONTHLY_TOTAL: 'SET_MONTHLY_TOTAL',
  SET_CATEGORY_BREAKDOWN: 'SET_CATEGORY_BREAKDOWN',
  SET_SELECTED_MONTH: 'SET_SELECTED_MONTH',
  SET_LOADING: 'SET_LOADING',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
};

const initialState = {
  expenses: [],
  categories: [],
  budgets: [],
  monthlyTotal: 0,
  categoryBreakdown: [],
  selectedMonth: getCurrentMonth(),
  loading: true,
  filters: {},
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_EXPENSES:
      return { ...state, expenses: action.payload };
    case ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    case ACTIONS.SET_BUDGETS:
      return { ...state, budgets: action.payload };
    case ACTIONS.SET_MONTHLY_TOTAL:
      return { ...state, monthlyTotal: action.payload };
    case ACTIONS.SET_CATEGORY_BREAKDOWN:
      return { ...state, categoryBreakdown: action.payload };
    case ACTIONS.SET_SELECTED_MONTH:
      return { ...state, selectedMonth: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case ACTIONS.CLEAR_FILTERS:
      return { ...state, filters: {} };
    default:
      return state;
  }
}

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  const db = useSQLiteContext();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, [state.selectedMonth]);

  const loadAllData = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await Promise.all([
        loadExpenses(),
        loadCategories(),
        loadBudgets(),
        loadMonthlyTotal(),
        loadCategoryBreakdown(),
      ]);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    dispatch({ type: ACTIONS.SET_LOADING, payload: false });
  }, [db, state.selectedMonth, state.filters]);

  const loadExpenses = useCallback(async () => {
    const filters = {
      ...state.filters,
      startDate: `${state.selectedMonth}-01`,
      endDate: `${state.selectedMonth}-31`,
    };
    const expenses = await queries.getAllExpenses(db, filters);
    dispatch({ type: ACTIONS.SET_EXPENSES, payload: expenses });
  }, [db, state.selectedMonth, state.filters]);

  const loadCategories = useCallback(async () => {
    const categories = await queries.getAllCategories(db);
    dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories });
  }, [db]);

  const loadBudgets = useCallback(async () => {
    const budgets = await queries.getBudgets(db, state.selectedMonth);
    dispatch({ type: ACTIONS.SET_BUDGETS, payload: budgets });
  }, [db, state.selectedMonth]);

  const loadMonthlyTotal = useCallback(async () => {
    const total = await queries.getMonthlyTotal(db, state.selectedMonth);
    dispatch({ type: ACTIONS.SET_MONTHLY_TOTAL, payload: total });
  }, [db, state.selectedMonth]);

  const loadCategoryBreakdown = useCallback(async () => {
    const breakdown = await queries.getCategoryBreakdown(db, state.selectedMonth);
    dispatch({ type: ACTIONS.SET_CATEGORY_BREAKDOWN, payload: breakdown });
  }, [db, state.selectedMonth]);

  // CRUD Actions
  const addExpense = useCallback(async (expense) => {
    const id = await queries.addExpense(db, expense);
    await loadAllData();
    return id;
  }, [db, loadAllData]);

  const updateExpense = useCallback(async (id, expense) => {
    await queries.updateExpense(db, id, expense);
    await loadAllData();
  }, [db, loadAllData]);

  const deleteExpense = useCallback(async (id) => {
    await queries.deleteExpense(db, id);
    await loadAllData();
  }, [db, loadAllData]);

  const addCategory = useCallback(async (name, icon, color) => {
    const id = await queries.addCategory(db, name, icon, color);
    await loadCategories();
    return id;
  }, [db, loadCategories]);

  const deleteCategory = useCallback(async (id) => {
    await queries.deleteCategory(db, id);
    await loadCategories();
    await loadAllData();
  }, [db, loadCategories, loadAllData]);

  const saveBudget = useCallback(async (categoryId, amount) => {
    await queries.setBudget(db, categoryId, state.selectedMonth, amount);
    await loadBudgets();
  }, [db, state.selectedMonth, loadBudgets]);

  const removeBudget = useCallback(async (categoryId) => {
    await queries.deleteBudget(db, categoryId, state.selectedMonth);
    await loadBudgets();
  }, [db, state.selectedMonth, loadBudgets]);

  const setSelectedMonth = useCallback((month) => {
    dispatch({ type: ACTIONS.SET_SELECTED_MONTH, payload: month });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_FILTERS });
  }, []);

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  return (
    <ExpenseContext.Provider
      value={{
        ...state,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        deleteCategory,
        saveBudget,
        removeBudget,
        setSelectedMonth,
        setFilters,
        clearFilters,
        refreshData,
        db,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
