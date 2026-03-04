import type { Task } from '../../store/useTaskStore';
import type { StudySession, CourseData } from '../../store/useStudyStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useStudyStore } from '../../store/useStudyStore';
import { AlertCircle, CalendarDays, Bolt, TrendingUp, BookOpen, Lightbulb, Target } from 'lucide-react';

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

  const generateRecommendation = () => {
    if (criticalTasks.length > 0) {
      return `Prioritaskan "${criticalTasks[0].title}" yang akan segera deadline. Alokasikan 2 jam hari ini.`;
    }
    const lowConfidenceSession = sessions.find(s => s.confidence <= 2);
    if (lowConfidenceSession) {
      return `Materi "${lowConfidenceSession.topic}" memiliki skor confidence rendah. Jadwalkan review ulang minggu ini.`;
    }
    return "Semua terkendali! Gunakan waktu luang untuk mencicil materi minggu depan.";
  };

  const handleDownloadReport = () => {
    const csvContent = [
      ["Tipe", "Judul", "Status/Durasi", "Deadline/Tanggal"],
      ...tasks.map(t => ["Tugas", t.title, t.status, t.deadline]),
      ...sessions.map(s => ["Sesi Belajar", s.topic, `${s.durationMinutes}m`, s.date])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Produktivitas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gradient">Selamat Datang Kembali</h1>
          <p className="text-muted text-lg max-w-2xl">Ringkasan produktivitas dan target akademik berdasarkan data Anda.</p>
        </div>
        <div className="glass-panel px-6 py-4 flex items-center gap-4 bg-surface-2 border border-border-main rounded-3xl shadow-xl hover:scale-105 transition-transform duration-300">
          <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform">
            <Target className="text-indigo-400 cursor-pointer" size={24} />
          </div>
          <div>
            <div className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest">Weekly Focus</div>
            <div className="text-xl font-black tabular-nums">{(weeklyStudyTime / 60).toFixed(1)} <span className="text-xs text-text-muted/60">Jam</span></div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalTasks.length > 0 && (
        <div className="relative overflow-hidden glass-panel backdrop-blur-2xl bg-red-500/10 border border-red-500/20 p-6 rounded-[2.5rem] animate-pulse">
          <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none">
            <AlertCircle size={160} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-red-500/20 rounded-2xl">
              <AlertCircle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="font-bold text-red-100">
                <span className="font-black text-xs uppercase tracking-widest bg-red-500/30 px-2 py-0.5 rounded mr-3">Kritis</span>
                Anda memiliki {criticalTasks.length} tugas yang mendekati deadline dalam 48 jam.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats */}
        <div className="glass-panel p-8 bg-surface-1 border border-border-main rounded-[2.5rem] shadow-2xl flex flex-col gap-8">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Bolt size={20} className="text-yellow-400" fill="currentColor" />
            </div>
            Ringkasan Target
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest">Tugas Selesai</span>
              <span className="text-3xl font-black tabular-nums">{tasks.filter(t => t.status === 'done').length}/{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest">Total Belajar</span>
              <span className="text-3xl font-black tabular-nums">{(totalStudyTime / 60).toFixed(1)}<span className="text-sm">j</span></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest">Mata Kuliah</span>
              <span className="text-3xl font-black tabular-nums">{courses.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest">Sesi Fokus</span>
              <span className="text-3xl font-black tabular-nums">{sessions.length}</span>
            </div>
          </div>
        </div>

        {/* Actionable Recommendation */}
        <div className="glass-panel p-8 bg-linear-to-br from-indigo-600 to-purple-700 border border-white/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.3)] text-white flex flex-col gap-6 group hover:translate-y-[-4px] transition-all duration-300">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <BookOpen size={20} />
            </div>
            Analisis Fokus
          </h3>
          <p className="text-xl font-bold leading-relaxed text-indigo-50">
            {generateRecommendation()}
          </p>
          <div className="flex gap-4 p-5 bg-black/20 rounded-3xl border border-white/10 text-xs leading-relaxed backdrop-blur-md mt-auto text-white">
             <Lightbulb size={24} className="text-yellow-300 shrink-0" />
             <p className="opacity-80 font-medium italic">Tip: Belajar 25 menit fokus + 5 menit istirahat terbukti efektif untuk materi kompleks.</p>
          </div>
        </div>

        {/* Heatmap & Recent Activity */}
        <div className="glass-panel p-8 bg-surface-1 border border-border-main rounded-[2.5rem] shadow-2xl flex flex-col gap-6">
          <h3 className="text-lg font-black flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-surface-2 rounded-xl text-text-muted/60">
              <CalendarDays size={20} />
            </div>
            Intensitas Belajar
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
                const bgClass = intensity === 'high' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : (intensity === 'med' ? 'bg-indigo-500/40' : 'bg-surface-2');
                
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
            
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted/40">
              <span>Bulan Lalu</span>
              <span>Sekarang</span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Sesi Terbaru</h4>
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted italic px-2">Belum ada sesi belajar hari ini.</p>
                ) : (
                  sessions.slice(-2).reverse().map((s: StudySession, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-2xl bg-surface-2 border border-border-main group/item hover:bg-surface-2/80 transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tight">{s.topic}</span>
                        <span className="text-[10px] text-muted font-bold">{courses.find((c: CourseData) => c.id === s.courseId)?.name}</span>
                      </div>
                      <div className="text-xs font-black text-indigo-400 tabular-nums bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">{s.durationMinutes}m</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <button 
            className="btn btn-glass mt-auto w-full h-14 justify-center rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]"
            onClick={handleDownloadReport}
          >
            Unduh Laporan Semester
          </button>
        </div>
      </div>
    </div>
  );
}
