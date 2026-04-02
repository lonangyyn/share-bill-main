import { useEffect } from "react";
import { useAuth } from "../../features/auth/model/use-auth";
import { QueryProvider } from "./query-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <QueryProvider>{children}</QueryProvider>;
}
