@../../CLAUDE.md

# Golf Mobile — Expo React Native App

## Tech Stack
- Expo SDK 55, React Native 0.83.2, React 19.2.0
- Expo Router (file-based), React Navigation 7
- Zustand 5.0.12 + AsyncStorage
- expo-secure-store (auth tokens)
- react-native-reanimated 4, react-native-gesture-handler 2.30
- date-fns 4, uuid 13

## Project Structure
```
golf-mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Login, Register
│   └── (tabs)/            # Bottom tab navigator
│       ├── index.tsx      # Home/dashboard
│       ├── stats.tsx      # Stats summary
│       ├── settings.tsx   # Settings
│       ├── rounds/        # Rounds list, new, [id] detail
│       ├── live/          # Live events hub + [eventId]/*
│       └── insights/      # SG, dispersion, goals, practice
├── src/
│   ├── components/        # RN components (mirrors web)
│   ├── stores/            # Zustand + AsyncStorage
│   ├── hooks/             # Same hooks as web
│   ├── lib/               # Same utils/stats as web
│   └── theme/             # colors.ts, spacing.ts
└── assets/                # Icons, splash screens
```

## Screen Routes

### Auth Stack
- `(auth)/login.tsx`, `(auth)/register.tsx`

### Tab Navigator
- `(tabs)/index.tsx` — Home dashboard
- `(tabs)/stats.tsx` — Stats overview
- `(tabs)/settings.tsx` — User settings

### Rounds Stack (`(tabs)/rounds/`)
- `index.tsx` — Rounds list
- `new.tsx` — Round entry wizard
- `[id].tsx` — Round detail

### Live Stack (`(tabs)/live/`)
- `index.tsx` — Events hub
- `[eventId]/index.tsx` — Event detail
- `[eventId]/leaderboard.tsx` — Leaderboard
- `[eventId]/score.tsx` — Score entry
- `[eventId]/scorecard/[playerId].tsx` — Player scorecard

### Insights Stack (`(tabs)/insights/`)
- `index.tsx` — Insights hub
- `strokes-gained.tsx`, `dispersion.tsx`, `goals.tsx`, `practice.tsx`

## Components (`src/components/`)
Mirrors web components in React Native:
- **Live**: `CreateEventForm`, `EventLobby`, `JoinEventForm`, `LeaderboardList`, `PlayerScorecard`, `ScoreEntryForm`, `HoleScoreInput`
- **Round entry**: `RoundEntryWizard`, `EntryModeSelector`, `HoleEntryCard`, `HoleSummaryCard`, `ShotFlowWizard`, `ShotEntryCard`, `ShotStepCard`, `ShotFlowHeader`, `ShotMissInput`, `PuttStepCard`, `PuttMissInput`, `DriverMissInput`
- **UI**: `Button`, `Card`, `NumberStepper`, `PillSelector`, `ProgressBar`, `ScoreIndicator`, `TextInput`, `Toast`
- **Other**: `SyncProvider`

## Stores (`src/stores/`)
Same interfaces as web, but use AsyncStorage instead of localStorage:
- `auth-store.ts` — `useAuthStore` (token + user, persisted in SecureStore)
- `round-store.ts` — `useRoundStore` (same as web)
- `course-store.ts` — `useCourseStore` (same as web)
- `goal-store.ts` — `useGoalStore` (same as web)

## API Communication
- `src/lib/api-config.ts` — base URL config (points to Railway-deployed web API)
- `src/lib/sync.ts` — same fire-and-forget sync as web
- `src/lib/live-api.ts` — live event API calls
- All API calls go to the deployed Next.js backend, not local

## Key Differences from Web
1. **No server-side rendering** — all client-side
2. **AsyncStorage** instead of localStorage
3. **expo-secure-store** for auth tokens (not cookies)
4. **Custom RN components** instead of Shadcn/Tailwind
5. **Theme system** via `src/theme/` (colors, spacing tokens)
6. **No API routes** — consumes web app's API
7. **Path alias**: `@/*` → `./src/*` (different from web's `./`)

## Config
- `app.json` — Expo config (scheme: `golfmobile`)
- `tsconfig.json` — extends `expo/tsconfig.base`
- `Dockerfile` — for containerized builds
