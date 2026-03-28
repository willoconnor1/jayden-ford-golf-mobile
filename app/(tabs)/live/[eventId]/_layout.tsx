import { Stack } from "expo-router";

export default function EventLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Event", headerShown: true }} />
      <Stack.Screen name="score" options={{ title: "Score Entry", headerShown: true }} />
      <Stack.Screen name="leaderboard" options={{ title: "Leaderboard", headerShown: true }} />
      <Stack.Screen name="scorecard" options={{ headerShown: false }} />
    </Stack>
  );
}
