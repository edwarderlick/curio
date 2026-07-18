import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", lazy: () => import("@/pages/LandingPage").then((m) => ({ Component: m.LandingPage })) },
      { path: "/explore", lazy: () => import("@/pages/ExplorePage").then((m) => ({ Component: m.ExplorePage })) },
      { path: "/search", lazy: () => import("@/pages/SearchPage").then((m) => ({ Component: m.SearchPage })) },
      { path: "/lecture/:id", lazy: () => import("@/pages/LectureDetailPage").then((m) => ({ Component: m.LectureDetailPage })) },
      { path: "/lecture/:id/watch", lazy: () => import("@/pages/LecturePlayerPage").then((m) => ({ Component: m.LecturePlayerPage })) },
      { path: "/creator/:id", lazy: () => import("@/pages/CreatorProfilePage").then((m) => ({ Component: m.CreatorProfilePage })) },
      { path: "/studio", lazy: () => import("@/pages/StudioDashboardPage").then((m) => ({ Component: m.StudioDashboardPage })) },
      { path: "/studio/upload", lazy: () => import("@/pages/StudioUploadPage").then((m) => ({ Component: m.StudioUploadPage })) },
      { path: "/studio/content", lazy: () => import("@/pages/StudioContentPage").then((m) => ({ Component: m.StudioContentPage })) },
      { path: "/studio/earnings", lazy: () => import("@/pages/StudioEarningsPage").then((m) => ({ Component: m.StudioEarningsPage })) },
      { path: "/account", lazy: () => import("@/pages/AccountSettingsPage").then((m) => ({ Component: m.AccountSettingsPage })) },
      { path: "/notifications", lazy: () => import("@/pages/NotificationsPage").then((m) => ({ Component: m.NotificationsPage })) },
      { path: "*", lazy: () => import("@/pages/NotFoundPage").then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
]);
