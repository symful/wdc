import { useState } from 'react';
import type { BlockType, TimeBlock } from '../../store/useScheduleStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Clock, Plus, Bolt, X, Map, Crosshair, Radar } from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

export function ScheduleView() {
  const { blocks, optimizeSchedule, moveBlock, addBlock, deleteBlock } = useScheduleStore();
  const [ui, setUi] = useState({
    showAddModal: false,
    draggedBlock: null as string | null,
  });

  const [form, setForm] = useState({
    title: '',
    type: 'study' as BlockType,
    day: 0,
    hour: 9,
    duration: 2,
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setUi(s => ({ ...s, draggedBlock: id }));
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
    setUi(s => ({ ...s, draggedBlock: null }));
  };

  const handleAddBlock = () => {
    if (!form.title) return;
    addBlock({
      title: form.title,
      type: form.type,
      day: form.day,
      startHour: form.hour,
      duration: form.duration
    });
    setUi(s => ({ ...s, showAddModal: false }));
    setForm(s => ({ ...s, title: '' }));
  };

  const getBlockStyles = (block: TimeBlock) => {
    const isDragged = ui.draggedBlock === block.id;
    
    const colors = {
      class: 'bg-neon-blue/10 border-neon-blue shadow-[0_0_10px_rgba(77,124,255,0.1)]',
      study: 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]',
      task: 'bg-neon-red/10 border-neon-red shadow-[0_0_10px_rgba(255,49,49,0.1)]',
      break: 'bg-neon-green/10 border-neon-green shadow-[0_0_10px_rgba(57,255,20,0.1)]',
    };

    return `
      absolute inset-x-1.5 top-1.5 z-10 p-4 rounded-2xl border-l-[3px] backdrop-blur-md 
      transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-xl
      ${colors[block.type as keyof typeof colors]}
      ${isDragged ? 'opacity-40 scale-95' : 'opacity-100'}
    `;
  };

  const getMissionType = (type: string) => {
    switch (type) {
      case 'class': return '📡 BRIEFING';
      case 'study': return '⚡ TRAINING';
      case 'task': return '⚔️ COMBAT';
      case 'break': return '💚 RECOVERY';
      default: return '📋 MISSION';
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display">MISSION TIMELINE</h1>
          <p className="text-text-muted text-lg max-w-2xl">Deploy misi belajar Anda dengan drag & drop. Gunakan Auto-Deploy untuk optimasi jadwal.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-glass px-6 hover:scale-105 active:scale-95 transition-all group border-neon-cyan/10 hover:border-neon-cyan/30" onClick={() => setUi(s => ({ ...s, showAddModal: true }))}>
            <Plus size={20} className="text-neon-cyan group-hover:scale-110 transition-transform" />
            <span className="font-black uppercase tracking-widest text-[10px]">New Mission</span>
          </button>
          <button 
            className="btn btn-neon px-8 hover:scale-105 active:scale-95 transition-all group" 
            onClick={() => optimizeSchedule()} 
            title="Auto-deploy misi ke slot waktu optimal"
          >
            <Bolt size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
            <span className="font-black uppercase tracking-widest text-[10px]">Auto-Deploy</span>
          </button>
        </div>
      </div>

      <div className="game-panel flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="flex border-b border-neon-cyan/10 bg-surface-2/80 backdrop-blur-md sticky top-0 z-30">
          <div className="w-20 shrink-0 p-4 border-r border-neon-cyan/10 flex items-center justify-center">
            <Radar size={14} className="text-neon-cyan/40" />
          </div>
          {DAY_CODES.map((code, i) => (
            <div key={code} className="flex-1 p-4 text-center text-xs font-black uppercase tracking-[0.2em] text-text-muted/60 border-r border-neon-cyan/10 last:border-r-0 font-display">
              <span className="text-neon-cyan/60">{code}</span>
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex flex-col w-full min-w-[800px]">
            {HOURS.map(hour => (
              <div key={hour} className="flex min-h-24 border-b border-neon-cyan/[0.05] group">
                {/* Time Strip */}
                <div className="w-20 shrink-0 border-r border-neon-cyan/[0.05] flex justify-center pt-4 text-[10px] font-black tabular-nums text-text-muted/40 group-hover:text-neon-cyan/60 transition-colors font-display">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Days Grid */}
                {DAYS.map((_, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className="flex-1 border-r border-neon-cyan/[0.05] last:border-r-0 relative group/cell hover:bg-neon-cyan/[0.02] transition-colors"
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
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest font-display">
                              <Clock size={10} strokeWidth={3} />
                              {block.duration} Jam
                            </div>
                          </div>
                          <button 
                            className="text-text-muted/30 hover:text-neon-red transition-all hover:scale-125 active:scale-90"
                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          >
                            <X size={14} className="cursor-pointer" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            {block.priority && (
                              <div className={`badge ${block.priority === 'high' ? 'badge-legendary' : 'badge-rare'} scale-90 -ml-1`}>
                                {block.priority === 'high' ? '★ HIGH' : '◆ MED'}
                              </div>
                            )}
                            {block.isRescheduled && (
                              <div className="w-2 h-2 rounded-full bg-neon-gold shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-pulse" title="Rescheduled"></div>
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
      {/* Add Mission Modal */}
      {ui.showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="game-panel p-8 max-w-xl w-full flex flex-col gap-8 border-neon-cyan/20 shadow-[0_0_50px_rgba(0,240,255,0.05)]">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight font-display neon-cyan-text">🎯 New Mission</h3>
              <button onClick={() => setUi(s => ({ ...s, showAddModal: false }))} className="p-2 hover:bg-neon-cyan/10 rounded-full text-text-muted/40 hover:text-neon-cyan transition-all hover:scale-110 active:scale-95 cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">Mission Title</label>
                <input 
                  type="text" 
                  className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" 
                  placeholder="Misal: Kuliah Basis Data"
                  value={form.title}
                  onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">Mission Type</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm(s => ({ ...s, type: e.target.value as BlockType }))}
                  >
                    <option value="class" className="bg-bg-main">📡 Briefing (Kuliah)</option>
                    <option value="study" className="bg-bg-main">⚡ Training (Belajar)</option>
                    <option value="task" className="bg-bg-main">⚔️ Combat (Tugas)</option>
                    <option value="break" className="bg-bg-main">💚 Recovery (Istirahat)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">Deploy Day</label>
                  <select 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all appearance-none cursor-pointer"
                    value={form.day}
                    onChange={(e) => setForm(s => ({ ...s, day: parseInt(e.target.value) }))}
                  >
                    {DAYS.map((day, i) => (
                      <option key={day} value={i} className="bg-bg-main">{DAY_CODES[i]} — {day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">Start Time</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" 
                    min="7" max="21"
                    value={form.hour}
                    onChange={(e) => setForm(s => ({ ...s, hour: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted/40 px-1 font-display">Duration (Hours)</label>
                  <input 
                    type="number" 
                    className="w-full h-14 bg-surface-2 border border-neon-cyan/10 rounded-2xl px-5 font-bold outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" 
                    min="1" max="4"
                    value={form.duration}
                    onChange={(e) => setForm(s => ({ ...s, duration: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary h-16 w-full text-lg mt-2 font-display"
              disabled={!form.title}
              onClick={handleAddBlock}
            >
              Deploy Mission
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
