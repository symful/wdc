import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BlockType = 'class' | 'study' | 'task' | 'break';

export interface TimeBlock {
  id: string;
  title: string;
  type: BlockType;
  day: number; // 0 (Senin) - 6 (Minggu)
  startHour: number; // 0 - 23 
  duration: number; // in hours (1-4)
  priority?: 'high' | 'med' | 'low';
  deadline?: string;
  isRescheduled?: boolean;
}

interface ScheduleState {
  blocks: TimeBlock[];
  addBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  moveBlock: (id: string, newDay: number, newStartHour: number) => void;
  deleteBlock: (id: string) => void;
  optimizeSchedule: () => void;
  clearSchedule: () => void;
}

// Initial mock data
const initialBlocks: TimeBlock[] = [
  { id: '1', title: 'Kuliah Basis Data', type: 'class', day: 0, startHour: 8, duration: 2 },
  { id: '2', title: 'Tugas Pemrograman', type: 'task', day: 0, startHour: 10, duration: 2, priority: 'high', deadline: 'Besok' },
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      blocks: initialBlocks,
      addBlock: (blockData: Omit<TimeBlock, 'id'>) => set((state: ScheduleState) => ({
        blocks: [...state.blocks, { ...blockData, id: Math.random().toString(36).substr(2, 9) }]
      })),
      updateBlock: (id: string, updates: Partial<TimeBlock>) => set((state: ScheduleState) => ({
        blocks: state.blocks.map((b: TimeBlock) => b.id === id ? { ...b, ...updates } : b)
      })),
      moveBlock: (id: string, newDay: number, newStartHour: number) => set((state: ScheduleState) => ({
        blocks: state.blocks.map((b: TimeBlock) => b.id === id ? { ...b, day: newDay, startHour: newStartHour } : b)
      })),
      deleteBlock: (id: string) => set((state: ScheduleState) => ({
        blocks: state.blocks.filter((b: TimeBlock) => b.id !== id)
      })),
      clearSchedule: () => set({ blocks: [] }),
      optimizeSchedule: () => set((state: ScheduleState) => {
        const { blocks } = state;
        const newBlocks = [...blocks];
        
        // Filter high priority tasks that are scheduled late (after Wednesday)
        const criticalTasks = newBlocks
          .filter((b: TimeBlock) => b.type === 'task' && b.priority === 'high' && b.day > 2)
          .sort((a, b) => b.day - a.day);

        let modified = false;

        criticalTasks.forEach((task) => {
          // Search for empty slots on Monday or Tuesday (day 0, 1)
          for (let d = 0; d <= 1; d++) {
            // Business hours 8 AM to 8 PM
            for (let h = 8; h <= 20 - task.duration; h++) {
              const isFree = !newBlocks.some((b) => 
                b.day === d && 
                ((h >= b.startHour && h < b.startHour + b.duration) || 
                 (h + task.duration > b.startHour && h + task.duration <= b.startHour + b.duration))
              );

              if (isFree) {
                const index = newBlocks.findIndex((b) => b.id === task.id);
                if (index !== -1) {
                  newBlocks[index] = { ...task, day: d, startHour: h, isRescheduled: true };
                  modified = true;
                }
                break;
              }
            }
            if (modified) break;
          }
        });

        return modified ? { blocks: newBlocks } : state;
      })
    }),
    {
      name: 'wdc-schedule-storage',
    }
  )
);
