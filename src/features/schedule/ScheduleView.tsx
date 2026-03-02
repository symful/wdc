import { useState } from 'react';
import type { BlockType, TimeBlock } from '../../store/useScheduleStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Clock, Plus, Bolt, X } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

export function ScheduleView() {
  const { blocks, optimizeSchedule, moveBlock, addBlock, deleteBlock } = useScheduleStore();
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<BlockType>('study');
  const [newDay, setNewDay] = useState(0);
  const [newHour, setNewHour] = useState(9);
  const [newDuration, setNewDuration] = useState(2);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBlock(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('text/plain');
    if (blockId) {
      moveBlock(blockId, dayIndex, hour);
    }
    setDraggedBlock(null);
  };

  const handleAddBlock = () => {
    if (!newTitle) return;
    addBlock({
      title: newTitle,
      type: newType,
      day: newDay,
      startHour: newHour,
      duration: newDuration
    });
    setShowAddModal(false);
    setNewTitle('');
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'class': return 'var(--status-info-subtle)';
      case 'study': return 'var(--status-warning-subtle)';
      case 'task': return 'var(--status-danger-subtle)';
      case 'break': return 'var(--status-success-subtle)';
      default: return 'var(--surface-2)';
    }
  };

  const getBlockBorder = (type: string) => {
    switch (type) {
      case 'class': return 'var(--status-info)';
      case 'study': return 'var(--accent-secondary)';
      case 'task': return 'var(--status-danger)';
      case 'break': return 'var(--status-success)';
      default: return 'var(--bg-surface-border)';
    }
  };

  const getBlockStyles = (block: TimeBlock) => {
    const isDragged = draggedBlock === block.id;
    
    const colors = {
      class: 'bg-blue-500/10 border-blue-500 shadow-blue-500/5',
      study: 'bg-indigo-500/10 border-indigo-500 shadow-indigo-500/5',
      task: 'bg-red-500/10 border-red-500 shadow-red-500/5',
      break: 'bg-green-500/10 border-green-500 shadow-green-500/5',
    };

    return `
      absolute inset-x-1.5 top-1.5 z-10 p-4 rounded-2xl border-l-[3px] backdrop-blur-md 
      transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-xl
      ${colors[block.type as keyof typeof colors]}
      ${isDragged ? 'opacity-40 scale-95' : 'opacity-100'}
    `;
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gradient">Pengelolaan Waktu</h1>
          <p className="text-muted text-lg max-w-2xl">Atur jadwal belajar Anda dengan drag & drop. Gunakan fitur optimasi untuk menyesuaikan waktu secara otomatis.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-glass px-6" onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="text-indigo-400" />
            <span className="font-black uppercase tracking-widest text-[10px]">Tambah Blok</span>
          </button>
          <button 
            className="btn btn-primary px-8" 
            onClick={() => optimizeSchedule()} 
            title="Pindahkan tugas kritis ke waktu kosong lebih awal"
          >
            <Bolt size={20} fill="currentColor" />
            <span className="font-black uppercase tracking-widest text-[10px]">Optimalkan Jadwal</span>
          </button>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden bg-surface-1 rounded-[2.5rem] border border-border-main shadow-2xl">
        {/* Calendar Header */}
        <div className="flex border-b border-border-main bg-surface-2/80 backdrop-blur-md sticky top-0 z-30">
          <div className="w-20 shrink-0 p-4 border-r border-border-main"></div>
          {DAYS.map(day => (
            <div key={day} className="flex-1 p-4 text-center text-xs font-black uppercase tracking-[0.2em] text-text-muted/60 border-r border-border-main last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex flex-col w-full min-w-[800px]">
            {HOURS.map(hour => (
              <div key={hour} className="flex min-h-24 border-b border-border-main group">
                {/* Time Strip */}
                <div className="w-20 shrink-0 border-r border-border-main flex justify-center pt-4 text-[10px] font-black tabular-nums text-text-muted/40 group-hover:text-indigo-400/60 transition-colors">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Days Grid */}
                {DAYS.map((_, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className="flex-1 border-r border-border-main last:border-r-0 relative group/cell hover:bg-indigo-500/5 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayIndex, hour)}
                  >
                    {blocks.filter((b: TimeBlock) => b.day === dayIndex && b.startHour === hour).map((block: TimeBlock) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        className={getBlockStyles(block)}
                        style={{ height: `${(block.duration * 96) - 12}px` }}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="font-black text-sm tracking-tight mb-1 truncate group-hover:text-clip group-hover:whitespace-normal">
                              {block.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">
                              <Clock size={10} strokeWidth={3} />
                              {block.duration} Jam
                            </div>
                          </div>
                          <button 
                            className="text-text-muted/30 hover:text-red-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            {block.priority && (
                              <div className={`badge ${block.priority === 'high' ? 'badge-high' : 'badge-med'} scale-90 -ml-1`}>
                                {block.priority === 'high' ? 'High' : 'Med'}
                              </div>
                            )}
                            {block.isRescheduled && (
                              <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse" title="Rescheduled"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg-main/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass-panel p-8 max-w-xl w-full flex flex-col gap-8 bg-bg-main border border-border-main rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight">Tambah Jadwal Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface-2 rounded-full text-text-muted/40 hover:text-text-main transition-colors"><X size={24} /></button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted/40 px-1">Judul Aktivitas</label>
                <input 
                  type="text" 
                  className="w-full h-14 bg-surface-subtle border border-border-main rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                  placeholder="Misal: Kuliah Basis Data"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/40 px-1">Tipe</label>
                  <select 
                    className="w-full h-14 bg-surface-subtle border border-border-main rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as BlockType)}
                  >
                    <option value="class" className="bg-slate-900">Kuliah</option>
                    <option value="study" className="bg-slate-900">Belajar Mandiri</option>
                    <option value="task" className="bg-slate-900">Pengerjaan Tugas</option>
                    <option value="break" className="bg-slate-900">Istirahat</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/40 px-1">Hari</label>
                  <select 
                    className="w-full h-14 bg-surface-subtle border border-border-main rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    value={newDay}
                    onChange={(e) => setNewDay(parseInt(e.target.value))}
                  >
                    {DAYS.map((day, i) => (
                      <option key={day} value={i} className="bg-slate-900">{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted/40 px-1">Jam Mulai</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-subtle border border-border-main rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                    min="7" max="21"
                    value={newHour}
                    onChange={(e) => setNewHour(parseInt(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1">Durasi (Jam)</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" 
                    min="1" max="4"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary h-16 w-full text-lg mt-2"
              disabled={!newTitle}
              onClick={handleAddBlock}
            >
              Simpan Jadwal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
