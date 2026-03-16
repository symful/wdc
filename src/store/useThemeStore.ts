import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('light-mode', newTheme === 'light');
        set({ theme: newTheme });
      },

      setTheme: (theme) => {
        document.documentElement.classList.toggle('light-mode', theme === 'light');
        set({ theme });
      },

      initTheme: () => {
        const { theme } = get();
        document.documentElement.classList.toggle('light-mode', theme === 'light');
      },
    }),
    {
      name: 'wdc-theme-storage',
    }
  )
);
