import { useNotificationStore } from '../../store/useNotificationStore';
import { X, Bell, AlertTriangle, Trophy, Flame, Info, Calendar } from 'lucide-react';

const iconMap = {
  reminder: <Calendar size={18} className="text-neon-cyan" />,
  deadline: <AlertTriangle size={18} className="text-neon-red" />,
  streak: <Flame size={18} className="text-neon-gold" />,
  badge: <Trophy size={18} className="text-neon-gold" />,
  info: <Info size={18} className="text-neon-cyan" />,
};

const bgMap = {
  reminder: 'border-neon-cyan/30 bg-neon-cyan/5',
  deadline: 'border-neon-red/30 bg-neon-red/5',
  streak: 'border-neon-gold/30 bg-neon-gold/5',
  badge: 'border-neon-gold/30 bg-neon-gold/5',
  info: 'border-neon-cyan/30 bg-neon-cyan/5',
};

export function NotificationToast() {
  const { notifications, removeToast } = useNotificationStore();

  const toasts = notifications.filter((n) => n.isToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.slice(0, 5).map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto game-panel p-4 border ${bgMap[notif.type]} flex items-start gap-3 animate-in slide-in-from-right-full duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl`}
        >
          <div className="p-2 rounded-xl bg-surface-2 border border-white/5 shrink-0">
            {notif.icon ? <span className="text-lg">{notif.icon}</span> : iconMap[notif.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-widest font-display mb-1 text-text-main">
              {notif.title}
            </div>
            <div className="text-[11px] text-text-muted leading-relaxed">
              {notif.message}
            </div>
          </div>
          <button
            onClick={() => removeToast(notif.id)}
            className="p-1 text-text-muted/40 hover:text-text-main hover:scale-125 active:scale-90 transition-all shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
