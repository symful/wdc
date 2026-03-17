import { useEffect, useRef, useCallback } from 'react';

// Shared AudioContext to prevent creating too many contexts
let sharedCtx: AudioContext | null = null;
let systemMuted = false;

function getContext() {
  if (systemMuted) return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume context if it was suspended (browser autoplay policy)
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}

export const playClickSound = () => {
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  // Fast pop sound
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
};

export const playHoverSound = () => {
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
};

export const playSuccessSound = () => {
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  playNote(440, now, 0.1); // A4
  playNote(554, now + 0.1, 0.1); // C#5
  playNote(659, now + 0.2, 0.3); // E5
};

export const useRPGAudio = () => {
  useEffect(() => {
    // We attach listeners to the document body to catch all relevant interactions
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('button, a, [role="button"], .cursor-pointer')) {
        playHoverSound();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('button, a, [role="button"], .cursor-pointer')) {
        playClickSound();
      }
    };

    document.addEventListener('mouseover', handleMouseOver, { capture: true, passive: true });
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  return null;
};
