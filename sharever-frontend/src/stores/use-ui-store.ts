import { create } from "zustand";

export const useUiStore = create<{
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
