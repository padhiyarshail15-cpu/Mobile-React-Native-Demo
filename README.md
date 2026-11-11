This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Environment variables (iOS)

Environment config is handled by [`react-native-config`](https://github.com/react-native-config/react-native-config). Android is not wired up yet.

### Env files

Env files live in `apps/mobile/` and are committed: `.env.development` and `.env.production`. To add or change a value, edit those files directly.

| Variable           | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `APP_ENV`          | `development` or `production`                |
| `APP_DISPLAY_NAME` | Home-screen app name (`CFBundleDisplayName`) |
| `API_URL`          | Base URL of the backend API                  |

> **Never put secrets in env files** — values are embedded in the app binary and can be extracted.

### Which file is used

The env file is chosen per Xcode **build configuration** in `apps/mobile/ios/Podfile` (`ENVFILES` map):

| Build configuration | Env file           | Scheme                                               | Command         |
| ------------------- | ------------------ | ---------------------------------------------------- | --------------- |
| `Debug`             | `.env.development` | `ReactNativeDemo-Dev` / `ReactNativeDemo` (Run)      | `yarn ios:dev`  |
| `Release`           | `.env.production`  | `ReactNativeDemo-Prod` / `ReactNativeDemo` (Archive) | `yarn ios:prod` |

Search the Xcode build log for `ENVFILE=` to confirm which file was used. `pod install` fails if a mapped env file is missing, and the app throws at startup if a required variable is empty.

### Using values

- **JS/TS:** import the typed wrapper instead of `react-native-config` directly:

  ```ts
  import { env } from '~/config/env';

  fetch(`${env.apiUrl}/health`);
  ```

- **Info.plist:** `INFOPLIST_PREPROCESS` is enabled, so any env key can be used as a bare macro (e.g. `<string>APP_DISPLAY_NAME</string>`). Avoid env keys that collide with other tokens in `Info.plist`.
- **Native (Obj-C):** `#import "RNCConfig.h"` then `[RNCConfig envFor:@"API_URL"]`.

### Adding a variable

1. Add it to both `.env.development` and `.env.production`.
2. Add it to `NativeConfig` in `apps/mobile/src/types/react-native-config.d.ts`.
3. Expose it from `apps/mobile/src/config/env.ts` and the Jest mock in `apps/mobile/__mocks__/react-native-config.js`.
4. Rebuild the native app (`yarn ios:dev`). Reloading Metro is **not** enough; if Info.plist values look stale, clean the build folder (Xcode ▸ Product ▸ Clean Build Folder).

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
