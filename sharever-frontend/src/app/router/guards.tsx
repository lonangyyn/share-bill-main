import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/model/use-auth";
import type { JSX } from "react";

interface GuardProps {
  children: JSX.Element;
}

export function RequireAuth({ children }: GuardProps) {
  const isAuthed = useAuth((s) => s.isAuthed);
  const booting = useAuth((s) => s.booting);
  const location = useLocation();

  // Hiển thị màn hình chờ nếu trạng thái xác thực đang được kiểm tra (booting)
  if (booting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
