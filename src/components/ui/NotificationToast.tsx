import { useNotificationStore } from "../../store/useNotificationStore";
import { X } from "lucide-react";

const bgMap = {
  reminder: "border-neon-cyan/30 bg-neon-cyan/5",
  deadline: "border-neon-red/30 bg-neon-red/5",
  streak: "border-neon-gold/30 bg-neon-gold/5",
  badge: "border-neon-gold/30 bg-neon-gold/5",
  info: "border-neon-cyan/30 bg-neon-cyan/5",
};

export function NotificationToast() {
  const { notifications, removeToast } = useNotificationStore();

  const toasts = notifications.filter((n) => n.isToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:top-24 md:right-4 md:left-auto z-999 flex flex-col gap-3 max-w-sm w-full pointer-events-none md:pointer-events-auto">
      {toasts.slice(0, 5).map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto game-panel p-3 md:p-4 border ${
            bgMap[notif.type]
          } flex items-start gap-3 animate-in slide-in-from-right-full duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs md:text-sm font-black uppercase tracking-widest font-display mb-1 text-text-main">
              {notif.title}
            </div>
            <div className="text-[10px] md:text-[11px] text-text-muted leading-relaxed line-clamp-2">
              {notif.message}
            </div>
          </div>
          <button
            onClick={() => removeToast(notif.id)}
            className="p-2 text-text-muted/40 hover:text-text-main hover:scale-125 active:scale-90 transition-all shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
