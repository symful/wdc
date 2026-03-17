import { create } from 'zustand';
import { AcademicCourse } from './useAcademicStore';

type StudyManagerForm = Omit<AcademicCourse, "id" | "semesterId">;

interface StudyManagerState {
  showModal: boolean;
  editingId: string | null;
  form: StudyManagerForm;

  // Actions
  setShowModal: (show: boolean) => void;
  setEditingId: (id: string | null) => void;
  setForm: (updates: Partial<StudyManagerForm> | ((s: StudyManagerForm) => Partial<StudyManagerForm>)) => void;
  resetForm: () => void;
  updateSchedule: (index: number, updates: Partial<StudyManagerForm['schedules'][0]>) => void;
  addSchedule: () => void;
  removeSchedule: (index: number) => void;
}

const initialForm: StudyManagerForm = {
  name: "",
  code: "",
  sks: 3,
  type: "Wajib",
  schedules: [{
    day: 0,
    startTime: "08:00",
    endTime: "10:00",
    room: "",
    lecturer: "",
  }],
  topics: [],
};

export const useStudyManagerStore = create<StudyManagerState>((set) => ({
  showModal: false,
  editingId: null,
  form: initialForm,

  setShowModal: (showModal) => set({ showModal }),
  setEditingId: (editingId) => set({ editingId }),
  setForm: (updates) => set((state) => ({
    form: {
      ...state.form,
      ...(typeof updates === 'function' ? updates(state.form) : updates)
    }
  })),
  resetForm: () => set({ form: initialForm, editingId: null }),
  updateSchedule: (index, updates) => set((state) => ({
    form: {
      ...state.form,
      schedules: state.form.schedules.map((sch, i) => 
        i === index ? { ...sch, ...updates } : sch
      )
    }
  })),
  addSchedule: () => set((state) => ({
    form: {
      ...state.form,
      schedules: [...state.form.schedules, {
        day: 0,
        startTime: "08:00",
        endTime: "10:00",
        room: "",
        lecturer: "",
      }]
    }
  })),
  removeSchedule: (index) => set((state) => ({
    form: {
      ...state.form,
      schedules: state.form.schedules.filter((_, i) => i !== index)
    }
  })),
}));
