import { useState } from 'react';
import type { Task, TaskType, TaskPriority } from '../../store/useTaskStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import {
  Plus,
  AlertCircle,
  X,
  Bolt,
  ScrollText,
  Star,
  CheckCircle2,
  PackageSearch,
  Flame,
  Archive,
  ChevronDown,
  Lightbulb
} from 'lucide-react';

const MISSION_TIPS: Record<TaskType, string> = {
  tugas: 'Break down subtasks to maintain momentum. Review core concepts before starting.',
  quiz: 'Practice rapid-fire questions. Review formulas and key definitions briefly.',
  ujian: 'Create a focused study block. Sleep well and review your weakest topics first.'
};

const MISSION_TIPS_ID: Record<TaskType, string> = {
  tugas: 'Pecah tugas menjadi bagian kecil. Review konsep dasar sebelum memulai.',
  quiz: 'Latihan soal cepat. Review rumus dan definisi kunci secara singkat.',
  ujian: 'Buat blok belajar fokus. Tidur cukup dan review topik tersulit lebih dulu.'
};

export function MissionBoard() {
  const { addTask, deleteTask, moveTask, getSortedTasks } = useTaskStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  // UI States
  const [ui, setUi] = useState({
    showAddModal: false,
    viewMode: 'active' as 'active' | 'archive',
    filterPriority: 'all' as 'all' | 'high' | 'med' | 'low',
  });

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tips = language === 'id' ? MISSION_TIPS_ID : MISSION_TIPS;

  const [form, setForm] = useState({
    title: '',
    type: 'tugas' as TaskType,
    deadline: '',
    priority: 'med' as TaskPriority,
    weight: 10,
  });

  // Data
  const allTasks = getSortedTasks();
  
  // Handlers
  const handleAddTask = () => {
    if (!form.title || !form.deadline) return;
    addTask({
      title: form.title,
      type: form.type,
      deadline: new Date(form.deadline).toISOString(),
      priority: form.priority,
      weight: form.weight,
      estHours: 2,
      links: []
    });
    setUi(s => ({ ...s, showAddModal: false }));
    setForm({ title: '', type: 'tugas', deadline: '', priority: 'med', weight: 10 });
  };

  const handleCompleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingId(id);
    // Play stamp animation then move task
    setTimeout(() => {
      moveTask(id, 'done');
      setCompletingId(null);
    }, 800);
  };

  // Helpers
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return language === 'id' ? 'Hari ini' : 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return language === 'id' ? 'Besok' : 'Tomorrow';
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  const getUrgencyDetails = (dateString: string) => {
    const d = new Date(dateString).getTime();
    const now = Date.now();
    const hoursLeft = (d - now) / (1000 * 60 * 60);

    if (hoursLeft < 24) return { color: 'var(--color-neon-red)', pulse: true, label: language === 'id' ? 'Kritis' : 'Critical' };
    if (hoursLeft < 72) return { color: 'var(--color-neon-gold)', pulse: false, label: language === 'id' ? 'Mendesak' : 'Urgent' };
    return { color: 'var(--color-neon-cyan)', pulse: false, label: language === 'id' ? 'Aman' : 'Safe' };
  };

  const getRarityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return { label: t.tasks.legendary || 'S-Rank', class: 'bg-neon-gold/10 text-neon-gold border-neon-gold/30', icon: <Star size={10} className="fill-neon-gold" /> };
      case 'med': return { label: t.tasks.rare || 'A-Rank', class: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30', icon: <Star size={10} className="fill-neon-purple" /> };
      case 'low': return { label: t.tasks.common || 'B-Rank', class: 'bg-surface-2 text-text-muted border-white/10', icon: <Star size={10} /> };
    }
  };

  // Filtering
  let displayedTasks = allTasks.filter(t => 
    ui.viewMode === 'active' ? t.status !== 'done' : t.status === 'done'
  );

  if (ui.filterPriority !== 'all') {
    displayedTasks = displayedTasks.filter(t => t.priority === ui.filterPriority);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display uppercase">Mission Board</h1>
          <p className="text-text-muted text-lg max-w-2xl">{ui.viewMode === 'active' ? 'Accept assignments and claim rewards.' : 'Mission Log Archives'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-neon-cyan/10">
            <button 
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${ui.viewMode === 'active' ? 'bg-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setUi(s => ({ ...s, viewMode: 'active' }))}
            >
              <ScrollText size={14} className="inline mr-2" /> Bounties
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${ui.viewMode === 'archive' ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setUi(s => ({ ...s, viewMode: 'archive' }))}
            >
              <Archive size={14} className="inline mr-2" /> Archive
            </button>
          </div>

          {ui.viewMode === 'active' && (
            <button 
              className="btn btn-neon px-6 h-10 hover:scale-105 active:scale-95 transition-all group shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer" 
              onClick={() => setUi(s => ({ ...s, showAddModal: true }))}
            >
              <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform inline" />
              <span className="font-black uppercase tracking-widest text-[10px]">Post Bounty</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters (Active only) */}
      {ui.viewMode === 'active' && (
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${ui.filterPriority === 'all' ? 'bg-surface-2 border-neon-cyan/30 text-neon-cyan' : 'bg-transparent border-transparent text-text-muted hover:bg-surface-2/50'}`}
            onClick={() => setUi(s => ({ ...s, filterPriority: 'all' }))}
          >
            All Missions
          </button>
          <button 
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${ui.filterPriority === 'high' ? 'bg-neon-gold/10 border-neon-gold/30 text-neon-gold shadow-[0_0_15px_rgba(255,215,0,0.15)]' : 'bg-transparent border-transparent text-text-muted hover:bg-surface-2/50'}`}
            onClick={() => setUi(s => ({ ...s, filterPriority: 'high' }))}
          >
            <Flame size={12} className={ui.filterPriority === 'high' ? 'animate-pulse' : ''} /> Critical Priority
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20 items-start">
        {displayedTasks.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6 game-panel border-dashed opacity-50">
            <PackageSearch size={64} className="text-text-muted/20" />
            <p className="text-text-muted text-xl font-bold font-display uppercase tracking-widest">
              {ui.viewMode === 'active' ? 'No Active Bounties' : 'Archive is Empty'}
            </p>
          </div>
        ) : (
          displayedTasks.map(task => {
            const urgency = getUrgencyDetails(task.deadline);
            const rarity = getRarityBadge(task.priority);
            const isCompleting = completingId === task.id;

            return (
              <div 
                key={task.id} 
                className={`game-panel flex flex-col justify-between group overflow-hidden transition-all duration-500 relative bg-surface-1 hover:-translate-y-1 cursor-pointer ${isCompleting ? 'scale-95 opacity-0 blur-sm pointer-events-none' : 'scale-100 opacity-100'} ${ui.viewMode === 'archive' ? 'opacity-70 grayscale hover:grayscale-0' : ''}`}
                onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                style={{
                  borderTop: `4px solid ${urgency.color}`,
                  boxShadow: urgency.pulse && !isCompleting ? `0 0 20px ${urgency.color}40` : 'none',
                }}
              >
                {/* Stamp Animation Layer */}
                {isCompleting && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="border-4 border-neon-green text-neon-green px-6 py-2 rounded-lg font-black text-3xl uppercase tracking-[0.3em] font-display transform -rotate-12 animate-in zoom-in-50 duration-300 shadow-[0_0_30px_rgba(57,255,20,0.4)] bg-black/60 backdrop-blur-md">
                      CLEARED
                    </div>
                  </div>
                )}

                <div className="p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rarity.class}`}>
                          {rarity.icon} {rarity.label}
                        </span>
                        {task.type !== 'tugas' && (
                          <span className="px-2 py-0.5 rounded bg-surface-2 border border-white/5 text-[8px] font-black uppercase tracking-widest text-text-muted/60">
                            {task.type}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-lg leading-tight tracking-tight mt-1 text-text-main group-hover:text-neon-cyan transition-colors line-clamp-2">{task.title}</h3>
                    </div>
                    
                    <button
                      className="p-2 text-text-muted/40 hover:text-neon-red transition-all rounded-lg hover:bg-neon-red/10 shrink-0 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body Details */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-surface-2/50 ${urgency.pulse ? 'border-neon-red/30' : 'border-white/5'}`}>
                      <AlertCircle size={14} style={{ color: urgency.color }} className={urgency.pulse ? 'animate-pulse' : ''} />
                      <span className="text-xs font-bold tabular-nums" style={{ color: urgency.color }}>
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neon-cyan/10 bg-surface-2/50">
                      <Bolt size={14} className="text-neon-cyan" fill="currentColor" />
                      <span className="text-xs font-black text-neon-cyan">
                        {task.weight} XP
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${expandedId === task.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mt-2 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-neon-cyan">
                        <Lightbulb size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Saran Strategi' : 'Strategy Suggestion'}</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">
                        {tips[task.type]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                {ui.viewMode === 'active' && (
                  <div className="p-2 mt-auto">
                    <button 
                      className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 font-display cursor-pointer bg-surface-2 text-text-muted/60 border border-white/5 hover:bg-neon-green hover:text-bg-main hover:border-neon-green hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                      onClick={(e) => handleCompleteTask(task.id, e)}
                    >
                      <CheckCircle2 size={16} /> Complete Mission
                    </button>
                  </div>
                )}
                {ui.viewMode === 'archive' && (
                  <div className="p-4 mt-auto border-t border-white/5 bg-surface-2/30">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                      <CheckCircle2 size={14} className="text-neon-green" /> Mission Accomplished
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {ui.showAddModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-md w-full flex flex-col gap-6 border-neon-cyan/20 bg-surface-1 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text uppercase">Post Bounty</h3>
              <button onClick={() => setUi(s => ({ ...s, showAddModal: false }))} className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Mission Target</label>
                <input 
                  type="text" 
                  className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all placeholder:text-text-muted/30"
                  value={form.title}
                  onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Defeat the final bug"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Deadline</label>
                <input 
                  type="datetime-local" 
                  className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all text-text-main"
                  value={form.deadline}
                  onChange={(e) => setForm(s => ({ ...s, deadline: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Type</label>
                  <select 
                    className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm(s => ({ ...s, type: e.target.value as TaskType }))}
                  >
                    <option value="tugas">Task</option>
                    <option value="quiz">Quiz</option>
                    <option value="ujian">Exam</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1 font-display">Priority (Rank)</label>
                  <select 
                    className="w-full h-12 bg-surface-2 border border-neon-cyan/20 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 appearance-none cursor-pointer"
                    value={form.priority}
                    onChange={(e) => setForm(s => ({ ...s, priority: e.target.value as TaskPriority }))}
                  >
                    <option value="low">B - Common</option>
                    <option value="med">A - Rare</option>
                    <option value="high">S - Legendary</option>
                  </select>
                </div>
              </div>

              <button 
                className={`btn h-14 w-full text-sm rounded-xl font-black mt-2 transition-all duration-300 font-display uppercase tracking-widest
                  ${!form.title || !form.deadline ? 'bg-surface-2 text-text-muted cursor-not-allowed border border-white/5' : 'btn-primary hover:scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.2)] cursor-pointer'}`}
                onClick={handleAddTask}
                disabled={!form.title || !form.deadline}
              >
                Post to Board
              </button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
}
