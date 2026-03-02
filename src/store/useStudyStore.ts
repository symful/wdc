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

export interface StudyTopic {
  id: string;
  title: string;
  completed: boolean;
  confidence: number; // 0-5
}

export interface CourseData {
  id: string;
  name: string;
  targetHours: number;
  topics: StudyTopic[];
}

interface StudyState {
  courses: CourseData[];
  sessions: StudySession[];
  activeSession: {
    courseId: string | null;
    topic: string;
    startTime: number | null;
  };
  startSession: (courseId: string, topic: string) => void;
  endSession: (confidence: number) => void;
  addCourse: (name: string, targetHours: number) => void;
  updateCourse: (id: string, updates: Partial<Omit<CourseData, 'id' | 'topics'>>) => void;
  deleteCourse: (id: string) => void;
  addTopic: (courseId: string, title: string) => void;
  updateTopic: (courseId: string, topicId: string, updates: Partial<Omit<StudyTopic, 'id'>>) => void;
  deleteTopic: (courseId: string, topicId: string) => void;
}

const initialActiveSession = {
  courseId: null as string | null,
  topic: '',
  startTime: null as number | null,
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      courses: [
        { 
          id: 'c1', 
          name: 'Aljabar Linear', 
          targetHours: 20, 
          topics: [] 
        },
        { 
          id: 'c2', 
          name: 'Pemrograman Web', 
          targetHours: 35, 
          topics: [] 
        },
      ],
      sessions: [],
      activeSession: initialActiveSession,
      addCourse: (name: string, targetHours: number) => set((state: StudyState) => ({
        courses: [...state.courses, { id: Math.random().toString(36).substr(2, 9), name, targetHours, topics: [] }]
      })),
      updateCourse: (id: string, updates: Partial<Omit<CourseData, 'id' | 'topics'>>) => set((state: StudyState) => ({
        courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCourse: (id: string) => set((state: StudyState) => ({
        courses: state.courses.filter(c => c.id !== id),
        sessions: state.sessions.filter(s => s.courseId !== id)
      })),
      addTopic: (courseId: string, title: string) => set((state: StudyState) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: [...c.topics, { id: Math.random().toString(36).substr(2, 9), title, completed: false, confidence: 0 }]
        } : c)
      })),
      updateTopic: (courseId: string, topicId: string, updates: Partial<Omit<StudyTopic, 'id'>>) => set((state: StudyState) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: c.topics.map(t => t.id === topicId ? { ...t, ...updates } : t)
        } : c)
      })),
      deleteTopic: (courseId: string, topicId: string) => set((state: StudyState) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: c.topics.filter(t => t.id !== topicId)
        } : c)
      })),
      startSession: (courseId: string, topic: string) => set({
        activeSession: { courseId, topic, startTime: Date.now() }
      }),
      endSession: (confidence: number) => {
        const { activeSession, sessions } = get();
        if (!activeSession.courseId || !activeSession.startTime) return;
        
        const durationMinutes = Math.round((Date.now() - activeSession.startTime) / 60000);
        
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
          activeSession: { courseId: null, topic: '', startTime: null }
        });
      }
    }),
    {
      name: 'wdc-study-storage',
    }
  )
);
