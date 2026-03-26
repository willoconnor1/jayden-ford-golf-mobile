import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal } from "@/lib/types";
import { getSeedGoals } from "@/lib/seed-data";
import {
  syncAddGoal,
  syncUpdateGoal,
  syncDeleteGoal,
} from "@/lib/sync";

interface GoalStore {
  goals: Goal[];
  seeded: boolean;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  clearSeedData: () => void;
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals: [],
      seeded: false,
      addGoal: (goal) => {
        set((state) => ({ goals: [...state.goals, goal] }));
        syncAddGoal(goal);
      },
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
        const updated = get().goals.find((g) => g.id === id);
        if (updated) syncUpdateGoal(updated);
      },
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
        syncDeleteGoal(id);
      },
      completeGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, isCompleted: true, completedAt: new Date().toISOString() }
              : g
          ),
        }));
        const updated = get().goals.find((g) => g.id === id);
        if (updated) syncUpdateGoal(updated);
      },
      clearSeedData: () =>
        set((state) => ({
          goals: state.goals.filter((g) => !g.id.startsWith("seed-goal-")),
        })),
    }),
    {
      name: "golf-goals-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Auto-seed demo goals on first visit
        if (state && !state.seeded && state.goals.length === 0) {
          state.goals = getSeedGoals();
          state.seeded = true;
        }
      },
    }
  )
);
