import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'high' | 'med' | 'low';
export type TaskType = 'tugas' | 'quiz' | 'ujian';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  deadline: string; // ISO date string
  priority: TaskPriority;
  status: TaskStatus;
  weight: number; // percentage out of 100
  estHours: number;
  progress: number; // 0 - 100
  subtasks: SubTask[];
  links: string[];
  createdAt: string;
  completedAt?: string;
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'progress' | 'status' | 'subtasks' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  deleteTask: (id: string) => void;
  getSortedTasks: () => Task[];
}

import mockTasks from '../data/mockTasks.json';

const initialTasks: Task[] = mockTasks as Task[];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: initialTasks,
      addTask: (taskData: Omit<Task, 'id' | 'progress' | 'status' | 'subtasks' | 'createdAt'>) => set((state: TaskState) => ({
        tasks: [
          ...state.tasks, 
          { 
            ...taskData, 
            id: Math.random().toString(36).substr(2, 9), 
            status: 'todo', 
            progress: 0, 
            subtasks: [], 
            createdAt: new Date().toISOString() 
          }
        ]
      })),
      updateTask: (id: string, updates: Partial<Task>) => set((state: TaskState) => ({
        tasks: state.tasks.map((t: Task) => t.id === id ? { ...t, ...updates } : t)
      })),
      moveTask: (id: string, newStatus: TaskStatus) => set((state: TaskState) => ({
        tasks: state.tasks.map((t: Task) => {
          if (t.id === id) {
            const progress = newStatus === 'done' ? 100 : (newStatus === 'todo' ? 0 : t.progress);
            const completedAt = newStatus === 'done' ? new Date().toISOString() : t.completedAt;
            return { ...t, status: newStatus, progress, completedAt };
          }
          return t;
        })
      })),
      deleteTask: (id: string) => set((state: TaskState) => ({
        tasks: state.tasks.filter((t: Task) => t.id !== id)
      })),
      getSortedTasks: () => {
        const { tasks } = get();
        return [...tasks].sort((a, b) => {
          // Priority Score: High=3, Med=2, Low=1
          const pScore = { high: 3, med: 2, low: 1 };
          
          // Urgency: Days until deadline (closer = higher score)
          const aTime = new Date(a.deadline).getTime();
          const bTime = new Date(b.deadline).getTime();
          const now = Date.now();
          
          const aUrgency = Math.max(0, 10 - (aTime - now) / 86400000);
          const bUrgency = Math.max(0, 10 - (bTime - now) / 86400000);
          
          const aPriorityScore = pScore[a.priority as keyof typeof pScore];
          const bPriorityScore = pScore[b.priority as keyof typeof pScore];

          const aScore = (aUrgency * 0.7) + (aPriorityScore * 0.3 * 10);
          const bScore = (bUrgency * 0.7) + (bPriorityScore * 0.3 * 10);
          
          return bScore - aScore;
        });
      }
    }),
    {
      name: 'wdc-task-storage',
    }
  )
);
