import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useSplashScreenStore } from '../../store/useSplashScreenStore';
import { playClickSound } from '../../hooks/useRPGAudio';
import { ChevronRight, Play } from 'lucide-react';

// ===== PARTICLE DATA =====
// (Keeping particle logic)
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
// (Keeping typewriter hook but utilizing store if needed later, for now keeping it local as it's purely UI transient)
function useTypewriter(text: string, startDelay: number, charDelay = 60) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let charIndex = 0;
    const timeout = setTimeout(() => {
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
  const {
    phase,
    loadingProgress,
    mousePos,
    exiting,
    setPhase,
    setLoadingProgress,
    setMousePos,
    setExiting
  } = useSplashScreenStore();

  const { language } = useLanguageStore();
  const particles = useMemo(() => generateParticles(25), []);

  // Phase sequencing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 400));   // boot text
    timers.push(setTimeout(() => setPhase(2), 1200));   // title
    timers.push(setTimeout(() => setPhase(3), 2800));   // tagline + loading
    timers.push(setTimeout(() => setPhase(4), 4200));   // press start

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [setPhase]);

  // Loading bar animation - FIXED: Removed loadingProgress from dependencies 
  useEffect(() => {
    if (phase >= 3) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(prev + 2 + Math.random() * 5, 100);
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase, setLoadingProgress]);

  // Mouse parallax
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, [setMousePos]);

  // Handle start
  const handleStart = useCallback(() => {
    if (phase < 4 || exiting) return;

    playClickSound();

    setExiting(true);
    setPhase(5);

    setTimeout(() => {
      setPhase(6);
      onComplete();
    }, 900);
  }, [phase, exiting, onComplete, setExiting, setPhase]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setPhase(5);
    setTimeout(() => {
      setPhase(6);
      onComplete();
    }, 500);
  }, [exiting, onComplete, setExiting, setPhase]);


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
      className={`splash-overlay ${exiting ? 'splash-exiting' : ''} ${phase >= 4 ? 'cursor-pointer' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={phase >= 4 ? () => handleStart() : undefined}
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
        {particles.map((p: Particle) => (
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
        {language === 'id' ? 'LEWATI' : 'SKIP'} <ChevronRight className="inline" size={16} />
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
            <Play className="inline mr-1" size={16} /> {language === 'id' ? 'PRESS START' : 'PRESS START'}
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
