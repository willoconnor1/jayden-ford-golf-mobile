import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function RoundDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Round Detail</Text>
      <Text style={styles.subtitle}>Round ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 16, color: "#6b7280", marginTop: 8 },
});
