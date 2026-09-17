import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Save,
  Activity,
  Bot,
  Globe,
  Lock,
  ChevronRight,
  Search,
  Gift,
  Brain,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  AiProvider,
  AiAgentSettings,
  AI_PROVIDERS_METADATA,
  TRADING_PERSONA_PROMPTS,
  TradingPersona,
  loadAiAgentSettings,
  saveAiAgentSettings,
  DEFAULT_AI_SETTINGS
} from '../types/aiSettings';

interface AiAgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: AiAgentSettings) => void;
}

export const AiAgentSettingsModal: React.FC<AiAgentSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [settings, setSettings] = useState<AiAgentSettings>(DEFAULT_AI_SETTINGS);
  const [selectedTab, setSelectedTab] = useState<AiProvider>('openai');
  const [showKey, setShowKey] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    openai: false,
    claude: false,
    openrouter: false,
    custom: false
  });
  const [testingStatus, setTestingStatus] = useState<Record<AiProvider, {
    testing: boolean;
    success?: boolean;
    latencyMs?: number;
    message?: string;
  }>>({
    gemini: { testing: false },
    openai: { testing: false },
    claude: { testing: false },
    openrouter: { testing: false },
    custom: { testing: false }
  });
  const [saveToast, setSaveToast] = useState(false);
  const [modelCategoryFilter, setModelCategoryFilter] = useState<'all' | 'free' | 'reasoning' | 'fast' | 'flagship'>('all');
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Reset filter and search when provider tab changes
  useEffect(() => {
    setModelCategoryFilter('all');
    setModelSearchQuery('');
  }, [selectedTab]);

  // Load existing settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loaded = loadAiAgentSettings();
      setSettings(loaded);
      setSelectedTab(loaded.activeProvider || 'gemini');
    }
  }, [isOpen]);

  const currentProviderMeta = AI_PROVIDERS_METADATA[selectedTab];
  const currentProviderConfig = settings.providers[selectedTab];

  // Count available categories for current provider
  const categoryCounts = useMemo(() => {
    const counts = { all: currentProviderMeta.models.length, free: 0, reasoning: 0, fast: 0, flagship: 0 };
    currentProviderMeta.models.forEach(m => {
      if (m.isFree || m.category === 'free') counts.free++;
      if (m.category === 'reasoning') counts.reasoning++;
      if (m.category === 'fast') counts.fast++;
      if (m.category === 'flagship') counts.flagship++;
    });
    return counts;
  }, [currentProviderMeta]);

  // Filtered models based on category & search text
  const filteredModels = useMemo(() => {
    return currentProviderMeta.models.filter(m => {
      // Category match
      if (modelCategoryFilter === 'free' && !m.isFree && m.category !== 'free') return false;
      if (modelCategoryFilter === 'reasoning' && m.category !== 'reasoning') return false;
      if (modelCategoryFilter === 'fast' && m.category !== 'fast') return false;
      if (modelCategoryFilter === 'flagship' && m.category !== 'flagship') return false;

      // Search match
      if (modelSearchQuery.trim()) {
        const q = modelSearchQuery.toLowerCase().trim();
        const matchName = m.name.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        return matchName || matchId || matchDesc;
      }
      return true;
    });
  }, [currentProviderMeta, modelCategoryFilter, modelSearchQuery]);

  const handleKeyChange = (val: string) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [selectedTab]: {
          ...prev.providers[selectedTab],
          apiKey: val
        }
      }
    }));
  };

  const handleModelChange = (modelId: string) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [selectedTab]: {
          ...prev.providers[selectedTab],
          model: modelId
        }
      }
    }));
  };

  const handleBaseUrlChange = (url: string) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [selectedTab]: {
          ...prev.providers[selectedTab],
          baseUrl: url
        }
      }
    }));
  };

  const handleSetActiveProvider = (prov: AiProvider) => {
    setSettings(prev => ({
      ...prev,
      activeProvider: prov,
      providers: {
        ...prev.providers,
        [prov]: {
          ...prev.providers[prov],
          isActive: true
        }
      }
    }));
  };

  const handleTestConnection = async (prov: AiProvider) => {
    const provConfig = settings.providers[prov];
    setTestingStatus(prev => ({
      ...prev,
      [prov]: { testing: true, message: 'Menguji koneksi ke server AI...' }
    }));

    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov,
          apiKey: provConfig.apiKey,
          model: provConfig.model,
          baseUrl: provConfig.baseUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestingStatus(prev => ({
          ...prev,
          [prov]: {
            testing: false,
            success: true,
            latencyMs: data.latencyMs,
            message: `Koneksi Berhasil! Model "${data.model}" merespons dalam ${data.latencyMs}ms.`
          }
        }));
      } else {
        setTestingStatus(prev => ({
          ...prev,
          [prov]: {
            testing: false,
            success: false,
            message: data.error || 'Gagal tersambung ke endpoint AI provider.'
          }
        }));
      }
    } catch (err: any) {
      setTestingStatus(prev => ({
        ...prev,
        [prov]: {
          testing: false,
          success: false,
          message: err?.message || 'Kesalahan jaringan saat menguji koneksi.'
        }
      }));
    }
  };

  const handleSaveAll = () => {
    saveAiAgentSettings(settings);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Kembalikan konfigurasi AI Agent ke pengaturan standar?")) {
      setSettings(DEFAULT_AI_SETTINGS);
      saveAiAgentSettings(DEFAULT_AI_SETTINGS);
      if (onSettingsSaved) onSettingsSaved(DEFAULT_AI_SETTINGS);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#0e131f]/95 via-[#0b0f19]/95 to-[#06080e]/98 shadow-2xl shadow-cyan-950/30 overflow-hidden text-slate-100">
        
        {/* Header with gradient bar */}
        <div className="relative px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500" />
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-cyan-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-wide text-white">
                  PENGATURAN AI AGENT
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  MULTI-MODEL ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gunakan API Key Anda sendiri untuk model GPT, Claude, OpenRouter, DeepSeek, atau Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Provider indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300">
              <span className="text-slate-400 text-[11px]">AI Aktif:</span>
              <span className="font-semibold text-cyan-400 uppercase tracking-wider">
                {AI_PROVIDERS_METADATA[settings.activeProvider]?.name.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns (Provider Tabs + Configuration Panel) */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
          
          {/* Left Column: Provider Tabs */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-3 space-y-1.5 bg-black/30 shrink-0">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pilih Provider AI
            </div>

            {(Object.keys(AI_PROVIDERS_METADATA) as AiProvider[]).map((provKey) => {
              const meta = AI_PROVIDERS_METADATA[provKey];
              const provConf = settings.providers[provKey];
              const isSelected = selectedTab === provKey;
              const isActiveEngine = settings.activeProvider === provKey;
              const hasKey = Boolean(provConf?.apiKey && provConf.apiKey.trim().length > 3);

              return (
                <button
                  key={provKey}
                  onClick={() => setSelectedTab(provKey)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500/20 to-transparent border-indigo-500/50 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isActiveEngine ? '#10b981' : hasKey ? meta.iconColor : '#64748b',
                        boxShadow: isActiveEngine ? '0 0 8px #10b981' : 'none'
                      }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {meta.name}
                        </span>
                        {isActiveEngine && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {hasKey ? 'Key tersimpan' : provKey === 'gemini' ? 'Native / Default' : 'Belum diisi'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform ${isSelected ? 'rotate-90 md:rotate-0 text-cyan-400' : ''}`} />
                </button>
              );
            })}

            {/* Persona and Parameters quick tab */}
            <div className="pt-3 mt-3 border-t border-white/10">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Strategi & Persona
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Persona Aktif:</span>
                  <span className="text-cyan-400 font-mono text-[10px] uppercase truncate max-w-[100px]">
                    {settings.persona.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Temperatur:</span>
                  <span className="font-mono text-slate-200">{settings.temperature}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Provider Configuration */}
          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            
            {/* Provider Banner */}
            <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {currentProviderMeta.name}
                  </h3>
                  <span
                    className="px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider rounded border uppercase"
                    style={{
                      borderColor: `${currentProviderMeta.iconColor}50`,
                      backgroundColor: `${currentProviderMeta.iconColor}15`,
                      color: currentProviderMeta.iconColor
                    }}
                  >
                    {currentProviderMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentProviderMeta.tagline}
                </p>
              </div>

              {/* Set Active Button */}
              <div>
                {settings.activeProvider === selectedTab ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mesin AI Aktif Utama
                  </div>
                ) : (
                  <button
                    onClick={() => handleSetActiveProvider(selectedTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-medium transition-colors shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Jadikan AI Aktif
                  </button>
                )}
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  API Key {currentProviderMeta.name}
                </label>
                <a
                  href={currentProviderMeta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                >
                  Dapatkan API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey[selectedTab] ? "text" : "password"}
                  value={currentProviderConfig?.apiKey || ''}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder={`Masukkan API key (${currentProviderMeta.keyPrefixHint})`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 text-xs font-mono text-white placeholder-slate-600 transition-all pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {currentProviderConfig?.apiKey && (
                    <button
                      type="button"
                      onClick={() => handleKeyChange('')}
                      className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                      title="Hapus Key"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowKey(prev => ({ ...prev, [selectedTab]: !prev[selectedTab] }))}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    {showKey[selectedTab] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                API Key disimpan dengan aman di penyimpanan browser lokal Anda (Local Vault) dan ditransmisikan langsung via proksi server.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Model yang Digunakan
                  <span className="text-[11px] font-normal text-slate-400">
                    ({filteredModels.length} dari {currentProviderMeta.models.length} model)
                  </span>
                </label>

                {/* Search Input for fast filtering */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Cari model (misal: free, r1, llama)..."
                    className="w-full pl-8 pr-7 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                  />
                  {modelSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModelSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills (especially for OpenRouter with many free models) */}
              {currentProviderMeta.models.length > 4 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setModelCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] ${
                      modelCategoryFilter === 'all'
                        ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                        : 'bg-black/30 text-slate-400 border border-white/5 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    Semua ({categoryCounts.all})
                  </button>

                  {categoryCounts.free > 0 && (
                    <button
                      type="button"
                      onClick={() => setModelCategoryFilter('free')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] flex items-center gap-1.5 ${
                        modelCategoryFilter === 'free'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : 'bg-emerald-950/20 text-emerald-400/80 border border-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      🎁 100% Free Tier ({categoryCounts.free})
                    </button>
                  )}

                  {categoryCounts.reasoning > 0 && (
                    <button
                      type="button"
                      onClick={() => setModelCategoryFilter('reasoning')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
                        modelCategoryFilter === 'reasoning'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                          : 'bg-purple-950/20 text-purple-400/80 border border-purple-500/20 hover:border-purple-500/40 hover:text-purple-300'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      Reasoning ({categoryCounts.reasoning})
                    </button>
                  )}

                  {categoryCounts.fast > 0 && (
                    <button
                      type="button"
                      onClick={() => setModelCategoryFilter('fast')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
                        modelCategoryFilter === 'fast'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-cyan-950/20 text-cyan-400/80 border border-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      Cepat / Low-Latency ({categoryCounts.fast})
                    </button>
                  )}

                  {categoryCounts.flagship > 0 && (
                    <button
                      type="button"
                      onClick={() => setModelCategoryFilter('flagship')}
                      className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
                        modelCategoryFilter === 'flagship'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-amber-950/20 text-amber-400/80 border border-amber-500/20 hover:border-amber-500/40 hover:text-amber-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Flagship ({categoryCounts.flagship})
                    </button>
                  )}
                </div>
              )}

              {/* Free Tier Active Notice */}
              {selectedTab === 'openrouter' && (currentProviderConfig?.model?.includes(':free') || currentProviderConfig?.model === 'deepseek/deepseek-r1:free') && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-teal-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <span className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                    🎁
                  </span>
                  <div className="flex-1 text-[11px] leading-snug">
                    <span className="font-bold text-emerald-200">OpenRouter Free Tier Aktif: </span>
                    Model dengan akhiran <code className="px-1 py-0.5 rounded bg-emerald-900/60 font-mono text-white text-[10px]">:free</code> dapat digunakan sepenuhnya tanpa memotong saldo kredit OpenRouter Anda.
                  </div>
                </div>
              )}

              {/* Model Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredModels.length > 0 ? (
                  filteredModels.map((m) => {
                    const isCurrentModel = currentProviderConfig?.model === m.id;
                    const isFreeModel = m.isFree || m.id.endsWith(':free');

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModelChange(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          isCurrentModel
                            ? isFreeModel
                              ? 'bg-gradient-to-r from-emerald-950/50 via-cyan-950/40 to-black/60 border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                              : 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/15 border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
                            : isFreeModel
                            ? 'bg-black/40 border-emerald-500/20 hover:bg-emerald-950/20 hover:border-emerald-500/40'
                            : 'bg-black/30 border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        {/* Glow indicator line on active */}
                        {isCurrentModel && (
                          <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                            isFreeModel ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400' : 'bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400'
                          }`} />
                        )}

                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold leading-tight ${
                              isCurrentModel ? (isFreeModel ? 'text-emerald-300' : 'text-cyan-300') : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {m.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            {isFreeModel && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center gap-0.5">
                                <span>🎁</span> FREE
                              </span>
                            )}
                            {m.recommended && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                TOP
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-1.5">
                          {m.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                          <span className="font-mono text-[9.5px] text-slate-400 truncate max-w-[170px]" title={m.id}>
                            {m.id}
                          </span>
                          {m.contextLength && (
                            <span className="px-1 py-0.2 rounded bg-white/5 text-slate-400 text-[9px] font-mono shrink-0">
                              {m.contextLength} ctx
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-6 text-center text-slate-400 border border-dashed border-white/10 rounded-xl">
                    <p className="text-xs mb-1">Tidak ada model yang sesuai kata kunci &quot;{modelSearchQuery}&quot;</p>
                    <button
                      type="button"
                      onClick={() => { setModelSearchQuery(''); setModelCategoryFilter('all'); }}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Reset Filter & Pencarian
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Model ID Input */}
              <div className="pt-2 border-t border-white/5">
                <label className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>Atau masukkan ID Model Kustom:</span>
                  {currentProviderConfig?.model && (
                    <span className="font-mono text-[10px] text-cyan-400">
                      Aktif: {currentProviderConfig.model}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentProviderConfig?.model || ''}
                    onChange={(e) => handleModelChange(e.target.value)}
                    placeholder="Contoh: deepseek/deepseek-r1:free / openai/gpt-4o"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom Base URL (For OpenRouter, DeepSeek, Local Ollama, Proxies) */}
            {(selectedTab === 'custom' || selectedTab === 'openrouter' || selectedTab === 'openai') && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400" />
                  Base URL Endpoint (OpenAI-Compatible)
                </label>
                <input
                  type="text"
                  value={currentProviderConfig?.baseUrl || currentProviderMeta.defaultBaseUrl || ''}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  placeholder={currentProviderMeta.defaultBaseUrl || "https://api.openai.com/v1"}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500">
                  Dapat diarahkan ke localhost Ollama (http://localhost:11434/v1), Groq, DeepSeek, atau reverse proxy trading desk Anda.
                </p>
              </div>
            )}

            {/* Connection Test Section */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Verifikasi Koneksi API
                </span>
                <span className="text-[11px] text-slate-400">
                  Kirim tes ping ke server {currentProviderMeta.name} untuk memastikan key & model valid.
                </span>
                {testingStatus[selectedTab]?.message && (
                  <div className={`mt-2 text-xs flex items-center gap-1.5 font-mono ${
                    testingStatus[selectedTab]?.success
                      ? 'text-emerald-400'
                      : testingStatus[selectedTab]?.testing
                      ? 'text-cyan-400'
                      : 'text-rose-400'
                  }`}>
                    {testingStatus[selectedTab]?.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : testingStatus[selectedTab]?.testing ? (
                      <Activity className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testingStatus[selectedTab]?.message}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={testingStatus[selectedTab]?.testing}
                onClick={() => handleTestConnection(selectedTab)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-xs font-medium text-white transition-all shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testingStatus[selectedTab]?.testing ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Menguji...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Test Koneksi API
                  </>
                )}
              </button>
            </div>

            {/* Strategy Persona & Parameters Drawer */}
            <div className="border-t border-white/10 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Persona & Parameter Analisis AI
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  GLOBAL AGENT PRESET
                </span>
              </div>

              {/* Persona Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(TRADING_PERSONA_PROMPTS) as TradingPersona[]).map((pKey) => {
                  const pInfo = TRADING_PERSONA_PROMPTS[pKey];
                  const isSelected = settings.persona === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => setSettings(prev => ({ ...prev, persona: pKey }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-white'
                          : 'bg-black/30 border-white/5 hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-0.5">{pInfo.title}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {pInfo.prompt.slice(0, 60)}...
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Prompt Textarea if persona === 'custom' */}
              {settings.persona === 'custom' && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Instruksi Khusus (System Prompt Custom):
                  </label>
                  <textarea
                    rows={3}
                    value={settings.customSystemPrompt || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, customSystemPrompt: e.target.value }))}
                    placeholder="Tuliskan gaya analisis trading yang Anda inginkan..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Temperature & Token Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Kreativitas / Temperature:</span>
                    <span className="font-mono text-cyan-400 font-semibold">{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Presisi / Kuantitatif (0.2)</span>
                    <span>Eksploratif (0.9)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Max Tokens:</span>
                    <span className="font-mono text-indigo-400 font-semibold">{settings.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="4096"
                    step="256"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Ringkas (512)</span>
                    <span>Mendalam (4096)</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              {saveToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan & Terapkan
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
