import { Stack } from "expo-router";

export default function RoundsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Rounds", headerShown: true }} />
      <Stack.Screen
        name="new"
        options={{ title: "New Round", headerShown: true, presentation: "card" }}
      />
      <Stack.Screen name="[id]" options={{ title: "Round Detail", headerShown: true }} />
    </Stack>
  );
}
