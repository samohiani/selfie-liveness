# Selfie Liveness Detection Demo

A React Native Expo app that demonstrates liveness detection for selfie capture. This demo works in Expo Go and simulates real liveness detection through user interaction challenges.

## Features

- **Camera Integration**: Uses expo-camera for selfie capture
- **Liveness Verification**: Simulated liveness detection with interactive challenges
- **Challenge Sequence**: Random sequence of 3 challenges (blink, smile, look left/right)
- **State Management**: Proper state handling for multi-step verification
- **Temporary Storage**: Captured images stored with temporary URLs
- **Expo Go Compatible**: Works without requiring native builds

## How It Works

1. **Start Check**: Tap "Start Check" to begin the liveness verification process
2. **Face Detection**: The app simulates face detection
3. **Challenge Sequence**: Complete 3 random challenges:
   - Blink your eyes
   - Smile
   - Look left or right
4. **User Interaction**: Tap the corresponding action buttons when prompted
5. **Verification**: After completing all challenges, you can capture a selfie
6. **Storage**: The captured image is stored with a temporary URL

## Challenges

- **Blink Detection**: Tap the "Blink" button when prompted
- **Smile Detection**: Tap the "Smile" button when prompted
- **Gaze Detection**: Tap either "Left" or "Right" button when prompted

## Technical Implementation

The app simulates liveness detection through user interaction rather than actual AI/ML face detection. This approach:

- Works in Expo Go without native modules
- Demonstrates the user experience of real liveness detection
- Provides visual feedback for each step
- Stores captured images to the device's document directory

## Dependencies

- expo-camera: For camera functionality
- expo-file-system: For storing captured images
- expo-router: For navigation

## Running the App

```bash
# Install dependencies
npm install

# Start in Expo Go
npx expo start
```

## Development vs Production

This is a demo implementation that simulates liveness detection. For production use, you would need:

- Actual face detection using computer vision libraries
- Real-time blink/smile/gaze detection
- Server-side verification of liveness
- Proper security measures to prevent spoofing
