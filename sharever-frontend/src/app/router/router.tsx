import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
