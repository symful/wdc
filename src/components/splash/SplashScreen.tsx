import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguageStore, translations } from '../../store/useLanguageStore';

// ===== WEB AUDIO API SOUND EFFECTS =====
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playBootBeep(ctx: AudioContext, freq: number, startTime: number, duration = 0.08) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0.06, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playBootSequence(ctx: AudioContext) {
  const now = ctx.currentTime;
  const freqs = [220, 330, 440, 550, 660, 880];
  freqs.forEach((f, i) => {
    playBootBeep(ctx, f, now + i * 0.1, 0.08);
  });
}

// Removed redundant local sound funcs to rely on useRPGAudio hook 

// ===== PARTICLE DATA =====
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  shape: 'hexagon' | 'triangle' | 'diamond' | 'dot';
  speed: number;
  delay: number;
  opacity: number;
}

function generateParticles(count: number): Particle[] {
  const shapes: Particle['shape'][] = ['hexagon', 'triangle', 'diamond', 'dot'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 16,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    speed: 15 + Math.random() * 25,
    delay: Math.random() * 8,
    opacity: 0.08 + Math.random() * 0.2,
  }));
}

// ===== TYPEWRITER HOOK =====
function useTypewriter(text: string, startDelay: number, charDelay = 60) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let charIndex = 0;

    timeout = setTimeout(() => {
      const interval = setInterval(() => {
        charIndex++;
        setDisplayed(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, charDelay);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [text, startDelay, charDelay]);

  return { displayed, done };
}

// ===== SPLASH SCREEN COMPONENT =====
interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);
  // phase 0: initial fade-in (hex grid + particles)
  // phase 1: boot text typing
  // phase 2: title typing
  // phase 3: tagline + loading bar
  // phase 4: press start visible
  // phase 5: exit animation
  // phase 6: done (unmount)

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [exiting, setExiting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { language } = useLanguageStore();
  const t = translations[language];
  const particles = useRef(generateParticles(25)).current;

  // Phase sequencing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 400));   // boot text
    timers.push(setTimeout(() => setPhase(2), 1200));   // title
    timers.push(setTimeout(() => setPhase(3), 2800));   // tagline + loading
    timers.push(setTimeout(() => setPhase(4), 4200));   // press start

    return () => timers.forEach(clearTimeout);
  }, []);

  // Removed blocked auto-play audio implementation

  // Loading bar animation
  useEffect(() => {
    if (phase >= 3) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2 + Math.random() * 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setLoadingProgress(progress);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Mouse parallax
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, []);

  // Handle start
  const handleStart = useCallback(() => {
    if (phase < 4 || exiting) return;

    import('../../hooks/useRPGAudio').then(({ playSuccessSound }) => playSuccessSound());

    setExiting(true);
    setPhase(5);

    setTimeout(() => {
      setPhase(6);
      onComplete();
    }, 900);
  }, [phase, exiting, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setPhase(5);
    setTimeout(() => {
      setPhase(6);
      onComplete();
    }, 500);
  }, [exiting, onComplete]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleStart]);

  // Typewriter texts
  const bootText = useTypewriter(language === 'id' ? '> MENGINISIALISASI SISTEM...' : '> INITIALIZING SYSTEM...', phase >= 1 ? 0 : 99999, 40);
  const titleText = useTypewriter('ontime!', phase >= 2 ? 0 : 99999, 80);

  if (phase === 6) return null;

  const parallaxX = (mousePos.x - 0.5) * 20;
  const parallaxY = (mousePos.y - 0.5) * 20;

  return (
    <div
      className={`splash-overlay ${exiting ? 'splash-exiting' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={phase >= 4 ? handleStart : undefined}
      id="splash-screen"
    >
      {/* Hex Grid Background */}
      <div className="splash-hex-grid" />

      {/* Scan Line */}
      <div className="splash-scanline" />

      {/* Floating Particles */}
      <div
        className="splash-particles-container"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className={`splash-particle splash-particle-${p.shape}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDuration: `${p.speed}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Skip Button */}
      <button
        className="splash-skip-btn"
        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
        id="splash-skip-btn"
      >
        {language === 'id' ? 'LEWATI ▸' : 'SKIP ▸'}
      </button>

      {/* Central Content */}
      <div className="splash-content">
        {/* Boot Text */}
        {phase >= 1 && (
          <div className={`splash-boot-text ${bootText.done ? 'done' : ''}`}>
            {bootText.displayed}
            <span className="splash-cursor">_</span>
          </div>
        )}

        {/* Timer Emblem */}
        {phase >= 2 && (
          <div className="splash-emblem">
            <svg viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="splash-shield-svg">
              <circle
                cx="30"
                cy="38"
                r="26"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="30"
                cy="38"
                r="22"
                stroke="currentColor"
                strokeWidth="1"
                fill="rgba(0, 240, 255, 0.05)"
              />
              <path
                d="M30 12V2M24 2H36M46 22L50 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M30 38L38 30"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text x="30" y="44" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="Orbitron" fontWeight="900" opacity="0.3">T</text>
            </svg>
          </div>
        )}

        {/* Title */}
        {phase >= 2 && (
          <h1 className="splash-title">
            {titleText.displayed}
            {!titleText.done && <span className="splash-cursor">_</span>}
          </h1>
        )}

        {/* Tagline */}
        {phase >= 3 && (
          <p className="splash-tagline">
            {language === 'id' ? 'Apakah kamu siap menaklukkan setiap misi?' : 'Are you ready to conquer every mission?'}
          </p>
        )}

        {/* Loading Bar */}
        {phase >= 3 && (
          <div className="splash-loading-section">
            <div className="splash-loading-bar">
              <div
                className="splash-loading-fill"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="splash-loading-text">
              {loadingProgress < 100
                ? `${language === 'id' ? 'MEMUAT DATA TUGAS...' : 'LOADING TASK DATA...'} ${Math.floor(loadingProgress)}%`
                : (language === 'id' ? 'SISTEM SIAP' : 'SYSTEM READY')}
            </div>
          </div>
        )}

        {/* Press Start Button */}
        {phase >= 4 && (
          <button
            className="splash-start-btn"
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            id="splash-start-btn"
          >
            ▶ {language === 'id' ? 'PRESS START' : 'PRESS START'}
          </button>
        )}

        {/* Hint */}
        {phase >= 4 && (
          <div className="splash-hint">
            {language === 'id' ? 'atau tekan ENTER untuk lanjut' : 'or press ENTER to continue'}
          </div>
        )}
      </div>

      {/* Corner HUD decorations */}
      <div className="splash-hud-corner splash-hud-tl" />
      <div className="splash-hud-corner splash-hud-tr" />
      <div className="splash-hud-corner splash-hud-bl" />
      <div className="splash-hud-corner splash-hud-br" />
    </div>
  );
}
