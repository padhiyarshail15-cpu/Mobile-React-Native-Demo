// Runs a shell command with the Node version from .nvmrc (installed if missing)
def nvmSh(String cmd) {
  sh """#!/bin/bash
set -e
export NVM_DIR="\$HOME/.nvm"
. "\$NVM_DIR/nvm.sh"
nvm install >/dev/null
nvm use >/dev/null
${cmd}
"""
}

pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
  }

  parameters {
    // Both default to false; main always builds the simulator app
    booleanParam(name: 'BUILD_IOS', defaultValue: false, description: 'Build the iOS simulator app on any branch (main always does)')
    booleanParam(name: 'DISTRIBUTE_FIREBASE', defaultValue: false, description: 'Also build a signed dev IPA and upload it to Firebase App Distribution (needs an iPhone registered to the Apple team)')
  }

  environment {
    CI = 'true'
    HUSKY = '0' // git hooks are for developer machines, not CI
    FASTLANE_SKIP_UPDATE_CHECK = '1'
    FASTLANE_OPT_OUT_USAGE = '1'
  }

  stages {
    stage('Install') {
      steps {
        nvmSh '''
          node -v
          corepack enable
          yarn install --immutable
        '''
      }
    }

    stage('Checks') {
      parallel {
        stage('Format Check') {
          steps {
            nvmSh 'yarn format:check'
          }
        }

        stage('Lint') {
          steps {
            nvmSh 'yarn lint'
          }
        }

        stage('Typecheck') {
          steps {
            nvmSh 'yarn typecheck'
          }
        }

        stage('Unit Tests') {
          steps {
            // CI=true makes jest-junit write apps/mobile/reports/junit.xml and packages/*/reports/junit.xml
            nvmSh 'yarn test:coverage'
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: '**/reports/junit.xml'
            }
          }
        }
      }
    }

    stage('iOS Simulator Build (main or BUILD_IOS)') {
      when {
        anyOf {
          branch 'main'
          expression { params.BUILD_IOS }
        }
      }
      steps {
        // No signing or device needed: proves the app compiles and gives a zipped .app for simulators
        nvmSh '''
          yarn workspace mobile bundle:install
          yarn workspace mobile pod:install:ci
          cd apps/mobile && bundle exec fastlane ios simulator variant:dev
        '''
      }
      post {
        success {
          archiveArtifacts artifacts: 'apps/mobile/dist/ios/*-simulator.zip', fingerprint: true, onlyIfSuccessful: true
        }
      }
    }

    stage('Firebase Distribution (DISTRIBUTE_FIREBASE)') {
      when {
        expression { params.DISTRIBUTE_FIREBASE }
      }
      steps {
        // Credentials are bound here, not in an environment block, so builds without this stage never need them.
        // FIREBASE_APP_ID is secret text; FIREBASE_SERVICE_CREDENTIALS_FILE is the path to the service-account JSON.
        withCredentials([
          string(credentialsId: 'firebase-app-id', variable: 'FIREBASE_APP_ID'),
          file(credentialsId: 'firebase-service-account', variable: 'FIREBASE_SERVICE_CREDENTIALS_FILE')
        ]) {
          nvmSh '''
            yarn workspace mobile bundle:install
            yarn workspace mobile pod:install:ci
            cd apps/mobile && BUILD_NUMBER="$BUILD_NUMBER" GIT_COMMIT="$(git rev-parse --short HEAD)" \
              bundle exec fastlane ios distribute
          '''
        }
      }
      post {
        success {
          // Keep every IPA with its build
          archiveArtifacts artifacts: 'apps/mobile/dist/ios/*.ipa', fingerprint: true, onlyIfSuccessful: true
        }
      }
    }
  }
}
