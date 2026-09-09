import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '../db/database';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ExpenseProvider, useExpenses } from '../context/ExpenseContext';
import OnboardingScreen from '../components/OnboardingScreen';
import { getSettings, setSetting } from '../db/queries';
import { useSQLiteContext } from 'expo-sqlite';

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
        console.error('Failed to check onboarding status:', e);
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
      </Stack>

      <OnboardingScreen
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
