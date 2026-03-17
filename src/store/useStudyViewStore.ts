import { create } from 'zustand';

interface TimerState {
  courseId: string;
  topicTitle: string;
  isCustomTopic: boolean;
  elapsed: number;
  systemId: string;
}

interface StudyViewState {
  timerState: TimerState;
  suggestions: string[];
  
  // Actions
  setTimerState: (updates: Partial<TimerState> | ((s: TimerState) => Partial<TimerState>)) => void;
  setSuggestions: (suggestions: string[]) => void;
  resetTimer: () => void;
}

const initialTimerState: TimerState = {
  courseId: '',
  topicTitle: '',
  isCustomTopic: false,
  elapsed: 0,
  systemId: Math.random().toString(16).substring(2, 8).toUpperCase(),
};

export const useStudyViewStore = create<StudyViewState>((set) => ({
  timerState: initialTimerState,
  suggestions: [],

  setTimerState: (updates) => set((state) => ({
    timerState: {
      ...state.timerState,
      ...(typeof updates === 'function' ? updates(state.timerState) : updates)
    }
  })),
  setSuggestions: (suggestions) => set({ suggestions }),
  resetTimer: () => set({ timerState: initialTimerState, suggestions: [] }),
}));
