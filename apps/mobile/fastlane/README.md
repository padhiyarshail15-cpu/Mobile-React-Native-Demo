fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build a signed development IPA into dist/ios (variant:dev|prod)

### ios simulator

```sh
[bundle exec] fastlane ios simulator
```

Build the app for the iOS Simulator (no signing, no device needed) and zip the .app into dist/ios

### ios distribute

```sh
[bundle exec] fastlane ios distribute
```

Build the dev IPA and upload it to Firebase App Distribution

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build a release APK into dist/android (variant:dev|prod). prod is signed with the release keystore (env vars required); dev falls back to the debug key

### android distribute

```sh
[bundle exec] fastlane android distribute
```

Build the release APK (prod) and upload it to Firebase App Distribution

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
