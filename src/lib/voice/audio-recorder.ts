/**
 * Mobile audio recorder using expo-av.
 * Records microphone audio and returns a file URI for upload.
 */

import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export async function requestPermissions(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) throw new Error("Microphone permission denied");

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recording = rec;
}

export async function stopRecording(): Promise<string> {
  if (!recording) throw new Error("No active recording");

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  recording = null;

  if (!uri) throw new Error("Recording URI not available");
  return uri;
}

export function cancelRecording(): void {
  if (recording) {
    recording.stopAndUnloadAsync().catch(() => {});
    recording = null;
  }
}
