import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Goal } from "@/lib/types";
import {
  syncAddGoal,
  syncUpdateGoal,
  syncDeleteGoal,
} from "@/lib/sync";

interface GoalStore {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals: [],
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
    }),
    {
      name: "golf-goals-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
