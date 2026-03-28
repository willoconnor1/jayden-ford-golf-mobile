import { useState, useEffect, useCallback, useRef } from "react";
import type { LiveEventData } from "@/lib/types";
import { fetchEventData } from "@/lib/live-api";

const POLL_INTERVAL = 5_000;

export function useLiveEvent(eventId: string | undefined) {
  const [data, setData] = useState<LiveEventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const result = await fetchEventData(eventId);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load event");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    load();

    intervalRef.current = setInterval(() => {
      load();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [eventId, load]);

  // Stop polling when event is completed
  useEffect(() => {
    if (data?.event.status === "completed" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [data?.event.status]);

  return { data, isLoading, error, refresh: load };
}
