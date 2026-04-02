import { create } from "zustand";

export const useThemeStore = create<{
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}>((set) => ({
  theme: "light",
  setTheme: (t) => set({ theme: t }),
}));
