import { Stack } from "expo-router";

export default function LiveLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Live Events", headerShown: true }} />
      <Stack.Screen
        name="[eventId]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
