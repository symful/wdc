import { useState, useEffect, Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, CheckSquare, BookOpen, BarChart3, Menu, X, MessageSquare, Swords, Timer, Gamepad2, Map, ScrollText, GraduationCap, User, Shield, Radar } from 'lucide-react';
import { DashboardSkeleton } from '../ui/Skeleton';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudyStore } from '../../store/useStudyStore';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import { Languages } from 'lucide-react';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { tasks } = useTaskStore();
  const { sessions } = useStudyStore();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  // Gamification: calculate XP and Level
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const xp = completedTasks * 100 + totalStudyMinutes * 2; // 100 XP per task, 2 XP per study minute
  const level = Math.floor(xp / 500) + 1; // Level up every 500 XP
  const xpProgress = ((xp % 500) / 500) * 100;

  const navItems = [
    { to: "/", icon: <Radar size={20} />, label: t.common.commandCenter, badge: null },
    { to: "/academic", icon: <GraduationCap size={20} />, label: t.common.studyManager, badge: null },
    { to: "/tasks", icon: <ScrollText size={20} />, label: t.common.questBoard, badge: tasks.filter(t => t.status !== 'done').length || null },
    { to: "/study", icon: <Swords size={20} />, label: t.common.trainingArena, badge: null },
    { to: "/chat", icon: <MessageSquare size={20} />, label: t.common.guildHall, badge: null },
    { to: "/profile", icon: <User size={20} />, label: t.common.profile, badge: null },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''} transition-all duration-300 z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-neon-cyan/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Timer size={18} className="text-neon-cyan" />
            </div>
            <h1 className="text-xl font-black neon-cyan-text font-display tracking-wider">ontime!</h1>
          </div>
          <button className="p-2 lg:hidden text-text-main/60 hover:text-neon-cyan hover:scale-110 active:scale-95 transition-all cursor-pointer" onClick={toggleSidebar} id="mobile-close-btn">
            <X size={24} />
          </button>
        </div>
        
        {/* Player Stats Mini Card */}
        <div className="mx-6 mt-6 p-4 rounded-xl border border-neon-cyan/10 bg-neon-cyan/3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-neon-cyan/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
              <span className="text-sm font-black text-neon-cyan font-display">L{level}</span>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">{t.common.playerLevel}</div>
              <div className="text-sm font-bold text-text-main">{xp} <span className="text-neon-gold text-[10px] font-display">{t.common.xp}</span></div>
            </div>
          </div>
          <div className="xp-bar relative z-10">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-[9px] font-bold text-text-muted/40 mt-1.5 relative z-10 font-display tracking-wider">
            <span>LVL {level}</span>
            <span>LVL {level + 1}</span>
          </div>
        </div>

        <nav className="p-6 flex flex-col gap-1.5 flex-1 overflow-y-auto">
          <div className="text-text-muted/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 mb-3 font-display">{t.layout.navigation}</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative
                ${isActive 
                  ? 'bg-neon-cyan/8 text-neon-cyan font-bold border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]' 
                  : 'text-text-muted/60 hover:text-text-main hover:bg-white/3 border border-transparent'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-cyan rounded-r-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>}
                  <span className="shrink-0 opacity-80 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
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
        <div className="p-6 border-t border-neon-cyan/10">
          <div className="flex items-center gap-3 px-3 py-2 text-text-muted/30">
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.5)] animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] font-display">{t.common.systemOnline}</span>
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
              <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.5)] animate-pulse"></div>
              <h2 className="text-xs font-black tracking-[0.15em] font-display text-text-muted/60 hidden sm:block uppercase">{t.common.commandCenter}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 hover:bg-neon-cyan/10 rounded-lg border border-neon-cyan/10 transition-all group"
            >
              <Languages size={14} className="text-neon-cyan group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black font-display text-text-main uppercase tracking-widest">{language === 'id' ? 'ID' : 'EN'}</span>
            </button>
            {/* XP Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-gold/6 rounded-lg border border-neon-gold/15">
              <span className="text-neon-gold text-[10px] font-black font-display">{xp} {t.common.xp}</span>
            </div>
            {/* Season Badge */}
            <div className="px-3 py-1.5 bg-surface-1 rounded-lg border border-neon-cyan/10 text-[10px] font-black shadow-inner flex items-center gap-2 font-display">
              <span className="text-text-muted/40 uppercase tracking-wider hidden xs:inline">{t.common.season}:</span>
              <span className="text-neon-cyan">S2 2026</span>
            </div>
            {/* Level Badge */}
            <div className="px-3 py-1.5 bg-neon-cyan/6 rounded-lg border border-neon-cyan/15 flex items-center gap-2">
              <Shield size={12} className="text-neon-cyan" />
              <span className="text-neon-cyan text-[10px] font-black font-display">LVL {level}</span>
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
      <style>{`
        @media (min-width: 769px) {
          #mobile-menu-btn, #mobile-close-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
