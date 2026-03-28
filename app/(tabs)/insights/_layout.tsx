import { Stack } from "expo-router";

export default function InsightsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Insights", headerShown: true }} />
      <Stack.Screen name="strokes-gained" options={{ title: "Strokes Gained", headerShown: true }} />
      <Stack.Screen name="goals" options={{ title: "Goals", headerShown: true }} />
      <Stack.Screen name="practice" options={{ title: "Practice", headerShown: true }} />
      <Stack.Screen name="dispersion" options={{ title: "Dispersion", headerShown: true }} />
    </Stack>
  );
}
