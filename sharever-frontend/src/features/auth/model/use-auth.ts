import { create } from "zustand";
import { http } from "../../../shared/api/http";
import { endpoints } from "../../../shared/api/endpoints";
import {
  getToken,
  setToken,
  clearToken,
  setRefreshToken,
} from "../../../shared/lib/storage";
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

    console.log("[Auth Debug] Login response data:", data); // Xem chi tiết data backend trả về

    // Bao lô mọi định dạng key
    const token = data?.token || data?.accessToken || data?.access_token;
    const refreshToken =
      data?.refresh_token || data?.refreshToken || data?.RefreshToken;

    if (!token) throw new Error("Missing token");
    setToken(token);
    if (refreshToken) {
      setRefreshToken(refreshToken);
      console.log("[Auth Debug] Saved refresh token successfully!");
    } else {
      console.error(
        "[Auth Debug] WARNING: No refresh token found in login response!",
      );
    }
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
