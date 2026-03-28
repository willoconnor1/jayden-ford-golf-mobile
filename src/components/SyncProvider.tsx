import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRoundStore } from "@/stores/round-store";
import { useGoalStore } from "@/stores/goal-store";
import { useCourseStore } from "@/stores/course-store";
import { pullFromDb, pushToDb } from "@/lib/sync";

const RESYNC_INTERVAL = 30_000;

/**
 * Handles initial pull from DB on login, periodic re-sync every 30s,
 * and clearing local stores when user changes.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hasInitialSync = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      hasInitialSync.current = false;
      return;
    }

    // If user changed, clear local stores and re-sync
    if (lastUserId.current !== user.userId) {
      lastUserId.current = user.userId;
      hasInitialSync.current = false;
      useRoundStore.setState({ rounds: [] });
      useGoalStore.setState({ goals: [] });
    }

    async function sync() {
      const remote = await pullFromDb();
      if (!remote) return; // DB not available, stay local-only

      const localRounds = useRoundStore.getState().rounds;
      const localGoals = useGoalStore.getState().goals;
      const localCourses = useCourseStore.getState().courses;

      // ── Merge rounds (DB is source of truth) ──────────────
      const remoteRoundMap = new Map(remote.rounds.map((r) => [r.id, r]));
      const mergedRounds = [...remote.rounds];
      const localOnlyRounds = localRounds.filter(
        (r) => !remoteRoundMap.has(r.id)
      );
      mergedRounds.push(...localOnlyRounds);

      // ── Merge goals (DB is source of truth) ────────────────
      const remoteGoalMap = new Map(remote.goals.map((g) => [g.id, g]));
      const mergedGoals = [...remote.goals];
      const localOnlyGoals = localGoals.filter(
        (g) => !remoteGoalMap.has(g.id)
      );
      mergedGoals.push(...localOnlyGoals);

      // ── Merge courses (DB is source of truth) ──────────────
      const remoteCourses = remote.courses ?? [];
      const remoteCourseMap = new Map(remoteCourses.map((c) => [c.id, c]));
      const mergedCourses = [...remoteCourses];
      const localOnlyCourses = localCourses.filter(
        (c) => !remoteCourseMap.has(c.id)
      );
      mergedCourses.push(...localOnlyCourses);

      // Update local stores with merged data
      useRoundStore.setState({ rounds: mergedRounds });
      useGoalStore.setState({ goals: mergedGoals });
      useCourseStore.setState({ courses: mergedCourses });

      // Push any local-only items up to DB
      if (
        localOnlyRounds.length > 0 ||
        localOnlyGoals.length > 0 ||
        localOnlyCourses.length > 0
      ) {
        pushToDb(localOnlyRounds, localOnlyGoals, localOnlyCourses);
      }
    }

    if (!hasInitialSync.current) {
      hasInitialSync.current = true;
      sync();
    }

    const interval = setInterval(sync, RESYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  return <>{children}</>;
}
