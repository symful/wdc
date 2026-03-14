import { lazy, Suspense, useState, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardSkeleton, KanbanSkeleton, ScheduleSkeleton } from './components/ui/Skeleton';
import { SplashScreen } from './components/splash/SplashScreen';

const DashboardView = lazy(() => import('./features/analytics/DashboardView').then(m => ({ default: m.DashboardView })));
const ScheduleView = lazy(() => import('./features/schedule/ScheduleView').then(m => ({ default: m.ScheduleView })));
const KanbanBoard = lazy(() => import('./features/tasks/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
const StudyView = lazy(() => import('./features/study/StudyView').then(m => ({ default: m.StudyView })));
const ChatView = lazy(() => import('./features/chat/ChatView').then(m => ({ default: m.ChatView })));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardView />
          </Suspense>
        )
      },
      {
        path: "schedule",
        element: (
          <Suspense fallback={<ScheduleSkeleton />}>
            <ScheduleView />
          </Suspense>
        )
      },
      {
        path: "tasks",
        element: (
          <Suspense fallback={<KanbanSkeleton />}>
            <KanbanBoard />
          </Suspense>
        )
      },
      {
        path: "study",
        element: (
          <Suspense fallback={<DashboardSkeleton />}>
            <StudyView />
          </Suspense>
        )
      },
      {
        path: "chat",
        element: (
          <Suspense fallback={<DashboardSkeleton />}>
            <ChatView />
          </Suspense>
        )
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

const SPLASH_KEY = 'studiku-splash-seen';

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem(SPLASH_KEY)
  );

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <RouterProvider router={router} />
    </>
  );
}

