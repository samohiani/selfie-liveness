# Liveness Detection App

A simple React Native app that demonstrates face detection and liveness verification.

## Features

- Real-time face detection
- Liveness verification through 3 challenges
- Selfie capture with verification
- Haptic feedback

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
5. Complete the 3 challenges:
   - Tap "Blink" when prompted
   - Tap "Smile" when prompted
   - Tap "Look Left" when prompted
6. After verification, tap "Capture Selfie"
7. View your captured image with confirmation

## Requirements

- Node.js (version 16 or higher)
- Xcode (for iOS development)
- Android Studio (for Android development)
