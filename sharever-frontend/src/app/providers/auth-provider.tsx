import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/model/use-auth";
import { getToken } from "../../shared/lib/storage";
import { userApi } from "../../entities/user/api";
import { setupResponseInterceptor } from "../../shared/api/http";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuth();
  const navigate = useNavigate();

  // Setup response interceptor to handle 401 (token expired)
  useEffect(() => {
    setupResponseInterceptor(logout, navigate);
  }, [logout, navigate]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    userApi
      .me()
      .then(setUser)
      .catch((err) => {
        if (err.response?.status !== 401) {
          logout();
        }
      });
  }, [setUser, logout]);

  return <>{children}</>;
}
