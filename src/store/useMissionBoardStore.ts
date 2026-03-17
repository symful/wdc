import { create } from 'zustand';
import { TaskPriority, TaskType } from './useTaskStore';

interface MissionForm {
  title: string;
  type: TaskType;
  deadline: string;
  priority: TaskPriority;
  weight: number;
}

interface MissionBoardState {
  showAddModal: boolean;
  viewMode: 'active' | 'archive';
  filterPriority: 'all' | 'high' | 'med' | 'low';
  completingId: string | null;
  expandedId: string | null;
  form: MissionForm;

  // Actions
  setShowAddModal: (show: boolean) => void;
  setViewMode: (mode: 'active' | 'archive') => void;
  setFilterPriority: (priority: 'all' | 'high' | 'med' | 'low') => void;
  setCompletingId: (id: string | null) => void;
  setExpandedId: (id: string | null) => void;
  setForm: (updates: Partial<MissionForm> | ((s: MissionForm) => Partial<MissionForm>)) => void;
  resetForm: () => void;
}

const initialForm: MissionForm = {
  title: "",
  type: "tugas",
  deadline: "",
  priority: "med",
  weight: 10,
};

export const useMissionBoardStore = create<MissionBoardState>((set) => ({
  showAddModal: false,
  viewMode: 'active',
  filterPriority: 'all',
  completingId: null,
  expandedId: null,
  form: initialForm,

  setShowAddModal: (showAddModal) => set({ showAddModal }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setCompletingId: (completingId) => set({ completingId }),
  setExpandedId: (expandedId) => set({ expandedId }),
  setForm: (updates) => set((state) => ({
    form: {
      ...state.form,
      ...(typeof updates === 'function' ? updates(state.form) : updates)
    }
  })),
  resetForm: () => set({ form: initialForm }),
}));
