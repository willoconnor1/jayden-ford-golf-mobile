import { useState, useCallback, useRef } from "react";
import {
  startRecording,
  stopRecording,
  cancelRecording,
} from "@/lib/voice/audio-recorder";
import { API_BASE } from "@/lib/api-config";
import { useAuthStore } from "@/stores/auth-store";
import type { TemplateType } from "@/lib/voice/voice-templates";

export type VoiceState = "idle" | "recording" | "processing" | "error";

interface VoiceContext {
  templateType: TemplateType;
  phase: "shot" | "putt";
}

interface UseVoiceRecognitionReturn {
  state: VoiceState;
  transcript: string;
  parsedData: Record<string, unknown> | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export function useVoiceRecognition(
  context: VoiceContext
): UseVoiceRecognitionReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setParsedData(null);

    try {
      await startRecording();
      setState("recording");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
      setState("error");
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      const fileUri = await stopRecording();
      setState("processing");

      // Build FormData with audio file
      const formData = new FormData();
      formData.append("audio", {
        uri: fileUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as unknown as Blob);
      formData.append("templateType", contextRef.current.templateType);
      formData.append("phase", contextRef.current.phase);

      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_BASE}/voice/parse`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API error ${res.status}`);
      }

      const { transcript: t, data } = await res.json();
      setTranscript(t || "");
      setParsedData(data && Object.keys(data).length > 0 ? data : null);
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice parsing failed");
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    cancelRecording();
    setState("idle");
    setTranscript("");
    setParsedData(null);
    setError(null);
  }, []);

  return {
    state,
    transcript,
    parsedData,
    error,
    start,
    stop,
    reset,
  };
}
