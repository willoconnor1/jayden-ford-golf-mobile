import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function hapticLight() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function hapticMedium() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function hapticSuccess() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
