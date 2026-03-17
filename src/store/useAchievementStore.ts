import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  unlockedAt: string | null;
}

interface AchievementState {
  achievements: Achievement[];
  lastChecked: string | null;
  checkAchievements: (ctx: AchievementContext) => Achievement[];
}

export interface AchievementContext {
  completedTasksCount: number;
  totalStudyMinutes: number;
  totalSessions: number;
  currentStreak: number;
  hasNightSession: boolean;
  hasSameDayTask: boolean;
  totalTasksCreated: number;
  sessionsToday: number;
}

const defaultAchievements: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    titleEn: 'First Blood',
    description: 'Selesaikan task pertama kamu',
    descriptionEn: 'Complete your first task',
    icon: 'sword',
    rarity: 'common',
    unlockedAt: null,
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    titleEn: 'Streak Master',
    description: 'Belajar 7 hari berturut-turut',
    descriptionEn: 'Study for 7 consecutive days',
    icon: 'flame',
    rarity: 'rare',
    unlockedAt: null,
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    titleEn: 'Night Owl',
    description: 'Selesaikan session setelah jam 22:00',
    descriptionEn: 'Complete a session after 10 PM',
    icon: 'moon',
    rarity: 'common',
    unlockedAt: null,
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    titleEn: 'Bookworm',
    description: 'Selesaikan 10 sesi belajar',
    descriptionEn: 'Complete 10 study sessions',
    icon: 'book',
    rarity: 'common',
    unlockedAt: null,
  },
  {
    id: 'speed_runner',
    title: 'Speed Runner',
    titleEn: 'Speed Runner',
    description: 'Selesaikan task di hari yang sama saat dibuat',
    descriptionEn: 'Complete a task the same day it was created',
    icon: 'zap',
    rarity: 'rare',
    unlockedAt: null,
  },
  {
    id: 'grinder',
    title: 'Grinder',
    titleEn: 'Grinder',
    description: 'Kumpulkan total 50 jam belajar',
    descriptionEn: 'Accumulate 50 total study hours',
    icon: 'gem',
    rarity: 'legendary',
    unlockedAt: null,
  },
  {
    id: 'task_slayer',
    title: 'Task Slayer',
    titleEn: 'Task Slayer',
    description: 'Selesaikan 10 task',
    descriptionEn: 'Complete 10 tasks',
    icon: 'crosshair',
    rarity: 'rare',
    unlockedAt: null,
  },
  {
    id: 'marathon',
    title: 'Marathon Runner',
    titleEn: 'Marathon Runner',
    description: 'Belajar 3 sesi dalam satu hari',
    descriptionEn: 'Complete 3 study sessions in one day',
    icon: 'timer',
    rarity: 'rare',
    unlockedAt: null,
  },
];

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: defaultAchievements,
      lastChecked: null,

      checkAchievements: (ctx: AchievementContext) => {
        const { achievements } = get();
        const newlyUnlocked: Achievement[] = [];
        const now = new Date().toISOString();

        const updated = achievements.map((a) => {
          if (a.unlockedAt) return a; // Already unlocked

          let shouldUnlock = false;

          switch (a.id) {
            case 'first_blood':
              shouldUnlock = ctx.completedTasksCount >= 1;
              break;
            case 'streak_master':
              shouldUnlock = ctx.currentStreak >= 7;
              break;
            case 'night_owl':
              shouldUnlock = ctx.hasNightSession;
              break;
            case 'bookworm':
              shouldUnlock = ctx.totalSessions >= 10;
              break;
            case 'speed_runner':
              shouldUnlock = ctx.hasSameDayTask;
              break;
            case 'grinder':
              shouldUnlock = ctx.totalStudyMinutes >= 3000; // 50 hours
              break;
            case 'task_slayer':
              shouldUnlock = ctx.completedTasksCount >= 10;
              break;
            case 'marathon':
              shouldUnlock = ctx.sessionsToday >= 3;
              break;
          }

          if (shouldUnlock) {
            const unlocked = { ...a, unlockedAt: now };
            newlyUnlocked.push(unlocked);
            return unlocked;
          }
          return a;
        });

        if (newlyUnlocked.length > 0) {
          set({ achievements: updated, lastChecked: now });
        }

        return newlyUnlocked;
      },
    }),
    {
      name: 'wdc-achievement-storage',
    }
  )
);
