import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
}

let toastId = 0;
let addToastFn: ((msg: Omit<ToastMessage, "id">) => void) | null = null;

export const toast = {
  success: (text: string) => addToastFn?.({ text, type: "success" }),
  error: (text: string) => addToastFn?.({ text, type: "error" }),
  info: (text: string) => addToastFn?.({ text, type: "info" }),
};

const typeColors = {
  success: "#16a34a",
  error: "#dc2626",
  info: "#2563eb",
};

function ToastItem({ message, onDone }: { message: ToastMessage; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, borderLeftColor: typeColors[message.type] },
      ]}
    >
      <Text style={styles.toastText}>{message.text}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  addToastFn = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = ++toastId;
    setMessages((prev) => [...prev, { ...msg, id }]);
  }, []);

  const remove = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {messages.map((msg) => (
          <ToastItem key={msg.id} message={msg} onDone={() => remove(msg.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
});
