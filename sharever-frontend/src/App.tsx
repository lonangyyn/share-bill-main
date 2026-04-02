import { AppProvider } from "./app/providers/app-provider";
import { AppRouter } from "./app/router/router";

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
