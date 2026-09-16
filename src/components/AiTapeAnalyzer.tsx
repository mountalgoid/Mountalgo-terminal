import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiTapeAnalyzerProps {
  tapeData: any[];
  symbol: string;
  timeframe: string;
}

export function AiTapeAnalyzer({ tapeData, symbol, timeframe }: AiTapeAnalyzerProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number>(0);

  const analyzeTape = useCallback(async () => {
    if (tapeData.length < 10 || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tapeData, symbol, timeframe }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      setLastAnalyzedAt(Date.now());
    } catch (error) {
      console.error('Tape Analysis Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [tapeData, symbol, timeframe, isAnalyzing]);

  // Analyze every 30 seconds or when manually triggered
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastAnalyzedAt > 30000) {
        analyzeTape();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [analyzeTape, lastAnalyzedAt]);

  return (
    <div className="bg-[var(--color-panel)]/80 border border-emerald-500/30 rounded-lg p-3 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-500/20 rounded">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Gemini AI Tape Intelligence</span>
        </div>
        <button 
          onClick={analyzeTape}
          disabled={isAnalyzing}
          className="p-1 hover:bg-[var(--color-bg)] rounded transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
          ) : (
            <Zap className="w-3 h-3 text-emerald-400" />
          )}
        </button>
      </div>

      <div className="min-h-[40px] flex items-center">
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.p
              key={analysis}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[11px] leading-relaxed text-zinc-300 italic"
            >
              "{analysis}"
            </motion.p>
          ) : (
            <p className="text-[10px] text-zinc-500">
              Gathering order flow data for AI synthesis...
            </p>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-600 font-mono">
        <span>MODEL: GEMINI-3.7-FLASH</span>
        <span>LATENCY: ~800MS</span>
      </div>
    </div>
  );
}
