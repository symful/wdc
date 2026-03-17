import { create } from 'zustand';

interface SplashScreenState {
  phase: number;
  loadingProgress: number;
  mousePos: { x: number; y: number };
  exiting: boolean;
  showSplash: boolean;
  
  // Actions
  setPhase: (phase: number) => void;
  setLoadingProgress: (progress: number | ((p: number) => number)) => void;
  setMousePos: (pos: { x: number; y: number }) => void;
  setExiting: (exiting: boolean) => void;
  setShowSplash: (show: boolean) => void;
  reset: () => void;
}

const SPLASH_KEY = 'ontime-splash-seen';

const initialState = {
  phase: 0,
  loadingProgress: 0,
  mousePos: { x: 0.5, y: 0.5 },
  exiting: false,
  showSplash: !sessionStorage.getItem(SPLASH_KEY),
};

export const useSplashScreenStore = create<SplashScreenState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setLoadingProgress: (update) => set((state) => ({ 
    loadingProgress: typeof update === 'function' ? update(state.loadingProgress) : update 
  })),
  setMousePos: (mousePos) => set({ mousePos }),
  setExiting: (exiting) => set({ exiting }),
  setShowSplash: (showSplash) => set({ showSplash }),
  reset: () => set(initialState),
}));
