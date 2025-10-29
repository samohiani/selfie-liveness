import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
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

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

// Define challenge types
type ChallengeType = "none" | "blink" | "smile" | "lookLeft" | "lookRight";

// Challenge sequence
const CHALLENGE_SEQUENCE: ChallengeType[] = ["blink", "smile", "lookLeft"];

export default function SelfieScreen() {
  const [facing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("Get ready...");
  const cameraRef = useRef<any>(null);

  // Get current challenge
  const currentChallenge =
    currentChallengeIndex < CHALLENGE_SEQUENCE.length
      ? CHALLENGE_SEQUENCE[currentChallengeIndex]
      : "none";

  // Trigger haptic feedback on challenge completion
  useEffect(() => {
    if (challengeCompleted && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [challengeCompleted]);

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
      case "lookLeft":
        return "Look to your left";
      case "lookRight":
        return "Look to your right";
      default:
        return "Get ready...";
    }
  };

  // Complete the current challenge
  const completeChallenge = () => {
    if (!challengeCompleted) {
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

  // Simulate user action for each challenge
  const simulateChallengeAction = () => {
    if (!challengeCompleted) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      completeChallenge();
    }
  };

  const resetLivenessCheck = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCapturedImage(null);
    setIsLivenessVerified(false);
    setCurrentChallengeIndex(0);
    setChallengeCompleted(false);
    setIsProcessing(false);
    setDetectionStatus("Get ready...");
  };

  async function takePicture() {
    if (cameraRef.current && isLivenessVerified) {
      try {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          mirror: true, // Mirror the image to match selfie expectations
        });

        // Store image URI directly (no file system operations)
        setCapturedImage(photo.uri);
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
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
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
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.faceOutline} />
        </View>
      </CameraView>

      <View style={styles.controlsContainer}>
        {currentChallenge === "none" ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startLivenessCheck}
          >
            <Text style={styles.buttonText}>Start Liveness Check</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.challengeContainer}>
            <TouchableOpacity
              style={[
                styles.challengeButton,
                challengeCompleted && styles.disabledButton,
              ]}
              onPress={simulateChallengeAction}
              disabled={challengeCompleted}
            >
              <Text style={styles.buttonText}>
                {challengeCompleted
                  ? "Completed"
                  : getCurrentChallengeLabel(currentChallengeIndex)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              (isProcessing || !isLivenessVerified) && styles.disabledButton,
            ]}
            onPress={takePicture}
            disabled={isProcessing || !isLivenessVerified}
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
    case "lookLeft":
      return "Look Left";
    case "lookRight":
      return "Look Right";
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
  camera: {
    flex: 1,
    marginHorizontal: isTablet ? 40 : 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  faceOutline: {
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
