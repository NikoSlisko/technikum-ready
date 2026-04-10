import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { ReihungstestPage } from "../pages/ReihungstestPage";
import { StudyPrepPage } from "../pages/StudyPrepPage";
import { HabitsPage } from "../pages/HabitsPage";
import { JournalPage } from "../pages/JournalPage";
import { SettingsPage } from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "reihungstest", element: <ReihungstestPage /> },
      { path: "study-prep", element: <StudyPrepPage /> },
      { path: "habits", element: <HabitsPage /> },
      { path: "journal", element: <JournalPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

