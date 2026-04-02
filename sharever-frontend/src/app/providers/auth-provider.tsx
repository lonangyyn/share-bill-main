import { useEffect } from "react";
import { useAuth } from "../../features/auth/model/use-auth";
import { getToken } from "../../shared/lib/storage";
import { userApi } from "../../entities/user/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuth();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    userApi
      .me()
      .then(setUser)
      .catch(() => logout());
  }, [setUser, logout]);

  return <>{children}</>;
}
