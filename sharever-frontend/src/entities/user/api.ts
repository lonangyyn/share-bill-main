import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type { User } from "./types";

type UpdateProfilePayload = {
  name?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

export const userApi = {
  async me(): Promise<User> {
    const res = await http.get(endpoints.users.me());
    return res.data.data ?? res.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await http.put(endpoints.users.updateProfile(), payload);
    return res.data.data ?? res.data;
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await http.put(endpoints.users.password(), payload);
  },

  async updateAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("avatar", file);
    const res = await http.patch(endpoints.users.avatar(), form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data ?? res.data;
  },
};
