import type { LiveEventData, LivePlayer, LiveEvent } from "@/lib/types";
import { API_BASE } from "@/lib/api-config";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

export function createEvent(
  name: string,
  courseName: string,
  holePars: number[]
): Promise<{ event: LiveEvent; organizerSecret: string }> {
  return api("/live/events", {
    method: "POST",
    body: JSON.stringify({ name, courseName, holePars }),
  });
}

export function lookupEventByCode(
  code: string
): Promise<{ event: LiveEvent }> {
  return api(`/live/events/join?code=${encodeURIComponent(code)}`);
}

export function joinEvent(
  eventId: string,
  name: string
): Promise<{ player: LivePlayer }> {
  return api(`/live/events/${eventId}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function fetchEventData(eventId: string): Promise<LiveEventData> {
  return api(`/live/events/${eventId}`);
}

export function updateEvent(
  eventId: string,
  organizerSecret: string,
  updates: {
    status?: string;
    playerGroups?: Array<{ playerId: string; groupNumber: number }>;
  }
): Promise<{ success: boolean }> {
  return api(`/live/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({ organizerSecret, ...updates }),
  });
}

export function submitScores(
  eventId: string,
  scores: Array<{ playerId: string; holeNumber: number; strokes: number }>
): Promise<{ success: boolean }> {
  return api(`/live/events/${eventId}/scores`, {
    method: "POST",
    body: JSON.stringify({ scores }),
  });
}
