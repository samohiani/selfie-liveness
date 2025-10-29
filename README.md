# Liveness Detection App

A React Native app that demonstrates automatic face detection and liveness verification.

## Features

- Real-time face detection using MLKit Vision
- Automatic liveness verification through 3 biometric challenges
- Selfie capture with verification
- Haptic feedback
- Cross-platform support (iOS & Android)

## How to Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Prebuild the project:

   ```bash
   npx expo prebuild
   ```

3. Run on iOS:

   ```bash
   npx expo run:ios
   ```

4. Run on Android:
   ```bash
   npx expo run:android
   ```

## How It Works

1. Open the app and tap "Start Detection"
2. Position your face within the circle
3. Wait for face detection (green box appears)
4. Tap "Start Liveness Check"
5. Complete the 3 automatic challenges:
   - Blink detection (system automatically detects when you close your eyes)
   - Smile detection (system automatically detects when you smile)
   - Head turn detection (system automatically detects when you turn your head)
6. After automatic verification, tap "Capture Selfie"
7. View your captured image with confirmation

## Requirements

- Node.js (version 16 or higher)
- Xcode (for iOS development)
- Android Studio (for Android development)
