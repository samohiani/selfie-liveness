# Selfie Liveness Detection App

A simple React Native app that demonstrates liveness verification flow.

## Installation

```bash
npm install
```

## Running the App

### iOS
```bash
npx react-native run-ios
```

### Android
```bash
npx react-native run-android
```

## How It Works

1. User sees instructions for liveness check
2. Progress bar simulates verification steps:
   - Blink detection
   - Head turn left
   - Head turn right
3. On success, shows captured image

## Dependencies

- react-native-vision-camera: High-performance camera library
- react-native-fs: File system access
- react-native-image-manipulator: Image processing
- react-native-permissions: Permission handling

## Additional Documentation

For more detailed information about the implementation, please refer to:

- [LIVENESS.md](LIVENESS.md): Detailed liveness detection implementation
- [FACE_DETECTION.md](FACE_DETECTION.md): Technical details of face detection algorithms
- [FINAL_INSTRUCTIONS.md](FINAL_INSTRUCTIONS.md): Complete project overview and usage guide
- [SUMMARY.md](SUMMARY.md): Project completion summary

## Troubleshooting

### iOS CocoaPods Issues

If you encounter issues with CocoaPods installation:

1. Make sure you have the latest version of CocoaPods:

   ```bash
   sudo gem install cocoapods
   ```

2. Clean and reinstall pods:
   ```bash
   cd ios
   rm -rf Pods/ Podfile.lock build/
   pod install --repo-update
   cd ..
   ```

### Android Permissions

On Android, if the camera doesn't work, ensure that camera permissions are granted in the app settings.

### Frame Processor Issues

If face detection is not working:

1. Make sure [react-native-worklets-core](https://github.com/margelo/react-native-worklets-core) is properly installed
2. Check that the frame processor is correctly configured in the camera component

## License

This project is licensed under the MIT License.
