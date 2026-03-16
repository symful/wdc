import { useState } from 'react';
import type { Task, TaskStatus } from '../../store/useTaskStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useLanguageStore, translations } from '../../store/useLanguageStore';
import {
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Bolt,
  ScrollText,
  Swords,
  Star,
  Crown,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import type { TaskType, TaskPriority } from '../../store/useTaskStore';

export function KanbanBoard() {
  const { moveTask, addTask, deleteTask, getSortedTasks } = useTaskStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  const COLUMNS: { id: TaskStatus; title: string; label: string; color: string; glow: string }[] = [
    { id: 'todo', title: t.tasks.newQuestsCol, label: '📜 New', color: 'var(--color-neon-cyan)', glow: 'rgba(0, 240, 255, 0.15)' },
    { id: 'doing', title: t.tasks.inProgressCol, label: '⚔️ Active', color: 'var(--color-neon-gold)', glow: 'rgba(255, 215, 0, 0.15)' },
    { id: 'done', title: t.tasks.completedCol, label: '✅ Done', color: 'var(--color-neon-green)', glow: 'rgba(57, 255, 20, 0.15)' },
  ];

  const tasks = getSortedTasks();
  const [ui, setUi] = useState({
    showAddModal: false,
    draggedTask: null as string | null,
  });

  const [form, setForm] = useState({
    title: '',
    type: 'tugas' as TaskType,
    deadline: '',
    priority: 'med' as TaskPriority,
    weight: 10,
  });

  const getRarityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { label: t.tasks.legendary, class: 'badge-legendary' };
      case 'med': return { label: t.tasks.rare, class: 'badge-rare' };
      case 'low': return { label: t.tasks.common, class: 'badge-common' };
      default: return { label: t.tasks.common, class: 'badge-common' };
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setUi(s => ({ ...s, draggedTask: id }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, status);
    }
    setUi(s => ({ ...s, draggedTask: null }));
  };

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
    setForm(s => ({ ...s, title: '', deadline: '' }));
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return language === 'id' ? 'Hari ini' : 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return language === 'id' ? 'Besok' : 'Tomorrow';
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  const getUrgencyColor = (dateString: string) => {
    const d = new Date(dateString).getTime();
    const now = Date.now();
    const hoursLeft = (d - now) / (1000 * 60 * 60);

    if (hoursLeft < 24) return 'var(--color-neon-red)';
    if (hoursLeft < 72) return 'var(--color-neon-gold)';
    return 'var(--color-text-muted)';
  };

  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'rgba(255, 215, 0, 0.4)';
      case 'med': return 'rgba(77, 124, 255, 0.3)';
      case 'low': return 'rgba(57, 255, 20, 0.25)';
      default: return 'rgba(0, 240, 255, 0.15)';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display">{t.tasks.title}</h1>
          <p className="text-text-muted text-lg max-w-2xl">{t.tasks.subtitle}</p>
        </div>
        <button className="btn btn-neon px-8 hover:scale-105 active:scale-95 transition-all group" onClick={() => setUi(s => ({ ...s, showAddModal: true }))}>
          <Plus size={20} className="mr-1 group-hover:scale-110 transition-transform" />
          <span className="font-black uppercase tracking-widest text-[10px]">{t.tasks.newQuest}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className="flex-1 min-w-0 lg:min-w-[320px] lg:max-w-100 flex flex-col h-full game-panel p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: col.color, boxShadow: `0 0 10px ${col.glow}` }} />
                <h3 className="text-sm font-black uppercase tracking-widest text-text-main/60 font-display">{col.title}</h3>
                <span className="bg-neon-cyan/6 text-neon-cyan text-[10px] font-black px-2 py-0.5 rounded-lg border border-neon-cyan/15 font-display">{tasks.filter(t => t.status === col.id).length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 hide-scrollbar min-h-50">
              {tasks.filter((t: Task) => t.status === col.id).map((task: Task) => {
                const rarity = getRarityBadge(task.priority);
                return (
                  <div
                    key={task.id}
                    className={`
                      quest-card group/card
                      ${ui.draggedTask === task.id ? 'opacity-40 scale-95' : 'opacity-100'}
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    style={{
                      borderLeft: `4px solid ${getBorderColor(task.priority)}`
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-xl bg-neon-cyan/6 text-neon-cyan group-hover/card:scale-110 transition-transform border border-neon-cyan/10">
                          <ScrollText size={18} />
                        </div>
                        <h4 className="font-bold text-text-main group-hover/card:text-neon-cyan transition-colors line-clamp-1">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 text-text-muted hover:text-neon-red transition-all rounded-xl hover:bg-neon-red/10 hover:scale-125 active:scale-90 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Rarity Badge */}
                    <div className="mb-4">
                      <span className={`badge ${rarity.class}`}>{rarity.label}</span>
                    </div>

                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-xl border border-neon-cyan/10">
                        <AlertCircle size={14} style={{ color: getUrgencyColor(task.deadline) }} />
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: getUrgencyColor(task.deadline) }}>
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-gold/6 rounded-xl border border-neon-gold/10">
                        <Bolt size={14} className="text-neon-gold" fill="currentColor" />
                        <span className="text-[11px] font-black text-neon-gold">
                          {task.weight}%
                        </span>
                      </div>
                    </div>

                    {task.subtasks.length > 0 && (
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-text-muted/60 font-display">
                          <span>Sub-quests</span>
                          <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                        </div>
                        <div className="xp-bar">
                          <div 
                            className="xp-bar-fill"
                            style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar for Doing Column */}
                    {task.status === 'doing' && (
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="text-[10px] font-black uppercase tracking-widest text-text-main/40 mb-3 flex items-center justify-between font-display">
                          <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(task.deadline).toLocaleDateString()}</span>
                          {task.weight && <span className="text-neon-gold">@{task.weight}%</span>}
                        </div>
                        <div className="xp-bar">
                          <div 
                            className="xp-bar-fill"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {task.status === 'done' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-neon-green/8 rounded-2xl border border-neon-green/20 text-neon-green text-[10px] font-black uppercase tracking-[0.2em] mt-auto font-display">
                        <CheckCircle2 size={14} strokeWidth={3} /> {t.tasks.questComplete}
                      </div>
                    )}

                    {/* Mobile Move Options */}
                    <div className="lg:hidden flex gap-2 mt-4 pt-4 border-t border-neon-cyan/5">
                      {task.status !== 'todo' && (
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-2 border border-neon-cyan/10 text-[10px] font-black uppercase tracking-widest text-text-muted active:scale-95 transition-all"
                          onClick={() => moveTask(task.id, task.status === 'done' ? 'doing' : 'todo')}
                        >
                          <ChevronLeft size={14} /> {t.common.back}
                        </button>
                      )}
                      {task.status !== 'done' && (
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-black uppercase tracking-widest text-neon-cyan active:scale-95 transition-all"
                          onClick={() => moveTask(task.id, task.status === 'todo' ? 'doing' : 'done')}
                        >
                          {t.common.advance} <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Add Quest Modal */}
      {ui.showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-xl w-full flex flex-col gap-8 border-neon-cyan/20 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">{t.tasks.addQuestTitle}</h3>
              <button onClick={() => setUi(s => ({ ...s, showAddModal: false }))} className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all hover:scale-110 active:scale-95 cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.tasks.questLabel}</label>
                <input 
                  type="text" 
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/30 transition-all" 
                  placeholder={t.tasks.questPlaceholder}
                  value={form.title}
                  onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.tasks.typeLabel}</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm(s => ({ ...s, type: e.target.value as TaskType }))}
                  >
                    <option value="tugas" className="bg-bg-main">{language === 'id' ? 'Tugas' : 'Task'}</option>
                    <option value="quiz" className="bg-bg-main">{language === 'id' ? 'Quiz' : 'Quiz'}</option>
                    <option value="ujian" className="bg-bg-main">{language === 'id' ? 'Ujian' : 'Exam'}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.tasks.rarityLabel}</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.priority}
                    onChange={(e) => setForm(s => ({ ...s, priority: e.target.value as TaskPriority }))}
                  >
                    <option value="high" className="bg-bg-main">{t.tasks.legendary} ({language === 'id' ? 'Tinggi' : 'High'})</option>
                    <option value="med" className="bg-bg-main">{t.tasks.rare} ({language === 'id' ? 'Sedang' : 'Medium'})</option>
                    <option value="low" className="bg-bg-main">{t.tasks.common} ({language === 'id' ? 'Rendah' : 'Low'})</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.tasks.deadlineLabel}</label>
                  <input 
                    type="date" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" 
                    value={form.deadline}
                    onChange={(e) => setForm(s => ({ ...s, deadline: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">{t.tasks.rewardLabel}</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" 
                    min="1" max="100"
                    value={form.weight}
                    onChange={(e) => setForm(s => ({ ...s, weight: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary h-16 w-full text-lg mt-2 font-display"
              disabled={!form.title || !form.deadline}
              onClick={handleAddTask}
            >
              {t.tasks.acceptBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
