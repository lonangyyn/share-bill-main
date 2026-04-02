import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/model/use-auth";

interface GuardProps {
  children: JSX.Element;
}

export function RequireAuth({ children }: GuardProps) {
  const isAuthed = useAuth((s) => s.isAuthed);
  const location = useLocation();

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
