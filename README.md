# Tuuduu 🤍

**Your day, sorted.**

Tuuduu is a calm, offline-first to-do app built with **React Native**, **Expo**, and **TypeScript**. Tasks stay on your device through AsyncStorage: there is no account, server, or external database.

![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## Features

- **Daily progress**: Animated completion bar, percentage, streak, and detailed stats.
- **Local reminders**: Start, wrap-up, and due notifications with interactive actions and snooze.
- **Focus sessions**: Start, pause, resume, and stop timed focus blocks.
- **Structured tasks**: Notes, subtasks, priority, categories, and recurring schedules.
- **Fast organization**: Search, All / Active / Done filters, and five sort modes.
- **Haptic feedback**: Light impact when checking a task and warning feedback on deletion.
- **Undo and batch cleanup**: Restore a deleted task or clear completed tasks.
- **Themes**: System, light, and dark appearance with a quick header toggle.
- **Guided onboarding**: A polished three-step first-run guide, replayable from Settings.
- **Offline persistence**: All data is stored locally with `@tuuduu_tasks_v1` and related Tuuduu keys.

---

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on a physical iOS or Android device, or press `a` / `i` / `w` for Android Emulator, iOS Simulator, or web. Local notifications and haptics are best verified on a physical device. On Android 14+, enable exact alarms from Tuuduu Settings when precise reminder timing is required.

---

## Checks

```bash
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform android
```

---

## Architecture

```text
Tuuduu/
├── App.tsx                         # Declarative root composition
├── index.ts                        # Expo root registration
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Branding, search, and header actions
│   │   ├── ProgressCard.tsx        # Animated progress and streak summary
│   │   ├── FilterTabs.tsx          # Status filters and sort control
│   │   ├── TaskItem.tsx            # Animated task row and actions
│   │   ├── TaskInput.tsx           # Category chips and quick add input
│   │   ├── EditTaskModal.tsx       # Full task editor sheet
│   │   ├── Checkbox.tsx            # Animated task checkbox
│   │   ├── DateTimeSheet.tsx       # Date/time picker sheet
│   │   ├── EmptyState.tsx          # Contextual empty states
│   │   ├── ErrorBoundary.tsx       # Crash fallback and retry
│   │   ├── FocusBar.tsx            # Focus session controls
│   │   ├── OnboardingFlow.tsx      # Three-step first-run guide
│   │   ├── SettingsControls.tsx    # Reusable toggles and option chips
│   │   ├── SettingsSheet.tsx       # Settings sheet
│   │   ├── Sheet.tsx               # Shared animated bottom sheet
│   │   ├── StatsSheet.tsx          # Progress breakdown
│   │   └── UndoSnackbar.tsx        # Delete undo prompt
│   ├── constants/
│   │   ├── index.ts                # Storage keys, options, starter tasks
│   │   └── theme.ts                # Colors, spacing, typography, styles
│   ├── hooks/
│   │   ├── useClock.ts             # Shared throttled clock
│   │   └── useTasks.ts             # Task state, persistence, filtering, stats
│   ├── services/
│   │   ├── haptics.ts              # Haptic feedback service
│   │   └── notifications.ts        # Permissions, scheduling, actions
│   ├── types/
│   │   └── task.ts                 # Task, Category, FilterType, CategoryType
│   └── utils/
│       └── taskUtils.ts            # Pure task/date helpers
├── __tests__/                      # Jest unit tests
├── .github/workflows/ci.yml        # Lint, typecheck, tests, doctor, export
├── app.json                        # Expo config and Tuuduu branding
├── package.json                    # Dependencies and scripts
└── assets/                         # App icons and splash screens
```

---

## Engineering trade-offs & architecture decisions

### Client-side offline-first storage over an external database

Tuuduu intentionally uses AsyncStorage instead of a remote database or a heavy state-management library.

- **Zero latency**: Every task mutation updates local React state immediately. There is no network round trip, loading spinner, or optimistic-update reconciliation layer.
- **Privacy-first**: Tasks, notes, schedules, and settings never leave the device. No account, analytics identity, or server-side task store is required.
- **Offline resilience**: The app works with no connectivity, which is the normal state for a quick personal task manager.
- **Simpler architecture**: A single typed `useTasks` hook owns state, filtering, derived statistics, undo behavior, and persistence. Components remain presentational and composable.
- **Appropriate scope**: AsyncStorage is a good fit for a compact personal task list. If Tuuduu later needs sync, shared lists, or very large datasets, a local SQLite store plus a sync service would be the next step—but that complexity is not justified for the current product.

### Strict TypeScript boundaries

`Task`, `Category`, `FilterType`, and `CategoryType` are defined once in `src/types/task.ts`. Storage parsing normalizes untrusted persisted data at the boundary, so components receive complete, predictable models. The strict compiler configuration catches regressions before runtime.

### Throttled clocks

The app uses a 15-second clock for overdue calculations and a 1-second clock only while a focus session is active. This keeps date-sensitive UI accurate without re-rendering the whole screen every second.

### Expo-native capabilities

Notifications and haptics use Expo SDK modules. No native projects are checked in; native behavior is configured through `app.json` and Expo config plugins.

---

## Branding

Tuuduu — **Your day, sorted. 🤍**

All app-facing copy, app configuration, storage keys, notification channels, and identifiers use Tuuduu branding.
