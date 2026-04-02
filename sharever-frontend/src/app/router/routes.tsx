// src/app/router/routes.tsx
import { RequireAuth } from "./guards";

import AuthLayout from "../layouts/auth-layout";
import MainLayout from "../layouts/main-layout";

import HomePage from "../../pages/home/home-page";
import LoginPage from "../../pages/auth/login-page";
import RegisterPage from "../../pages/auth/register-page";
import VerifyPage from "../../pages/auth/verify-page";
import InvitePage from "../../pages/invite/invite-page";

import EventsListPage from "../../pages/dashboard/events-list-page";
import EventDetailPage from "../../pages/event/event-detail-page";
import ActivityPage from "../../pages/activity/activity-page";
import ProfilePage from "../../pages/profile/profile-page";
import NotFoundPage from "../../pages/not-found";
import ExpensesPage from "../../pages/expenses/expenses-page";
import AccountsPage from "../../pages/accounts/accounts-page"
export const routes = [
  // HOME PUBLIC
  {
    path: "/",
    element: <HomePage />,
  },

  // AUTH PUBLIC
  {
    path: "/login",
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: "/verify",
    element: (
      <AuthLayout>
        <VerifyPage />
      </AuthLayout>
    ),
  },
  {
    path: "/invite/:eventId",
    element: <InvitePage />,
  },

  // APP (cần đăng nhập)
  {
  path: "/app",
  element: <MainLayout />,  // 👉 bỏ RequireAuth
  children: [
    { index: true, element: <EventsListPage /> },
    { path: "events/:eventId", element: <EventDetailPage /> },
    { path: "activity", element: <ActivityPage /> },
    { path: "profile", element: <ProfilePage /> },
    { path: "expenses", element: <ExpensesPage/>},
    { path: "accounts", element: <AccountsPage/>},
  ],
},


  // 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
