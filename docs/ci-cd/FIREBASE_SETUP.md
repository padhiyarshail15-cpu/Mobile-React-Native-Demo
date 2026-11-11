# Firebase App Distribution setup

The `ios distribute` lane uploads the dev IPA to Firebase App Distribution. This is optional and off by default: it needs an iPhone registered to your Apple team, and the default Jenkins build uses the simulator lane instead. These are one-time steps in the Firebase console and Apple Developer account.

## 1. Firebase app

1. In the [Firebase console](https://console.firebase.google.com/), open the project for this app (or create one).
2. Add an iOS app with bundle ID `com.mobile.reactnativedemo.dev` (the dev variant that the lane builds).
3. Copy the **App ID** (format `1:<number>:ios:<hash>`). Store it in Jenkins as the secret text credential `firebase-app-id`.

## 2. Service account for uploads

1. In **Project settings → Service accounts**, or in Google Cloud IAM, create a service account.
2. Grant it the **Firebase App Distribution Admin** role (or the App Distribution Admin role on the project).
3. Create a JSON key for it and download the file.
4. Store the JSON in Jenkins as the secret file credential `firebase-service-account`.
5. Never commit the JSON. `.gitignore` covers `*service-account*.json`.

## 3. Testers

- In **App Distribution → Testers & groups**, create a group named `testers` (the lane default). To use a different group, set `FIREBASE_TESTER_GROUPS` in the Jenkins job.
- Add tester emails to the group.

## 4. Apple signing for the IPA (free team)

The IPA is signed with automatic signing for team `WAP9785ZZA`. Export requires a device registered to the team.

- Connect each test iPhone to the Mac and add it through **Xcode → Window → Devices and Simulators**. Xcode registers it to the free team automatically.
- Free-team limits: up to **3 iPhones**, and each build **expires after 7 days**.
- If the export fails with "Your team has no devices from which to generate a provisioning profile", no device is registered yet. Connect a device and retry.
- Fallback when no device is available: build for the simulator to verify compilation (`xcodebuild -workspace apps/mobile/ios/ReactNativeDemo.xcworkspace -scheme ReactNativeDemo-Dev -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`). A simulator build cannot be distributed.

## 5. Local test of the lane

```sh
cd apps/mobile
export FIREBASE_APP_ID='1:...:ios:...'
export FIREBASE_SERVICE_CREDENTIALS_FILE=/path/to/service-account.json
bundle exec fastlane ios build variant:dev       # IPA in dist/ios/
bundle exec fastlane ios distribute              # build and upload
```
