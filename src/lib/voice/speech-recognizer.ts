import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export interface SpeechRecognizerCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

const GOLF_CONTEXT_STRINGS = [
  "driver", "three wood", "five wood", "seven wood",
  "hybrid", "iron",
  "two iron", "three iron", "four iron", "five iron",
  "six iron", "seven iron", "eight iron", "nine iron",
  "pitching wedge", "gap wedge", "sand wedge", "lob wedge",
  "PW", "GW", "SW", "LW",
  "fairway", "rough", "bunker", "green", "sand",
  "dogleg", "dogleg left", "dogleg right", "straight",
  "penalty", "out of bounds", "OB",
  "uphill", "downhill", "flat",
  "left to right", "right to left",
  "birdie", "bogey", "par",
];

export async function requestPermissions(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

export async function startListening(): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error("Microphone and speech recognition permissions are required.");
  }

  ExpoSpeechRecognitionModule.start({
    lang: "en-US",
    interimResults: true,
    contextualStrings: GOLF_CONTEXT_STRINGS,
    addsPunctuation: false,
    requiresOnDeviceRecognition: false,
  });
}

export function stopListening(): void {
  ExpoSpeechRecognitionModule.stop();
}

export { useSpeechRecognitionEvent };
