import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { scanFaces } from "vision-camera-face-detector";

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

// Define Face type
type Face = {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  smilingProbability: number;
  yawAngle: number;
};

// Liveness detection thresholds
const EYE_CLOSED_THRESHOLD = 0.4;
const SMILE_THRESHOLD = 0.7;
const HEAD_TURN_THRESHOLD = 15; // degrees

// Challenge types for automatic detection
type ChallengeType = "none" | "blink" | "smile" | "turnHead";

// Challenge sequence
const CHALLENGE_SEQUENCE: ChallengeType[] = ["blink", "smile", "turnHead"];

export default function SelfieVisionScreen() {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(
    "Position your face in the circle"
  );
  const [faceDetected, setFaceDetected] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);

  // Liveness detection state
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [smileDetected, setSmileDetected] = useState(false);
  const [headTurnDetected, setHeadTurnDetected] = useState(false);
  const [initialHeadPosition, setInitialHeadPosition] = useState<number | null>(
    null
  );

  // Get current challenge
  const currentChallenge =
    currentChallengeIndex < CHALLENGE_SEQUENCE.length
      ? CHALLENGE_SEQUENCE[currentChallengeIndex]
      : "none";

  // Frame processor for face detection
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    try {
      const detectedFaces = scanFaces(frame);
      // @ts-ignore
      setFaces(detectedFaces);
    } catch (error) {
      console.log("Face detection error:", error);
    }
  }, []);

  // Automatic liveness detection
  useEffect(() => {
    if (faces.length > 0 && currentChallenge !== "none") {
      const face = faces[0];

      // Initialize head position on first detection
      if (initialHeadPosition === null) {
        setInitialHeadPosition(face.yawAngle);
      }

      // Detect blink (both eyes closed)
      if (currentChallenge === "blink" && !blinkDetected) {
        if (
          face.leftEyeOpenProbability < EYE_CLOSED_THRESHOLD &&
          face.rightEyeOpenProbability < EYE_CLOSED_THRESHOLD
        ) {
          setBlinkDetected(true);
          setChallengeCompleted(true);
          setDetectionStatus("Blink detected!");

          // Move to next challenge automatically
          setTimeout(() => {
            moveToNextChallenge();
          }, 1500);
        }
      }

      // Detect smile
      if (currentChallenge === "smile" && !smileDetected) {
        if (face.smilingProbability > SMILE_THRESHOLD) {
          setSmileDetected(true);
          setChallengeCompleted(true);
          setDetectionStatus("Smile detected!");

          // Move to next challenge automatically
          setTimeout(() => {
            moveToNextChallenge();
          }, 1500);
        }
      }

      // Detect head turn
      if (
        currentChallenge === "turnHead" &&
        initialHeadPosition !== null &&
        !headTurnDetected
      ) {
        const headMovement = Math.abs(face.yawAngle - initialHeadPosition);
        if (headMovement > HEAD_TURN_THRESHOLD) {
          setHeadTurnDetected(true);
          setChallengeCompleted(true);
          setDetectionStatus("Head turn detected!");

          // Complete all challenges
          setTimeout(() => {
            setIsLivenessVerified(true);
            setDetectionStatus("Liveness verified! Take a selfie.");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          }, 1500);
        }
      }
    }
  }, [
    faces,
    currentChallenge,
    blinkDetected,
    smileDetected,
    headTurnDetected,
    initialHeadPosition,
  ]);

  // Update face detection status based on detected faces
  useEffect(() => {
    if (faces.length > 0) {
      setFaceDetected(true);
      const face = faces[0];

      // Check if face is centered
      const faceCenterX = face.bounds.x + face.bounds.width / 2;
      const faceCenterY = face.bounds.y + face.bounds.height / 2;
      const screenCenterX = SCREEN_WIDTH / 2;
      const screenCenterY = SCREEN_HEIGHT / 2;

      const isCenteredHorizontally =
        Math.abs(faceCenterX - screenCenterX) < SCREEN_WIDTH * 0.2;
      const isCenteredVertically =
        Math.abs(faceCenterY - screenCenterY) < SCREEN_HEIGHT * 0.2;

      if (isCenteredHorizontally && isCenteredVertically) {
        if (detectionStatus === "Position your face in the circle") {
          setDetectionStatus("Face detected! Get ready...");
        }
      } else {
        setDetectionStatus("Center your face in the circle");
      }
    } else {
      setFaceDetected(false);
      if (currentChallenge === "none") {
        setDetectionStatus("Position your face in the circle");
      }
    }
  }, [faces, currentChallenge]);

  // Trigger haptic feedback on challenge completion
  useEffect(() => {
    if (challengeCompleted && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [challengeCompleted]);

  // Function to move to the next challenge
  const moveToNextChallenge = () => {
    if (currentChallengeIndex < CHALLENGE_SEQUENCE.length - 1) {
      // Move to next challenge
      const nextIndex = currentChallengeIndex + 1;
      setCurrentChallengeIndex(nextIndex);
      setChallengeCompleted(false);
      setDetectionStatus(
        getChallengeInstruction(CHALLENGE_SEQUENCE[nextIndex])
      );

      // Reset challenge-specific states
      if (CHALLENGE_SEQUENCE[nextIndex] === "smile") {
        setBlinkDetected(false);
      } else if (CHALLENGE_SEQUENCE[nextIndex] === "turnHead") {
        setSmileDetected(false);
        // Reset head position tracking for turn head challenge
        setInitialHeadPosition(null);
      }
    }
  };

  // Start the liveness challenge
  const startLivenessCheck = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (currentChallengeIndex === 0 && currentChallenge === "none") {
      setDetectionStatus("Starting liveness check...");

      // Start first challenge after delay
      setTimeout(() => {
        setCurrentChallengeIndex(0);
        setDetectionStatus(getChallengeInstruction(CHALLENGE_SEQUENCE[0]));
      }, 1000);
    }
  };

  // Get instruction text for each challenge
  const getChallengeInstruction = (challenge: ChallengeType): string => {
    switch (challenge) {
      case "blink":
        return "Blink your eyes";
      case "smile":
        return "Please smile now";
      case "turnHead":
        return "Look to your left and right";
      default:
        return "Position your face in the circle";
    }
  };

  // Complete the current challenge
  const completeChallenge = () => {
    if (!challengeCompleted && faceDetected) {
      setChallengeCompleted(true);
      setDetectionStatus("Challenge completed!");

      // Move to next challenge or complete verification
      setTimeout(() => {
        if (currentChallengeIndex < CHALLENGE_SEQUENCE.length - 1) {
          // Move to next challenge
          const nextIndex = currentChallengeIndex + 1;
          setCurrentChallengeIndex(nextIndex);
          setChallengeCompleted(false);
          setDetectionStatus(
            getChallengeInstruction(CHALLENGE_SEQUENCE[nextIndex])
          );
        } else {
          // All challenges completed
          setIsLivenessVerified(true);
          setDetectionStatus("Liveness verified! Take a selfie.");
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }, 1500);
    }
  };

  // Simulate user action for each challenge (in a real app, this would be replaced with actual detection)
  const simulateChallengeAction = () => {
    if (!challengeCompleted && faceDetected) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      completeChallenge();
    }
  };

  // Reset liveness check
  const resetLivenessCheck = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCapturedImage(null);
    setIsLivenessVerified(false);
    setCurrentChallengeIndex(0);
    setChallengeCompleted(false);
    setIsProcessing(false);
    setDetectionStatus("Position your face in the circle");
    setFaceDetected(false);
    setFaces([]);

    // Reset liveness detection states
    setBlinkDetected(false);
    setSmileDetected(false);
    setHeadTurnDetected(false);
    setInitialHeadPosition(null);
  };

  async function takePicture() {
    if (cameraRef.current && isLivenessVerified) {
      try {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        setIsProcessing(true);
        const photo = await cameraRef.current.takePhoto({
          flash: "off",
          enableShutterSound: false,
        });

        // Store image URI
        setCapturedImage(`file://${photo.path}`);
        setIsProcessing(false);
        Alert.alert("Success", "Selfie captured with liveness verification!");
      } catch (error) {
        console.error("Error taking picture:", error);
        setIsProcessing(false);
        Alert.alert(
          "Error",
          "Failed to capture image: " + (error as Error).message
        );
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } else {
      Alert.alert(
        "Verification Required",
        "Please complete liveness verification first"
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }

  // Handle permission states
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera not available</Text>
      </View>
    );
  }

  // Handle captured image state
  if (capturedImage) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Selfie Result</Text>
        <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        <Text style={styles.verificationText}>✅ Liveness Verified</Text>
        <TouchableOpacity
          onPress={resetLivenessCheck}
          style={styles.retryButton}
        >
          <Text style={styles.buttonText}>Take Another</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Main camera view
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie with Liveness Check</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.detectionStatus}>{detectionStatus}</Text>
        {currentChallenge !== "none" && (
          <Text style={styles.progressText}>
            Challenge {currentChallengeIndex + 1} of {CHALLENGE_SEQUENCE.length}
          </Text>
        )}
        {/* Face detection indicator */}
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.indicator,
              faceDetected ? styles.indicatorActive : styles.indicatorInactive,
            ]}
          />
          <Text style={styles.indicatorText}>
            {faceDetected ? "Face Detected" : "No Face Detected"}
          </Text>
        </View>
      </View>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        photo={true}
      >
        <View style={styles.cameraOverlay}>
          {/* Face detection visualization */}
          {faces.map((face, index) => (
            <View
              key={index}
              style={[
                styles.faceOutline,
                {
                  position: "absolute",
                  left: face.bounds.x,
                  top: face.bounds.y,
                  width: face.bounds.width,
                  height: face.bounds.height,
                  borderColor: "#00FF00",
                },
              ]}
            />
          ))}

          {/* Center guide circle */}
          <View style={styles.centerGuide} />
        </View>
      </Camera>

      <View style={styles.controlsContainer}>
        {currentChallenge === "none" ? (
          <TouchableOpacity
            style={[styles.startButton, !faceDetected && styles.disabledButton]}
            onPress={startLivenessCheck}
            disabled={!faceDetected}
          >
            <Text style={styles.buttonText}>
              {!faceDetected ? "Face Not Detected" : "Start Liveness Check"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.challengeContainer}>
            <View style={styles.challengeButton}>
              <Text style={styles.buttonText}>
                {getCurrentChallengeLabel(currentChallengeIndex)}
              </Text>
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: isTablet ? 14 : 12, marginTop: 5 },
                ]}
              >
                Automatic Detection
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              (isProcessing || !isLivenessVerified || !faceDetected) &&
                styles.disabledButton,
            ]}
            onPress={takePicture}
            disabled={isProcessing || !isLivenessVerified || !faceDetected}
          >
            <Text style={styles.buttonText}>
              {isProcessing ? "Processing..." : "Capture Selfie"}
            </Text>
          </TouchableOpacity>

          {currentChallenge !== "none" && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetLivenessCheck}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// Get label for current challenge button
function getCurrentChallengeLabel(currentChallengeIndex: number): string {
  switch (CHALLENGE_SEQUENCE[currentChallengeIndex]) {
    case "blink":
      return "Blink";
    case "smile":
      return "Smile";
    case "turnHead":
      return "Turn Head";
    default:
      return "Complete Challenge";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#333",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    fontSize: isTablet ? 20 : 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionButton: {
    backgroundColor: "#6200ee",
    borderRadius: 8,
    padding: isTablet ? 20 : 15,
    marginHorizontal: 30,
    alignItems: "center",
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    marginHorizontal: isTablet ? 40 : 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detectionStatus: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  progressText: {
    fontSize: isTablet ? 16 : 14,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  indicatorActive: {
    backgroundColor: "#4CAF50",
  },
  indicatorInactive: {
    backgroundColor: "#ff5252",
  },
  indicatorText: {
    fontSize: isTablet ? 16 : 14,
    color: "#666",
  },
  camera: {
    flex: 1,
    marginHorizontal: isTablet ? 40 : 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  faceOutline: {
    borderWidth: 3,
    borderStyle: "solid",
    borderRadius: 10,
  },
  centerGuide: {
    width: isTablet ? 300 : 200,
    height: isTablet ? 300 : 200,
    borderRadius: isTablet ? 150 : 100,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderStyle: "dashed",
  },
  controlsContainer: {
    padding: isTablet ? 30 : 20,
    paddingBottom: isTablet ? 40 : 30,
  },
  startButton: {
    backgroundColor: "#6200ee",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  challengeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  challengeButton: {
    backgroundColor: "#03dac4",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: "center",
    minWidth: 140,
    shadowColor: "#03dac4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  captureButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#ff5252",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginLeft: 10,
    alignItems: "center",
    shadowColor: "#ff5252",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  buttonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "white",
  },
  capturedImage: {
    width: isTablet ? 400 : 300,
    height: isTablet ? 400 : 300,
    borderRadius: 15,
    alignSelf: "center",
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  verificationText: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#4CAF50",
  },
  retryButton: {
    backgroundColor: "#6200ee",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginHorizontal: 30,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
