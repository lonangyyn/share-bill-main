import { create } from "zustand";

const STORAGE_KEY = "active_event_id";

type State = {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
};

function getInitial(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const useEventStore = create<State>((set) => ({
  selectedEventId: getInitial(),
  setSelectedEventId: (id) => {
    const nextId = id ? String(id) : null;
    try {
      if (nextId) localStorage.setItem(STORAGE_KEY, nextId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ selectedEventId: nextId });
  },
}));
