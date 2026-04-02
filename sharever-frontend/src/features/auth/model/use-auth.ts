import { create } from "zustand";
import { http } from "../../../shared/api/http";
import { endpoints } from "../../../shared/api/endpoints";
import { getToken, setToken, clearToken } from "../../../shared/lib/storage";
import type { User } from "../../../entities/user/types";

type State = {
  user: User | null;
  isAuthed: boolean;
  booting: boolean;

  setUser: (user: User | null) => void;

  login: (p: { email: string; password: string }) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => void;
};

export const useAuth = create<State>((set) => ({
  user: null,
  isAuthed: !!getToken(),
  booting: true,

  setUser: (user) => set({ user, isAuthed: !!user || !!getToken() }),

  login: async ({ email, password }) => {
    const res = await http.post(endpoints.auth.login(), { email, password });
    const data = res.data?.data ?? res.data;
    const token = data?.token;
    if (!token) throw new Error("Missing token");
    setToken(token);
    set({ user: data?.user ?? null, isAuthed: true });
  },

  hydrate: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, isAuthed: false, booting: false });
      return;
    }
    try {
      const res = await http.get(endpoints.users.me());
      set({ user: res.data?.data ?? res.data, isAuthed: true, booting: false });
    } catch {
      clearToken();
      set({ user: null, isAuthed: false, booting: false });
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, isAuthed: false });
  },
}));
