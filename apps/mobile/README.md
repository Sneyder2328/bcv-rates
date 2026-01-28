# BCV Rates Mobile App

React Native mobile app for BCV exchange rates, part of the bcv-rates monorepo.

## Prerequisites

- Node.js >= 20
- pnpm (workspace package manager)
- [React Native development environment](https://reactnative.dev/docs/set-up-your-environment)
  - **iOS**: Xcode, CocoaPods, Ruby bundler
  - **Android**: Android Studio, JDK 17+

## Installation

From the **monorepo root**:

```sh
# Install all dependencies
pnpm install
```

### Native Dependencies Setup

After `pnpm install`, you must link native dependencies:

#### iOS

```sh
cd apps/mobile/ios
bundle install          # First time only - installs CocoaPods
bundle exec pod install # Every time native deps change
```

#### Android

Native dependencies auto-link on Android. If you encounter issues:

```sh
cd apps/mobile/android
./gradlew clean
```

## Development

From the **monorepo root**:

```sh
# Start Metro bundler
pnpm --filter @bcv-rates/mobile dev

# Or from apps/mobile directory
pnpm dev
```

### Running on Device/Simulator

In a separate terminal:

```sh
# iOS
pnpm --filter @bcv-rates/mobile ios

# Android
pnpm --filter @bcv-rates/mobile android
```

Or from `apps/mobile`:

```sh
pnpm ios
pnpm android
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── App.tsx                 # Root app component
│   ├── components/
│   │   └── primitives/         # UI primitives (Button, Card, Input, etc.)
│   ├── icons/                  # Icon exports from lucide-react-native
│   ├── navigation/
│   │   └── RootNavigator.tsx   # Navigation stack configuration
│   ├── providers/              # Context providers (Auth, tRPC)
│   └── screens/                # Screen components
├── android/                    # Android native project
├── ios/                        # iOS native project
└── App.tsx                     # Entry point (re-exports src/App.tsx)
```

## Available Scripts

| Script          | Description                       |
| --------------- | --------------------------------- |
| `pnpm dev`      | Start Metro bundler               |
| `pnpm ios`      | Build and run on iOS              |
| `pnpm android`  | Build and run on Android          |
| `pnpm lint`     | Run Biome linter                  |
| `pnpm lint:fix` | Fix lint issues automatically     |
| `pnpm type-check` | Run TypeScript type checking    |
| `pnpm test`     | Run Jest tests                    |

## Phase 2 Status

This is Phase 2 of the mobile app implementation:

- [x] Navigation setup (@react-navigation/native-stack)
- [x] Provider stubs (AuthProvider, TrpcProvider)
- [x] UI primitives (Card, Button, Input, Label, SectionDivider, Banner)
- [x] Icons (lucide-react-native + react-native-svg)
- [x] Screen placeholders (Home, Settings, History, Auth modal)
- [x] Toast notifications (react-native-toast-message)

### TODOs for Native Setup

After cloning or updating dependencies:

1. **iOS**: Run `cd ios && bundle exec pod install`
2. **Android**: Native deps auto-link; run `./gradlew clean` if issues occur
3. **react-native-svg**: Required by lucide-react-native, needs native linking
4. **react-native-screens**: Required by @react-navigation, needs native linking

## Troubleshooting

### Metro bundler issues

```sh
# Clear Metro cache
pnpm dev --reset-cache
```

### iOS build issues

```sh
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install --repo-update
```

### Android build issues

```sh
cd android
./gradlew clean
```

## Learn More

- [React Native docs](https://reactnative.dev/docs/getting-started)
- [React Navigation docs](https://reactnavigation.org/docs/getting-started)
- [Lucide Icons](https://lucide.dev/guide/packages/lucide-react-native)
