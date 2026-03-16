import { useMemo } from 'react';
import { useTaskStore, Task } from '../../store/useTaskStore';
import { useStudyStore, StudySession } from '../../store/useStudyStore';
import { useAcademicStore } from '../../store/useAcademicStore';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import mockActivityData from '../../data/mockActivityData.json';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Calendar,
  Target,
  Lightbulb,
  Zap,
  Trophy,
  Flame,
  Star,
} from 'lucide-react';

export function StatsSection() {
  const { tasks } = useTaskStore();
  const { sessions } = useStudyStore();
  const { courses } = useAcademicStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const now = Date.now();
  const oneWeek = 7 * 86400000;

  // This week vs Last week
  const thisWeekSessions = sessions.filter(
    (s: StudySession) => new Date(s.date).getTime() > now - oneWeek
  );
  const lastWeekSessions = sessions.filter(
    (s: StudySession) => {
      const time = new Date(s.date).getTime();
      return time > now - 2 * oneWeek && time <= now - oneWeek;
    }
  );

  const thisWeekMinutes = thisWeekSessions.reduce((a: number, s: StudySession) => a + s.durationMinutes, 0);
  const lastWeekMinutes = lastWeekSessions.reduce((a: number, s: StudySession) => a + s.durationMinutes, 0);
  const minutesDiff = thisWeekMinutes - lastWeekMinutes;
  const minutesDiffPercent = lastWeekMinutes > 0 ? Math.round((minutesDiff / lastWeekMinutes) * 100) : (thisWeekMinutes > 0 ? 100 : 0);

  // Tasks by type
  const completedTasks = tasks.filter((t: Task) => t.status === 'done');
  const tasksByType = {
    tugas: completedTasks.filter((t: Task) => t.type === 'tugas').length,
    quiz: completedTasks.filter((t: Task) => t.type === 'quiz').length,
    ujian: completedTasks.filter((t: Task) => t.type === 'ujian').length,
  };

  // Most productive day
  const dayMinutes: Record<string, number> = {};
  sessions.forEach((s: StudySession) => {
    const dayName = new Date(s.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' });
    dayMinutes[dayName] = (dayMinutes[dayName] || 0) + s.durationMinutes;
  });
  const mostProductiveDay = Object.keys(dayMinutes).length > 0
    ? Object.entries(dayMinutes).sort((a, b) => b[1] - a[1])[0]
    : null;

  // 14-day chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' });
      const dateNum = d.getDate();
      
      const dummyDay = mockActivityData.find(d => d.date === dateStr);
      const realMins = sessions
        .filter((s: StudySession) => s.date.startsWith(dateStr))
        .reduce((a: number, s: StudySession) => a + s.durationMinutes, 0);
      
      const mins = realMins + (dummyDay?.durationMinutes || 0);
      return { dateStr, dayName, dateNum, mins };
    });
  }, [sessions, language]);
  const maxMins = Math.max(...chartData.map((d) => d.mins), 30) + 10;

  // Current streak
  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasSession = sessions.some((s: StudySession) => s.date.startsWith(dateStr));
      if (hasSession) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [sessions]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: { icon: any; text: string; color: string }[] = [];

    // Find low-confidence topics
    const lowConfSessions = sessions.filter((s: StudySession) => s.confidence <= 2);
    if (lowConfSessions.length > 0) {
      const topic = lowConfSessions[lowConfSessions.length - 1].topic;
      recs.push({
        icon: <Target size={16} />,
        text: language === 'id'
          ? `Review ulang materi "${topic}" — confidence masih rendah.`
          : `Review "${topic}" — confidence is still low.`,
        color: 'text-neon-red',
      });
    }

    // Suggest more study if dropped
    if (minutesDiff < 0) {
      recs.push({
        icon: <TrendingUp size={16} />,
        text: language === 'id'
          ? `Waktu belajar minggu ini ${Math.abs(minutesDiffPercent)}% lebih rendah dari minggu lalu. Ayo tingkatkan!`
          : `Study time is ${Math.abs(minutesDiffPercent)}% lower than last week. Let's push harder!`,
        color: 'text-neon-gold',
      });
    }

    // Streak encouragement
    if (streak >= 3) {
      recs.push({
        icon: <Flame size={16} />,
        text: language === 'id'
          ? `Streak ${streak} hari! Jangan putus, terus semangat! 🔥`
          : `${streak}-day streak! Don't break it, keep going! 🔥`,
        color: 'text-neon-green',
      });
    }

    // Study variety
    const courseStudied = new Set(thisWeekSessions.map((s: StudySession) => s.courseId));
    if (courses.length > 0 && courseStudied.size < Math.min(courses.length, 3)) {
      const unstudied = courses.find((c) => !courseStudied.has(c.id));
      if (unstudied) {
        recs.push({
          icon: <Lightbulb size={16} />,
          text: language === 'id'
            ? `Minggu ini kamu belum belajar "${unstudied.name}". Coba alokasikan waktu untuk itu.`
            : `You haven't studied "${unstudied.name}" this week. Try to allocate time for it.`,
          color: 'text-neon-cyan',
        });
      }
    }

    if (recs.length === 0) {
      recs.push({
        icon: <Star size={16} />,
        text: language === 'id'
          ? 'Performamu bagus! Terus pertahankan konsistensinya.'
          : 'Great performance! Keep up the consistency.',
        color: 'text-neon-cyan',
      });
    }

    return recs;
  }, [sessions, courses, streak, thisWeekSessions, minutesDiff, minutesDiffPercent, language]);

  const isUp = minutesDiff >= 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-lg font-black font-display neon-glow-text uppercase tracking-widest flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
            <BarChart3 size={20} className="text-neon-cyan" />
          </div>
          {language === 'id' ? 'STATISTIK PLAYER' : 'PLAYER STATISTICS'}
        </h3>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* This Week Study */}
        <div className="game-panel p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
              <Clock size={18} className="text-neon-cyan" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
              {language === 'id' ? 'BELAJAR MINGGU INI' : 'THIS WEEK STUDY'}
            </span>
          </div>
          <div className="text-3xl font-black tabular-nums text-neon-cyan">
            {(thisWeekMinutes / 60).toFixed(1)}
            <span className="text-sm text-text-muted/40 ml-1">{language === 'id' ? 'jam' : 'hrs'}</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${isUp ? 'text-neon-green' : 'text-neon-red'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{minutesDiffPercent}% vs {language === 'id' ? 'minggu lalu' : 'last week'}
          </div>
        </div>

        {/* Tasks Done */}
        <div className="game-panel p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/10 rounded-xl border border-neon-green/20">
              <CheckCircle2 size={18} className="text-neon-green" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
              {language === 'id' ? 'TASK SELESAI' : 'TASKS COMPLETED'}
            </span>
          </div>
          <div className="text-3xl font-black tabular-nums text-neon-green">
            {completedTasks.length}
            <span className="text-sm text-text-muted/40 ml-1">/ {tasks.length}</span>
          </div>
          <div className="flex gap-3 text-[9px] font-black text-text-muted/40">
            <span className="px-1.5 py-0.5 rounded bg-neon-gold/10 text-neon-gold border border-neon-gold/20">
              📝 {tasksByType.tugas}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
              📋 {tasksByType.quiz}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20">
              🎯 {tasksByType.ujian}
            </span>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="game-panel p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
              <Calendar size={18} className="text-neon-gold" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
              {language === 'id' ? 'HARI PALING PRODUKTIF' : 'MOST PRODUCTIVE DAY'}
            </span>
          </div>
          <div className="text-2xl font-black text-neon-gold">
            {mostProductiveDay ? mostProductiveDay[0] : '-'}
          </div>
          {mostProductiveDay && (
            <div className="text-[10px] font-bold text-text-muted/60">
              {(mostProductiveDay[1] / 60).toFixed(1)} {language === 'id' ? 'jam total' : 'total hours'}
            </div>
          )}
        </div>

        {/* Current Streak */}
        <div className="game-panel p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20">
              <Flame size={18} className="text-neon-red" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">
              {language === 'id' ? 'STREAK SAAT INI' : 'CURRENT STREAK'}
            </span>
          </div>
          <div className="text-3xl font-black tabular-nums text-neon-red">
            {streak}
            <span className="text-sm text-text-muted/40 ml-1">{language === 'id' ? 'hari' : 'days'}</span>
          </div>
          {streak >= 3 && (
            <div className="text-[10px] font-black text-neon-gold animate-pulse">🔥 On Fire!</div>
          )}
        </div>
      </div>

      {/* Progress Chart */}
      <div className="game-panel p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-purple/10 rounded-xl border border-neon-purple/20">
            <BarChart3 size={20} className="text-neon-purple" />
          </div>
          <h3 className="text-md font-black font-display neon-purple-text uppercase tracking-widest">
            {language === 'id' ? 'GRAFIK PROGRESS 14 HARI' : '14-DAY PROGRESS CHART'}
          </h3>
        </div>

        <div className="relative h-64 w-full flex gap-4">
          <div className="flex flex-col justify-between text-[8px] font-black text-text-muted/40 py-1 font-display">
            <span>{maxMins}m</span>
            <span>{Math.round(maxMins * 0.75)}m</span>
            <span>{Math.round(maxMins * 0.5)}m</span>
            <span>{Math.round(maxMins * 0.25)}m</span>
            <span>0m</span>
          </div>

          <div className="flex-1 relative flex items-end">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              ))}
              
              {chartData.map((d, i) => {
                const h = (d.mins / maxMins) * 100;
                const x = (i / 13) * 100;
                const isToday = i === 13;
                return (
                  <rect
                    key={i}
                    x={x - 2}
                    y={100 - h}
                    width="4"
                    height={h}
                    rx="1"
                    className={`transition-all duration-500 ${
                      isToday
                        ? 'fill-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                        : i >= 7
                        ? 'fill-neon-purple'
                        : 'fill-neon-purple/40'
                    }`}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex justify-between pl-8">
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className={`text-[7px] font-black uppercase tracking-wider ${i === 13 ? 'text-neon-cyan' : 'text-text-muted/30'}`}>
                {d.dayName}
              </span>
              <span className={`text-[9px] font-black ${i === 13 ? 'text-neon-cyan' : 'text-text-muted/50'}`}>
                {d.dateNum}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-6 justify-center text-[10px] font-bold text-text-muted/40 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-neon-purple/30" />
            <span>{language === 'id' ? 'Minggu lalu' : 'Last week'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-neon-purple/80" />
            <span>{language === 'id' ? 'Minggu ini' : 'This week'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-neon-cyan" />
            <span>{language === 'id' ? 'Hari ini' : 'Today'}</span>
          </div>
        </div>
      </div>

      {/* Personal Recommendations */}
      <div className="game-panel p-8 flex flex-col gap-6 border-neon-gold/20 bg-linear-to-br from-neon-gold/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
            <Lightbulb size={20} className="text-neon-gold" />
          </div>
          <h3 className="text-md font-black font-display neon-gold-text uppercase tracking-widest">
            {language === 'id' ? 'REKOMENDASI PERSONAL' : 'PERSONAL RECOMMENDATIONS'}
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface-2/60 border border-white/5 hover:border-neon-gold/20 transition-all group"
            >
              <div className={`p-2 rounded-xl bg-surface-2 border border-white/5 shrink-0 ${rec.color}`}>
                {rec.icon}
              </div>
              <p className="text-sm font-medium text-text-main/80 leading-relaxed">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
