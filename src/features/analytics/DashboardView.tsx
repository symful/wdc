import { useMemo, useState, useEffect } from 'react';
import type { Task } from '../../store/useTaskStore';
import type { StudySession } from '../../store/useStudyStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudyStore } from '../../store/useStudyStore';
import { useAcademicStore } from '../../store/useAcademicStore';
import { 
  AlertCircle, 
  Zap, 
  Swords, 
  Timer, 
  Lightbulb, 
  Clock, 
  MapPin, 
  ChevronRight, 
  User, 
  GraduationCap, 
  ClipboardList, 
  Sparkles,
  Search,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useLanguageStore, translations } from '../../store/useLanguageStore';

export function DashboardView() {
  const { tasks } = useTaskStore();
  const { sessions } = useStudyStore();
  const { courses: academicCourses, activeSemesterId, studyPlan, generateStudyPlan } = useAcademicStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const [generationState, setGenerationState] = useState<{
    isActive: boolean;
    isExiting: boolean;
    step: number;
    completed: boolean;
  }>({ isActive: false, isExiting: false, step: 0, completed: false });

  const steps = [
    { title: language === 'id' ? 'Analisis jadwal minggu ini' : 'Analyzing weekly schedule', icon: <CalendarRange size={20} /> },
    { title: language === 'id' ? 'Membuat prioritas' : 'Creating priority mapping', icon: <BarChart3 size={20} /> },
    { title: language === 'id' ? 'Menyusun jadwal' : 'Developing schedule', icon: <Search size={20} /> },
  ];

  const handleGenerate = () => {
    setGenerationState({ isActive: true, isExiting: false, step: 0, completed: false });
    
    // Simulate steps
    const timers = [
      setTimeout(() => setGenerationState(s => ({ ...s, step: 1 })), 1000),
      setTimeout(() => setGenerationState(s => ({ ...s, step: 2 })), 2000),
      setTimeout(() => setGenerationState(s => ({ ...s, step: 3, completed: true })), 3000),
      setTimeout(() => {
        setGenerationState(s => ({ ...s, isExiting: true }));
        generateStudyPlan(sessions);
        setTimeout(() => {
          setGenerationState({ isActive: false, isExiting: false, step: 0, completed: false });
        }, 600); // Time for fade out
      }, 4500),
    ];

    return () => timers.forEach(clearTimeout);
  };

  // Logic for stats (still needed for XP/Level calculation)
  const totalStudyTime = sessions.reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);
  const weeklyStudyTime = sessions
    .filter((s: StudySession) => new Date(s.date).getTime() > Date.now() - 86400000 * 7)
    .reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const xp = completedTasks * 100 + totalStudyTime * 2;
  const level = Math.floor(xp / 500) + 1;
  const xpProgress = ((xp % 500) / 500) * 100;

  const activeTasks = tasks.filter((t: Task) => t.status !== 'done');
  const criticalTasks = activeTasks.filter((t: Task) => {
    const diff = new Date(t.deadline).getTime() - Date.now();
    return diff > 0 && diff < 86400000 * 2;
  });

  const generateRecommendation = () => {
    if (criticalTasks.length > 0) {
      return t.dashboard.recommendationUrgent(criticalTasks[0].title);
    }
    const lowConfidenceSession = sessions.find(s => s.confidence <= 2);
    if (lowConfidenceSession) {
      return t.dashboard.recommendationReview(lowConfidenceSession.topic);
    }
    return t.dashboard.recommendationClear;
  };

  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // Convert Sun-Sat to Mon-Sun (0-6)
  const [selectedDayIndex, setSelectedDayIndex] = useState(dayIndex);
  
  const selectedSchedules = useMemo(() => {
    const schedules: any[] = [];
    const filteredCourses = academicCourses.filter(c => c.semesterId === activeSemesterId);
    
    filteredCourses.forEach(course => {
      course.schedules.forEach(sch => {
        if (sch.day === selectedDayIndex) {
          schedules.push({
            ...sch,
            courseName: course.name,
            courseCode: course.code,
            type: course.type
          });
        }
      });
    });
    return schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [academicCourses, selectedDayIndex, activeSemesterId]);

  const weekDays = useMemo(() => {
    const days = [];
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(first + i);
        days.push({
            index: i,
            date: d.getDate(),
            dayName: d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
            isToday: d.toDateString() === new Date().toDateString()
        });
    }
    return days;
  }, [language]);

  const selectedDateStr = useMemo(() => {
    const d = new Date();
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1;
    d.setDate(first + selectedDayIndex);
    return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDayIndex, language]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">{t.dashboard.title}</h1>
          <p className="text-text-muted text-lg max-w-2xl">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex gap-4 items-stretch">
          <div className="game-panel px-6 py-4 flex items-center gap-4 hover:scale-105 active:scale-[0.98] transition-all duration-300 group cursor-pointer h-14 min-w-45">
            <div className="p-2 bg-neon-cyan/10 rounded-xl group-hover:scale-110 transition-transform border border-neon-cyan/20">
              <Zap className="text-neon-cyan" size={20} />
            </div>
            <div>
              <div className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display leading-tight">{t.dashboard.weeklyPower}</div>
              <div className="text-lg font-black tabular-nums text-neon-cyan leading-tight">{(weeklyStudyTime / 60).toFixed(1)} <span className="text-xs text-text-muted/60">{t.dashboard.hours}</span></div>
            </div>
          </div>
          <button 
            className="btn btn-glass px-8 h-14 rounded-2xl font-black uppercase tracking-widest gap-3 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 whitespace-nowrap"
            onClick={handleGenerate}
            disabled={generationState.isActive}
          >
            <Sparkles size={20} className="text-neon-cyan group-hover:animate-pulse" />
            {t.dashboard.generateStudyPlan}
          </button>
        </div>
      </div>

      {/* Generation Overlay */}
      {generationState.isActive && (
        <div className={`fixed inset-0 z-200 bg-bg-main/90 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-700 ease-in-out ${generationState.isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className={`game-panel p-10 max-w-md w-full border-neon-cyan/20 flex flex-col gap-8 shadow-[0_0_50px_rgba(0,240,255,0.1)] relative overflow-hidden transition-all duration-700 transform ${generationState.isExiting ? 'scale-90 opacity-0 blur-sm' : 'scale-100 opacity-100'}`}>
            {/* HUD Scanning Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-0 bg-linear-to-b from-neon-cyan/10 to-transparent animate-scan-line h-1/2"></div>
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10">
               <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  {generationState.completed ? (
                    <CheckCircle2 size={32} className="text-neon-green animate-in zoom-in duration-500" />
                  ) : (
                    <Sparkles size={32} className="text-neon-cyan animate-pulse" />
                  )}
               </div>
               <h3 className="text-2xl font-black tracking-tight font-display neon-glow-text uppercase">
                 {generationState.completed ? (language === 'id' ? 'Selesai' : 'Completed') : (language === 'id' ? 'Generating Plan...' : 'Generating Plan...')}
               </h3>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              {steps.map((s, idx) => (
                <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${generationState.step >= idx ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
                  <div className={`p-2 rounded-lg border transition-all duration-300 ${generationState.step > idx ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : generationState.step === idx ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan animate-pulse' : 'bg-surface-2 border-white/5 text-text-muted/40'}`}>
                    {generationState.step > idx ? <CheckCircle2 size={20} /> : s.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold transition-colors ${generationState.step === idx ? 'text-text-main' : generationState.step > idx ? 'text-text-muted/60' : 'text-text-muted/20'}`}>
                      {s.title}
                    </span>
                    {generationState.step === idx && !generationState.completed && (
                      <div className="w-32 h-0.5 bg-neon-cyan/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-neon-cyan animate-pixel-shimmer w-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Final Success Step */}
              <div className={`flex items-center gap-4 transition-all duration-500 ${generationState.completed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                <div className="p-2 rounded-lg border bg-neon-green/10 border-neon-green/30 text-neon-green">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-sm font-black text-neon-green uppercase tracking-widest font-display">
                  {language === 'id' ? 'Selesai' : 'Completed'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-surface-2/50 border border-neon-cyan/5 text-[9px] font-mono text-text-muted/40 uppercase tracking-[0.2em] relative z-10 text-center">
              System initialization... 0x{Math.random().toString(16).substr(2, 6).toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {studyPlan.length > 0 && (
        <div className="game-panel p-6 bg-neon-cyan/5 border-neon-cyan/20 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
              <ClipboardList size={18} className="text-neon-cyan" />
            </div>
            <h3 className="text-xs font-black tracking-[0.2em] font-display text-neon-cyan uppercase">{t.dashboard.todayStudyPlan}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyPlan.map((plan, idx) => {
              const course = academicCourses.find(c => c.id === plan.courseId);
              return (
                <div key={idx} className="p-4 rounded-xl bg-surface-2 border border-neon-cyan/10 flex flex-col gap-2">
                  <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">{course?.name}</div>
                  <div className="font-bold text-sm text-text-main line-clamp-1">{plan.topicTitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neon-cyan/5 text-neon-cyan/60 border border-neon-cyan/10">Target: 1h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Alerts and Briefing */}
        <div className="lg:col-span-12 flex flex-col gap-8">
          {/* Critical Alerts */}
          {criticalTasks.length > 0 && (
            <div className="relative overflow-hidden game-panel bg-neon-red/6 border-neon-red/20 p-6">
              <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none">
                <AlertCircle size={160} />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-neon-red/20 rounded-2xl animate-pulse">
                  <AlertCircle className="text-neon-red" size={24} />
                </div>
                <div>
                  <p className="font-bold text-red-100 italic">
                    <span className="font-black text-[10px] uppercase tracking-widest bg-neon-red/30 text-neon-red px-3 py-1 rounded-lg mr-3 border border-neon-red/30 font-display not-italic">⚠ {t.dashboard.urgentTask}</span>
                    {t.dashboard.urgentTaskSubtitle(criticalTasks.length)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Briefing */}
          <div className="game-panel p-8 border-neon-cyan/20 bg-linear-to-br from-[rgba(0,240,255,0.06)] to-[rgba(168,85,247,0.06)] text-text-main flex flex-col gap-6 group hover:border-neon-cyan/40 transition-all duration-300">
            <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
              <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
                <Swords size={20} className="text-neon-cyan" />
              </div>
              <span className="neon-cyan-text">{t.dashboard.dailyBriefing}</span>
            </h3>
            <p className="text-xl font-bold leading-relaxed text-text-main/90">
              {generateRecommendation()}
            </p>
            <div className="flex gap-4 p-6 bg-neon-gold/5 rounded-3xl border border-neon-gold/20 text-sm md:text-base leading-relaxed mt-auto shadow-[0_0_20px_rgba(255,215,0,0.05)]">
               <Lightbulb size={28} className="text-neon-gold shrink-0" />
               <p className="font-bold italic text-text-main/80">{t.dashboard.tip}</p>
            </div>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="lg:col-span-12">
          <div className="game-panel p-8 flex flex-col gap-8 border-neon-cyan/10">
            {/* Header: Date and Week */}
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold text-text-muted/60">{selectedDateStr}</div>
                  <h2 className="text-4xl font-black neon-cyan-text font-display uppercase tracking-tight">
                    {selectedDayIndex === dayIndex ? 'Today' : (language === 'id' ? t.academic.days[selectedDayIndex] : weekDays[selectedDayIndex].dayName)}
                  </h2>
                </div>
              </div>

              {/* Day Selector */}
              <div className="flex justify-between items-center px-2">
                {weekDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => setSelectedDayIndex(d.index)}>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${d.isToday ? 'text-neon-cyan' : (selectedDayIndex === i ? 'text-neon-cyan/60' : 'text-text-muted/40 group-hover:text-text-muted')}`}>{d.dayName}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${d.isToday ? 'bg-neon-cyan text-bg-main shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-110' : (selectedDayIndex === i ? 'border-2 border-neon-cyan/40 text-neon-cyan' : 'text-text-muted/60 hover:bg-surface-2')}`}>
                      {d.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="flex flex-col gap-0 relative pl-12 mt-4 min-h-50">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-10 w-0.5 bg-linear-to-b from-neon-cyan/30 via-neon-cyan/10 to-transparent"></div>
              
              {!activeSemesterId ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted/20 italic text-center">
                   <AlertCircle size={40} />
                   <p className="font-bold tracking-widest uppercase text-xs">No active semester selected</p>
                   <a href="#/profile" className="text-[10px] text-neon-cyan underline uppercase font-black">Go to Profile to select</a>
                </div>
              ) : selectedSchedules.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-muted/20 italic text-center">
                   <Clock size={40} />
                   <p className="font-extrabold tracking-widest uppercase text-sm">
                     {language === 'id' ? 'Hari ini kosong, selamat beristirahat' : 'Today is empty, have a good rest'}
                   </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {selectedSchedules.map((sch, i) => (
                    <div key={i} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-9.25 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-bg-main border-2 border-neon-cyan flex items-center justify-center z-10 shadow-[0_0_10px_rgba(0,240,255,0.2)] group-hover:scale-125 transition-transform duration-300">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                      </div>

                      {/* Schedule Card */}
                      <div className="game-panel bg-surface-2/40 hover:bg-surface-2 group-hover:border-neon-cyan/30 transition-all duration-300 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 cursor-pointer relative overflow-hidden">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h4 className="text-lg md:text-xl font-black tracking-tight group-hover:text-neon-cyan transition-colors leading-tight">{sch.courseName}</h4>
                            
                            {/* Time Badge - Mobile Only */}
                            <div className="flex md:hidden items-center">
                              <span className="px-3 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-black text-neon-cyan uppercase tracking-wider font-mono">
                                {sch.startTime} - {sch.endTime}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-text-muted/60 text-[10px] md:text-xs font-bold">
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-neon-cyan/40" /> {sch.room || 'TBA'}</span>
                            <span className="flex items-center gap-1.5"><User size={14} className="text-neon-cyan/40" /> {sch.lecturer || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Time Badge - Desktop Only */}
                          <span className="hidden md:inline-block px-5 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-xs md:text-sm font-black text-neon-cyan uppercase tracking-wider font-mono">
                            {sch.startTime} - {sch.endTime}
                          </span>
                          
                          <div className="hidden md:flex p-2 rounded-full bg-neon-cyan/5 text-neon-cyan opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
