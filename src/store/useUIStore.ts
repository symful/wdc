import { create } from 'zustand';

interface GenerationState {
  isActive: boolean;
  isExiting: boolean;
  step: number;
  completed: boolean;
  type: 'study-plan' | 'google-sync';
}

interface UIState {
  // Layout
  sidebarOpen: boolean;
  showNotifPanel: boolean;
  
  // Dashboard / Generation
  generationState: GenerationState;
  selectedDayIndex: number;

  // Study View
  studyModals: {
    confidenceModal: boolean;
    showTreeModal: boolean;
    showSuggestions: boolean;
  };

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setShowNotifPanel: (show: boolean) => void;
  setGenerationState: (state: Partial<GenerationState> | ((s: GenerationState) => Partial<GenerationState>)) => void;
  resetGenerationState: () => void;
  setSelectedDayIndex: (index: number) => void;
  setStudyModal: (modal: keyof UIState['studyModals'], show: boolean) => void;
}

const initialGenerationState: GenerationState = {
  isActive: false,
  isExiting: false,
  step: 0,
  completed: false,
  type: 'study-plan',
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  showNotifPanel: false,
  
  generationState: initialGenerationState,
  selectedDayIndex: (new Date().getDay() + 6) % 7,

  studyModals: {
    confidenceModal: false,
    showTreeModal: false,
    showSuggestions: false,
  },

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setShowNotifPanel: (showNotifPanel) => set({ showNotifPanel }),
  
  setGenerationState: (updates) => set((state) => ({ 
    generationState: { 
      ...state.generationState, 
      ...(typeof updates === 'function' ? updates(state.generationState) : updates) 
    } 
  })),
  
  resetGenerationState: () => set({ generationState: initialGenerationState }),
  
  setSelectedDayIndex: (selectedDayIndex) => set({ selectedDayIndex }),
  
  setStudyModal: (modal, show) => set((state) => ({
    studyModals: { ...state.studyModals, [modal]: show }
  })),
}));
