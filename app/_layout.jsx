import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '../db/database';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ExpenseProvider } from '../context/ExpenseContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash after a short delay to let providers load
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SQLiteProvider databaseName="expense_tracker.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider>
        <SettingsProvider>
          <ExpenseProvider>
            <RootLayoutNav />
          </ExpenseProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="edit/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
