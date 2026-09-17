export type AiProvider = 'gemini' | 'openai' | 'claude' | 'openrouter' | 'custom';

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  organizationId?: string;
  isActive: boolean;
  lastTested?: number;
  testStatus?: 'success' | 'error' | 'testing' | null;
  testLatencyMs?: number;
  testMessage?: string;
}

export type TradingPersona = 
  | 'quant_analyst' 
  | 'aggressive_scalper' 
  | 'risk_manager' 
  | 'macro_strategist' 
  | 'custom';

export interface AiAgentSettings {
  activeProvider: AiProvider;
  providers: Record<AiProvider, AiProviderConfig>;
  temperature: number; // 0.0 - 1.0
  maxTokens: number;
  persona: TradingPersona;
  customSystemPrompt?: string;
  autoAnalyzeOnChartLoad?: boolean;
  enableConsensusMode?: boolean;
  consensusProvider?: AiProvider;
  consensusModel?: string;
  enableIndicatorDeepScan?: boolean;
}

export interface AiUsageStats {
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  lastResetTime: number;
  providerBreakdown: Record<string, { requests: number; tokens: number; estimatedCost: number }>;
}

export interface ProviderMetadata {
  id: AiProvider;
  name: string;
  tagline: string;
  badge: string;
  iconColor: string;
  keyPrefixHint: string;
  docsUrl: string;
  defaultBaseUrl?: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
    recommended?: boolean;
    isFree?: boolean;
    category?: 'free' | 'flagship' | 'reasoning' | 'fast';
    contextLength?: string;
  }>;
}

export const AI_PROVIDERS_METADATA: Record<AiProvider, ProviderMetadata> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Ultra-low latency inference & multimodality kelas dunia',
    badge: 'NATIVE SPEED',
    iconColor: '#38bdf8',
    keyPrefixHint: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Model rilis teruji, cepat, dan konsisten', recommended: true, category: 'fast' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', description: 'Ultra-low latency dan hemat kuota', category: 'fast' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', description: 'Versi stabil rilis cepat terkini', category: 'fast' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Penalaran kuantitatif mendalam & kalkulasi presisi', category: 'reasoning' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Kecepatan tinggi, penalaran teks instan', category: 'fast' }
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT)',
    tagline: 'Model flagship penalaran kuantitatif industri terpopuler',
    badge: 'GPT-4O / O-SERIES',
    iconColor: '#10b981',
    keyPrefixHint: 'sk-proj-... / sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', description: 'Flagship multimodal seimbang kecepatan & kecerdasan', recommended: true, category: 'flagship' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Cepat dan hemat biaya untuk analisis rutin', category: 'fast' },
      { id: 'o3-mini', name: 'o3-mini (Reasoning)', description: 'Model penalaran penalaran mendalam generasi baru', category: 'reasoning' },
      { id: 'o1-mini', name: 'o1-mini (Reasoning)', description: 'Penalaran matematika & probabilitas kuantitatif', category: 'reasoning' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Kemampuan analisis dokumen & data panjang', category: 'flagship' }
    ]
  },
  claude: {
    id: 'claude',
    name: 'Claude AI (Anthropic)',
    tagline: 'Pemahaman nuansa pasar, penulisan mendalam, dan analitika presisi',
    badge: 'SONNET 3.5 & 3.7',
    iconColor: '#f59e0b',
    keyPrefixHint: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: 'Hybrid reasoning & analitika tingkat tertinggi di dunia', recommended: true, category: 'flagship' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Kecerdasan tertinggi untuk analisis komparatif & order flow', category: 'flagship' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Respon super gesit dengan pemahaman tinggi', category: 'fast' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Penalaran naratif mendalam & riset makroekonomi', category: 'reasoning' }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (All-in-One)',
    tagline: 'Satu API key untuk mengakses ratusan model LLM global termasuk model 100% Free',
    badge: 'UNIFIED GATEWAY & FREE TIER',
    iconColor: '#a855f7',
    keyPrefixHint: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      // === 100% FREE TIER MODELS (NO CREDIT CONSUMPTION) ===
      {
        id: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek R1 (Free)',
        description: 'Open-weight reasoning #1 dunia, logika kuantitatif & SMC order flow mendalam tanpa biaya kuota',
        recommended: true,
        isFree: true,
        category: 'free',
        contextLength: '64k'
      },
      {
        id: 'deepseek/deepseek-chat:free',
        name: 'DeepSeek V3 (Free)',
        description: 'Model 671B MoE multi-bahasa ultra-gesit untuk analisis teknikal instan 100% gratis',
        recommended: true,
        isFree: true,
        category: 'free',
        contextLength: '64k'
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B Instruct (Free)',
        description: 'Flagship Meta 70B parameter untuk analisis indikator teknikal & sintesis pasar tanpa biaya',
        recommended: true,
        isFree: true,
        category: 'free',
        contextLength: '128k'
      },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash Exp (Free)',
        description: 'Model multimodal generasi baru Google berkecepatan tinggi dengan konteks 1M tokens gratis',
        isFree: true,
        category: 'free',
        contextLength: '1000k'
      },
      {
        id: 'google/gemini-2.0-pro-exp-02-05:free',
        name: 'Gemini 2.0 Pro Exp (Free)',
        description: 'Model penalaran kognitif tingkat lanjut Google untuk probabilitas kalkulasi statistik gratis',
        isFree: true,
        category: 'free',
        contextLength: '2000k'
      },
      {
        id: 'qwen/qwen-2.5-72b-instruct:free',
        name: 'Qwen 2.5 72B Instruct (Free)',
        description: 'Model raksasa 72B Alibaba Cloud dengan kemampuan kuantitatif & penalaran data mendalam gratis',
        isFree: true,
        category: 'free',
        contextLength: '128k'
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct:free',
        name: 'Qwen 2.5 Coder 32B (Free)',
        description: 'Spesialis algoritma matematika, formula PineScript/Python, dan kalkulasi risk-reward presisi gratis',
        isFree: true,
        category: 'free',
        contextLength: '32k'
      },
      {
        id: 'mistralai/mistral-small-24b-instruct-2501:free',
        name: 'Mistral Small 24B (Free)',
        description: 'Arsitektur baru Eropa dari Mistral AI dengan efisiensi tinggi dan respon latensi kilat gratis',
        isFree: true,
        category: 'free',
        contextLength: '32k'
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct:free',
        name: 'Llama 3.1 405B Instruct (Free)',
        description: 'Model terbesar di dunia (405 Miliar Parameter) untuk korelasi makro multi-variabel tanpa biaya',
        isFree: true,
        category: 'free',
        contextLength: '128k'
      },
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B (Free)',
        description: 'Model ringkas super cepat (sub-50ms) untuk scalping kilat & evaluasi sinyal real-time gratis',
        isFree: true,
        category: 'free',
        contextLength: '128k'
      },
      {
        id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
        name: 'Dolphin 3.0 R1 Mistral (Free)',
        description: 'Uncensored reasoning model untuk analisis sentimen & spekulasi pasar tanpa filter kaku',
        isFree: true,
        category: 'free',
        contextLength: '32k'
      },
      {
        id: 'microsoft/phi-3-medium-128k-instruct:free',
        name: 'Microsoft Phi-3 Medium (Free)',
        description: 'Model penalaran ringkas berakurasi tinggi dari Microsoft Research gratis',
        isFree: true,
        category: 'free',
        contextLength: '128k'
      },
      {
        id: 'openchat/openchat-7b:free',
        name: 'OpenChat 7B (Free)',
        description: 'Model percakapan open-source lincah untuk tanya jawab strategi cepat gratis',
        isFree: true,
        category: 'free',
        contextLength: '8k'
      },

      // === FLAGSHIP & PREMIUM ROUTING MODELS (PAID / UNIVERSAL) ===
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 (Dedicated)',
        description: 'Akses langsung jalur prioritas DeepSeek R1 reasoning',
        category: 'reasoning',
        contextLength: '64k'
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3 (Dedicated)',
        description: 'Akses jalur prioritas tinggi DeepSeek V3',
        category: 'fast',
        contextLength: '64k'
      },
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (via OpenRouter)',
        description: 'Hybrid reasoning flagship Anthropic terkini',
        category: 'flagship',
        contextLength: '200k'
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet (via OpenRouter)',
        description: 'Model analitika institusional standar hedge fund',
        category: 'flagship',
        contextLength: '200k'
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (via OpenRouter)',
        description: 'Flagship multimodal OpenAI via gateway OpenRouter',
        category: 'flagship',
        contextLength: '128k'
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini (via OpenRouter)',
        description: 'Versi hemat biaya & cepat dari OpenAI',
        category: 'fast',
        contextLength: '128k'
      },
      {
        id: 'openai/o3-mini',
        name: 'o3-mini (via OpenRouter)',
        description: 'Penalaran matematika & kalkulasi trading OpenAI',
        category: 'reasoning',
        contextLength: '128k'
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (via OpenRouter)',
        description: 'Inferensi kecepatan tinggi Google via OpenRouter',
        category: 'fast',
        contextLength: '1000k'
      },
      {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro (via OpenRouter)',
        description: 'Penalaran kuantitatif mendalam Google via OpenRouter',
        category: 'reasoning',
        contextLength: '2000k'
      },
      {
        id: 'x-ai/grok-2-1212',
        name: 'xAI Grok 2 (via OpenRouter)',
        description: 'Model analitika & sentimen pasar xAI',
        category: 'flagship',
        contextLength: '128k'
      }
    ]
  },
  custom: {
    id: 'custom',
    name: 'DeepSeek / Groq / Kustom',
    tagline: 'Koneksi ke DeepSeek Direct, Groq LPU, Ollama, LM Studio, vLLM',
    badge: 'CUSTOM / OPENAI COMPATIBLE',
    iconColor: '#ec4899',
    keyPrefixHint: 'sk-... atau apa saja untuk local server',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Direct API)', description: 'Koneksi langsung ke api.deepseek.com', recommended: true, category: 'fast' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Direct API)', description: 'Penalaran murni via DeepSeek server', category: 'reasoning' },
      { id: 'llama-3.3-70b-versatile', name: 'Groq Llama 3.3 70B (Sub-100ms)', description: 'Kecepatan inferensi Groq LPU super instan', category: 'fast' },
      { id: 'llama3:latest', name: 'Ollama Local (http://localhost:11434/v1)', description: 'Model lokal offline tanpa internet', category: 'fast' }
    ]
  }
};

export const TRADING_PERSONA_PROMPTS: Record<TradingPersona, { title: string; prompt: string }> = {
  quant_analyst: {
    title: 'Quantitative Order Flow Analyst (Default)',
    prompt: `Anda adalah MountAlgo Quant AI Agent, analis kuantitatif hedge fund profesional. Fokus Anda adalah struktur pasar (Order Blocks, Fair Value Gaps, Liquidity Sweeps), Volume Profile (POC, VAH, VAL), tape reading (delta order flow), dan probabilitas statistik. Berikan trade plan terstruktur dengan entry presisi, stop loss logis, dan minimal target R:R 1:2.`
  },
  aggressive_scalper: {
    title: 'Aggressive Momentum Scalper',
    prompt: `Anda adalah Trader Scalping Agresif MountAlgo. Fokus Anda adalah timeframe 1m - 15m, momentum breakouts, penembusan level kunci likuiditas, dan kecepatan eksekusi. Berikan level entry tajam, Stop Loss sangat ketat (0.3% - 0.8%), dan target profit cepat.`
  },
  risk_manager: {
    title: 'Institutional Risk Management Officer',
    prompt: `Anda adalah Kepala Manajemen Risiko MountAlgo. Prioritas absolut Anda adalah pelestarian modal dan mitigasi drawdown. Anda wajib menghitung ukuran lot/posisi, memverifikasi rasio Risk-to-Reward, dan memberi peringatan keras jika market dalam kondisi pelebaran spread atau rilis berita berbahaya.`
  },
  macro_strategist: {
    title: 'Macro & Fundamental Strategist',
    prompt: `Anda adalah Analis Makroekonomi Global MountAlgo. Fokus utama Anda adalah korelasi data kalender ekonomi (CPI, Non-Farm Payrolls, FOMC/The Fed), tren inflasi, imbal hasil obligasi US Treasury, dan dampaknya terhadap valuta asing, kripto, serta emas (XAUUSD).`
  },
  custom: {
    title: 'Kustom Trader (Persona Pribadi)',
    prompt: `Anda adalah asisten trading MountAlgo profesional yang dikonfigurasi secara personal oleh trader.`
  }
};

export const DEFAULT_AI_SETTINGS: AiAgentSettings = {
  activeProvider: 'gemini',
  providers: {
    gemini: {
      apiKey: '',
      model: 'gemini-2.5-flash',
      isActive: true,
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
      isActive: false,
    },
    claude: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      baseUrl: 'https://api.anthropic.com/v1',
      isActive: false,
    },
    openrouter: {
      apiKey: '',
      model: 'deepseek/deepseek-r1:free',
      baseUrl: 'https://openrouter.ai/api/v1',
      isActive: false,
    },
    custom: {
      apiKey: '',
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
      isActive: false,
    },
  },
  temperature: 0.65,
  maxTokens: 2048,
  persona: 'quant_analyst',
  customSystemPrompt: '',
  autoAnalyzeOnChartLoad: false,
  enableConsensusMode: false,
  consensusProvider: 'claude',
  consensusModel: 'claude-3-5-sonnet-20241022',
  enableIndicatorDeepScan: true
};

const STORAGE_KEY = 'mountalgo_ai_settings';
const USAGE_STORAGE_KEY = 'mountalgo_ai_usage_stats';

export const DEFAULT_USAGE_STATS: AiUsageStats = {
  totalRequests: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
  lastResetTime: Date.now(),
  providerBreakdown: {}
};

export function loadAiUsageStats(): AiUsageStats {
  if (typeof window === 'undefined') return DEFAULT_USAGE_STATS;
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return DEFAULT_USAGE_STATS;
    return { ...DEFAULT_USAGE_STATS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_USAGE_STATS;
  }
}

export function recordAiUsage(
  provider: string, 
  promptTokensApprox: number = 250, 
  completionTokensApprox: number = 380,
  costUsdApprox: number = 0.0008
): AiUsageStats {
  if (typeof window === 'undefined') return DEFAULT_USAGE_STATS;
  try {
    const current = loadAiUsageStats();
    const updated: AiUsageStats = {
      ...current,
      totalRequests: (current.totalRequests || 0) + 1,
      promptTokens: (current.promptTokens || 0) + promptTokensApprox,
      completionTokens: (current.completionTokens || 0) + completionTokensApprox,
      totalTokens: (current.totalTokens || 0) + promptTokensApprox + completionTokensApprox,
      estimatedCostUsd: Number(((current.estimatedCostUsd || 0) + costUsdApprox).toFixed(6)),
      providerBreakdown: {
        ...(current.providerBreakdown || {}),
        [provider]: {
          requests: ((current.providerBreakdown?.[provider]?.requests) || 0) + 1,
          tokens: ((current.providerBreakdown?.[provider]?.tokens) || 0) + promptTokensApprox + completionTokensApprox,
          estimatedCost: Number((((current.providerBreakdown?.[provider]?.estimatedCost) || 0) + costUsdApprox).toFixed(6))
        }
      }
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mountalgo:ai-usage-updated', { detail: updated }));
    return updated;
  } catch (e) {
    return DEFAULT_USAGE_STATS;
  }
}

export function resetAiUsageStats(): void {
  if (typeof window === 'undefined') return;
  const reset = { ...DEFAULT_USAGE_STATS, lastResetTime: Date.now() };
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(reset));
  window.dispatchEvent(new CustomEvent('mountalgo:ai-usage-updated', { detail: reset }));
}

export function loadAiAgentSettings(): AiAgentSettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
      providers: {
        ...DEFAULT_AI_SETTINGS.providers,
        ...(parsed.providers || {})
      }
    };
  } catch (err) {
    console.warn("Failed to load AI settings from localStorage:", err);
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAiAgentSettings(settings: AiAgentSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('mountalgo:ai-settings-updated', { detail: settings }));
  } catch (err) {
    console.error("Failed to save AI settings to localStorage:", err);
  }
}
