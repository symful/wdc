import { Suspense, useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  GraduationCap,
  Menu,
  MessageSquare,
  Moon,
  Radar,
  ScrollText,
  Shield,
  Sun,
  Swords,
  User,
  X,
} from "lucide-react";
import { DashboardSkeleton } from "../ui/Skeleton";
import { NotificationToast } from "../ui/NotificationToast";
import { useTaskStore } from "../../store/useTaskStore";
import { useStudyStore } from "../../store/useStudyStore";
import { translations, useLanguageStore } from "../../store/useLanguageStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useAchievementStore } from "../../store/useAchievementStore";
import type { AchievementContext } from "../../store/useAchievementStore";
import { useAcademicStore } from "../../store/useAcademicStore";
import { useUIStore } from "../../store/useUIStore";
import { Languages } from "lucide-react";

export function Layout() {
  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    showNotifPanel,
    setShowNotifPanel,
  } = useUIStore();

  const { tasks } = useTaskStore();
  const { sessions } = useStudyStore();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { notifications, addNotification } = useNotificationStore();
  const { checkAchievements } = useAchievementStore();
  const { xpLogs } = useAcademicStore();

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Gamification: calculate XP and Level
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalStudyMinutes = sessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0,
  );
  const xp = xpLogs.reduce((acc, log) => acc + log.amount, 0);
  const level = Math.floor(xp / 1000) + 1;
  const xpProgress = ((xp % 1000) / 1000) * 100;
  const isInitialMount = useRef(true);

  // Achievement checking and deadline notifications
  useEffect(() => {
    // Check achievements
    const today = new Date().toISOString().split("T")[0];
    const sessionsToday = sessions.filter((s) =>
      s.date.startsWith(today)
    ).length;
    const hasNightSession = sessions.some((s) => {
      const hour = new Date(s.date).getHours();
      return hour >= 22 || hour < 4;
    });
    const hasSameDayTask = tasks.some((t) => {
      if (t.status !== "done" || !t.completedAt) return false;
      return t.createdAt.split("T")[0] === t.completedAt.split("T")[0];
    });

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hasSession = sessions.some((s) => s.date.startsWith(dateStr));
      if (hasSession) streak++;
      else if (i > 0) break;
    }

    const ctx: AchievementContext = {
      completedTasksCount: completedTasks,
      totalStudyMinutes,
      totalSessions: sessions.length,
      currentStreak: streak,
      hasNightSession,
      hasSameDayTask,
      totalTasksCreated: tasks.length,
      sessionsToday,
    };

    const newBadges = checkAchievements(ctx);
    newBadges.forEach((badge) => {
      addNotification({
        type: "badge",
        title: t.common.newBadge,
        message: `${language === "id" ? badge.title : badge.titleEn}`,
        icon: badge.icon,
        isToast: !isInitialMount.current,
      });
    });

    // Check deadline notifications
    const now = Date.now();
    tasks.forEach((task) => {
      if (task.status === "done") return;
      const deadline = new Date(task.deadline).getTime();
      const hoursLeft = (deadline - now) / 3600000;
      if (hoursLeft > 0 && hoursLeft < 24) {
        // Only show once per session
        const key = `deadline-notif-${task.id}-${today}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          addNotification({
            type: "deadline",
            title: t.common.deadlineApproaching,
            message: `"${task.title}" — ${
              t.common.hoursLeft(Math.round(hoursLeft))
            }`,
            autoDismiss: false,
            isToast: !isInitialMount.current,
          });
        }
      }
    });

    // Streak notification
    if (streak >= 3) {
      const streakKey = `streak-notif-${today}`;
      if (!sessionStorage.getItem(streakKey)) {
        sessionStorage.setItem(streakKey, "1");
        addNotification({
          type: "streak",
          title: language === "id" ? "Streak Aktif!" : "Streak Active!",
          message: `${streak} ${
            language === "id"
              ? "hari berturut-turut! Jangan putus!"
              : "day streak! Keep it going!"
          }`,
          icon: "🔥",
          isToast: !isInitialMount.current,
        });
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [tasks, sessions, checkAchievements, addNotification, t, language, completedTasks, totalStudyMinutes]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    {
      to: "/",
      icon: <Radar size={20} />,
      label: t.common.commandCenter,
      badge: null,
    },
    {
      to: "/academic",
      icon: <GraduationCap size={20} />,
      label: t.common.studyManager,
      badge: null,
    },
    {
      to: "/tasks",
      icon: <ScrollText size={20} />,
      label: t.common.taskBoard,
      badge: tasks.filter((t) => t.status !== "done").length || null,
    },
    {
      to: "/study",
      icon: <Swords size={20} />,
      label: t.common.trainingArena,
      badge: null,
    },
    {
      to: "/chat",
      icon: <MessageSquare size={20} />,
      label: t.common.guildHall,
      badge: null,
    },
    {
      to: "/profile",
      icon: <User size={20} />,
      label: t.common.profile,
      badge: null,
    },
  ];

  return (
    <div className="app-container">
      {/* Notification Toasts */}
      <NotificationToast />

      {/* Global Click-to-close for panels */}
      {showNotifPanel && (
        <div
          className="fixed inset-0 z-100 w-full h-full bg-transparent cursor-default"
          onClick={() => setShowNotifPanel(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar flex flex-col ${
          sidebarOpen ? "open" : ""
        } transition-all duration-300 z-50`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-neon-cyan/10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black neon-cyan-text font-display tracking-wider">
              ontime!
            </h1>
          </div>
          <button
            className="p-2 lg:hidden text-text-main/60 hover:text-neon-cyan hover:scale-110 active:scale-95 transition-all cursor-pointer"
            onClick={toggleSidebar}
            id="mobile-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Player Stats Mini Card */}
        <div className="mx-6 mt-6 p-4 rounded-xl border border-neon-cyan/10 bg-neon-cyan/3 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-20 h-20 bg-neon-cyan/5 rounded-full blur-2xl">
          </div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
              <span className="text-sm font-black text-neon-cyan font-display">
                L{level}
              </span>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
                {t.common.playerLevel}
              </div>
              <div className="text-sm font-bold text-text-main">
                {xp}{" "}
                <span className="text-neon-gold text-[10px] font-display">
                  {t.common.xp}
                </span>
              </div>
            </div>
          </div>
          <div className="xp-bar relative z-10">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}>
            </div>
          </div>
          <div className="flex justify-between text-[9px] font-bold text-text-muted/40 mt-1.5 relative z-10 font-display tracking-wider">
            <span>LVL {level}</span>
            <span>LVL {level + 1}</span>
          </div>
        </div>

        <nav className="p-6 flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0">
          <div className="text-text-muted/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 mb-3 font-display">
            {t.layout.navigation}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative
                ${
                isActive
                  ? "bg-neon-cyan/8 text-neon-cyan font-bold border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]"
                  : "text-text-muted/60 hover:text-text-main hover:bg-white/3 border border-transparent"
              }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-cyan rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                    </div>
                  )}
                  <span className="shrink-0 opacity-80 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-black bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded-md border border-neon-cyan/20 font-display">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-neon-cyan/10 flex flex-col gap-4 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="flex-1 flex items-center gap-3 px-4 py-3 bg-surface-2 hover:bg-neon-cyan/10 rounded-xl border border-neon-cyan/10 transition-all group"
            >
              <Languages
                size={18}
                className="text-neon-cyan group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-black font-display text-text-main uppercase tracking-widest leading-none">
                {language === "id" ? "ID" : "EN"}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-3 bg-surface-2 hover:bg-neon-gold/10 rounded-xl border border-neon-cyan/10 transition-all group"
              title={theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"}
            >
              {theme === "dark"
                ? (
                  <Sun
                    size={18}
                    className="text-neon-gold group-hover:scale-110 group-hover:rotate-45 transition-all"
                  />
                )
                : (
                  <Moon
                    size={18}
                    className="text-neon-purple group-hover:scale-110 group-hover:-rotate-12 transition-all"
                  />
                )}
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-1 text-text-muted/30">
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.5)] animate-pulse">
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] font-display">
              {t.common.systemOnline}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main flex flex-col min-h-screen">
        {/* Header (Game HUD Top Bar) */}
        <header className="h-16 px-6 flex items-center justify-between bg-sidebar-bg/80 backdrop-blur-md border-b border-neon-cyan/10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-text-muted/60 hover:text-neon-cyan bg-surface-1 rounded-lg border border-border-main hover:border-neon-cyan/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              onClick={toggleSidebar}
              id="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.5)] animate-pulse">
              </div>
              <h2 className="text-xs font-black tracking-[0.15em] font-display text-text-muted/60 hidden sm:block uppercase">
                {t.common.commandCenter}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Notification Bell + Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifPanel(!showNotifPanel);
                  if (!showNotifPanel) {
                    useNotificationStore.getState().markAllAsRead();
                  }
                }}
                className="relative p-2 rounded-lg bg-surface-1 border border-border-main hover:border-neon-cyan/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Bell size={16} className="text-text-muted/60" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-red text-[8px] font-black text-white rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(255,49,49,0.5)]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifPanel && (
                <div className="fixed md:absolute right-2 md:right-0 top-20 md:top-full md:mt-2 left-2 md:left-auto w-auto md:w-80 max-h-[70vh] md:max-h-96 z-150 bg-bg-main rounded-2xl border border-neon-cyan/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-neon-cyan" />
                      <span className="text-xs font-black uppercase tracking-widest font-display text-text-main">
                        {language === "id" ? "Notifikasi" : "Notifications"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {notifications.length > 0 && (
                        <button
                          onClick={() =>
                            useNotificationStore.getState().clearAll()}
                          className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-text-muted/70 hover:text-neon-red px-2 md:px-3 py-2 rounded-lg hover:bg-neon-red/10 transition-all"
                        >
                          {language === "id" ? "Hapus" : "Clear"}
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifPanel(false)}
                        className="md:hidden p-2 text-text-muted/50 hover:text-neon-red transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0
                      ? (
                        <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-3 text-text-muted/20">
                          <Bell size={24} className="md:size-28" />
                          <span className="text-[10px] font-black uppercase tracking-widest font-display">
                            {language === "id"
                              ? "Tidak ada notifikasi"
                              : "No notifications"}
                          </span>
                        </div>
                      )
                      : (
                        notifications.slice(0, 15).map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-2 md:gap-3 p-3 md:p-4 border-b border-white/5 hover:bg-white/3 transition-all group ${
                              !notif.read ? "bg-neon-cyan/3" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] md:text-[10px] font-black uppercase tracking-wider font-display text-text-main mb-0.5">
                                {notif.title}
                              </div>
                              <div className="text-[10px] md:text-[11px] text-text-muted leading-relaxed line-clamp-2">
                                {notif.message}
                              </div>
                              <div className="text-[8px] font-bold text-text-muted/30 mt-1 font-display">
                                {new Date(notif.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                useNotificationStore.getState()
                                  .dismissNotification(notif.id);
                              }}
                              className="p-1.5 md:p-2.5 text-text-muted/50 hover:text-neon-red opacity-100 transition-all hover:scale-125 shrink-0"
                            >
                              <X size={16} className="md:size-5" />
                            </button>
                          </div>
                        ))
                      )}
                  </div>
                </div>
              )}
            </div>
            {/* XP Display */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-neon-gold/6 rounded-lg border border-neon-gold/15 shrink-0">
              <span className="text-neon-gold text-[10px] font-black font-display">
                {xp} {t.common.xp}
              </span>
            </div>
            {/* Season Badge */}
            <div className="hidden sm:flex px-3 py-1.5 bg-surface-1 rounded-lg border border-neon-cyan/10 text-[10px] font-black shadow-inner items-center gap-2 font-display shrink-0">
              <span className="text-text-muted/40 uppercase tracking-wider">
                {t.common.season}:
              </span>
              <span className="text-neon-cyan">S2 2026</span>
            </div>
            {/* Level Badge */}
            <div className="flex px-2 sm:px-3 py-1.5 bg-neon-cyan/6 rounded-lg border border-neon-cyan/15 items-center gap-2 shrink-0">
              <Shield size={12} className="text-neon-cyan" />
              <span className="text-neon-cyan text-[10px] font-black font-display">
                L{level}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="app-content p-6 lg:p-10 flex-1 overflow-x-hidden">
          <Suspense fallback={<DashboardSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dynamic styles for mobile visibility */}
      <style>
        {`
        @media (min-width: 769px) {
          #mobile-menu-btn, #mobile-close-btn { display: none !important; }
        }
      `}
      </style>
    </div>
  );
}
