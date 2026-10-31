import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3, Layers, Zap, Shield, Globe2, Activity,
  ArrowUpRight, ChevronDown, Monitor,
  LayoutDashboard, Crosshair,
  CandlestickChart, Sparkles, Wifi
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { MountAlgoLogo } from './MountAlgoLogo';
import type { LogoutFn } from './authShim';

interface LandingPageProps {
  onEnterTerminal: () => void;
  logout?: LogoutFn;
}

function hexToRgbTuple(hex: string, fallback = [81, 52, 255]): [number, number, number] {
  if (!hex) return fallback as [number, number, number];
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return fallback as [number, number, number];
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getThemeDarkGradient(bullHex: string, bearHex?: string) {
  const [r, g, b] = hexToRgbTuple(bullHex, [81, 52, 255]);
  const [r2, g2, b2] = bearHex ? hexToRgbTuple(bearHex, [23, 156, 116]) : [20, 24, 38];
  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.85) 0%, rgba(${r2}, ${g2}, ${b2}, 0.45) 55%, rgba(6, 8, 16, 0.96) 100%)`,
    boxShadow: `0 8px 28px -4px rgba(${r}, ${g}, ${b}, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
  };
}

/* ───── Flash / Light Streak Background ───── */
function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let t = 0;
    let destroyed = false;

    const [bullR, bullG, bullB] = hexToRgbTuple(palette.bull, [81, 52, 255]);
    const [bearR, bearG, bearB] = hexToRgbTuple(palette.bear, [23, 156, 116]);
    const [pocR, pocG, pocB] = hexToRgbTuple(palette.poc, [255, 255, 255]);
    const [bgR, bgG, bgB] = hexToRgbTuple(palette.dark, [3, 4, 8]);

    const BULL = `${bullR},${bullG},${bullB}`;
    const BEAR = `${bearR},${bearG},${bearB}`;
    const POC = `${pocR},${pocG},${pocB}`;

    // --- Flash streaks ---
    interface Streak {
      x: number; y: number;
      len: number; maxLen: number;
      angle: number; speed: number;
      r: string; alpha: number; maxAlpha: number;
      width: number; born: number; life: number;
    }
    const streaks: Streak[] = [];
    const MAX_STREAKS = 35;

    const spawnStreak = (w: number, h: number) => {
      const rand = Math.random();
      const color = rand > 0.55 ? BULL : rand > 0.2 ? BEAR : POC;
      const angle = (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 4 + 2;
      streaks.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 0, maxLen: Math.random() * 300 + 100,
        angle, speed,
        r: color, alpha: 0, maxAlpha: Math.random() * 0.3 + 0.1,
        width: Math.random() * 2.5 + 0.8,
        born: t, life: Math.random() * 100 + 50,
      });
    };

    // --- Ambient orbs ---
    interface Orb {
      x: number; y: number; r: string; radius: number;
      vx: number; vy: number; alpha: number; pulse: number;
    }
    const orbs: Orb[] = [];
    const ORB_COUNT = 7;

    const initOrbs = (w: number, h: number) => {
      orbs.length = 0;
      for (let i = 0; i < ORB_COUNT; i++) {
        const rand = Math.random();
        const color = rand > 0.5 ? BULL : rand > 0.2 ? BEAR : POC;
        orbs.push({
          x: Math.random() * w, y: Math.random() * h,
          r: color,
          radius: Math.random() * 150 + 80,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.08 + 0.03,
          pulse: Math.random() * 6.28,
        });
      }
    };

    const resize = () => {
      if (destroyed) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initOrbs(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (destroyed) return;
      const w = canvas.width;
      const h = canvas.height;
      if (w < 1 || h < 1) { raf = requestAnimationFrame(draw); return; }

      // Clear with active background color with subtle theme radial glow
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);

      // Deep theme-tinted canvas background
      const bgGrad = ctx.createRadialGradient(w * 0.5, 0, 10, w * 0.5, h * 0.5, Math.max(w, h));
      bgGrad.addColorStop(0, `rgba(${bullR},${bullG},${bullB},0.08)`);
      bgGrad.addColorStop(0.4, `rgba(${bgR},${bgG},${bgB},0.98)`);
      bgGrad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},1)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Spawn new streaks
      if (streaks.length < MAX_STREAKS && Math.random() < 0.2) {
        spawnStreak(w, h);
      }

      // Draw & update streaks
      try {
        ctx.save();
        for (let i = streaks.length - 1; i >= 0; i--) {
          const s = streaks[i];
          const age = t - s.born;
          if (age > s.life) { streaks.splice(i, 1); continue; }
          // Move
          s.x += Math.cos(s.angle) * s.speed;
          s.y += Math.sin(s.angle) * s.speed * 0.3;
          // Grow then fade
          const lifeRatio = age / s.life;
          if (lifeRatio < 0.3) {
            s.len = (lifeRatio / 0.3) * s.maxLen;
            s.alpha = (lifeRatio / 0.3) * s.maxAlpha;
          } else if (lifeRatio > 0.6) {
            s.alpha = ((1 - lifeRatio) / 0.4) * s.maxAlpha;
          }
          // Draw streak as gradient line
          const ex = s.x + Math.cos(s.angle) * s.len;
          const ey = s.y + Math.sin(s.angle) * s.len * 0.3;
          const grad = ctx.createLinearGradient(s.x, s.y, ex, ey);
          grad.addColorStop(0, `rgba(${s.r},0)`);
          grad.addColorStop(0.3, `rgba(${s.r},${s.alpha})`);
          grad.addColorStop(0.7, `rgba(${s.r},${s.alpha * 0.6})`);
          grad.addColorStop(1, `rgba(${s.r},0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.width;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        ctx.restore();
      } catch (_) { /* safe */ }

      // Draw ambient orbs (slow-moving glowing blobs)
      try {
        ctx.save();
        for (const o of orbs) {
          o.x += o.vx; o.y += o.vy;
          o.pulse += 0.015;
          if (o.x < -o.radius) o.x = w + o.radius;
          if (o.x > w + o.radius) o.x = -o.radius;
          if (o.y < -o.radius) o.y = h + o.radius;
          if (o.y > h + o.radius) o.y = -o.radius;
          const a = o.alpha + Math.sin(o.pulse) * 0.015;
          if (!isFinite(o.x) || !isFinite(o.y) || !isFinite(o.radius) || o.radius <= 0) continue;
          const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
          grad.addColorStop(0, `rgba(${o.r},${Math.max(0, a)})`);
          grad.addColorStop(0.5, `rgba(${o.r},${Math.max(0, a * 0.45)})`);
          grad.addColorStop(1, `rgba(${o.r},0)`);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 1;
          ctx.fillRect(o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
        }
        ctx.restore();
      } catch (_) { /* safe */ }

      // Horizontal flash sweep
      try {
        ctx.save();
        const sweepProgress = (t * 0.008) % 1;
        const sweepX = sweepProgress * (w + 400) - 200;
        const sweepGrad = ctx.createLinearGradient(sweepX - 200, 0, sweepX + 200, 0);
        sweepGrad.addColorStop(0, `rgba(${BULL},0)`);
        sweepGrad.addColorStop(0.4, `rgba(${BULL},0.04)`);
        sweepGrad.addColorStop(0.5, `rgba(${BULL},0.08)`);
        sweepGrad.addColorStop(0.6, `rgba(${BULL},0.04)`);
        sweepGrad.addColorStop(1, `rgba(${BULL},0)`);
        ctx.fillStyle = sweepGrad;
        ctx.globalAlpha = 1;
        ctx.fillRect(sweepX - 200, 0, 400, h);
        ctx.restore();
      } catch (_) { /* safe */ }

      t++;
      raf = requestAnimationFrame(draw);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!destroyed) {
        raf = requestAnimationFrame(draw);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    draw();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.95, willChange: 'transform, opacity', contain: 'paint' }}
    />
  );
}
/* ───── live ticker strip ───── */
const tickers = [
  { symbol: 'BTCUSDT', price: '112,847.32', change: '+2.41%', up: true },
  { symbol: 'ETHUSDT', price: '4,312.88', change: '+1.87%', up: true },
  { symbol: 'SOLUSDT', price: '218.54', change: '-0.93%', up: false },
  { symbol: 'EURUSD', price: '1.1142', change: '+0.12%', up: true },
  { symbol: 'XAUUSD', price: '3,408.60', change: '+0.67%', up: true },
  { symbol: 'NAS100', price: '24,105.50', change: '+1.15%', up: true },
  { symbol: 'BTCUSDT', price: '112,847.32', change: '+2.41%', up: true },
  { symbol: 'ETHUSDT', price: '4,312.88', change: '+1.87%', up: true },
  { symbol: 'SOLUSDT', price: '218.54', change: '-0.93%', up: false },
  { symbol: 'EURUSD', price: '1.1142', change: '+0.12%', up: true },
];

function TickerStrip() {
  const { palette } = useTheme();
  return (
    <div className="w-full overflow-hidden border-b border-white/[0.08] bg-[#020308]/80 backdrop-blur-md">
      <div className="flex animate-ticker-strip whitespace-nowrap py-1.5 sm:py-2">
        {tickers.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 text-[10px] sm:text-[11px] font-mono font-medium">
            <span className="text-zinc-400 font-bold">{t.symbol}</span>
            <span className="text-white font-semibold">{t.price}</span>
            <span style={{ color: t.up ? palette.bull : palette.bear }}>{t.change}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───── metrics ───── */
const metrics = [
  { value: '50+', label: 'Drawing Tools', icon: Crosshair },
  { value: '20+', label: 'Indicators', icon: BarChart3 },
  { value: '<5ms', label: 'Execution', icon: Zap },
  { value: '24/7', label: 'Live Markets', icon: Globe2 },
];

/* ───── main landing page ───── */
export default function LandingPage({ onEnterTerminal, logout = undefined, isLoggedIn = false }: LandingPageProps) {
  const { palette } = useTheme();
  const [showContent, setShowContent] = useState(false);
  const themeDarkGradient = getThemeDarkGradient(palette.bull, palette.bear);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(t);
  }, []);

  const features = [
    {
      icon: CandlestickChart,
      title: 'Multi-Timeframe Charts',
      desc: 'Advanced candlestick, footprint, and order flow visualization with 20+ built-in indicators.',
      color: palette.bull,
    },
    {
      icon: Layers,
      title: 'Pro Drawing Suite',
      desc: '30+ institutional-grade drawing tools — trendlines, fibonacci, Elliott Wave, and pattern recognition.',
      color: palette.bear,
    },
    {
      icon: LayoutDashboard,
      title: 'Multi-Chart Workspace',
      desc: 'Split, tile, and rearrange chart panels with customizable workspace presets.',
      color: palette.poc,
    },
    {
      icon: Activity,
      title: 'Order Flow Analytics',
      desc: 'Footprint charts, delta analysis, cumulative volume delta, and DOM depth ladder.',
      color: palette.bull,
    },
    {
      icon: Shield,
      title: 'Risk Management',
      desc: 'Auto break-even, trailing stops, multi-TP brackets, and position sizing calculator.',
      color: palette.bear,
    },
    {
      icon: Zap,
      title: 'Hotkey Execution',
      desc: 'Lightning-fast trade execution with customizable keyboard shortcuts for scalping.',
      color: palette.poc,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100000] flex flex-col bg-[#030408] text-white overflow-y-auto overflow-x-hidden selection:bg-white/20 selection:text-white transition-colors duration-500"
      style={{
        backgroundColor: palette.dark ? `${palette.dark}` : '#030408',
      }}
    >
      {/* ─── Futuristic Animated Background ─── */}
      <FuturisticBackground />

      {/* ─── Dynamic Ambient Glowing Halos Synchronized with Active Theme ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left Bull Accent Halo */}
        <div 
          className="absolute top-[-15%] left-[10%] w-[650px] h-[650px] rounded-full blur-[160px] opacity-40 transition-all duration-700 pointer-events-none" 
          style={{ backgroundColor: `${palette.bull}35` }}
        />
        {/* Bottom-right Bear Accent Halo */}
        <div 
          className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-35 transition-all duration-700 pointer-events-none" 
          style={{ backgroundColor: `${palette.bear}30` }}
        />
        {/* Center POC Accent Glow */}
        <div 
          className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[180px] opacity-25 transition-all duration-700 pointer-events-none" 
          style={{ backgroundColor: `${palette.poc}20` }}
        />
        {/* Top Sheen Ambient Gradient */}
        <div 
          className="absolute top-0 inset-x-0 h-[450px] pointer-events-none transition-all duration-700 opacity-60"
          style={{
            background: `radial-gradient(ellipse 90% 60% at 50% -10%, ${palette.bull}22, transparent 75%)`,
          }}
        />
      </div>

      {/* ─── Ticker Strip ─── */}
      <TickerStrip />

      {/* ─── Nav (Premium Glassmorphic Header) ─── */}
      <nav 
        className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3.5 backdrop-blur-3xl border-b transition-colors duration-500"
        style={{
          background: 'rgba(10, 15, 30, 0.4)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 0 0 ${palette.bull}15`,
        }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <MountAlgoLogo size="sm" className="sm:w-8 sm:h-8" />
          <span className="font-extrabold italic text-base sm:text-lg tracking-wider text-white">
            MountAlgo
          </span>
          <span 
            className="hidden sm:inline text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-white/10 bg-white/[0.03] text-zinc-300 uppercase tracking-widest backdrop-blur-md"
          >
            Pro Terminal
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Network
          </span>              {isLoggedIn ? (
                <button
                  onClick={() => {
                    logout?.();
                    onEnterTerminal();
                  }}
                  style={{
                    background: themeDarkGradient.background,
                    boxShadow: themeDarkGradient.boxShadow,
                  }}
                  className="group relative px-4 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.97] text-white border border-white/20 backdrop-blur-md shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1.5 font-bold text-white">
                    Kembali ke Landing
                  </span>
                </button>
              ) : (
                <button
                  onClick={onEnterTerminal}
                  style={{
                    background: themeDarkGradient.background,
                    boxShadow: themeDarkGradient.boxShadow,
                  }}
                  className="group relative px-4 py-1.5 rounded-xl font-bold text-[10px] tracking-wider uppercase cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.97] text-white border border-white/20 backdrop-blur-md shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1.5 font-bold text-white">
                    Enter Terminal
                  </span>
                </button>
              )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-24 pb-8 sm:pb-12">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center max-w-3xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-6 sm:mb-8"
              >
                <span 
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-white shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-zinc-400">Institutional-Grade</span>
                  <span className="text-white font-bold">Trading Terminal</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-6 text-white"
              >
                <span>Trade with </span>
                <span className="italic font-black text-white">
                  Precision
                </span>
                <br />
                <span className="text-zinc-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light">
                  Footprints • Order Flow • Execution
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8 }}
                className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-lg mb-8 sm:mb-10 leading-relaxed font-normal"
              >
                Professional-grade execution engine mapping footprint order books, liquidations, and real-time delta.
                Designed with meticulous precision for algorithmic & structural traders.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                {isLoggedIn ? (
                <button
                  onClick={() => {
                    logout?.();
                    onEnterTerminal();
                  }}
                  style={{
                    background: themeDarkGradient.background,
                    boxShadow: themeDarkGradient.boxShadow,
                  }}
                  className="group relative px-7 py-3.5 rounded-lg font-extrabold text-[12px] tracking-wider uppercase overflow-hidden cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.98] text-white border border-white/25 backdrop-blur-md shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2 font-black text-white">
                    Kembali ke Landing
                    <ArrowUpRight size={15} className="text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={onEnterTerminal}
                  style={{
                    background: themeDarkGradient.background,
                    boxShadow: themeDarkGradient.boxShadow,
                  }}
                  className="group relative px-7 py-3.5 rounded-lg font-extrabold text-[12px] tracking-wider uppercase overflow-hidden cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.98] text-white border border-white/25 backdrop-blur-md shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2 font-black text-white">
                    Launch Terminal
                    <ArrowUpRight size={15} className="text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </button>
              )}              <button
                  onClick={() => {
                    if (logout) {
                      logout().then(() => onEnterTerminal());
                    } else {
                      onEnterTerminal();
                    }
                  }}
                  className="group flex items-center gap-2 px-6 py-3.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/25 backdrop-blur-md text-zinc-400 hover:text-white transition-all duration-300 text-[12px] tracking-wider uppercase font-bold cursor-pointer shadow-lg"
                >
                  <Monitor size={15} className="text-zinc-400 group-hover:text-white transition-colors" />
                  {isLoggedIn ? 'Log out dulu' : 'View Demo'}
                </button>
              </motion.div>

              {/* Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.8 }}
                className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl"
              >
                {metrics.map((m, i) => (
                  <div 
                    key={i} 
                    style={{
                      background: 'rgba(15, 23, 42, 0.25)',
                      borderColor: 'rgba(255, 255, 255, 0.06)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)'
                    }}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl border backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <m.icon size={15} className="text-zinc-400 group-hover:text-white transition-colors mb-0.5" />
                    <span className="text-base sm:text-lg font-black tracking-tight text-white">{m.value}</span>
                    <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest text-center">{m.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-12 sm:mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown size={16} className="text-zinc-500 animate-bounce" />
        </motion.div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase mb-3 text-zinc-400">
              <Sparkles size={13} className="text-white" />
              Terminal Features
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
              Everything you need to trade
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
              A complete trading ecosystem designed for professional traders who need speed, precision, and deep market insight.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
                style={{
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                  background: 'rgba(15, 23, 42, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.06)'
                }}
                className="group p-5 sm:p-6 rounded-2xl border hover:bg-slate-900/40 hover:border-white/15 transition-all duration-300 backdrop-blur-2xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 border border-white/10 bg-white/[0.03] text-white shadow-inner"
                  style={{
                    boxShadow: `0 4px 16px -2px ${f.color}35`,
                  }}
                >
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Chart Preview ─── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase mb-3 text-zinc-400">
              <CandlestickChart size={13} style={{ color: palette.bull }} />
              Visualizations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              See the market differently
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Footprint charts, order flow, and institutional-grade analytics at your fingertips.
            </p>
          </div>

          <div 
            className="group relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] border border-white/[0.12] bg-[#04060c]/90 backdrop-blur-2xl transition-all duration-500"
            style={{
              boxShadow: `0 20px 60px -10px ${palette.bull}25, 0 8px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)`,
            }}
          >
            <div className="relative z-10 w-full h-full">
              <ChartPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
              Ready to trade?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
              Join elite traders who demand institutional-grade order flow analytics. Launch instantly.
            </p>            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout?.();
                  onEnterTerminal();
                }}
                style={{
                  background: themeDarkGradient.background,
                  boxShadow: themeDarkGradient.boxShadow,
                }}
                className="group relative px-7 py-3.5 rounded-lg font-extrabold text-[12px] tracking-wider uppercase overflow-hidden cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.98] text-white border border-white/25 backdrop-blur-md shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-2 font-black text-white">
                  Kembali ke Landing
                  <ArrowUpRight size={15} className="text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </button>
            ) : (
              <button
                onClick={onEnterTerminal}
                style={{
                  background: themeDarkGradient.background,
                  boxShadow: themeDarkGradient.boxShadow,
                }}
                className="group relative px-7 py-3.5 rounded-lg font-extrabold text-[12px] tracking-wider uppercase overflow-hidden cursor-pointer transition-all duration-300 hover:brightness-125 active:scale-[0.98] text-white border border-white/25 backdrop-blur-md shadow-2xl"
              >
                <span className="relative z-10 flex items-center gap-2 font-black text-white">
                  Enter Terminal
                  <ArrowUpRight size={15} className="text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#020409]/85 backdrop-blur-xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-[11px] text-zinc-400 font-mono">
          <span>© 2025 MountAlgo. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v2.0 Pro Terminal
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Wifi size={11} className="text-zinc-400" />
              Real-time
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───── Liquidation Heatmap + Footprint Chart Preview ───── */
function ChartPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let t = 0;
    let destroyed = false;

    const [BULL_R, BULL_G, BULL_B] = hexToRgbTuple(palette.bull, [81, 52, 255]);
    const [BEAR_R, BEAR_G, BEAR_B] = hexToRgbTuple(palette.bear, [23, 156, 116]);
    const [BG_R, BG_G, BG_B] = hexToRgbTuple(palette.dark, [6, 6, 14]);

    // Generate footprint data
    interface FootprintLevel {
      price: number; buyVol: number; sellVol: number; liqCluster: number;
    }
    interface FootprintCandle {
      o: number; h: number; l: number; c: number;
      levels: FootprintLevel[];
    }

    const fpCandles: FootprintCandle[] = [];
    let price = 112500;
    const LEVEL_STEP = 80;
    const LEVELS_PER = 8;

    for (let i = 0; i < 40; i++) {
      const change = (Math.random() - 0.48) * 500;
      const o = price;
      const c = price + change;
      const h = Math.max(o, c) + Math.random() * 250;
      const l = Math.min(o, c) - Math.random() * 250;
      const levels: FootprintLevel[] = [];
      const lowLevel = Math.floor(l / LEVEL_STEP) * LEVEL_STEP;
      for (let j = 0; j < LEVELS_PER; j++) {
        const lvPrice = lowLevel + j * LEVEL_STEP;
        const isNearPOC = Math.abs(lvPrice - (o + c) / 2) < LEVEL_STEP * 2;
        const buyVol = Math.floor(Math.random() * 80 + (isNearPOC ? 40 : 5));
        const sellVol = Math.floor(Math.random() * 80 + (isNearPOC ? 40 : 5));
        const liqCluster = Math.random() * (isNearPOC ? 120 : 30);
        levels.push({ price: lvPrice, buyVol, sellVol, liqCluster });
      }
      fpCandles.push({ o, h, l, c, levels });
      price = c;
    }

    const resize = () => {
      if (destroyed) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      }
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      if (destroyed) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      if (w < 1 || h < 1) { raf = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, w, h);
      
      // Dynamic thematic radial gradient background
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.9);
      bgGrad.addColorStop(0, `rgba(${BG_R + 10},${BG_G + 12},${BG_B + 20}, 1)`);
      bgGrad.addColorStop(0.6, `rgb(${BG_R},${BG_G},${BG_B})`);
      bgGrad.addColorStop(1, `rgba(${Math.max(0, BG_R - 4)},${Math.max(0, BG_G - 4)},${Math.max(0, BG_B - 4)}, 1)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Ambient theme auras
      const bullAura = ctx.createRadialGradient(w * 0.2, h * 0.2, 0, w * 0.2, h * 0.2, Math.max(w, h) * 0.6);
      bullAura.addColorStop(0, `rgba(${BULL_R},${BULL_G},${BULL_B},0.08)`);
      bullAura.addColorStop(1, 'transparent');
      ctx.fillStyle = bullAura;
      ctx.fillRect(0, 0, w, h);

      const bearAura = ctx.createRadialGradient(w * 0.8, h * 0.8, 0, w * 0.8, h * 0.8, Math.max(w, h) * 0.6);
      bearAura.addColorStop(0, `rgba(${BEAR_R},${BEAR_G},${BEAR_B},0.06)`);
      bearAura.addColorStop(1, 'transparent');
      ctx.fillStyle = bearAura;
      ctx.fillRect(0, 0, w, h);

      // Subtle theme-tinted grid
      try {
        ctx.strokeStyle = `rgba(${BULL_R},${BULL_G},${BULL_B},0.035)`;
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let x = 0; x < w; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
      } catch (_) { /* safe */ }

      // Price scaling
      const margin = 30;
      const chartH = h - margin * 2;
      let allMin = Infinity, allMax = -Infinity;
      fpCandles.forEach(c => { if (c.l < allMin) allMin = c.l; if (c.h > allMax) allMax = c.h; });
      if (allMin === Infinity) allMin = 0;
      if (allMax === -Infinity) allMax = 100;
      const range = Math.max(allMax - allMin, 100);
      const padRange = range * 1.1;
      const toY = (p: number) => margin + (allMax + (padRange - range) / 2 - p) * (chartH / padRange);
      const candleW = 16;
      const spacing = 24;
      const totalW = fpCandles.length * spacing;
      const offsetX = Math.max(0, (w - totalW) / 2);

      // --- Layer 1: Liquidation Heatmap ---
      try {
        fpCandles.forEach((fc, ci) => {
          const x = offsetX + ci * spacing;
          fc.levels.forEach(lv => {
            const y = toY(lv.price);
            const intensity = lv.liqCluster / 120;
            if (intensity > 0.1 && isFinite(x) && isFinite(y)) {
              const grad = ctx.createRadialGradient(x + candleW / 2, y, 0, x + candleW / 2, y, 20);
              grad.addColorStop(0, `rgba(255,100,50,${intensity * 0.12})`);
              grad.addColorStop(0.5, `rgba(255,60,30,${intensity * 0.06})`);
              grad.addColorStop(1, 'rgba(255,60,30,0)');
              ctx.fillStyle = grad;
              ctx.globalAlpha = 1;
              ctx.fillRect(x - 8, y - 12, candleW + 16, 24);
            }
          });
        });
        ctx.globalAlpha = 1;
      } catch (_) { /* safe */ }

      // --- Layer 2: Footprint bars ---
      try {
        fpCandles.forEach((fc, ci) => {
          const x = offsetX + ci * spacing;
          const maxVol = Math.max(...fc.levels.map(l => Math.max(l.buyVol, l.sellVol)), 1);
          const barMaxW = (spacing - 4) / 2;

          fc.levels.forEach(lv => {
            const y = toY(lv.price);
            const buyW = (lv.buyVol / maxVol) * barMaxW;
            const sellW = (lv.sellVol / maxVol) * barMaxW;
            const midX = x + candleW / 2;

            // Buy bar
            ctx.globalAlpha = 0.6 + (lv.buyVol / maxVol) * 0.4;
            ctx.fillStyle = `rgb(${BULL_R},${BULL_G},${BULL_B})`;
            ctx.fillRect(midX - buyW, y - 2.5, buyW, 5);

            // Sell bar
            ctx.globalAlpha = 0.6 + (lv.sellVol / maxVol) * 0.4;
            ctx.fillStyle = `rgb(${BEAR_R},${BEAR_G},${BEAR_B})`;
            ctx.fillRect(midX, y - 2.5, sellW, 5);
          });
        });
        ctx.globalAlpha = 1;
      } catch (_) { /* safe */ }

      // --- Layer 3: Outline candles ---
      try {
        fpCandles.forEach((fc, ci) => {
          const x = offsetX + ci * spacing;
          const yH = toY(fc.h);
          const yL = toY(fc.l);
          const yO = toY(fc.o);
          const yC = toY(fc.c);
          const bull = fc.c >= fc.o;
          const r = bull ? BULL_R : BEAR_R;
          const g = bull ? BULL_G : BEAR_G;
          const b = bull ? BULL_B : BEAR_B;

          // Wick
          ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + candleW / 2, yH);
          ctx.lineTo(x + candleW / 2, yL);
          ctx.stroke();

          // Body outline
          const bodyTop = Math.min(yO, yC);
          const bodyH = Math.max(Math.abs(yO - yC), 2);
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x, bodyTop, candleW, bodyH);

          // Fill body translucent
          ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
          ctx.fillRect(x, bodyTop, candleW, bodyH);
        });
      } catch (_) { /* safe */ }

      // --- Layer 4: POC line ---
      try {
        let pocPrice = 0;
        let pocVol = 0;
        fpCandles.forEach(fc => {
          fc.levels.forEach(lv => {
            const totalVol = lv.buyVol + lv.sellVol;
            if (totalVol > pocVol) { pocVol = totalVol; pocPrice = lv.price; }
          });
        });
        if (pocPrice > 0) {
          const pocY = toY(pocPrice);
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(0, pocY); ctx.lineTo(w, pocY); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('POC', 4, pocY - 4);
        }
      } catch (_) { /* safe */ }

      // --- Layer 5: Price label ---
      try {
        const last = fpCandles[fpCandles.length - 1];
        if (last) {
          const py = toY(last.c);
          ctx.fillStyle = `rgb(${BULL_R},${BULL_G},${BULL_B})`;
          ctx.fillRect(w - 68, py - 8, 64, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText((112847 + last.c * 10).toFixed(2), w - 8, py + 3);
        }
      } catch (_) { /* safe */ }

      // --- Layer 6: Animated liquidation cascade ---
      try {
        for (let i = 0; i < 8; i++) {
          const ci = Math.floor((t * 0.3 + i * 5) % fpCandles.length);
          const fc = fpCandles[ci];
          if (!fc || fc.levels.length === 0) continue;
          const hiLiqLevels = fc.levels.filter(l => l.liqCluster > 60);
          if (hiLiqLevels.length === 0) continue;
          const lv = hiLiqLevels[i % hiLiqLevels.length];
          const x = offsetX + ci * spacing + candleW / 2;
          const baseY = toY(lv.price);
          const fallOffset = ((t * 1.5 + i * 30) % 40) - 20;
          const py = baseY + fallOffset;
          const a = Math.max(0, 1 - Math.abs(fallOffset) / 20) * 0.4;
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(255,120,60)`;
          ctx.beginPath();
          ctx.arc(x, py, 1.5, 0, 6.28);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } catch (_) { /* safe */ }

      t++;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [palette]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

