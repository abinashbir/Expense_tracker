import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import OnboardingScreen from '../components/OnboardingScreen';
import { ExpenseProvider } from '../context/ExpenseContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { migrateDbIfNeeded } from '../db/database';
import { getSettings, setSetting } from '../db/queries';
import { processRecurringExpenses } from '../utils/recurring';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="expense_tracker.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider>
        <SettingsProvider>
          <AppBootstrap />
        </SettingsProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

/**
 * Runs one-time startup work (recurring expenses) before mounting the provider
 * that reads the database, so generated entries appear immediately.
 */
function AppBootstrap() {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await processRecurringExpenses(db);
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [db]);

  if (!ready) return null;

  return (
    <ExpenseProvider>
      <RootLayoutNav />
    </ExpenseProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const db = useSQLiteContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check if onboarding has been completed
  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings(db);
        if (settings.onboarding_completed !== 'true') {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error('Failed to initialize app:', e);
      }
      setOnboardingChecked(true);
    })();
  }, [db]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await setSetting(db, 'onboarding_completed', 'true');
    } catch (e) {
      console.error('Failed to save onboarding status:', e);
    }
  };

  if (!onboardingChecked) return null;

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
        <Stack.Screen
          name="edit-income/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>

      <OnboardingScreen
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
