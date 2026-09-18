import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadAiAgentSettings, AI_PROVIDERS_METADATA } from '../types/aiSettings';
import { useTheme } from '../context/ThemeContext';
import { getThemeCardGradient, getThemeCardBorder, hexToRgba } from '../utils/themeGradient';

interface AiTapeAnalyzerProps {
  tapeData: any[];
  symbol: string;
  timeframe: string;
}

export function AiTapeAnalyzer({ tapeData, symbol, timeframe }: AiTapeAnalyzerProps) {
  const { palette, isLight } = useTheme();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number>(0);
  const [modelLabel, setModelLabel] = useState<string>('GEMINI-3.8-FLASH');
  const [latency, setLatency] = useState<number | null>(null);

  const analyzeTape = useCallback(async () => {
    if (tapeData.length < 10 || isAnalyzing) return;

    setIsAnalyzing(true);
    const start = Date.now();
    try {
      const aiSettings = loadAiAgentSettings();
      const activeProv = aiSettings.activeProvider || 'gemini';
      const provConfig = aiSettings.providers[activeProv];
      const userAiConfig = {
        provider: activeProv,
        apiKey: provConfig?.apiKey || '',
        model: provConfig?.model,
        baseUrl: provConfig?.baseUrl,
        temperature: aiSettings.temperature,
        maxTokens: aiSettings.maxTokens
      };

      const response = await fetch('/api/ai/analyze-tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tapeData, symbol, timeframe, userAiConfig }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      setModelLabel(data.model ? `${data.provider || activeProv.toUpperCase()} - ${data.model.toUpperCase()}` : 'AI TAPE ENGINE');
      setLatency(data.latencyMs || (Date.now() - start));
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
    <div 
      style={{
        background: getThemeCardGradient(palette, isLight, false),
        borderColor: getThemeCardBorder(palette, false),
      }}
      className="backdrop-blur-xl border rounded-xl p-3 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            style={{
              backgroundColor: hexToRgba(palette.bull, 0.2),
            }}
            className="p-1 rounded"
          >
            <Brain size={16} style={{ color: palette.bull }} />
          </div>
          <span style={{ color: palette.bull }} className="text-xs font-bold tracking-wider uppercase">Multi-Provider AI Tape Intelligence</span>
        </div>
        <button 
          onClick={analyzeTape}
          disabled={isAnalyzing}
          className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isAnalyzing ? (
            <Loader2 size={12} style={{ color: palette.bull }} className="animate-spin" />
          ) : (
            <Zap size={12} style={{ color: palette.bull }} />
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
      
      <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <span>MODEL: {modelLabel}</span>
        <span>LATENCY: {latency ? `~${latency}MS` : '~800MS'}</span>
      </div>
    </div>
  );
}
