# Jenkins setup

This is the one-time setup for the Jenkins job that builds this repo. The steps are done in the Jenkins UI, not in the repo.

## 1. Jenkins home and URL

- Jenkins is the existing install in `~/.jenkins`. No new instance is needed.
- Public URL: `https://headcount-doctrine-dispersed.ngrok-free.dev/`. It's the same ngrok tunnel that Tech-Service uses, so keep the tunnel running.

## 2. Credentials

Add these in **Manage Jenkins → Credentials → (global)**. Do not reuse or edit the Tech-Service IDs.

| ID                             | Kind                   | Value                                                                                       |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| `github-pat-mobile`            | Username with password | GitHub user and a PAT scoped to this repo (see below)                                       |
| `github-webhook-secret-mobile` | Secret text            | Optional. Not used while the global GitHub shared secret is empty (see the webhook section) |
| `firebase-app-id`              | Secret text            | Firebase Android/iOS app ID (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))                  |
| `firebase-service-account`     | Secret file            | Service-account JSON (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))                         |

PAT permissions: use a fine-grained token limited to this repo with Contents (read), Metadata (read), Commit statuses (read and write), and Pull requests (read). If **Scan Repository Now** fails with a 403 or "could not find repository", use a classic token with only the `repo` scope instead.

The two `firebase-*` credentials are only needed for the optional `DISTRIBUTE_FIREBASE` stage, so you can add them later.

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

- The iOS stages run on the Jenkins Mac with Xcode installed. The simulator build needs no Apple account or device.
- Only for Firebase distribution: sign Xcode in to the Apple ID for team `WAP9785ZZA` (**Xcode → Settings → Accounts**) and register each test iPhone through Xcode (**Window → Devices and Simulators**). Free teams allow up to 3 iPhones and builds expire after 7 days.
- Ruby is the system Ruby (2.6.10). Run `cd apps/mobile && bundle install` once on the agent to install fastlane.

## 6. Running builds

- Push to any branch: the Checks stage runs (format, lint, typecheck, tests). JUnit results appear in the job's **Test Result** page.
- `main`, or **Build with Parameters** with `BUILD_IOS` checked: also builds the iOS simulator app and archives `ReactNativeDemo-dev-simulator.zip` in the build's artifacts.
- **Build with Parameters** with `DISTRIBUTE_FIREBASE` checked: also builds a signed dev IPA, uploads it to Firebase App Distribution, and archives the `.ipa`. This needs a registered iPhone and the Firebase credentials. Leave it off until then.
