import React, { useEffect, useState, useRef } from 'react';
import { MountAlgoLogo } from './MountAlgoLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 300);
    const exitTimer = setTimeout(() => setPhase('exit'), 2000);
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 2600);

    const handleKeyDown = () => {
      onCompleteRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSkip = () => {
    onCompleteRef.current();
  };

  return (
    <div
      onClick={handleSkip}
      onTouchStart={handleSkip}
      title="Klik untuk melewati splash screen"
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden bg-[#05070a] cursor-pointer select-none"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      {/* Deep dark professional background */}
      <div className="absolute inset-0 bg-[#05070a]" />

      {/* Subtle floating orbs in theme colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.08]"
          style={{
            background: 'radial-gradient(circle, #22c55e, transparent 70%)',
            top: '-10%',
            left: '-5%',
            animation: 'splashFloat1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
            bottom: '10%',
            right: '5%',
            animation: 'splashFloat2 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'splashFloat3 5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Custom keyframe animation styled directly inside component */}
      <style>{`
        @keyframes shimmerMove {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .animate-shimmer-progress {
          background-size: 200% 100%;
          animation: shimmerMove 1.6s infinite linear;
        }
      `}</style>

      {/* Center content - pristine branding without any surrounding card borders */}
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.97) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Brand Row with Logo and Text side-by-side */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <MountAlgoLogo 
              className="w-11 h-11 sm:w-14 sm:h-14 shrink-0" 
            />
            <h1
              className="text-4xl sm:text-5xl font-black italic tracking-wider text-white animate-text-slash"
              style={{
                textShadow: '0 0 45px rgba(255,255,255,0.35), 0 0 90px rgba(255,255,255,0.18)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
            </h1>
          </div>
          <span
            className="text-xs sm:text-sm font-mono font-bold tracking-[0.45em] uppercase mt-2.5 text-zinc-300"
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.3)',
            }}
          >
            terminal
          </span>
        </div>

        {/* Shimmering Gradient Horizontal Line Loading Indicator */}
        <div className="w-52 sm:w-60 h-[3px] bg-white/10 rounded-full overflow-hidden mt-4 relative">
          <div 
            className="absolute inset-0 rounded-full animate-shimmer-progress"
            style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, #10b981 35%, #06b6d4 65%, rgba(6, 182, 212, 0.2) 100%)',
            }}
          />
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        className="absolute bottom-8 left-0 right-0 text-center z-10"
        style={{
          opacity: phase === 'enter' ? 0 : 0.5,
          transition: 'opacity 1s ease 0.5s',
        }}
      >
        <p className="text-[10px] font-mono text-white/40 tracking-wider">
          Professional Trading Terminal • Real-Time Market Data
        </p>
      </div>
    </div>
  );
}
