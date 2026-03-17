import { create } from 'zustand';
import { SemesterType } from './useAcademicStore';

interface ProfileForm {
  number: number;
  year: string;
  type: SemesterType;
  totalSks: number;
}

interface ProfileState {
  showAddModal: boolean;
  showLogModal: boolean;
  form: ProfileForm;

  // Actions
  setShowAddModal: (show: boolean) => void;
  setShowLogModal: (show: boolean) => void;
  setForm: (updates: Partial<ProfileForm> | ((s: ProfileForm) => Partial<ProfileForm>)) => void;
  resetForm: (nextSemesterNumber: number) => void;
}

const initialForm: (number: number) => ProfileForm = (number) => ({
  number: number,
  year: "2023/2024",
  type: "ganjil",
  totalSks: 0,
});

export const useProfileStore = create<ProfileState>((set) => ({
  showAddModal: false,
  showLogModal: false,
  form: initialForm(1),

  setShowAddModal: (showAddModal) => set({ showAddModal }),
  setShowLogModal: (showLogModal) => set({ showLogModal }),
  setForm: (updates) => set((state) => ({
    form: {
      ...state.form,
      ...(typeof updates === 'function' ? updates(state.form) : updates)
    }
  })),
  resetForm: (nextSemesterNumber) => set({ 
    form: initialForm(nextSemesterNumber)
  }),
}));
