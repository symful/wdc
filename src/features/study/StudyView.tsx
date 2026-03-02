import { useState, useEffect } from 'react';
import type { CourseData, StudySession } from '../../store/useStudyStore';
import { useStudyStore } from '../../store/useStudyStore';
import { Play, Square, Timer, Target, BrainCircuit, CheckCircle2, X, Plus } from 'lucide-react';

export function StudyView() {
  const { courses, sessions, activeSession, startSession, endSession, addCourse, deleteCourse } = useStudyStore();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [elapsed, setElapsed] = useState<number>(0);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // New/Edit Course Form
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [targetHours, setTargetHours] = useState(20);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession.startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (activeSession.startTime as number)) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession.startTime]);

  const handleStart = () => {
    if (!selectedCourse || !topic) return;
    startSession(selectedCourse, topic);
  };

  const handleEnd = (confidence: number) => {
    endSession(confidence);
    setShowConfidenceModal(false);
    setTopic('');
  };

  const handleSaveCourse = () => {
    if (!courseName) return;
    if (editingCourseId) {
      useStudyStore.getState().updateCourse(editingCourseId, { name: courseName, targetHours });
    } else {
      addCourse(courseName, targetHours);
    }
    setCourseName('');
    setTargetHours(20);
    setEditingCourseId(null);
    setShowCourseModal(false);
  };

  const openEditCourse = (course: CourseData) => {
    setEditingCourseId(course.id);
    setCourseName(course.name);
    setTargetHours(course.targetHours);
    setShowCourseModal(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (courseId: string) => {
    const course = courses.find((c: CourseData) => c.id === courseId);
    if (!course) return 0;
    const totalMinutes = sessions.filter((s: StudySession) => s.courseId === courseId).reduce((acc: number, curr: StudySession) => acc + curr.durationMinutes, 0);
    const progress = (totalMinutes / (course.targetHours * 60)) * 100;
    return Math.min(Math.round(progress), 100);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gradient">Aktivitas Belajar</h1>
          <p className="text-muted text-lg max-w-2xl">Atur target belajar dan pantau progres mata kuliah Anda secara detail.</p>
        </div>
        <button 
          className="btn btn-glass px-6 border-indigo-500/10 hover:border-indigo-500/30"
          onClick={() => setShowCourseModal(true)}
        >
          <Target size={20} className="text-indigo-400" />
          <span className="font-black uppercase tracking-widest text-[10px]">Kelola Mata Kuliah</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Timer Panel */}
        <div className="lg:col-span-2 glass-panel flex flex-col items-center justify-center p-10 bg-surface-1 backdrop-blur-xl rounded-[2.5rem] border border-border-main shadow-2xl relative overflow-hidden group min-h-[500px]">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className={`p-8 rounded-full mb-8 transition-all duration-700 relative z-10 ${activeSession.startTime ? 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : 'bg-surface-2'}`}>
            <Timer size={64} className={activeSession.startTime ? "text-indigo-400" : "text-text-muted"} />
          </div>
          
          {activeSession.startTime ? (
            <div className="flex flex-col items-center justify-center gap-8 w-full relative z-10">
              <div className="text-7xl font-black font-mono tracking-tighter text-gradient tabular-nums">
                {formatTime(elapsed)}
              </div>
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-2xl font-black tracking-tight">{activeSession.topic}</div>
                <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-widest">
                  {courses.find(c => c.id === activeSession.courseId)?.name}
                </div>
              </div>

              <button 
                className="btn bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl shadow-red-500/20"
                onClick={() => setShowConfidenceModal(true)}
              >
                <Square size={20} fill="currentColor" /> Akhiri Sesi
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8 w-full relative z-10">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Mata Kuliah</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="" className="bg-bg-main">-- Pilih Mata Kuliah --</option>
                    {courses.map((c: CourseData) => (
                      <option key={c.id} value={c.id} className="bg-bg-main">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Topik Belajar</label>
                  <input 
                    type="text" 
                    className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-text-muted/30"
                    placeholder="Misal: Latihan Integral Partisi" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>
              <button 
                className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xl 
                  ${(!selectedCourse || !topic) 
                    ? 'bg-surface-2 text-text-muted/20 cursor-not-allowed border border-border-main' 
                    : 'btn-primary'}`}
                onClick={handleStart}
                disabled={!selectedCourse || !topic}
              >
                <Play size={20} fill="currentColor" /> Mulai Sesi Fokus
              </button>
            </div>
          )}
        </div>

        {/* Study Plan Status Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-8 bg-surface-subtle backdrop-blur-md rounded-[2.5rem] border border-border-main">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <Target size={24} className="text-indigo-400" /> 
              Target Semester Ini
            </h3>
            
            <div className="flex flex-col gap-8">
              {courses.map((c: CourseData) => (
                <div key={c.id} className="flex flex-col gap-3 group/item">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{c.name}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 rounded-lg text-indigo-400/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                            onClick={() => openEditCourse(c)}
                            title="Edit Mata Kuliah"
                          >
                            <BrainCircuit size={14} />
                          </button>
                          <button 
                            className="p-1.5 rounded-lg text-red-500/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            onClick={() => deleteCourse(c.id)}
                            title="Hapus Mata Kuliah"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-muted/60 tracking-tight uppercase">
                        {Math.floor(sessions.filter((s: StudySession) => s.courseId === c.id).reduce((sum: number, curr: StudySession) => sum + curr.durationMinutes, 0) / 60)}j {sessions.filter((s: StudySession) => s.courseId === c.id).reduce((sum: number, curr: StudySession) => sum + curr.durationMinutes, 0) % 60}m / {c.targetHours} Jam
                      </div>
                    </div>
                    <div className="text-2xl font-black text-gradient tabular-nums">{calculateProgress(c.id)}%</div>
                  </div>
                  <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden p-[2px] border border-border-main">
                    <div 
                      className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      style={{ width: `${calculateProgress(c.id)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel p-8 bg-surface-1 backdrop-blur-md rounded-[2.5rem] border border-border-main flex-1">
            <h4 className="text-lg font-black mb-6 flex items-center gap-3">
              <BrainCircuit size={22} className="text-indigo-400" /> 
              Riwayat Log Belajar Terbaru
            </h4>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-text-muted/40 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-border-main flex items-center justify-center">
                  <Play size={24} className="opacity-20" />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Belum ada sesi yang terekam.<br/>Ayo mulai sekarang!</p>
              </div>
            ) : (
                <div className="flex flex-col gap-4">
                  {sessions.slice(-3).reverse().map((s: StudySession) => (
                    <div key={s.id} className="group/session flex justify-between items-center p-5 bg-surface-2 hover:bg-surface-2/80 rounded-2xl border border-border-main transition-all duration-300">
                      <div className="flex flex-col gap-1 text-left">
                        <div className="font-bold text-sm group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.topic}</div>
                        <div className="text-xs font-bold text-text-muted/60">{courses.find((c: CourseData) => c.id === s.courseId)?.name}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-lg font-black tabular-nums">{s.durationMinutes}m</div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                          Skor {s.confidence}/5
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence Modal */}
      {showConfidenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="glass-panel p-10 flex flex-col items-center gap-10 max-w-lg w-full bg-surface-subtle border border-border-main rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                <CheckCircle2 size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-3xl font-black mb-3 tracking-tight">Sesi Selesai!</h3>
              <p className="text-muted text-lg font-medium opacity-80">Seberapa percaya diri Anda dengan materi tadi?</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-text-main">
              {[1, 2, 3, 4, 5].map(rating => (
                <button 
                  key={rating}
                  className="w-16 h-16 rounded-2xl bg-surface-2 hover:bg-indigo-500 text-xl font-black transition-all duration-300 transform hover:scale-110 active:scale-90 hover:shadow-xl hover:shadow-indigo-500/30 border border-border-main hover:border-indigo-400 group"
                  onClick={() => handleEnd(rating)}
                >
                  <span className="group-hover:scale-125 transition-transform inline-block">{rating}</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] uppercase font-black tracking-widest text-text-muted/40">Skor 1 (Rendah) — Skor 5 (Sangat Paham)</p>
          </div>
        </div>
      )}

      {/* Manual Course Management Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="glass-panel p-8 max-w-2xl w-full bg-bg-main border border-border-main rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight">
                {editingCourseId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
              </h3>
              <button 
                className="p-2 hover:bg-surface-2 rounded-full transition-colors"
                onClick={() => { setShowCourseModal(false); setEditingCourseId(null); setCourseName(''); }}
              >
                <X size={24} className="text-text-muted" />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Nama Mata Kuliah</label>
                  <input 
                    type="text" 
                    className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="Misal: Kecerdasan Buatan"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Target Jam (Semester)</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    value={targetHours}
                    onChange={(e) => setTargetHours(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {editingCourseId && (
                <div className="flex flex-col gap-4 p-6 bg-surface-2/50 rounded-3xl border border-border-main">
                  <h4 className="text-sm font-black uppercase tracking-widest text-text-muted">Topik Pembelajaran</h4>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 h-12 bg-surface-1 border border-border-main rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      placeholder="Tambah topik baru..."
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                    />
                    <button 
                      className="btn-primary w-12 h-12 p-0 flex items-center justify-center rounded-xl"
                      onClick={() => {
                        if (newTopicTitle) {
                          useStudyStore.getState().addTopic(editingCourseId, newTopicTitle);
                          setNewTopicTitle('');
                        }
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {courses.find(c => c.id === editingCourseId)?.topics.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-surface-1 border border-border-main rounded-xl">
                        <span className="text-sm font-bold">{t.title}</span>
                        <button 
                          className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          onClick={() => useStudyStore.getState().deleteTopic(editingCourseId, t.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 
                  ${!courseName ? 'bg-surface-2 text-text-muted cursor-not-allowed' : 'btn-primary'}`}
                onClick={handleSaveCourse}
                disabled={!courseName}
              >
                {editingCourseId ? 'Simpan Perubahan' : 'Tambahkan Mata Kuliah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
