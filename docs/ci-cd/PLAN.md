# CI/CD plan: Jenkins + Fastlane

## Goal

- Run format, lint, typecheck and Jest on every branch, with JUnit results shown in Jenkins.
- On `main` or from Build with Parameters, build the Android APK and the iOS simulator app with Fastlane (no signing keys, accounts, or devices needed) and archive them.
- Publishing to Firebase App Distribution is manual only. A person starts a build with Build with Parameters and ticks `DISTRIBUTE_ANDROID` and/or `DISTRIBUTE_IOS`. Nothing publishes from pushes, PRs, or `main`. iOS needs an iPhone registered to the Apple team, so it is off until then.

## Decisions

- **Ruby:** the system Ruby (2.6.10) is used. Homebrew, rbenv and `.ruby-version` are not needed. `apps/mobile/Gemfile` already requires `ruby >= 2.6.10`, and fastlane 2.229.0 installs on it.
- **Jenkins:** reuse the existing `~/.jenkins` home and the same ngrok URL (`https://headcount-doctrine-dispersed.ngrok-free.dev/`).
- **GitHub credentials:** new IDs, `github-pat-mobile` and `github-webhook-secret-mobile` (optional, not used while the global shared secret is empty). The Tech-Service IDs `github-pat` and `github-webhook-secret` are not touched.
- **Signing:** automatic signing with the free team `WAP9785ZZA`. The dev IPA uses the Debug configuration.
- **Limits:** free-team builds expire after 7 days and install only on up to 3 iPhones registered through Xcode.

## Repo changes

1. **Fastlane** (`apps/mobile/fastlane/`)
   - `ios build variant:dev|prod` builds an IPA into `apps/mobile/dist/ios/`.
     - `dev`: scheme `ReactNativeDemo-Dev`, Debug, `com.mobile.reactnativedemo.dev`.
     - `prod`: scheme `ReactNativeDemo-Prod`, Release, `com.mobile.reactnativedemo`.
   - `ios simulator variant:dev|prod` builds for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO` and zips the `.app` to `apps/mobile/dist/ios/ReactNativeDemo-<variant>-simulator.zip`. No Apple account or device is needed.
   - `ios distribute` runs the dev build and uploads it with `firebase_app_distribution`. That action comes from the `fastlane-plugin-firebase_app_distribution` plugin (`fastlane/Pluginfile`, loaded from the Gemfile), so run `bundle install` in `apps/mobile` before using it.
   - `android build variant:dev|prod` runs `assembleRelease` and copies the APK to `apps/mobile/dist/android/ReactNativeDemo-<variant>.apk`. It uses the existing debug keystore, so testers can install it, and it bundles the JS so it runs without Metro. `ENVFILE` selects `.env.development` or `.env.production`. Only the `arm64-v8a` and `x86_64` ABIs are built, to save time.
   - `android distribute` runs the dev APK build and uploads it with the same plugin.
   - Android env: `android/app/build.gradle` now applies `react-native-config`'s `dotenv.gradle` (Debug uses `.env.development`, Release uses `.env.production`), so the app no longer throws on a missing `APP_ENV`.
2. **Jest results:** `jest-junit` is a devDependency of `@repo/config-jest`. The reporter is enabled only when `CI` is set, and it writes `reports/junit.xml` in each package. `reports/**` is in turbo's `test` outputs.
3. **`Jenkinsfile`** (repo root), in the same style as Tech-Service
   - `Install`, then in parallel: Format Check, Lint, Typecheck, Unit Tests (JUnit).
   - `Android APK Build` and `iOS Simulator Build` run only when `branch 'main'` or when `BUILD_ANDROID` / `BUILD_IOS` is set. They archive the APK and the simulator zip.
   - `Android Firebase Distribution` and `iOS Firebase Distribution` run only when `DISTRIBUTE_ANDROID` / `DISTRIBUTE_IOS` is ticked **and** the build was started by a person (`triggeredBy 'UserIdCause'`). They bind the Firebase credentials with `withCredentials`, so other builds never need them, and archive the APK or IPA.
4. **`.gitignore`:** signing files, service-account JSON, and `reports/`.
5. **README:** CI/CD section that links to these docs.

## Gate result

- `bundle exec fastlane ios build variant:dev` reached code signing and failed. The free team has no registered device, so Apple cannot generate a provisioning profile.
- Fallback used: `bundle exec fastlane ios simulator variant:dev` succeeds and produces `dist/ios/ReactNativeDemo-dev-simulator.zip`. This is the default iOS stage in Jenkins.
- Export to a device IPA (and the iOS Firebase upload) needs an iPhone registered through Xcode for team `WAP9785ZZA`. Until one is registered, leave `DISTRIBUTE_IOS` off. Android distribution has no such limit.

## Testing

- Tests use Jest with [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) (`@testing-library/react-native` v13, in `apps/mobile` and `packages/ui`). Importing it also registers the built-in matchers such as `toBeOnTheScreen` and `toBeDisabled`.
- Tests query by role, text, and testID, and avoid asserting on style internals.
- `SafeAreaProvider` renders nothing until native insets arrive. Tests that render it use `react-native-safe-area-context/jest/mock` (see `apps/mobile/__tests__/App.test.tsx`).
- Run `yarn test`, or `yarn test:coverage` from the repo root.

## Jenkins wiring (operational, outside the repo)

- One Multibranch Pipeline job for this repo, scanning branches and the root `Jenkinsfile`.
- One GitHub webhook: `https://headcount-doctrine-dispersed.ngrok-free.dev/github-webhook/` (JSON content type), with no secret. The global GitHub shared secret in Jenkins stays empty, as for Tech-Service, and the job also polls every minute.
- See [JENKINS_SETUP.md](./JENKINS_SETUP.md) and [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).
