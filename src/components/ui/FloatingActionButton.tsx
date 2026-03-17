import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  mainIcon?: React.ReactNode;
  actions?: FABAction[];
  onClick?: () => void; // Used if there's only one action
}

export function FloatingActionButton({
  mainIcon = <Plus size={24} />,
  actions = [],
  onClick,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If only one action is provided via onClick, we don't need a menu
  if (onClick && actions.length === 0) {
    return (
      <div className="fixed bottom-6 right-6 z-100 lg:hidden">
        <button
          onClick={onClick}
          className="w-14 h-14 rounded-full bg-neon-cyan text-bg-main shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none border-none"
        >
          {mainIcon}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-100 lg:hidden flex flex-col items-end gap-3">
      {/* Action Menu */}
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {actions.map((action, idx) => (
            <div key={idx} className="flex items-center gap-3 group">
              <span className="bg-bg-main/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neon-cyan/20 text-[10px] font-black uppercase tracking-widest text-neon-cyan shadow-lg">
                {action.label}
              </span>
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 rounded-full ${
                  action.color || "bg-surface-2"
                } border border-neon-cyan/20 text-neon-cyan shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all`}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => (actions.length > 0 ? setIsOpen(!isOpen) : onClick?.())}
        className={`w-14 h-14 rounded-full ${
          isOpen ? "bg-neon-red rotate-45" : "bg-neon-cyan"
        } text-bg-main shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none border-none z-10`}
      >
        {isOpen ? <X size={24} /> : mainIcon}
      </button>

      {/* Backdrop for closing */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
