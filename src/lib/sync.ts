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

/** Fire-and-forget with one retry after 2s on failure */
function fireAndForget(fn: () => Promise<unknown>, label: string) {
  fn().catch((e) => {
    console.warn(`Background sync (${label}) failed, retrying in 2s:`, e);
    setTimeout(() => {
      fn().catch((e2) =>
        console.warn(`Background sync (${label}) retry failed:`, e2)
      );
    }, 2000);
  });
}

// ── Round sync ────────────────────────────────────────────────────

export function syncAddRound(round: Round) {
  fireAndForget(
    () => api("/rounds", { method: "POST", body: JSON.stringify(round) }),
    "add round"
  );
}

export function syncUpdateRound(round: Round) {
  fireAndForget(
    () => api(`/rounds/${round.id}`, { method: "PUT", body: JSON.stringify(round) }),
    "update round"
  );
}

export function syncDeleteRound(id: string) {
  fireAndForget(
    () => api(`/rounds/${id}`, { method: "DELETE" }),
    "delete round"
  );
}

// ── Goal sync ─────────────────────────────────────────────────────

export function syncAddGoal(goal: Goal) {
  fireAndForget(
    () => api("/goals", { method: "POST", body: JSON.stringify(goal) }),
    "add goal"
  );
}

export function syncUpdateGoal(goal: Goal) {
  fireAndForget(
    () => api(`/goals/${goal.id}`, { method: "PUT", body: JSON.stringify(goal) }),
    "update goal"
  );
}

export function syncDeleteGoal(id: string) {
  fireAndForget(
    () => api(`/goals/${id}`, { method: "DELETE" }),
    "delete goal"
  );
}

// ── Course sync ──────────────────────────────────────────────────

export function syncSaveCourse(course: SavedCourse) {
  fireAndForget(
    () => api("/courses", { method: "POST", body: JSON.stringify(course) }),
    "save course"
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
