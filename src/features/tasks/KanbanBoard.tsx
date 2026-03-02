import { useState } from 'react';
import type { Task, TaskStatus } from '../../store/useTaskStore';
import { useTaskStore } from '../../store/useTaskStore';
import {
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Zap,
  Bolt
} from 'lucide-react';
import type { TaskType, TaskPriority } from '../../store/useTaskStore';

const statusColors: Record<TaskStatus, string> = {
  'todo': 'slate',
  'doing': 'indigo',
  'done': 'green'
};

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'Belum Dimulai', color: 'var(--color-text-muted)' },
  { id: 'doing', title: 'Sedang Dikerjakan', color: 'var(--color-accent-indigo)' },
  { id: 'done', title: 'Selesai', color: '#22c55e' },
];

export function KanbanBoard() {
  const { moveTask, addTask, deleteTask, getSortedTasks } = useTaskStore();
  const tasks = getSortedTasks();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('tugas');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('med');
  const [newWeight, setNewWeight] = useState(10);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTask(id);
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
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    if (!newTitle || !newDeadline) return;
    addTask({
      title: newTitle,
      type: newType,
      deadline: new Date(newDeadline).toISOString(),
      priority: newPriority,
      weight: newWeight,
      estHours: 2,
      links: []
    });
    setShowAddModal(false);
    setNewTitle('');
    setNewDeadline('');
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    if (d.toDateString() === tomorrow.toDateString()) return 'Besok';
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  const getUrgencyColor = (dateString: string) => {
    const d = new Date(dateString).getTime();
    const now = Date.now();
    const hoursLeft = (d - now) / (1000 * 60 * 60);

    if (hoursLeft < 24) return 'var(--status-danger)';
    if (hoursLeft < 72) return 'var(--status-warning)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gradient">Pencatatan Tugas</h1>
          <p className="text-muted text-lg max-w-2xl">Kelola tugas kuliah Anda dengan sistem Kanban dan tracking progres mendetail.</p>
        </div>
        <button className="btn btn-primary px-8" onClick={() => setShowAddModal(true)}>
          <Plus size={20} className="mr-1" />
          <span className="font-black uppercase tracking-widest text-[10px]">Tambah Tugas</span>
        </button>
      </div>

      <div className="flex gap-6 h-full overflow-x-auto pb-8 hide-scrollbar">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full bg-surface-subtle/50 backdrop-blur-sm rounded-4xl border border-border-main p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${statusColors[col.id]}-500 shadow-lg shadow-${statusColors[col.id]}-500/50 animate-pulse`} />
                <h3 className="text-sm font-black uppercase tracking-widest text-text-main/60">{col.id.toUpperCase()}</h3>
                <span className="bg-surface-subtle text-text-main/50 text-[10px] font-black px-2 py-0.5 rounded-lg border border-border-main">{tasks.filter(t => t.status === col.id).length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 hide-scrollbar min-h-[200px]">
              {tasks.filter((t: Task) => t.status === col.id).map((task: Task) => (
                <div
                  key={task.id}
                  className={`
                    group/card bg-surface-panel p-5 rounded-2xl border border-border-main hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-grab active:cursor-grabbing transform hover:-translate-y-1
                    ${draggedTask === task.id ? 'opacity-40 scale-95' : 'opacity-100'}
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  style={{
                    borderLeft: `4px solid ${task.priority === 'high' ? '#ef4444' : task.priority === 'med' ? '#eab308' : '#22c55e'}`
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-xl bg-${statusColors[task.status]}-500/10 text-${statusColors[task.status]}-400 group-hover/card:scale-110 transition-transform`}>
                        <Bolt size={18} />
                      </div>
                      <h4 className="font-bold text-text-main group-hover/card:text-indigo-400 transition-colors line-clamp-1">{task.title}</h4>
                    </div>
                    <button
                      className="p-2 text-text-muted hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-xl border border-border-main">
                      <AlertCircle size={14} style={{ color: getUrgencyColor(task.deadline) }} />
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: getUrgencyColor(task.deadline) }}>
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-status-warning-subtle rounded-xl border border-status-warning/10">
                      <Bolt size={14} className="text-status-warning" fill="currentColor" />
                      <span className="text-[11px] font-black text-status-warning underline decoration-status-warning/30 underline-offset-2">
                        {task.weight}%
                      </span>
                    </div>
                  </div>

                  {task.subtasks.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-text-muted/60">
                        <span>Sub-tasks</span>
                        <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden p-px border border-border-main">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                          style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar for Doing Column */}
                  {task.status === 'doing' && (
                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-main/40 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(task.deadline).toLocaleDateString()}</span>
                        {task.weight && <span className="text-indigo-400">@{task.weight}%</span>}
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-px border border-indigo-500/20 shadow-inner">
                        <div 
                          className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'done' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-[0.2em] mt-auto">
                      <CheckCircle2 size={14} strokeWidth={3} /> Selesai
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass-panel p-8 max-w-xl w-full flex flex-col gap-8 bg-slate-900/90 border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight">Tambah Tugas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Judul Tugas</label>
                <input 
                  type="text" 
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                  placeholder="Misal: Laporan Praktikum Jarkom"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Tipe</label>
                  <select 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TaskType)}
                  >
                    <option value="tugas" className="bg-slate-900">Tugas</option>
                    <option value="quiz" className="bg-slate-900">Quiz</option>
                    <option value="ujian" className="bg-slate-900">Ujian</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Prioritas</label>
                  <select 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  >
                    <option value="high" className="bg-slate-900">Tinggi</option>
                    <option value="med" className="bg-slate-900">Sedang</option>
                    <option value="low" className="bg-slate-900">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Deadline</label>
                  <input 
                    type="date" 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Bobot (%)</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                    min="1" max="100"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary h-16 w-full text-lg mt-2"
              disabled={!newTitle || !newDeadline}
              onClick={handleAddTask}
            >
              Simpan Tugas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
