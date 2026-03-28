import { useState, useCallback, useRef } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { startListening, stopListening } from "@/lib/voice/speech-recognizer";

export type VoiceState = "idle" | "listening" | "processing" | "error";

interface UseVoiceRecognitionReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef("");

  useSpeechRecognitionEvent("start", () => {
    setState("listening");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const results = event.results;
    if (!results || results.length === 0) return;

    const latest = results[results.length - 1];
    const text = latest.transcript;

    if (event.isFinal) {
      // Accumulate final results
      transcriptRef.current = transcriptRef.current
        ? `${transcriptRef.current} ${text}`
        : text;
      setTranscript(transcriptRef.current);
      setInterimTranscript("");
    } else {
      setInterimTranscript(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    // If we have interim text that wasn't finalized, treat it as final
    if (interimTranscript && !transcriptRef.current) {
      transcriptRef.current = interimTranscript;
      setTranscript(interimTranscript);
      setInterimTranscript("");
    }
    setState(transcriptRef.current ? "processing" : "idle");
  });

  useSpeechRecognitionEvent("error", (event) => {
    const message = event.error === "no-speech"
      ? "No speech detected. Try again."
      : `Speech error: ${event.error}`;
    setError(message);
    setState("error");
  });

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    try {
      await startListening();
    } catch (e: any) {
      setError(e.message || "Failed to start speech recognition");
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    stopListening();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    transcriptRef.current = "";
  }, []);

  return { state, transcript, interimTranscript, error, start, stop, reset };
}
