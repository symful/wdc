import { useState } from 'react';
import { useAcademicStore, SemesterType } from '../../store/useAcademicStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudyStore, StudySession } from '../../store/useStudyStore';
import { useAchievementStore } from '../../store/useAchievementStore';
import { Timer } from 'lucide-react';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import mockActivityData from '../../data/mockActivityData.json';
import { 
  User, 
  Settings, 
  Plus, 
  Trash2, 
  Calendar, 
  GraduationCap, 
  Trophy, 
  Shield, 
  CalendarDays,
  X,
  ChevronDown,
  History,
  Swords,
  Zap,
  Info,
  LineChart
} from 'lucide-react';

export function ProfileView() {
  const { 
    semesters, 
    courses: academicCourses, 
    activeSemesterId, 
    addSemester, 
    deleteSemester, 
    setActiveSemester,
    xpLogs
  } = useAcademicStore();
  
  const { tasks } = useTaskStore();
  const { sessions } = useStudyStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  const { achievements } = useAchievementStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [form, setForm] = useState({
    number: semesters.length + 1,
    year: '2023/2024',
    type: 'ganjil' as SemesterType,
    totalSks: 0
  });
  const [chartView, setChartView] = useState<'sessions' | 'tasks'>('sessions');

  const activeSemester = semesters.find(s => s.id === activeSemesterId);

  // Stats from Dashboard
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const totalStudyTime = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  
  // Real XP from Logs
  const xp = xpLogs.reduce((acc, log) => acc + log.amount, 0);
  const level = Math.floor(xp / 1000) + 1; // 1000 XP per level
  const xpProgress = ((xp % 1000) / 1000) * 100;

  const handleAddSemester = () => {
    addSemester(form);
    setShowAddModal(false);
    setForm({
      number: semesters.length + 2,
      year: '2023/2024',
      type: 'ganjil',
      totalSks: 0
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">{t.profile.title}</h1>
          <p className="text-text-muted text-lg max-w-2xl">{t.profile.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Semester Management */}
        <div className="lg:col-span-1 order-1">
          <div className="game-panel p-8 flex flex-col gap-6 h-full">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
                <GraduationCap size={20} className="text-neon-cyan" />
              </div>
              <span className="neon-cyan-text">{t.profile.semester}</span>
            </h3>

            {semesters.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer pr-12"
                    value={activeSemesterId || ''}
                    onChange={(e) => setActiveSemester(e.target.value)}
                  >
                    {semesters.map(s => (
                      <option key={s.id} value={s.id} className="bg-bg-main">
                        {t.profile.semester} {s.number} - {s.year} ({s.type === 'ganjil' ? t.profile.ganjil : t.profile.genap})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none" size={20} />
                </div>
                
                <button 
                  className="btn btn-glass w-full h-12 justify-center rounded-xl text-xs font-black uppercase tracking-widest gap-2"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} /> {t.profile.addSemester}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                <p className="text-text-muted text-sm text-center italic">{t.profile.noSemester}</p>
                <button 
                  className="btn btn-primary w-full h-14 justify-center rounded-2xl text-xs font-black uppercase tracking-widest gap-2"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={20} /> {t.profile.addSemester}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Player Level Card (order 2 on mobile) */}
        <div className="lg:col-span-1 order-2 lg:order-3">
          <div className="game-panel p-6 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-all"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
                  <Trophy size={18} className="text-neon-cyan" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">{t.common.playerLevel}</div>
                  <div className="text-lg font-black text-text-main leading-none mt-1">
                    Level {level} <span className="text-neon-gold text-xs ml-2 tabular-nums">{xp} XP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="xp-bar relative z-10 h-1.5 mb-2">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-text-muted/40 mb-8 font-display">
               <span>{Math.round(xpProgress)}%</span>
               <span>LVL {level + 1}</span>
            </div>

            <div className="flex-1"></div>

            <button 
              className="mt-4 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/5 hover:border-neon-cyan/20 transition-all cursor-pointer font-display"
              onClick={() => setShowLogModal(true)}
            >
               View Full Activity Log
            </button>
          </div>
        </div>

        {/* Base Stats Panel (order 3 on mobile) */}
        <div className="lg:col-span-2 order-3 lg:order-2">
          <div className="game-panel p-8 h-full">
            <h3 className="text-lg font-black flex items-center gap-3 mb-8 tracking-tight font-display">
              <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
                <Trophy size={20} className="text-neon-gold" />
              </div>
              <span className="neon-gold-text">{t.profile.statsTitle}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="stat-card">
                <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">{t.dashboard.tasksDone}</span>
                <span className="text-3xl font-black tabular-nums text-neon-cyan">{completedTasks}<span className="text-lg text-text-muted/40">/{tasks.length}</span></span>
              </div>
              <div className="stat-card">
                <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">{t.dashboard.trainingTime}</span>
                <span className="text-3xl font-black tabular-nums text-neon-gold">{(totalStudyTime / 60).toFixed(1)}<span className="text-sm text-text-muted/40">{t.dashboard.hours.toLowerCase().charAt(0)}</span></span>
              </div>
              <div className="stat-card">
                <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">{t.dashboard.skillTrees}</span>
                <span className="text-3xl font-black tabular-nums text-neon-purple">{academicCourses.length}</span>
              </div>
              <div className="stat-card">
                <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">{t.dashboard.focusSessions}</span>
                <span className="text-3xl font-black tabular-nums text-neon-green">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Trend Line Chart */}
        <div className="lg:col-span-2 order-4">
          <TrendChart 
            sessions={sessions} 
            tasks={tasks} 
            view={chartView} 
            setView={setChartView}
            language={language}
          />
        </div>

        {/* Trophy Case - Achievement Badges */}
        <div className="lg:col-span-3 order-5">
          <div className="game-panel p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
                <Trophy size={20} className="text-neon-gold" />
              </div>
              <span className="neon-gold-text uppercase tracking-widest">{language === 'id' ? 'Trophy Case' : 'Trophy Case'}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((ach) => {
                const isUnlocked = !!ach.unlockedAt;
                const rarityColors = {
                  common: 'border-neon-green/20 bg-neon-green/5',
                  rare: 'border-neon-blue/20 bg-neon-blue/5',
                  legendary: 'border-neon-gold/20 bg-neon-gold/5',
                };
                const rarityGlow = {
                  common: '',
                  rare: isUnlocked ? 'shadow-[0_0_15px_rgba(77,124,255,0.15)]' : '',
                  legendary: isUnlocked ? 'shadow-[0_0_20px_rgba(255,215,0,0.2)]' : '',
                };
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center gap-3 group relative overflow-hidden ${
                      isUnlocked
                        ? `${rarityColors[ach.rarity]} ${rarityGlow[ach.rarity]} hover:scale-105`
                        : 'border-white/5 bg-surface-2/30 opacity-40 grayscale'
                    }`}
                  >
                    <div className={`text-3xl transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-125 group-hover:rotate-12' : ''}`}>
                      {ach.icon}
                    </div>
                    <div>
                      <div className={`text-xs font-black uppercase tracking-wide font-display ${
                        isUnlocked ? 'text-text-main' : 'text-text-muted/40'
                      }`}>
                        {language === 'id' ? ach.title : ach.titleEn}
                      </div>
                      <div className="text-[10px] text-text-muted/60 mt-1">
                        {language === 'id' ? ach.description : ach.descriptionEn}
                      </div>
                    </div>
                    {isUnlocked && (
                      <div className="text-[8px] font-black uppercase tracking-widest text-neon-gold/60 font-display">
                        {new Date(ach.unlockedAt!).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest font-display">🔒 Locked</div>
                    )}
                    {isUnlocked && ach.rarity === 'legendary' && (
                      <div className="absolute inset-0 bg-linear-to-t from-neon-gold/5 to-transparent pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Monitor (Heatmap) */}
        <div className="lg:col-span-3 order-6">
          <div className="game-panel p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-green/10 rounded-xl border border-neon-green/20">
                <CalendarDays size={20} className="text-neon-green" />
              </div>
              <span className="neon-green-text uppercase tracking-widest">Activity Monitor</span>
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
                {Array.from({ length: 28 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (27 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  
                  const daySessions = sessions.filter((s: StudySession) => s.date.startsWith(dateStr));
                  const totalMins = daySessions.reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);
                  
                  // Gradient logic: 0 to 120 mins maps to 0.1 to 1.0 opacity
                  const opacity = totalMins === 0 ? 0.05 : Math.min(1, 0.3 + (totalMins / 100));
                  
                  return (
                    <div 
                      key={i} 
                      className="aspect-square rounded-sm transition-all duration-300 hover:scale-[1.2] hover:z-20 cursor-help relative"
                      style={{ 
                        backgroundColor: `rgba(57, 255, 20, ${opacity})`,
                        boxShadow: totalMins > 60 ? `0 0 10px rgba(57, 255, 20, ${opacity}), 0 0 20px rgba(57, 255, 20, ${opacity * 0.5})` : 'none',
                        border: totalMins > 0 ? `1px solid rgba(57, 255, 20, ${Math.max(0.2, opacity)})` : '1px solid rgba(255,255,255,0.05)'
                      }}
                      title={`${dateStr}: ${totalMins} menit`}
                    >
                      {totalMins > 60 && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-sm"></div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/40 font-display">
                <span>{language === 'id' ? 'BULAN LALU' : 'LAST MONTH'}</span>
                <span>{language === 'id' ? 'SEKARANG' : 'NOW'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Semester Button at Bottom */}
      {activeSemester && (
        <div className="flex justify-center mt-12 pb-12">
          <button 
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-neon-red/10 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-neon-red/20 text-neon-red hover:bg-neon-red/20 transition-all group font-display"
            onClick={() => deleteSemester(activeSemester.id)}
          >
            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">{t.profile.deleteSemester}</span>
          </button>
        </div>
      )}

      {/* Add Semester Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-md w-full flex flex-col gap-8 border-neon-cyan/20">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">{t.profile.addSemester}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.profile.semesterNumber}</label>
                <input 
                  type="number" 
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all font-mono"
                  value={form.number}
                  onChange={(e) => setForm(s => ({ ...s, number: parseInt(e.target.value) }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.profile.academicYear}</label>
                <input 
                  type="text" 
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all"
                  placeholder="e.g. 2023/2024"
                  value={form.year}
                  onChange={(e) => setForm(s => ({ ...s, year: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.profile.semesterType}</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm(s => ({ ...s, type: e.target.value as SemesterType }))}
                  >
                    <option value="ganjil" className="bg-bg-main">{t.profile.ganjil}</option>
                    <option value="genap" className="bg-bg-main">{t.profile.genap}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.profile.totalSks}</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all"
                    value={form.totalSks}
                    onChange={(e) => setForm(s => ({ ...s, totalSks: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary h-16 w-full text-lg mt-2 font-display"
              onClick={handleAddSemester}
            >
              {t.profile.addSemester}
            </button>
          </div>
        </div>
      )}
      {/* Full Activity Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-150 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="game-panel p-8 max-w-2xl w-full flex flex-col gap-8 border-neon-cyan/20 max-h-[85vh] shadow-[0_0_80px_rgba(0,240,255,0.05)]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neon-cyan/10 rounded-2xl border border-neon-cyan/20">
                    <History size={24} className="text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text uppercase">Full Activity Log</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 mt-1">Player XP gain history record</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLogModal(false)} 
                  className="p-3 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer border border-transparent hover:border-neon-cyan/20"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                {xpLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-20 italic">
                    <Shield size={40} />
                    <p className="font-bold uppercase tracking-widest text-xs">No records available</p>
                  </div>
                ) : (
                  [...xpLogs].reverse().map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-5 rounded-2xl bg-surface-2/40 border border-white/5 hover:border-neon-cyan/30 transition-all duration-300 group/logitem">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted/40 group-hover/logitem:text-neon-cyan group-hover/logitem:bg-neon-cyan/5 transition-all">
                          {log.source.includes('Streak') ? <Zap size={18} /> : 
                           log.source.includes('Mastery') ? <Trophy size={18} /> : 
                           log.source.includes('Training') ? <Swords size={18} /> : <Shield size={18} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-text-main group-hover/logitem:text-neon-cyan transition-colors">{log.source}</span>
                          <span className="text-[10px] font-bold text-text-muted/40 font-mono mt-0.5">
                            {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-black text-neon-gold tabular-nums">+{log.amount}</div>
                        <div className="text-[8px] font-black text-neon-gold/40 uppercase tracking-widest">EXP POINTS</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-5 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Info size={16} className="text-neon-cyan/60" />
                   <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-wide">Total Accumulation</span>
                </div>
                <div className="text-xl font-black text-neon-cyan tabular-nums">{xp} XP</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function TrendChart({ sessions, tasks, view, setView, language }: { sessions: any[], tasks: any[], view: 'sessions' | 'tasks', setView: any, language: string }) {
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dateDay = d.getDate().toString().padStart(2, '0');
    const dateMonth = (d.getMonth() + 1).toString().padStart(2, '0');
    const dayName = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' });
    return { dateStr, dateDay, dateMonth, dayName };
  });

  const data = last7Days.map(day => {
    const dummyDay = mockActivityData.find(d => d.date === day.dateStr);
    const daySessions = (sessions.filter((s: any) => s.date.startsWith(day.dateStr)).length) + (dummyDay?.sessions || 0);
    const dayTasks = (tasks.filter((t: any) => 
      (t.completedAt || t.deadline).startsWith(day.dateStr) && t.status === 'done'
    ).length) + (dummyDay?.tasks || 0);
    return { ...day, sessions: daySessions, tasks: dayTasks } as { sessions: number, tasks: number, dateStr: string, dateDay: string, dateMonth: string, dayName: string };
  });

  const maxVal = Math.max(...data.map(d => d[view] as number), 1) + 2;
  
  const getPath = (key: 'sessions' | 'tasks') => {
    const points = data.map((d, i) => {
      const x = (i / 6) * 100;
      const y = 100 - (d[key] / maxVal) * 100;
      return `${x},${y}`;
    }).join(' ');
    return points;
  };

  return (
    <div className="game-panel p-8 flex flex-col gap-6 h-full min-h-75">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
          <div className="p-2 bg-neon-purple/10 rounded-xl border border-neon-purple/20">
            <LineChart size={20} className="text-neon-purple" />
          </div>
          <span className="neon-purple-text uppercase tracking-widest">Activity Trend</span>
        </h3>
        <div className="flex bg-surface-2 p-1 rounded-xl border border-white/5">
          {(['sessions', 'tasks'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === v ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20' : 'text-text-muted/40 hover:text-text-main'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative mt-8 h-48 flex gap-4">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-[8px] font-black text-text-muted/40 py-1 font-display">
          <span>{maxVal}</span>
          <span>{Math.round(maxVal * 0.75)}</span>
          <span>{Math.round(maxVal * 0.5)}</span>
          <span>{Math.round(maxVal * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="flex-1 relative">
          {/* SVG Chart */}
          <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ))}
            
            {/* Sessions Path */}
            <polyline
              fill="none"
              stroke="var(--color-neon-green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={getPath('sessions')}
              style={{ opacity: view === 'sessions' ? 1 : 0.1 }}
              className={view === 'sessions' ? 'drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]' : ''}
            />

            {/* Tasks Path */}
            <polyline
              fill="none"
              stroke="var(--color-neon-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={getPath('tasks')}
              style={{ opacity: view === 'tasks' ? 1 : 0.1 }}
              className={view === 'tasks' ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : ''}
            />

            {/* Selected Data Points */}
            {data.map((d, i) => (
              <circle 
                key={i} 
                cx={(i / 6) * 100} 
                cy={100 - ((d[view] as number) / maxVal) * 100} 
                r="2" 
                fill={view === 'sessions' ? 'var(--color-neon-green)' : 'var(--color-neon-cyan)'} 
                className="shadow-lg"
              />
            ))}
          </svg>
        </div>
      </div>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between pl-8 pr-0">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[7px] font-black text-text-muted/30 uppercase tracking-widest font-display leading-tight mb-1">{d.dayName}</span>
            <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest font-display leading-tight">{d.dateDay}</span>
            <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest font-display leading-tight">{d.dateMonth}</span>
          </div>
        ))}
      </div>
      
      <div className="flex gap-6 mt-4 pt-4 border-t border-white/5 justify-center">
        <div className={`flex items-center gap-2 transition-opacity ${view === 'sessions' ? 'opacity-100' : 'opacity-20'}`}>
          <div className="w-2 h-2 rounded-full bg-neon-green"></div>
          <span className="text-[10px] font-bold text-text-muted/60 uppercase">Sessions</span>
        </div>
        <div className={`flex items-center gap-2 transition-opacity ${view === 'tasks' ? 'opacity-100' : 'opacity-20'}`}>
          <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
          <span className="text-[10px] font-bold text-text-muted/60 uppercase">Tasks</span>
        </div>
      </div>
    </div>
  );
}
