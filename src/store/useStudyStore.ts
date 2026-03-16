import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudySession {
  id: string;
  courseId: string;
  topic: string;
  durationMinutes: number;
  date: string;
  confidence: number; // 1-5 rating
}

interface StudyState {
  sessions: StudySession[];
  activeSession: {
    courseId: string | null;
    topic: string;
    startTime: number | null;
    pauseTime: number | null;
    totalPausedTime: number;
  };
  startSession: (courseId: string, topic: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (confidence: number) => void;
  deleteSession: (id: string) => void;
  setSessions: (sessions: StudySession[]) => void;
  clearSessions: () => void;
  cancelSession: () => void;
}

const initialActiveSession = {
  courseId: null as string | null,
  topic: '',
  startTime: null as number | null,
  pauseTime: null as number | null,
  totalPausedTime: 0,
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: initialActiveSession,
      
      startSession: (courseId: string, topic: string) => set({
        activeSession: { ...initialActiveSession, courseId, topic, startTime: Date.now() }
      }),
      
      pauseSession: () => set((state) => {
        if (!state.activeSession.startTime || state.activeSession.pauseTime) return state;
        return {
          activeSession: { ...state.activeSession, pauseTime: Date.now() }
        };
      }),

      resumeSession: () => set((state) => {
        if (!state.activeSession.pauseTime) return state;
        const pausedDuration = Date.now() - state.activeSession.pauseTime;
        return {
          activeSession: { 
            ...state.activeSession, 
            pauseTime: null,
            totalPausedTime: state.activeSession.totalPausedTime + pausedDuration
          }
        };
      }),

      endSession: (confidence: number) => {
        const { activeSession, sessions } = get();
        if (!activeSession.courseId || !activeSession.startTime) return;
        
        const now = activeSession.pauseTime || Date.now();
        const durationMinutes = Math.round((now - activeSession.startTime - activeSession.totalPausedTime) / 60000);
        
        const newSession: StudySession = {
          id: Math.random().toString(36).substr(2, 9),
          courseId: activeSession.courseId,
          topic: activeSession.topic,
          durationMinutes: durationMinutes > 0 ? durationMinutes : 1,
          date: new Date().toISOString(),
          confidence
        };

        set({
          sessions: [...sessions, newSession],
          activeSession: initialActiveSession
        });
      },

      deleteSession: (id: string) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id)
      })),

      setSessions: (sessions: StudySession[]) => set({ sessions }),
      
      clearSessions: () => set({ sessions: [] }),

      cancelSession: () => set({ activeSession: initialActiveSession }),
    }),
    {
      name: 'wdc-study-sessions-v2',
    }
  )
);
