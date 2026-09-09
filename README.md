# ExpenseTracker

A clean, modern expense tracking app built with React Native and Expo. Track your daily spending, set budgets, visualize trends, and stay on top of your finances — all offline with local SQLite storage.

## Features

- **Add & Edit Expenses** — Quick entry with amount, category, date, and notes
- **Category System** — Predefined categories with custom icons and colors
- **Budget Tracking** — Set monthly budgets and monitor progress with a visual progress bar
- **Statistics & Charts** — Pie chart and bar chart views to analyze spending patterns
- **Filter & Search** — Filter expenses by date range, category, or amount
- **CSV Export** — Export your expense data as a CSV file for external use
- **Database Backup** — Backup and restore your SQLite database
- **Daily Reminders** — Optional push notifications to remind you to log expenses
- **Haptic Feedback** — Subtle tactile feedback for a polished feel
- **Dark Mode** — Automatic dark/light theme based on system preference
- **Onboarding** — Guided introduction for first-time users
- **Fully Offline** — All data stored locally on your device using SQLite

## Tech Stack

- **React Native** with **Expo SDK 57**
- **Expo Router** for file-based navigation
- **Expo SQLite** for local database storage
- **React Native Gifted Charts** for data visualization
- **React Native Reanimated** for smooth animations

## Download

Download the latest APK from the [GitHub Releases](https://github.com/abinashbir/Expense_tracker/releases) page.

## Build From Source

```bash
# Clone the repository
git clone https://github.com/abinashbir/Expense_tracker.git
cd Expense_tracker

# Install dependencies
npm install

# Start the development server
npx expo start

# Build APK (requires EAS CLI)
npx expo run:android
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
