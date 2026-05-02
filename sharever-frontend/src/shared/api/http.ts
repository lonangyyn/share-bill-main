import axios, { AxiosError } from "axios";
import { env } from "../config/env";
import {
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
} from "../lib/storage";
import { endpoints } from "./endpoints";

export const http = axios.create({
  baseURL: env.API_URL,
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Setup response interceptor để handle token hết hạn với refresh token
export function setupResponseInterceptor(
  logout: () => void,
  navigate: (path: string) => void,
) {
  http.interceptors.response.clear();
  http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      if (error.response?.status === 401 && !originalRequest._retry) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest._retry = true;
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return http(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const baseUrl = (env.API_URL || "").replace(/\/+$/, "");

          let path = "/auth/refresh";
          try {
            path =
              typeof endpoints?.auth?.refresh === "function"
                ? endpoints.auth.refresh()
                : endpoints?.auth?.refresh || "/auth/refresh";
          } catch (e) {}
          if (!path.startsWith("/")) path = "/" + path;

          const response = await axios.post(`${baseUrl}${path}`, {
            refresh_token: refreshToken,
            refreshToken: refreshToken,
          });

          const resData = response.data?.data || response.data;
          const newToken =
            resData?.token ||
            resData?.accessToken ||
            resData?.access_token ||
            resData?.Token;
          const newRefreshToken =
            resData?.refresh_token ||
            resData?.refreshToken ||
            resData?.RefreshToken;

          if (!newToken) throw new Error("No new token received");

          setToken(newToken);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        } catch (err) {
          processQueue(err, undefined);
          logout();
          navigate("/");
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
