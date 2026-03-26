import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Round, HoleData } from "@/lib/types";
import { getSeedRounds } from "@/lib/seed-data";
import {
  syncAddRound,
  syncUpdateRound,
  syncDeleteRound,
} from "@/lib/sync";

/** Migrate old firstPuttDistance to puttDistances array */
function migratePuttDistances(hole: HoleData & { firstPuttDistance?: number }): HoleData {
  if ("puttDistances" in hole && Array.isArray(hole.puttDistances)) return hole as HoleData;
  const first = hole.firstPuttDistance ?? 0;
  const putts = hole.putts ?? 0;
  const puttDistances: number[] = [];
  if (putts > 0) {
    puttDistances.push(first);
    let rem = first;
    for (let j = 1; j < putts; j++) {
      rem = Math.max(1, Math.round(rem * 0.35));
      puttDistances.push(rem);
    }
  }
  const { firstPuttDistance: _, ...rest } = hole;
  return { ...rest, puttDistances } as HoleData;
}

interface RoundStore {
  rounds: Round[];
  seeded: boolean;
  addRound: (round: Round) => void;
  updateRound: (id: string, updates: Partial<Round>) => void;
  deleteRound: (id: string) => void;
  getRound: (id: string) => Round | undefined;
  clearSeedData: () => void;
}

export const useRoundStore = create<RoundStore>()(
  persist(
    (set, get) => ({
      rounds: [],
      seeded: false,
      addRound: (round) => {
        set((state) => ({ rounds: [...state.rounds, round] }));
        syncAddRound(round);
      },
      updateRound: (id, updates) => {
        set((state) => ({
          rounds: state.rounds.map((r) =>
            r.id === id
              ? { ...r, ...updates, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
        const updated = get().rounds.find((r) => r.id === id);
        if (updated) syncUpdateRound(updated);
      },
      deleteRound: (id) => {
        set((state) => ({
          rounds: state.rounds.filter((r) => r.id !== id),
        }));
        syncDeleteRound(id);
      },
      getRound: (id) => get().rounds.find((r) => r.id === id),
      clearSeedData: () =>
        set((state) => ({
          rounds: state.rounds.filter((r) => !r.id.startsWith("seed-round-")),
        })),
    }),
    {
      name: "golf-rounds-storage",
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as RoundStore;
        if (version < 2 && state.rounds) {
          state.rounds = state.rounds.map((round) => ({
            ...round,
            holes: round.holes.map((hole) => migratePuttDistances(hole as HoleData & { firstPuttDistance?: number })),
          }));
        }
        if (version < 3 && state.rounds) {
          state.rounds = state.rounds.map((round) => ({
            ...round,
            holes: round.holes.map((hole) => ({
              ...hole,
              puttMisses: hole.puttMisses?.map((m) => ({
                ...m,
                speed: (m.speed as string) === "too-soft" ? ("short" as const) : m.speed,
              })),
            })),
          }));
        }
        if (version < 4 && state.rounds) {
          // Re-seed: old seed data lacks shot tracking and puttMisses
          state.rounds = state.rounds.filter((r) => !r.id.startsWith("seed-round-"));
          state.seeded = false;
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded && state.rounds.length === 0) {
          state.rounds = getSeedRounds();
          state.seeded = true;
        }
      },
    }
  )
);
