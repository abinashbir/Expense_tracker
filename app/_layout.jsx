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

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
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
