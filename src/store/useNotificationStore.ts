import { create } from 'zustand';

export type NotificationType = 'reminder' | 'deadline' | 'streak' | 'badge' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  autoDismiss?: boolean;
  isToast?: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'isToast'>) => void;
  dismissNotification: (id: string) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
      isToast: true,
    };

    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 30),
    }));

    // Auto-dismiss after 6 seconds if autoDismiss is true
    if (notif.autoDismiss !== false) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === newNotif.id ? { ...n, isToast: false } : n
          ),
        }));
      }, 6000);
    }
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  removeToast: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isToast: false } : n
      ),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
