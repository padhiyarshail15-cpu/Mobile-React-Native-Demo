# CI/CD plan: Jenkins + Fastlane

## Goal

- Run format, lint, typecheck and Jest on every branch, with JUnit results shown in Jenkins.
- On `main` or from Build with Parameters, build the iOS app for the simulator with Fastlane (no signing or device needed) and archive the zipped `.app`.
- Optionally (`DISTRIBUTE_FIREBASE`), build a signed development IPA and upload it to Firebase App Distribution. This needs an iPhone registered to the Apple team, so it is off by default.

## Decisions

- **Ruby:** the system Ruby (2.6.10) is used. Homebrew, rbenv and `.ruby-version` are not needed. `apps/mobile/Gemfile` already requires `ruby >= 2.6.10`, and fastlane 2.229.0 installs on it.
- **Jenkins:** reuse the existing `~/.jenkins` home and the same ngrok URL (`https://headcount-doctrine-dispersed.ngrok-free.dev/`).
- **GitHub credentials:** new IDs, `github-pat-mobile` and `github-webhook-secret-mobile`. The Tech-Service IDs `github-pat` and `github-webhook-secret` are not touched.
- **Signing:** automatic signing with the free team `WAP9785ZZA`. The dev IPA uses the Debug configuration.
- **Limits:** free-team builds expire after 7 days and install only on up to 3 iPhones registered through Xcode.

## Repo changes

1. **Fastlane** (`apps/mobile/fastlane/`)
   - `ios build variant:dev|prod` builds an IPA into `apps/mobile/dist/ios/`.
     - `dev`: scheme `ReactNativeDemo-Dev`, Debug, `com.mobile.reactnativedemo.dev`.
     - `prod`: scheme `ReactNativeDemo-Prod`, Release, `com.mobile.reactnativedemo`.
   - `ios simulator variant:dev|prod` builds for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO` and zips the `.app` to `apps/mobile/dist/ios/ReactNativeDemo-<variant>-simulator.zip`. No Apple account or device is needed.
   - `ios distribute` runs the dev build and uploads it with `firebase_app_distribution`. That action comes from the `fastlane-plugin-firebase_app_distribution` plugin (`fastlane/Pluginfile`, loaded from the Gemfile), so run `bundle install` in `apps/mobile` before using it.
2. **Jest results:** `jest-junit` is a devDependency of `@repo/config-jest`. The reporter is enabled only when `CI` is set, and it writes `reports/junit.xml` in each package. `reports/**` is in turbo's `test` outputs.
3. **`Jenkinsfile`** (repo root), in the same style as Tech-Service
   - `Install`, then in parallel: Format Check, Lint, Typecheck, Unit Tests (JUnit).
   - `iOS Simulator Build` runs only when `branch 'main'` or when `BUILD_IOS` is set. It archives the simulator zip with each build.
   - `Firebase Distribution` runs only when `DISTRIBUTE_FIREBASE` is set. It binds the Firebase credentials with `withCredentials`, so other builds never need them, and archives the IPA.
4. **`.gitignore`:** signing files, service-account JSON, and `reports/`.
5. **README:** CI/CD section that links to these docs.

## Gate result

- `bundle exec fastlane ios build variant:dev` reached code signing and failed. The free team has no registered device, so Apple cannot generate a provisioning profile.
- Fallback used: `bundle exec fastlane ios simulator variant:dev` succeeds and produces `dist/ios/ReactNativeDemo-dev-simulator.zip`. This is the default iOS stage in Jenkins.
- Export to a device IPA (and the Firebase upload) needs an iPhone registered through Xcode for team `WAP9785ZZA`. Until one is registered, leave `DISTRIBUTE_FIREBASE` off.

## Testing

- Tests use Jest with [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) (`@testing-library/react-native` v13, in `apps/mobile` and `packages/ui`). Importing it also registers the built-in matchers such as `toBeOnTheScreen` and `toBeDisabled`.
- Tests query by role, text, and testID, and avoid asserting on style internals.
- `SafeAreaProvider` renders nothing until native insets arrive. Tests that render it use `react-native-safe-area-context/jest/mock` (see `apps/mobile/__tests__/App.test.tsx`).
- Run `yarn test`, or `yarn test:coverage` from the repo root.

## Jenkins wiring (operational, outside the repo)

- One Multibranch Pipeline job for this repo, scanning branches and the root `Jenkinsfile`.
- One GitHub webhook: `https://headcount-doctrine-dispersed.ngrok-free.dev/github-webhook/` (JSON content type), using the `github-webhook-secret-mobile` secret.
- See [JENKINS_SETUP.md](./JENKINS_SETUP.md) and [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).
