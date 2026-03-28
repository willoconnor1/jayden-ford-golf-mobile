import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LiveSessionState {
  playerId: string | null;
  isOrganizer: boolean;
  organizerSecret: string | null;
  loaded: boolean;
}

export function useLiveSession(eventId: string | undefined) {
  const [state, setState] = useState<LiveSessionState>({
    playerId: null,
    isOrganizer: false,
    organizerSecret: null,
    loaded: false,
  });

  useEffect(() => {
    if (!eventId) {
      setState((s) => ({ ...s, loaded: true }));
      return;
    }

    (async () => {
      const [session, organizer] = await Promise.all([
        AsyncStorage.getItem(`live-session-${eventId}`),
        AsyncStorage.getItem(`live-organizer-${eventId}`),
      ]);
      const parsed = session ? JSON.parse(session) : {};
      const orgParsed = organizer ? JSON.parse(organizer) : {};
      setState({
        playerId: parsed.playerId ?? null,
        isOrganizer: !!orgParsed.organizerSecret,
        organizerSecret: orgParsed.organizerSecret ?? null,
        loaded: true,
      });
    })();
  }, [eventId]);

  const setSession = useCallback(
    async (playerId: string) => {
      if (!eventId) return;
      await AsyncStorage.setItem(
        `live-session-${eventId}`,
        JSON.stringify({ playerId })
      );
      setState((s) => ({ ...s, playerId }));
    },
    [eventId]
  );

  const setOrganizer = useCallback(
    async (organizerSecret: string) => {
      if (!eventId) return;
      await AsyncStorage.setItem(
        `live-organizer-${eventId}`,
        JSON.stringify({ organizerSecret })
      );
      setState((s) => ({ ...s, isOrganizer: true, organizerSecret }));
    },
    [eventId]
  );

  return { ...state, setSession, setOrganizer };
}
