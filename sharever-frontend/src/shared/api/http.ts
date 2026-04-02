import axios from "axios";
import { env } from "../config/env";
import { getToken } from "../lib/storage";

export const http = axios.create({
  baseURL: env.API_URL, // ví dụ: http://localhost:3000/api
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = getToken();

  // đảm bảo headers luôn tồn tại (tránh lỗi khi axios types khác nhau)
  config.headers = config.headers ?? {};

  if (token) {
    (config.headers as any).Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  } else {
    // nếu không có token thì đảm bảo không gửi Authorization rác
    (config.headers as any).Authorization = undefined;
  }

  return config;
});
