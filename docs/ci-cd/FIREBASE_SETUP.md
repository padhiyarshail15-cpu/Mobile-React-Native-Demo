# Firebase App Distribution setup

Firebase App Distribution sends test builds to testers by email. Publishing is **manual only**: a build is uploaded only when someone starts it from Jenkins with **Build with Parameters** and ticks `DISTRIBUTE_ANDROID` and/or `DISTRIBUTE_IOS`. Pushes, pull requests, and `main` builds never upload.

|         | Lane                               | Jenkins parameter    | Needs                                              |
| ------- | ---------------------------------- | -------------------- | -------------------------------------------------- |
| Android | `android distribute` (release APK) | `DISTRIBUTE_ANDROID` | Firebase + Android SDK. No fee, no physical device |
| iOS     | `ios distribute` (signed dev IPA)  | `DISTRIBUTE_IOS`     | Firebase + an iPhone registered to the Apple team  |

Start with Android. iOS is optional and blocked until a device is registered (see section 6).

## 1. Firebase project (once, both platforms)

1. Open the [Firebase console](https://console.firebase.google.com/) and create a project (Analytics can stay off).
2. Go to **Build → App Distribution** and click **Get started**.

## 2. Android app in Firebase

1. **Project settings → General → Add app → Android**.
2. Package name: `com.reactnativedemo` (it must match `applicationId` in `apps/mobile/android/app/build.gradle`). Skip the `google-services.json` step: App Distribution doesn't need it.
3. Copy the **App ID** (format `1:<number>:android:<hash>`). Store it in Jenkins as the secret text credential `firebase-android-app-id`.

## 3. Service account for uploads (once, both platforms)

1. In **Project settings → Service accounts**, open the linked Google Cloud project and create a service account (**IAM & Admin → Service Accounts**).
2. In **IAM**, give it the role **Firebase App Distribution Admin**.
3. Open the service account → **Keys → Add key → JSON** and download the file.
4. Store the JSON in Jenkins as the secret file credential `firebase-service-account`.
5. Never commit the JSON. `.gitignore` covers `*service-account*.json`.
6. If the upload fails with a permission or API error, enable the **Firebase App Distribution API** in the Google Cloud console for this project.

## 4. Testers

- **App Distribution → Testers & groups**: create a group with the alias `testers` (the lane default). To use another group, set the `FIREBASE_TESTER_GROUPS` environment variable on the Jenkins job.
- Add tester email addresses to the group. Each tester gets an invite email the first time.
- Testers open the email link on an Android phone, install the **Firebase App Tester** app (or the web link), and install the build. They need to allow installs from this source.
- Without a physical phone, test with the Android Studio emulator: sign in to the Firebase App Tester or download the APK from the link, and install it.

## 5. Local test of the Android lane

```sh
cd apps/mobile
bundle install
export ANDROID_HOME=$HOME/Library/Android/sdk
export FIREBASE_ANDROID_APP_ID='1:...:android:...'
export FIREBASE_SERVICE_CREDENTIALS_FILE=/path/to/service-account.json
bundle exec fastlane android build variant:dev       # APK in dist/android/
bundle exec fastlane android distribute              # build and upload
```

The build is a **release** APK signed with the project's debug keystore, so it runs without Metro and testers can install it. For a real store release you would need your own keystore (see the React Native "signed APK" guide).

## 6. iOS (optional, needs a registered iPhone)

The IPA is signed with automatic signing for team `WAP9785ZZA` and exported as a development build. iOS only installs it on iPhones that are in the provisioning profile.

- Free team: only iPhones plugged into your Mac and added through **Xcode → Window → Devices and Simulators** can be registered. Up to **3 iPhones**, and each build **expires after 7 days**. You cannot add a tester's iPhone by UDID.
- Paid Apple Developer Program: you can register testers' UDIDs and use an ad hoc build. This needs a lane change (`ad-hoc` export method and your paid team ID).
- If the export fails with "Your team has no devices from which to generate a provisioning profile", no device is registered yet.
- Add an iOS app in Firebase with bundle ID `com.mobile.reactnativedemo.dev` and store its App ID (`1:<number>:ios:<hash>`) in Jenkins as the secret text credential `firebase-ios-app-id`.
- Fallback with no device: the simulator lane (`bundle exec fastlane ios simulator variant:dev`). A simulator build cannot be distributed.

```sh
cd apps/mobile
export FIREBASE_IOS_APP_ID='1:...:ios:...'
export FIREBASE_SERVICE_CREDENTIALS_FILE=/path/to/service-account.json
bundle exec fastlane ios build variant:dev       # IPA in dist/ios/
bundle exec fastlane ios distribute              # build and upload
```
