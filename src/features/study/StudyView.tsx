import { useState, useEffect } from 'react';
import type { CourseData, StudySession } from '../../store/useStudyStore';
import { useStudyStore } from '../../store/useStudyStore';
import { Play, Square, Timer, Target, BrainCircuit, CheckCircle2, X, Plus, Swords, Zap, Shield } from 'lucide-react';

export function StudyView() {
  const { courses, sessions, activeSession, startSession, endSession, addCourse, deleteCourse } = useStudyStore();
  const [ui, setUi] = useState({
    confidenceModal: false,
    courseModal: false,
  });

  const [timer, setTimer] = useState({
    selectedCourse: '',
    topic: '',
    elapsed: 0,
  });

  const [courseForm, setCourseForm] = useState({
    editingId: null as string | null,
    name: '',
    targetHours: 20,
    newTopicTitle: '',
  });

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession.startTime) {
      interval = setInterval(() => {
        setTimer(s => ({ ...s, elapsed: Math.floor((Date.now() - (activeSession.startTime as number)) / 1000) }));
      }, 1000);
    } else {
      setTimer(s => ({ ...s, elapsed: 0 }));
    }
    return () => clearInterval(interval);
  }, [activeSession.startTime]);

  const handleStart = () => {
    if (!timer.selectedCourse || !timer.topic) return;
    startSession(timer.selectedCourse, timer.topic);
  };

  const handleEnd = (confidence: number) => {
    endSession(confidence);
    setUi(s => ({ ...s, confidenceModal: false }));
    setTimer(s => ({ ...s, topic: '' }));
  };

  const handleSaveCourse = () => {
    if (!courseForm.name) return;
    if (courseForm.editingId) {
      useStudyStore.getState().updateCourse(courseForm.editingId, { 
        name: courseForm.name, 
        targetHours: courseForm.targetHours 
      });
    } else {
      addCourse(courseForm.name, courseForm.targetHours);
    }
    setCourseForm({
      editingId: null,
      name: '',
      targetHours: 20,
      newTopicTitle: '',
    });
    setUi(s => ({ ...s, courseModal: false }));
  };

  const openEditCourse = (course: CourseData) => {
    setCourseForm({
      editingId: course.id,
      name: course.name,
      targetHours: course.targetHours,
      newTopicTitle: '',
    });
    setUi(s => ({ ...s, courseModal: true }));
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display">TRAINING ARENA</h1>
          <p className="text-text-muted text-lg max-w-2xl">Level up skill Anda. Mulai training session dan pantau skill tree progress.</p>
        </div>
        <button 
          className="btn btn-glass px-6 border-neon-cyan/10 hover:border-neon-cyan/30 hover:scale-105 active:scale-95 transition-all group"
          onClick={() => setUi(s => ({ ...s, courseModal: true }))}
        >
          <Target size={20} className="text-neon-cyan group-hover:scale-110 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[10px]">Manage Skill Trees</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Timer Panel — Power-Up Charging Station */}
        <div className="lg:col-span-2 game-panel flex flex-col items-center justify-center p-10 relative overflow-hidden group min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/[0.03] to-neon-purple/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Animated ring effect when active */}
          <div className={`p-8 rounded-full mb-8 transition-all duration-700 relative z-10 ${activeSession.startTime ? 'bg-neon-cyan/10 shadow-[0_0_50px_rgba(0,240,255,0.2)] border border-neon-cyan/20' : 'bg-surface-2 border border-neon-cyan/10'}`}>
            <Swords size={64} className={activeSession.startTime ? "text-neon-cyan animate-pulse" : "text-text-muted"} />
          </div>
          
          {activeSession.startTime ? (
            <div className="flex flex-col items-center justify-center gap-8 w-full relative z-10">
              {/* Training in Progress HUD */}
              <div className="px-4 py-1.5 bg-neon-cyan/10 rounded-full border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-[0.3em] animate-pulse font-display">
                ⚡ TRAINING IN PROGRESS
              </div>
              
              <div className="text-7xl font-black font-mono tracking-tighter neon-cyan-text tabular-nums">
                {formatTime(timer.elapsed)}
              </div>
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-2xl font-black tracking-tight">{activeSession.topic}</div>
                <div className="px-4 py-1.5 bg-neon-purple/10 rounded-full border border-neon-purple/20 text-neon-purple text-sm font-bold uppercase tracking-widest">
                  {courses.find(c => c.id === activeSession.courseId)?.name}
                </div>
              </div>

              <button 
                className="btn bg-neon-red hover:bg-neon-red/80 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,49,49,0.2)] border border-neon-red/30"
                onClick={() => setUi(s => ({ ...s, confidenceModal: true }))}
              >
                <Square size={20} fill="currentColor" /> End Training
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8 w-full relative z-10">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Skill Tree</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all appearance-none cursor-pointer"
                    value={timer.selectedCourse} 
                    onChange={(e) => setTimer(s => ({ ...s, selectedCourse: e.target.value }))}
                  >
                    <option value="" className="bg-bg-main">-- Select Skill Tree --</option>
                    {courses.map((c: CourseData) => (
                      <option key={c.id} value={c.id} className="bg-bg-main">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Training Topic</label>
                  <input 
                    type="text" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all placeholder:text-text-muted/30"
                    placeholder="Misal: Latihan Integral Partisi" 
                    value={timer.topic}
                    onChange={(e) => setTimer(s => ({ ...s, topic: e.target.value }))}
                  />
                </div>
              </div>
              <button 
                className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xl group font-display
                  ${(!timer.selectedCourse || !timer.topic) 
                    ? 'bg-surface-2 text-text-muted/20 cursor-not-allowed border border-neon-cyan/5' 
                    : 'btn-primary hover:scale-105'}`}
                onClick={handleStart}
                disabled={!timer.selectedCourse || !timer.topic}
              >
                <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" /> Begin Training
              </button>
            </div>
          )}
        </div>

        {/* Skill Trees Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="game-panel p-8">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 font-display">
              <div className="p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
                <Zap size={24} className="text-neon-cyan" />
              </div>
              <span className="neon-cyan-text">Skill Trees</span>
            </h3>
            
            <div className="flex flex-col gap-8">
              {courses.map((c: CourseData) => (
                <div key={c.id} className="flex flex-col gap-3 group/item">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold group-hover/item:text-neon-cyan transition-colors uppercase tracking-tight">{c.name}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 rounded-lg text-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all hover:scale-110 active:scale-90"
                            onClick={() => openEditCourse(c)}
                            title="Edit Skill Tree"
                          >
                            <BrainCircuit size={14} className="cursor-pointer" />
                          </button>
                          <button 
                            className="p-1.5 rounded-lg text-neon-red/20 hover:text-neon-red hover:bg-neon-red/10 transition-all hover:scale-110 active:scale-90"
                            onClick={() => deleteCourse(c.id)}
                            title="Delete Skill Tree"
                          >
                            <X size={14} className="cursor-pointer" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-text-muted/60 tracking-tight uppercase font-display">
                        {Math.floor(sessions.filter((s: StudySession) => s.courseId === c.id).reduce((sum: number, curr: StudySession) => sum + curr.durationMinutes, 0) / 60)}h {sessions.filter((s: StudySession) => s.courseId === c.id).reduce((sum: number, curr: StudySession) => sum + curr.durationMinutes, 0) % 60}m / {c.targetHours} Hours
                      </div>
                    </div>
                    <div className="text-2xl font-black neon-cyan-text tabular-nums">{calculateProgress(c.id)}%</div>
                  </div>
                  <div className="xp-bar">
                    <div 
                      className="xp-bar-fill"
                      style={{ width: `${calculateProgress(c.id)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Training Log */}
          <div className="game-panel p-8 flex-1">
            <h4 className="text-lg font-black mb-6 flex items-center gap-3 font-display">
              <div className="p-2 bg-neon-gold/10 rounded-xl border border-neon-gold/20">
                <Shield size={22} className="text-neon-gold" />
              </div>
              <span className="neon-gold-text">Training Log</span>
            </h4>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-text-muted/40 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-neon-cyan/10 flex items-center justify-center">
                  <Play size={24} className="opacity-20" />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs font-display">No training recorded yet.<br/>Begin your first session!</p>
              </div>
            ) : (
                <div className="flex flex-col gap-4">
                  {sessions.slice(-3).reverse().map((s: StudySession) => (
                    <div key={s.id} className="group/session flex justify-between items-center p-5 bg-surface-2 hover:bg-surface-2/80 rounded-2xl border border-neon-cyan/10 hover:border-neon-cyan/20 transition-all duration-300">
                      <div className="flex flex-col gap-1 text-left">
                        <div className="font-bold text-sm group-hover/session:text-neon-cyan transition-colors uppercase tracking-tight">{s.topic}</div>
                        <div className="text-xs font-bold text-text-muted/60">{courses.find((c: CourseData) => c.id === s.courseId)?.name}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-lg font-black tabular-nums text-neon-cyan">{s.durationMinutes}m</div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-neon-gold/[0.08] border border-neon-gold/15 rounded-lg text-[10px] font-black uppercase text-neon-gold tracking-widest font-display">
                          PWR {s.confidence}/5
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Power Level Assessment Modal */}
      {ui.confidenceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="game-panel p-10 flex flex-col items-center gap-10 max-w-lg w-full border-neon-cyan/20 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
            <div className="text-center">
              <div className="w-20 h-20 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                <CheckCircle2 size={40} className="text-neon-cyan" />
              </div>
              <h3 className="text-3xl font-black mb-3 tracking-tight font-display neon-cyan-text">Training Complete!</h3>
              <p className="text-text-muted text-lg font-medium opacity-80">Rate your power level for this material:</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-text-main">
              {[1, 2, 3, 4, 5].map(rating => (
                <button 
                  key={rating}
                  className="w-16 h-16 rounded-2xl bg-surface-2 hover:bg-neon-cyan text-xl font-black transition-all duration-300 transform hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] border border-neon-cyan/10 hover:border-neon-cyan group cursor-pointer font-display"
                  onClick={() => handleEnd(rating)}
                >
                  <span className="group-hover:scale-125 transition-transform inline-block">{rating}</span>
                </button>
              ))}
            </div>

            <p className="text-[10px] uppercase font-black tracking-widest text-text-muted/40 font-display">Level 1 (Weak) — Level 5 (Mastered)</p>
          </div>
        </div>
      )}

      {/* Skill Tree Management Modal */}
      {ui.courseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="game-panel p-8 max-w-2xl w-full border-neon-cyan/20 overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(0,240,255,0.05)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">
                {courseForm.editingId ? '⚙ Edit Skill Tree' : '➕ New Skill Tree'}
              </h3>
              <button 
                className="p-2 hover:bg-neon-cyan/10 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer"
                onClick={() => { 
                  setUi(s => ({ ...s, courseModal: false })); 
                  setCourseForm({ editingId: null, name: '', targetHours: 20, newTopicTitle: '' });
                }}
              >
                <X size={24} className="text-text-muted hover:text-neon-cyan transition-colors" />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Skill Tree Name</label>
                  <input 
                    type="text" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all"
                    placeholder="Misal: Kecerdasan Buatan"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm(s => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Target Hours (Season)</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all"
                    value={courseForm.targetHours}
                    onChange={(e) => setCourseForm(s => ({ ...s, targetHours: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {courseForm.editingId && (
                <div className="flex flex-col gap-4 p-6 bg-surface-2/50 rounded-3xl border border-neon-cyan/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-text-muted font-display">Skill Nodes</h4>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 h-12 bg-surface-1 border border-neon-cyan/10 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none"
                      placeholder="Add new skill node..."
                      value={courseForm.newTopicTitle}
                      onChange={(e) => setCourseForm(s => ({ ...s, newTopicTitle: e.target.value }))}
                    />
                    <button 
                      className="btn-primary w-12 h-12 p-0 flex items-center justify-center rounded-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      onClick={() => {
                        if (courseForm.newTopicTitle) {
                          useStudyStore.getState().addTopic(courseForm.editingId!, courseForm.newTopicTitle);
                          setCourseForm(s => ({ ...s, newTopicTitle: '' }));
                        }
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                    {courses.find(c => c.id === courseForm.editingId)?.topics.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-surface-1 border border-neon-cyan/10 rounded-xl">
                        <span className="text-sm font-bold">{t.title}</span>
                        <button 
                          className="p-1.5 text-neon-red/40 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-all"
                          onClick={() => useStudyStore.getState().deleteTopic(courseForm.editingId!, t.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all duration-300 font-display
                  ${!courseForm.name ? 'bg-surface-2 text-text-muted cursor-not-allowed' : 'btn-primary hover:scale-105 active:scale-95'}`}
                onClick={handleSaveCourse}
                disabled={!courseForm.name}
              >
                {courseForm.editingId ? 'Save Changes' : 'Add Skill Tree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
