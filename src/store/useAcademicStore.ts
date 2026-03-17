import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudySession } from './useStudyStore';

export type SemesterType = 'ganjil' | 'genap';
export type CourseType = 'Wajib' | 'Pilihan' | 'Mengulang';

export interface CourseSchedule {
  day: number; // 0 (Senin) - 6 (Minggu)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
  lecturer: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  completed: boolean;
  confidence: number; // 0-5
  repetitionCount: number;
}

export interface AcademicCourse {
  id: string;
  semesterId: string;
  name: string;
  code: string;
  sks: number;
  type: CourseType;
  schedules: CourseSchedule[];
  topics: StudyTopic[];
}

export interface Semester {
  id: string;
  number: number;
  year: string;
  type: SemesterType;
  totalSks: number;
}

export interface XPLog {
  id: string;
  amount: number;
  source: string; // 'Session Mastery' | 'Daily Streak' | etc.
  date: string;
}

interface AcademicState {
  semesters: Semester[];
  courses: AcademicCourse[];
  activeSemesterId: string | null;
  studyPlan: { courseId: string; topicTitle: string; allocatedMinutes: number }[];
  xpLogs: XPLog[];
  
  // Semester actions
  addSemester: (sem: Omit<Semester, 'id'>) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void;
  setActiveSemester: (id: string | null) => void;
  
  // Course actions
  addCourse: (course: Omit<AcademicCourse, 'id' | 'topics'>) => void;
  updateCourse: (id: string, updates: Partial<AcademicCourse>) => void;
  deleteCourse: (id: string) => void;

  // Topic actions
  addTopic: (courseId: string, title: string) => void;
  updateTopic: (courseId: string, topicId: string, updates: Partial<StudyTopic>) => void;
  deleteTopic: (courseId: string, topicId: string) => void;
  
  // XP Actions
  addXp: (amount: number, source: string) => void;

  // Study Plan
  generateStudyPlan: (pastSessions: StudySession[]) => void;
  skipTask: (courseId: string, topicTitle: string) => void;
  importData: (data: { semesters: Semester[]; courses: AcademicCourse[]; xpLogs?: XPLog[] }) => void;
}

import semesterData from '../data/semesters/semester_2.json';

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set) => ({
      semesters: [semesterData.semester] as Semester[],
      courses: semesterData.courses as AcademicCourse[],
      activeSemesterId: semesterData.semester.id,
      studyPlan: [],
      xpLogs: semesterData.xpLogs as XPLog[],
      
      addSemester: (semData) => set((state) => {
        const id = Math.random().toString(36).substring(2, 11);
        return { 
          semesters: [...state.semesters, { ...semData, id }],
          activeSemesterId: state.activeSemesterId || id
        };
      }),
      
      updateSemester: (id, updates) => set((state) => ({
        semesters: state.semesters.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      
      deleteSemester: (id) => set((state) => ({
        semesters: state.semesters.filter(s => s.id !== id),
        courses: state.courses.filter(c => c.semesterId !== id),
        activeSemesterId: state.activeSemesterId === id ? (state.semesters.length > 1 ? state.semesters.find(s => s.id !== id)?.id || null : null) : state.activeSemesterId
      })),
      
      setActiveSemester: (id) => set({ activeSemesterId: id }),
      
      addCourse: (courseData) => set((state) => ({
        courses: [...state.courses, { ...courseData, topics: [], id: Math.random().toString(36).substring(2, 11) }]
      })),
      
      updateCourse: (id, updates) => set((state) => ({
        courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      
      deleteCourse: (id) => set((state) => ({
        courses: state.courses.filter(c => c.id !== id)
      })),

      addTopic: (courseId, title) => set((state) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: [...c.topics, { id: Math.random().toString(36).substring(2, 11), title, completed: false, confidence: 0, repetitionCount: 0 }]
        } : c)
      })),

      updateTopic: (courseId, topicId, updates) => set((state) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: c.topics.map(t => t.id === topicId ? { ...t, ...updates } : t)
        } : c)
      })),

      deleteTopic: (courseId, topicId) => set((state) => ({
        courses: state.courses.map(c => c.id === courseId ? {
          ...c,
          topics: c.topics.filter(t => t.id !== topicId)
        } : c)
      })),

      addXp: (amount, source) => set((state) => ({
        xpLogs: [{
          id: Math.random().toString(36).substring(2, 11),
          amount,
          source,
          date: new Date().toISOString()
        }, ...state.xpLogs].slice(0, 50) // Keep last 50
      })),

      generateStudyPlan: (pastSessions) => set((state) => {
        if (!state.activeSemesterId) return state;
        
        const activeSemester = state.semesters.find(s => s.id === state.activeSemesterId);
        if (!activeSemester) return state;

        const activeCourses = state.courses.filter(c => c.semesterId === state.activeSemesterId);
        if (activeCourses.length === 0) return state;

        const totalSks = activeSemester.totalSks || activeCourses.reduce((sum, c) => sum + c.sks, 0);
        const sortedCourses = [...activeCourses].sort((a, b) => (b.sks / totalSks) - (a.sks / totalSks));

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const recentlyStudiedIds = new Set(
          pastSessions
            .filter(s => s.date.startsWith(yesterdayStr))
            .map(s => s.courseId)
        );

        const avgPriority = 1 / activeCourses.length;
        const selectedCourses = sortedCourses.filter(c => {
          const priority = c.sks / totalSks;
          if (recentlyStudiedIds.has(c.id)) {
            return priority > avgPriority;
          }
          return true;
        }).slice(0, 3);

        const newPlan = selectedCourses.map(c => {
          const targetTopic = c.topics.find(t => !t.completed) || c.topics.sort((a, b) => a.confidence - b.confidence)[0];
          // Allocated time based on SKS: e.g., 45 mins per SKS point for a session
          const allocatedMinutes = Math.max(30, c.sks * 25); 

          return {
            courseId: c.id,
            topicTitle: targetTopic ? targetTopic.title : 'General Review',
            allocatedMinutes
          };
        });

        return { ...state, studyPlan: newPlan };
      }),

      skipTask: (courseId, topicTitle) => set((state) => ({
        studyPlan: state.studyPlan.filter(p => !(p.courseId === courseId && p.topicTitle === topicTitle))
      })),

      importData: (data) => set((state) => ({
        ...state,
        semesters: data.semesters,
        courses: data.courses,
        xpLogs: data.xpLogs || state.xpLogs,
        activeSemesterId: data.semesters[0]?.id || null
      })),
    }),
    {
      name: 'wdc-academic-storage',
    }
  )
);
