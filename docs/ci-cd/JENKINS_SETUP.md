# Jenkins setup

This is the one-time setup for the Jenkins job that builds this repo. The steps are done in the Jenkins UI, not in the repo.

## 1. Jenkins home and URL

- Jenkins is the existing install in `~/.jenkins`. No new instance is needed.
- Public URL: `https://headcount-doctrine-dispersed.ngrok-free.dev/`. It's the same ngrok tunnel that Tech-Service uses, so keep the tunnel running.

## 2. Credentials

Add these in **Manage Jenkins → Credentials → (global)**. Do not reuse or edit the Tech-Service IDs.

| ID                             | Kind                   | Value                                                                      |
| ------------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| `github-pat-mobile`            | Username with password | GitHub user and a PAT with repo read access                                |
| `github-webhook-secret-mobile` | Secret text            | Random string, also set on the GitHub webhook                              |
| `firebase-app-id`              | Secret text            | Firebase Android/iOS app ID (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)) |
| `firebase-service-account`     | Secret file            | Service-account JSON (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))        |

The two `firebase-*` credentials are only needed for the optional `DISTRIBUTE_FIREBASE` stage, so you can add them later.

## 3. Multibranch Pipeline job

1. **New Item** → name `Mobile-React-Native-Demo` → **Multibranch Pipeline**.
2. **Branch Sources** → **GitHub** → repository `padhiyarshail15-cpu/Mobile-React-Native-Demo`, credentials `github-pat-mobile`.
3. **Build Configuration** → mode **by Jenkinsfile**, script path `Jenkinsfile`.
4. **Scan Repository Triggers**: enable periodic scan as a fallback (for example, 1 day).
5. Save. Jenkins scans the branches and runs the root `Jenkinsfile`.

## 4. GitHub webhook

On the repo (**Settings → Webhooks → Add webhook**):

- **Payload URL:** `https://headcount-doctrine-dispersed.ngrok-free.dev/github-webhook/`
- **Content type:** `application/json`
- **Secret:** the same value as the `github-webhook-secret-mobile` credential
- **Events:** push and pull requests

## 5. Mac build agent

- The iOS stages run on the Jenkins Mac with Xcode installed. The simulator build needs no Apple account or device.
- Only for Firebase distribution: sign Xcode in to the Apple ID for team `WAP9785ZZA` (**Xcode → Settings → Accounts**) and register each test iPhone through Xcode (**Window → Devices and Simulators**). Free teams allow up to 3 iPhones and builds expire after 7 days.
- Ruby is the system Ruby (2.6.10). Run `cd apps/mobile && bundle install` once on the agent to install fastlane.

## 6. Running builds

- Push to any branch: the Checks stage runs (format, lint, typecheck, tests). JUnit results appear in the job's **Test Result** page.
- `main`, or **Build with Parameters** with `BUILD_IOS` checked: also builds the iOS simulator app and archives `ReactNativeDemo-dev-simulator.zip` in the build's artifacts.
- **Build with Parameters** with `DISTRIBUTE_FIREBASE` checked: also builds a signed dev IPA, uploads it to Firebase App Distribution, and archives the `.ipa`. This needs a registered iPhone and the Firebase credentials. Leave it off until then.
