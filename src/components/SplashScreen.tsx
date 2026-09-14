import React, { useEffect, useState } from 'react';
import { MountAlgoLogo } from './MountAlgoLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 300);
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    const completeTimer = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden bg-[#05070a]"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.8s ease-in-out',
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

      {/* Center content */}
      <div
        className="relative z-10 flex flex-col items-center gap-4"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.9) translateY(20px)' : 'scale(1) translateY(0)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Brand Row with Logo and Text side-by-side */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <MountAlgoLogo 
              className="w-10 h-10 sm:w-13 sm:h-13 shrink-0" 
            />
            <h1
              className="text-4xl sm:text-5xl font-black italic tracking-wider text-white animate-text-slash"
              style={{
                textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.15)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <span>𝙈𝙤𝙪𝙣𝙩𝘼𝙡𝙜𝙤</span>
            </h1>
          </div>
          <span
            className="text-sm sm:text-base font-mono font-bold tracking-[0.35em] uppercase mt-1"
            style={{
              color: 'rgba(255,255,255,0.7)',
              textShadow: '0 0 20px rgba(255,255,255,0.3)',
            }}
          >
            terminal
          </span>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/50"
              style={{
                animation: `splashPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
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
