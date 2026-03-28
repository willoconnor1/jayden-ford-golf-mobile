import type { Round, Goal, SavedCourse } from "@/lib/types";
import { API_BASE } from "@/lib/api-config";
import { useAuthStore } from "@/stores/auth-store";

async function api(path: string, init?: RequestInit) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path}: ${res.status}`);
  return res.json();
}

// ── Round sync ────────────────────────────────────────────────────

export function syncAddRound(round: Round) {
  api("/rounds", { method: "POST", body: JSON.stringify(round) }).catch((e) =>
    console.warn("Background sync (add round) failed:", e)
  );
}

export function syncUpdateRound(round: Round) {
  api(`/rounds/${round.id}`, { method: "PUT", body: JSON.stringify(round) }).catch((e) =>
    console.warn("Background sync (update round) failed:", e)
  );
}

export function syncDeleteRound(id: string) {
  api(`/rounds/${id}`, { method: "DELETE" }).catch((e) =>
    console.warn("Background sync (delete round) failed:", e)
  );
}

// ── Goal sync ─────────────────────────────────────────────────────

export function syncAddGoal(goal: Goal) {
  api("/goals", { method: "POST", body: JSON.stringify(goal) }).catch((e) =>
    console.warn("Background sync (add goal) failed:", e)
  );
}

export function syncUpdateGoal(goal: Goal) {
  api(`/goals/${goal.id}`, { method: "PUT", body: JSON.stringify(goal) }).catch((e) =>
    console.warn("Background sync (update goal) failed:", e)
  );
}

export function syncDeleteGoal(id: string) {
  api(`/goals/${id}`, { method: "DELETE" }).catch((e) =>
    console.warn("Background sync (delete goal) failed:", e)
  );
}

// ── Course sync ──────────────────────────────────────────────────

export function syncSaveCourse(course: SavedCourse) {
  api("/courses", { method: "POST", body: JSON.stringify(course) }).catch((e) =>
    console.warn("Background sync (save course) failed:", e)
  );
}

// ── Full sync ─────────────────────────────────────────────────────

export async function pullFromDb(): Promise<{
  rounds: Round[];
  goals: Goal[];
  courses: SavedCourse[];
} | null> {
  try {
    return await api("/sync");
  } catch {
    console.warn("Pull from DB failed — running in local-only mode");
    return null;
  }
}

export async function pushToDb(
  rounds: Round[],
  goals: Goal[],
  courses?: SavedCourse[]
) {
  try {
    await api("/sync", {
      method: "POST",
      body: JSON.stringify({ rounds, goals, courses }),
    });
  } catch (e) {
    console.warn("Push to DB failed:", e);
  }
}
