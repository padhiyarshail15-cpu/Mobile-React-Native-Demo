# Jenkins setup

This is the one-time setup for the Jenkins job that builds this repo. The steps are done in the Jenkins UI, not in the repo.

## 1. Jenkins home and URL

- Jenkins is the existing install in `~/.jenkins`. No new instance is needed.
- Public URL: `https://headcount-doctrine-dispersed.ngrok-free.dev/`. It's the same ngrok tunnel that Tech-Service uses, so keep the tunnel running.

## 2. Credentials

Add these in **Manage Jenkins → Credentials → (global)**. Do not reuse or edit the Tech-Service IDs.

| ID                             | Kind                   | Value                                                                                        |
| ------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------- |
| `github-pat-mobile`            | Username with password | GitHub user and a PAT scoped to this repo (see below)                                        |
| `github-webhook-secret-mobile` | Secret text            | Optional. Not used while the global GitHub shared secret is empty (see the webhook section)  |
| `firebase-service-account`     | Secret file            | Service-account JSON, used by both platforms (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))  |
| `firebase-android-app-id`      | Secret text            | Firebase Android app ID, for `DISTRIBUTE_ANDROID`                                            |
| `firebase-ios-app-id`          | Secret text            | Firebase iOS app ID, for `DISTRIBUTE_IOS`                                                    |
| `android-release-keystore`     | Secret file            | Release keystore (`.jks`), for `DISTRIBUTE_ANDROID`. Keep a backup; losing it blocks updates |
| `android-keystore-password`    | Secret text            | Password of the release keystore                                                             |
| `android-key-alias`            | Secret text            | Key alias inside the release keystore                                                        |
| `android-key-password`         | Secret text            | Password of that key                                                                         |

PAT permissions: use a fine-grained token limited to this repo with Contents (read), Metadata (read), Commit statuses (read and write), and Pull requests (read). If **Scan Repository Now** fails with a 403 or "could not find repository", use a classic token with only the `repo` scope instead.

The `firebase-*` and `android-*` release credentials are only needed by the manual distribute stages, so you can add them later. A build that doesn't tick a `DISTRIBUTE_*` parameter never reads them. Builds on `main` and `BUILD_ANDROID` runs use the debug key and don't need the `android-*` credentials.

## 3. Multibranch Pipeline job

1. **New Item** → name `Mobile-React-Native-Demo` → **Multibranch Pipeline**.
2. **Branch Sources** → **GitHub** → repository `padhiyarshail15-cpu/Mobile-React-Native-Demo`, credentials `github-pat-mobile`.
3. **Build Configuration** → mode **by Jenkinsfile**, script path `Jenkinsfile`.
4. **Scan Repository Triggers**: tick **Periodically if not otherwise run** and set the interval to 1 minute, the same as the Tech-Service job. Builds start by polling even if the webhook isn't working.
5. Save, then click **Scan Repository Now**. Jenkins finds the branches and pull requests that contain a `Jenkinsfile`.

## 4. GitHub webhook

The webhook makes builds start immediately instead of waiting for the next poll. Like Tech-Service, leave **Manage Jenkins → System → GitHub → Advanced → Shared secret** empty. With no shared secret configured, Jenkins doesn't check the webhook signature.

On the repo (**Settings → Webhooks → Add webhook**):

- **Payload URL:** `https://headcount-doctrine-dispersed.ngrok-free.dev/github-webhook/`
- **Content type:** `application/json`
- **Secret:** leave empty
- **Events:** push and pull requests

Start Jenkins and ngrok first, then add the webhook. Check **Recent Deliveries** on the webhook for a 200 response.

## 5. Mac build agent

- Jenkins runs as your macOS user (the same user as your terminal), so it finds `~/.nvm`, the Ruby gems, and Xcode.
- **iOS stages:** need Xcode. The simulator build needs no Apple account or device.
- **Android stages:** need the Android SDK and a JDK (17 or newer, Java 21 is installed).
  - Install Android Studio, or only the command-line tools, so the SDK is at `~/Library/Android/sdk`. The pipeline uses that path unless `ANDROID_HOME` is set on the Jenkins node.
  - In the SDK Manager install: **Android 37.0** (`platforms;android-37.0`), **Build-Tools 37.0.0**, **Platform-Tools**, and **NDK 27.1.12297006** (the versions are set in `apps/mobile/android/build.gradle`). On this Mac they are already installed under `~/Library/Android/sdk`.
  - Accept the licenses once: `yes | ~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --licenses`.
  - The first Android build downloads Gradle and compiles native code, which takes 10 to 25 minutes. Later builds are faster.
- **iOS Firebase upload only:** sign Xcode in to the Apple ID for team `WAP9785ZZA` (**Xcode → Settings → Accounts**) and register each test iPhone through Xcode (**Window → Devices and Simulators**). Free teams allow up to 3 iPhones and builds expire after 7 days.
- Ruby is the system Ruby (2.6.10). Run `cd apps/mobile && bundle install` once on the agent to install fastlane and the Firebase plugin.

## 6. Running builds

- Push to any branch: the Checks stage runs (format, lint, typecheck, tests). JUnit results appear in the job's **Test Result** page.
- `main`: also builds the Android APK and the iOS simulator app, and archives `ReactNativeDemo-dev.apk` and `ReactNativeDemo-dev-simulator.zip`. Nothing is published.
- **Build with Parameters** on any branch (the parameters appear after the branch has built once):

| Parameter            | Effect                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `BUILD_ANDROID`      | Build and archive the Android APK, without publishing                                     |
| `BUILD_IOS`          | Build and archive the iOS simulator zip, without publishing                               |
| `DISTRIBUTE_ANDROID` | Build the release-signed prod APK, upload it to Firebase App Distribution, and archive it |
| `DISTRIBUTE_IOS`     | Build a signed dev IPA, upload it to Firebase, and archive it. Needs a registered iPhone  |

- **Publishing is manual only.** The `DISTRIBUTE_*` stages run only when the parameter is ticked **and** a person started the build (`triggeredBy 'UserIdCause'`). Webhook pushes, branch scans, and `main` builds can never publish.
