import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedCourse, CourseInfo } from "@/lib/types";
import { syncSaveCourse } from "@/lib/sync";
import { API_BASE } from "@/lib/api-config";

interface CourseStore {
  courses: SavedCourse[];
  searchResults: SavedCourse[];
  isSearching: boolean;

  saveCourse: (course: SavedCourse) => void;
  removeCourse: (id: string) => void;
  toggleFavorite: (id: string) => void;
  searchCourses: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchCourseDetail: (externalId: string) => Promise<SavedCourse | null>;
  getCourseInfo: (courseId: string, teeName: string) => CourseInfo | undefined;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
      courses: [],
      searchResults: [],
      isSearching: false,

      saveCourse: (course) => {
        set((state) => {
          const exists = state.courses.find((c) => c.id === course.id);
          const courses = exists
            ? state.courses.map((c) => (c.id === course.id ? course : c))
            : [...state.courses, course];
          return { courses };
        });
        syncSaveCourse(course);
      },

      removeCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        }));
      },

      searchCourses: async (query) => {
        if (query.trim().length < 2) {
          set({ searchResults: [], isSearching: false });
          return;
        }

        set({ isSearching: true });
        try {
          const res = await fetch(
            `${API_BASE}/courses/search?q=${encodeURIComponent(query)}`
          );
          if (!res.ok) throw new Error("Search failed");
          const data = await res.json();
          set({ searchResults: data.courses ?? [], isSearching: false });
        } catch {
          set({ searchResults: [], isSearching: false });
        }
      },

      clearSearch: () => set({ searchResults: [], isSearching: false }),

      fetchCourseDetail: async (externalId) => {
        const cached = get().courses.find(
          (c) => c.externalId === externalId && c.tees.length > 0
        );
        if (cached) return cached;

        try {
          const res = await fetch(
            `${API_BASE}/courses/${externalId}`
          );
          if (!res.ok) throw new Error("Fetch failed");
          const course: SavedCourse = await res.json();
          get().saveCourse(course);
          return course;
        } catch {
          return null;
        }
      },

      getCourseInfo: (courseId, teeName) => {
        const course = get().courses.find((c) => c.id === courseId);
        if (!course) return undefined;

        const tee = course.tees.find((t) => t.name === teeName) ?? course.tees[0];
        if (!tee) return undefined;

        return {
          name: course.name,
          tees: tee.name,
          rating: tee.rating,
          slope: tee.slope,
          totalPar: tee.totalPar,
          holePars: tee.holePars,
          holeDistances: tee.holeDistances,
        };
      },
    }),
    {
      name: "golf-courses-storage",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        courses: state.courses,
      }),
    }
  )
);
