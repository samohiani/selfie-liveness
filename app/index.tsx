import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie Liveness Detection</Text>
      <Text style={styles.subtitle}>With Face Detection</Text>

      <View style={styles.featuresContainer}>
        <Text style={styles.feature}>✓ Real-time face detection</Text>
        <Text style={styles.feature}>✓ Liveness verification</Text>
        <Text style={styles.feature}>✓ Haptic feedback</Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push("/selfie")}
      >
        <Text style={styles.buttonText}>Start Detection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 30,
  },
  feature: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    color: "#444",
  },
  startButton: {
    backgroundColor: "#6200ee",
    borderRadius: 10,
    padding: 15,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
