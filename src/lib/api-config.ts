import { Platform } from "react-native";

// On physical devices, localhost points to the device itself, not your computer.
// Use your computer's local IP for dev. On iOS simulator, localhost works fine.
const DEV_HOST =
  Platform.OS === "android" ? "10.0.2.2" : "192.168.86.24";

export const API_BASE = __DEV__
  ? `http://${DEV_HOST}:3002/api`
  : "https://your-production-url.com/api";
