import type { Task } from '../../store/useTaskStore';
import type { StudySession, CourseData } from '../../store/useStudyStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudyStore } from '../../store/useStudyStore';
import { AlertCircle, CalendarDays, Bolt, TrendingUp, BookOpen, Lightbulb, Target, FileDown, Swords, Shield, Zap, Trophy } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function DashboardView() {
  const { tasks } = useTaskStore();
  const { sessions, courses } = useStudyStore();

  const activeTasks = tasks.filter((t: Task) => t.status !== 'done');
  const criticalTasks = activeTasks.filter((t: Task) => {
    const diff = new Date(t.deadline).getTime() - Date.now();
    return diff > 0 && diff < 86400000 * 2; // < 48 hours
  });

  const totalStudyTime = sessions.reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);
  const weeklyStudyTime = sessions
    .filter((s: StudySession) => new Date(s.date).getTime() > Date.now() - 86400000 * 7)
    .reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);

  // Gamification calculations
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const xp = completedTasks * 100 + totalStudyTime * 2;
  const level = Math.floor(xp / 500) + 1;
  const xpProgress = ((xp % 500) / 500) * 100;

  const generateRecommendation = () => {
    if (criticalTasks.length > 0) {
      return `⚔️ Quest Urgent: "${criticalTasks[0].title}" mendekati deadline! Alokasikan 2 jam hari ini untuk menyelesaikannya.`;
    }
    const lowConfidenceSession = sessions.find(s => s.confidence <= 2);
    if (lowConfidenceSession) {
      return `📖 Skill Check: Materi "${lowConfidenceSession.topic}" perlu training ulang. Jadwalkan review session minggu ini.`;
    }
    return "✨ All clear, Commander! Semua quest terkendali. Gunakan waktu luang untuk grinding materi minggu depan.";
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 240, 255);
    doc.text('StudiKu Quest - Battle Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${dateStr} | Level ${level} | ${xp} XP`, 14, 30);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Player Stats Summary', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Stat', 'Value']],
      body: [
        ['Quests Completed', `${completedTasks}/${tasks.length}`],
        ['Total Training Time', `${(totalStudyTime / 60).toFixed(1)} Hours`],
        ['Skill Trees (Courses)', `${courses.length}`],
        ['Focus Sessions', `${sessions.length}`],
        ['Player Level', `Level ${level}`],
        ['Total XP', `${xp} XP`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 200, 220] },
    });

    // Tasks Section
    doc.setFontSize(16);
    doc.text('Quest Log', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Quest Title', 'Status', 'Deadline']],
      body: tasks.map(t => [t.title, t.status.toUpperCase(), new Date(t.deadline).toLocaleDateString('id-ID')]),
      theme: 'grid',
      headStyles: { fillColor: [0, 200, 220] },
    });

    // Study Sessions Section
    doc.setFontSize(16);
    doc.text('Training Log', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Topic', 'Skill Tree', 'Duration', 'Date']],
      body: sessions.map(s => [
        s.topic, 
        courses.find(c => c.id === s.courseId)?.name || 'N/A',
        `${s.durationMinutes}m`,
        new Date(s.date).toLocaleDateString('id-ID')
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 200, 220] },
    });

    doc.save(`Battle_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display">COMMAND CENTER</h1>
          <p className="text-text-muted text-lg max-w-2xl">Monitor status quest, power level, dan aktivitas training Anda.</p>
        </div>
        <div className="game-panel px-6 py-4 flex items-center gap-4 hover:scale-105 active:scale-[0.98] transition-all duration-300 group cursor-pointer">
          <div className="p-3 bg-neon-cyan/10 rounded-2xl group-hover:scale-110 transition-transform border border-neon-cyan/20">
            <Zap className="text-neon-cyan" size={24} />
          </div>
          <div>
            <div className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">Weekly Power</div>
            <div className="text-xl font-black tabular-nums text-neon-cyan">{(weeklyStudyTime / 60).toFixed(1)} <span className="text-xs text-text-muted/60">Jam</span></div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="game-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
              <Shield size={18} className="text-neon-cyan" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 font-display">Player Level</div>
              <div className="text-lg font-black text-text-main">Level {level} <span className="text-neon-gold text-sm font-display">{xp} XP</span></div>
            </div>
          </div>
          <div className="text-sm font-black text-neon-cyan font-display">{Math.round(xpProgress)}% → LVL {level + 1}</div>
        </div>
        <div className="xp-bar relative z-10">
          <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
        </div>
      </div>

      {/* Critical Alerts — URGENT QUEST */}
      {criticalTasks.length > 0 && (
        <div className="relative overflow-hidden game-panel bg-neon-red/[0.06] border-neon-red/20 p-6">
          <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none">
            <AlertCircle size={160} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-neon-red/20 rounded-2xl animate-pulse">
              <AlertCircle className="text-neon-red" size={24} />
            </div>
            <div>
              <p className="font-bold text-red-100">
                <span className="font-black text-[10px] uppercase tracking-widest bg-neon-red/30 text-neon-red px-3 py-1 rounded-lg mr-3 border border-neon-red/30 font-display">⚠ URGENT QUEST</span>
                Anda memiliki {criticalTasks.length} quest yang mendekati deadline dalam 48 jam!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats — Character Stats Panel */}
        <div className="game-panel p-8 flex flex-col gap-8">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
            <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
              <Trophy size={20} className="text-neon-gold" />
            </div>
            <span className="neon-gold-text">Player Stats</span>
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="stat-card">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">Quests Done</span>
              <span className="text-3xl font-black tabular-nums text-neon-cyan">{completedTasks}<span className="text-lg text-text-muted/40">/{tasks.length}</span></span>
            </div>
            <div className="stat-card">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">Training Time</span>
              <span className="text-3xl font-black tabular-nums text-neon-gold">{(totalStudyTime / 60).toFixed(1)}<span className="text-sm text-text-muted/40">j</span></span>
            </div>
            <div className="stat-card">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">Skill Trees</span>
              <span className="text-3xl font-black tabular-nums text-neon-purple">{courses.length}</span>
            </div>
            <div className="stat-card">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest font-display">Focus Sessions</span>
              <span className="text-3xl font-black tabular-nums text-neon-green">{sessions.length}</span>
            </div>
          </div>
        </div>

        {/* Actionable Recommendation — Daily Quest Briefing */}
        <div className="game-panel p-8 border-neon-cyan/20 bg-gradient-to-br from-[rgba(0,240,255,0.06)] to-[rgba(168,85,247,0.06)] text-text-main flex flex-col gap-6 group hover:translate-y-[-4px] transition-all duration-300 hover:border-neon-cyan/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
            <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
              <Swords size={20} className="text-neon-cyan" />
            </div>
            <span className="neon-cyan-text">Daily Quest Briefing</span>
          </h3>
          <p className="text-xl font-bold leading-relaxed text-text-main/90">
            {generateRecommendation()}
          </p>
          <div className="flex gap-4 p-5 bg-neon-gold/[0.04] rounded-3xl border border-neon-gold/10 text-xs leading-relaxed mt-auto">
             <Lightbulb size={24} className="text-neon-gold shrink-0" />
             <p className="opacity-70 font-medium italic text-text-muted">Tip: Belajar 25 menit fokus + 5 menit istirahat terbukti efektif untuk materi kompleks.</p>
          </div>
        </div>

        {/* Heatmap & Recent Activity — Activity Radar */}
        <div className="game-panel p-8 flex flex-col gap-6">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight font-display">
            <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
              <CalendarDays size={20} className="text-neon-cyan" />
            </div>
            <span className="neon-cyan-text">Activity Radar</span>
          </h3>
          
          <div className="flex flex-col gap-4">
            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
              {Array.from({ length: 28 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toISOString().split('T')[0];
                
                const daySessions = sessions.filter((s: StudySession) => s.date.startsWith(dateStr));
                const totalMins = daySessions.reduce((acc: number, s: StudySession) => acc + s.durationMinutes, 0);
                
                const intensity = totalMins > 120 ? 'high' : (totalMins > 30 ? 'med' : 'low');
                const bgClass = intensity === 'high' 
                  ? 'bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                  : (intensity === 'med' ? 'bg-neon-cyan/40' : 'bg-surface-2');
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-sm transition-all duration-300 hover:scale-[1.3] hover:z-20 cursor-help ${bgClass} relative`}
                    title={`${dateStr}: ${totalMins} menit`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-sm"></div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted/40 font-display">
              <span>Bulan Lalu</span>
              <span>Sekarang</span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Recent Training</h4>
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <p className="text-xs text-text-muted italic px-2">Belum ada sesi training hari ini.</p>
                ) : (
                  sessions.slice(-2).reverse().map((s: StudySession, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-2xl bg-surface-2 border border-neon-cyan/10 group/item hover:border-neon-cyan/25 transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tight">{s.topic}</span>
                        <span className="text-[10px] text-text-muted font-bold">{courses.find((c: CourseData) => c.id === s.courseId)?.name}</span>
                      </div>
                      <div className="text-xs font-black text-neon-cyan tabular-nums bg-neon-cyan/10 px-2 py-1 rounded-lg border border-neon-cyan/20">{s.durationMinutes}m</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <button 
            className="btn btn-neon mt-auto w-full h-14 justify-center rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] gap-3 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            onClick={handleDownloadReport}
          >
            <FileDown size={18} className="group-hover:scale-110 transition-transform" /> Download Battle Report
          </button>
        </div>
      </div>
    </div>
  );
}
