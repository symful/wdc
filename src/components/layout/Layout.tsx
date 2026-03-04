import { useState, useEffect, Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, CheckSquare, BookOpen, BarChart3, Menu, X, Moon, Sun, MessageSquare } from 'lucide-react';
import { DashboardSkeleton } from '../ui/Skeleton';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('wdc-theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('wdc-theme') as 'dark' | 'light';
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const navItems = [
    { to: "/", icon: <BarChart3 size={20} />, label: "Dashboard" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "Jadwal Waktu" },
    { to: "/tasks", icon: <CheckSquare size={20} />, label: "Tugas & Kanban" },
    { to: "/study", icon: <BookOpen size={20} />, label: "Rencana Belajar" },
    { to: "/chat", icon: <MessageSquare size={20} />, label: "Grup Chat P2P" },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''} bg-sidebar-bg backdrop-blur-3xl border-r border-border-main transition-all duration-300 z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-border-main">
          <h1 className="text-2xl font-black text-gradient">StudiKu</h1>
          <button className="p-2 lg:hidden text-text-main/60 hover:text-text-main hover:scale-110 active:scale-95 transition-all cursor-pointer" onClick={toggleSidebar} id="mobile-close-btn">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-6 flex flex-col gap-2 flex-1 overflow-y-auto">
          <div className="text-text-main/40 text-[10px] font-black uppercase tracking-widest px-3 mb-2">Menu Utama</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                ${isActive 
                  ? 'bg-indigo-500/15 text-indigo-400 font-bold border-l-4 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                  : 'text-text-main/60 hover:text-text-main hover:bg-white/5 border-l-4 border-transparent'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="shrink-0 opacity-80 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-6 border-t border-white/10">
          <button 
            className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-text-main font-bold rounded-2xl border border-border-main transition-all hover:scale-110 active:scale-95 group cursor-pointer" 
            onClick={toggleTheme}
            id="sidebar-theme-toggle"
          >
            <div className={`transition-all duration-500 group-hover:rotate-12 ${theme === 'dark' ? 'rotate-0 text-yellow-400' : 'rotate-180 text-indigo-500'}`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className="text-sm opacity-80">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main flex flex-col min-h-screen">
        {/* Header (Mobile menu & Topbar) */}
        <header className="h-20 px-6 flex items-center justify-between bg-sidebar-bg backdrop-blur-md border-b border-border-main sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-text-main/60 hover:text-text-main bg-surface-subtle rounded-xl border border-border-main hover:scale-110 active:scale-95 transition-all cursor-pointer" 
              onClick={toggleSidebar} 
              id="mobile-menu-btn"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-extrabold tracking-tight hidden sm:block">Portal Akademik</h2>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              className="p-2.5 bg-surface-subtle border border-border-main rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer group shadow-sm" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className={`transition-all duration-500 group-hover:rotate-12 ${theme === 'dark' ? 'text-yellow-400' : 'text-indigo-500 rotate-180'}`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
            </button>
            <div className="px-4 py-2 bg-surface-subtle rounded-full border border-border-main text-[10px] md:text-xs font-bold shadow-inner flex items-center gap-2">
              <span className="text-text-main/40 uppercase tracking-tighter hidden xs:inline">Semester:</span>
              <span className="text-indigo-400">Genap 2026</span>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
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
