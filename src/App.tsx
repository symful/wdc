import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardSkeleton, KanbanSkeleton, ScheduleSkeleton } from './components/ui/Skeleton';
import { Swords } from 'lucide-react';
import { SplashScreen } from './components/splash/SplashScreen';
import { useAcademicStore } from './store/useAcademicStore';
import { useStudyStore } from './store/useStudyStore';
import { useLanguageStore } from './store/useLanguageStore';
import semester2Data from './data/semesters/semester_2.json';

const DashboardView = lazy(() => import('./features/analytics/DashboardView').then(m => ({ default: m.DashboardView })));
const StudyManagerView = lazy(() => import('./features/study/StudyManagerView').then(m => ({ default: m.StudyManagerView })));
const ProfileView = lazy(() => import('./features/profile/ProfileView').then(m => ({ default: m.ProfileView })));
const MissionBoard = lazy(() => import('./features/tasks/MissionBoard').then(m => ({ default: m.MissionBoard })));
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
        path: "academic",
        element: (
          <Suspense fallback={<ScheduleSkeleton />}>
            <StudyManagerView />
          </Suspense>
        )
      },
      {
        path: "tasks",
        element: (
          <Suspense fallback={<KanbanSkeleton />}>
            <MissionBoard />
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
        path: "profile",
        element: (
          <Suspense fallback={<DashboardSkeleton />}>
            <ProfileView />
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

import { useRPGAudio } from './hooks/useRPGAudio';

function GlobalAudio() {
  useRPGAudio();
  return null;
}

const SPLASH_KEY = 'ontime-splash-seen';

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem(SPLASH_KEY)
  );

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  }, []);

  const { semesters, courses, xpLogs, importData } = useAcademicStore();
  const { sessions, setSessions } = useStudyStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    // Auto-initialize if empty (to ensure semester file is loaded)
    if (semesters.length === 0 || courses.length === 0 || xpLogs.length === 0) {
      importData({
        semesters: [semester2Data.semester] as any,
        courses: semester2Data.courses as any,
        xpLogs: semester2Data.xpLogs as any
      });
    }
    
    // Initialize sessions if empty
    if (sessions.length === 0 && semester2Data.sessions) {
      setSessions(semester2Data.sessions as any);
    }
  }, [semesters.length, courses.length, xpLogs.length, sessions.length, importData, setSessions]);

  const hasSemester = semesters.length > 0;

  return (
    <>
      <GlobalAudio />
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <>
          {!hasSemester && (
            <div className="fixed inset-0 z-200 bg-bg-main flex items-center justify-center p-6">
              <div className="game-panel p-10 max-w-md w-full border-neon-cyan/20 text-center flex flex-col gap-8 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-neon-cyan/10 rounded-3xl border border-neon-cyan/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,240,255,0.2)] text-neon-cyan">
                  <Swords size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black neon-glow-text uppercase mb-2">
                    {language === 'id' ? 'DILEMA AKADEMIK' : 'Setup Required'}
                  </h2>
                  <p className="text-text-muted">
                    {language === 'id' 
                      ? 'Komandan, kami butuh parameter akademik Anda sebelum musim baru bisa dimulai.' 
                      : 'Commander, we need your academic parameters before we can begin the season.'}
                  </p>
                </div>
                <a 
                  href="/profile" 
                  className="btn btn-primary h-16 w-full text-lg uppercase tracking-widest font-display"
                >
                  {language === 'id' ? 'KONFIGURASI PROFIL' : 'Configure Profile'}
                </a>
              </div>
            </div>
          )}
          <RouterProvider router={router} />
        </>
      )}
    </>
  );
}

