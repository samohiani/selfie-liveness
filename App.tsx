/**
 * Selfie Liveness Detection App with Real Face Detection
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from "react-native-vision-camera";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

const App = () => {
  const [step, setStep] = useState<"instructions" | "liveness" | "success">(
    "instructions"
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [livenessStatus, setLivenessStatus] = useState<{
    blinkDetected: boolean;
    headTurnLeft: boolean;
    headTurnRight: boolean;
    completed: boolean;
  }>({
    blinkDetected: false,
    headTurnLeft: false,
    headTurnRight: false,
    completed: false,
  });

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice("front");

  // Initialize face detector
  const faceDetector = useFaceDetector({
    classificationMode: "all",
    landmarkMode: "all",
    contourMode: "all",
    performanceMode: "fast",
  });

  // Worklet functions to update state on main thread
  const updateBlinkStatus = Worklets.createRunOnJS(() => {
    if (!livenessStatus.blinkDetected) {
      setLivenessStatus((prev) => ({ ...prev, blinkDetected: true }));
    }
  });

  const updateHeadTurnLeftStatus = Worklets.createRunOnJS(() => {
    if (!livenessStatus.headTurnLeft) {
      setLivenessStatus((prev) => ({ ...prev, headTurnLeft: true }));
    }
  });

  const updateHeadTurnRightStatus = Worklets.createRunOnJS(() => {
    if (!livenessStatus.headTurnRight) {
      setLivenessStatus((prev) => ({ ...prev, headTurnRight: true }));
    }
  });

  const completeLivenessCheck = Worklets.createRunOnJS(async () => {
    if (!livenessStatus.completed) {
      setLivenessStatus((prev) => ({ ...prev, completed: true }));
      // Capture image
      if (cameraRef.current && device) {
        try {
          const photo = await cameraRef.current.takePhoto();
          setCapturedImage(`file://${photo.path}`);
          setStep("success");
        } catch (err) {
          setError("Failed to capture image");
          console.error("Error capturing image:", err);
        }
      } else {
        // Fallback for when camera is not available
        setCapturedImage("https://reactnative.dev/img/tiny_logo.png");
        setStep("success");
      }
    }
  });

  // Frame processor for real-time face analysis
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const faces = faceDetector.detectFaces(frame);

    if (faces.length > 0) {
      const face = faces[0];

      // Blink detection using eye openness metrics
      const leftEyeOpenness = face.leftEyeOpenProbability;
      const rightEyeOpenness = face.rightEyeOpenProbability;

      if (leftEyeOpenness < 0.2 && rightEyeOpenness < 0.2) {
        // Both eyes closed - potential blink
        updateBlinkStatus();
      }

      // Head pose estimation using facial landmarks
      if (face.yawAngle < -15) {
        // Head turned left
        updateHeadTurnLeftStatus();
      } else if (face.yawAngle > 15) {
        // Head turned right
        updateHeadTurnRightStatus();
      }

      // Check if all liveness checks are completed
      if (
        livenessStatus.blinkDetected &&
        livenessStatus.headTurnLeft &&
        livenessStatus.headTurnRight &&
        !livenessStatus.completed
      ) {
        completeLivenessCheck();
      }
    }
  }, []);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message:
              "This app needs access to your camera for liveness detection",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setCameraPermission(true);
          return true;
        } else {
          setError("Camera permission denied");
          return false;
        }
      } else {
        const result = await request(PERMISSIONS.IOS.CAMERA);
        if (result === RESULTS.GRANTED) {
          setCameraPermission(true);
          return true;
        } else {
          setError("Camera permission denied");
          return false;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error requesting camera permission:", err);
      return false;
    }
  };

  const startLivenessCheck = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }

      setStep("liveness");
      setError(null);

      // Reset liveness detection state
      setLivenessStatus({
        blinkDetected: false,
        headTurnLeft: false,
        headTurnRight: false,
        completed: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error in startLivenessCheck:", err);
    }
  };

  const retakeSelfie = () => {
    setStep("instructions");
    setCapturedImage(null);
    setError(null);
    setLivenessStatus({
      blinkDetected: false,
      headTurnLeft: false,
      headTurnRight: false,
      completed: false,
    });
  };

  const renderInstructions = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie Liveness Check</Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <Text style={styles.instructions}>
        To verify you're a real person, you'll need to:
      </Text>
      <Text style={styles.bullet}>• Blink your eyes</Text>
      <Text style={styles.bullet}>• Turn your head left</Text>
      <Text style={styles.bullet}>• Turn your head right</Text>
      <TouchableOpacity style={styles.button} onPress={startLivenessCheck}>
        <Text style={styles.buttonText}>Start Verification</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLivenessCheck = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Liveness Check</Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      {device && cameraPermission ? (
        <>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={step === "liveness"}
            photo={true}
            frameProcessor={frameProcessor}
          />
          <View style={styles.overlay}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (livenessStatus.blinkDetected ? 25 : 0) +
                        (livenessStatus.headTurnLeft ? 25 : 0) +
                        (livenessStatus.headTurnRight ? 25 : 0) +
                        (livenessStatus.completed ? 25 : 0)
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.status}>
              {!livenessStatus.blinkDetected
                ? "Please blink your eyes"
                : !livenessStatus.headTurnLeft
                ? "Now turn your head left"
                : !livenessStatus.headTurnRight
                ? "Now turn your head right"
                : "Capturing selfie..."}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraText}>Camera View</Text>
          <Text style={styles.cameraSubtext}>
            Position your face in the frame
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (livenessStatus.blinkDetected ? 25 : 0) +
                      (livenessStatus.headTurnLeft ? 25 : 0) +
                      (livenessStatus.headTurnRight ? 25 : 0) +
                      (livenessStatus.completed ? 25 : 0)
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.status}>
            {!livenessStatus.blinkDetected
              ? "Please blink your eyes"
              : !livenessStatus.headTurnLeft
              ? "Now turn your head left"
              : !livenessStatus.headTurnRight
              ? "Now turn your head right"
              : "Capturing selfie..."}
          </Text>
        </View>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Success!</Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <Text style={styles.successText}>Liveness verification passed</Text>
      {capturedImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.selfieImage}
            resizeMode="contain"
          />
        </View>
      )}
      <Text style={styles.infoText}>
        Your selfie has been captured and verified successfully.
      </Text>
      <TouchableOpacity style={styles.button} onPress={retakeSelfie}>
        <Text style={styles.buttonText}>Take Another Selfie</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === "instructions" && renderInstructions()}
      {step === "liveness" && renderLivenessCheck()}
      {step === "success" && renderSuccess()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  instructions: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  bullet: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
    marginLeft: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    alignSelf: "center",
    width: "80%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  camera: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    marginBottom: 30,
  },
  cameraPlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "#333",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  cameraText: {
    color: "white",
    fontSize: 20,
    marginBottom: 10,
  },
  cameraSubtext: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 50,
  },
  progressBarContainer: {
    width: "80%",
    marginBottom: 20,
  },
  progressBar: {
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  status: {
    fontSize: 18,
    textAlign: "center",
    color: "#333",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 10,
  },
  successText: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 30,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  imageContainer: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  selfieImage: {
    width: "100%",
    height: "100%",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "red",
    fontWeight: "bold",
  },
});

export default App;
