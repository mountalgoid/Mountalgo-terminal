import { GoogleGenAI } from "@google/genai";

export interface UserAiConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'openrouter' | 'custom';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface AiExecutionResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  isFallback?: boolean;
}

/**
 * Execute AI completion using the user's custom API key and provider,
 * supporting Gemini, OpenAI (GPT), Claude (Anthropic), OpenRouter, and Custom (DeepSeek, Groq, Ollama).
 */
export async function executeMultiProviderAi(
  config: UserAiConfig,
  messages: ChatTurn[],
  customSystemPrompt?: string
): Promise<AiExecutionResult> {
  const startTime = Date.now();
  const provider = config.provider || 'gemini';
  const systemPrompt = customSystemPrompt || config.systemPrompt || "Anda adalah MountAlgo Quant AI Agent profesional.";
  const temperature = typeof config.temperature === 'number' ? config.temperature : 0.65;
  const maxTokens = config.maxTokens || 2048;

  switch (provider) {
    case 'openai': {
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API Key belum dimasukkan. Masukkan API key OpenAI di Pengaturan AI Agent.");
      }
      const model = config.model || 'gpt-4o';
      const baseUrl = (config.baseUrl?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');

      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        ],
        temperature,
        max_tokens: maxTokens,
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000)
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `OpenAI Error status ${res.status}: ${res.statusText}`;
        throw new Error(errMsg);
      }

      const data: any = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "";
      return {
        text: reply,
        provider: 'OpenAI (GPT)',
        model,
        latencyMs: Date.now() - startTime
      };
    }

    case 'claude': {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("Anthropic Claude API Key belum dimasukkan. Masukkan API key Claude di Pengaturan AI Agent.");
      }
      const model = config.model || 'claude-3-5-sonnet-20241022';
      const baseUrl = (config.baseUrl?.trim() || 'https://api.anthropic.com/v1').replace(/\/+$/, '');

      // Anthropic requires alternating user/assistant messages, system prompt passed separately
      const formattedMessages = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const payload = {
        model,
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature: Math.min(1.0, temperature)
      };

      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000)
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `Anthropic Claude Error status ${res.status}: ${res.statusText}`;
        throw new Error(errMsg);
      }

      const data: any = await res.json();
      const reply = data?.content?.[0]?.text || "";
      return {
        text: reply,
        provider: 'Claude AI (Anthropic)',
        model,
        latencyMs: Date.now() - startTime
      };
    }

    case 'openrouter': {
      const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API Key belum dimasukkan. Dapatkan di https://openrouter.ai/keys lalu masukkan di Pengaturan AI.");
      }
      const model = config.model || 'deepseek/deepseek-r1';
      const baseUrl = (config.baseUrl?.trim() || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');

      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        ],
        temperature,
        max_tokens: maxTokens,
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://mountalgo.io',
          'X-Title': 'MountAlgo Pro Quant Terminal'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(40000)
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `OpenRouter Error status ${res.status}: ${res.statusText}`;
        throw new Error(errMsg);
      }

      const data: any = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "";
      return {
        text: reply,
        provider: 'OpenRouter Unified',
        model,
        latencyMs: Date.now() - startTime
      };
    }

    case 'custom': {
      const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "";
      const model = config.model || 'deepseek-chat';
      let baseUrl = (config.baseUrl?.trim() || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }

      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        ],
        temperature,
        max_tokens: maxTokens,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000)
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `Endpoint Error status ${res.status}: ${res.statusText}`;
        throw new Error(errMsg);
      }

      const data: any = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "";
      return {
        text: reply,
        provider: 'Custom / DeepSeek',
        model,
        latencyMs: Date.now() - startTime
      };
    }

    case 'gemini':
    default: {
      const apiKey = config.apiKey?.trim() || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key belum dikonfigurasi. Masukkan API key Gemini di Pengaturan AI Agent.");
      }

      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Prepare Gemini contents
      const geminiContents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Candidate models in order of priority & reliability:
      // Start with the user's chosen model, then reliable fallbacks
      const requestedModel = config.model || 'gemini-2.5-flash';
      const fallbackPool = [
        requestedModel,
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-3.8-flash'
      ];
      // Deduplicate preserving order
      const candidateModels = Array.from(new Set(fallbackPool));

      let lastError: any = null;
      for (const modelToTry of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: modelToTry,
            contents: geminiContents,
            config: {
              systemInstruction: systemPrompt,
              temperature,
            }
          });

          const reply = response?.text || "";
          if (reply) {
            return {
              text: reply,
              provider: 'Google Gemini',
              model: modelToTry,
              latencyMs: Date.now() - startTime
            };
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.error && err.error.code);
          const msg = err?.message || String(err);
          const isTemporarySpike = 
            status === 503 || 
            status === 429 || 
            msg.includes('503') || 
            msg.includes('429') || 
            msg.includes('high demand') || 
            msg.includes('UNAVAILABLE') || 
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('overloaded');

          if (isTemporarySpike) {
            // Try next candidate model silently
            continue;
          } else {
            // For other errors (like invalid API key), break early
            throw err;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      throw new Error("Tidak ada respons yang diterima dari model AI.");
    }
  }
}

/**
 * Test connectivity and latency for a specific AI provider & key
 */
export async function testAiProviderConnection(
  config: UserAiConfig
): Promise<{
  success: boolean;
  latencyMs: number;
  provider: string;
  model: string;
  replySnippet?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const testResult = await executeMultiProviderAi(
      config,
      [{ role: 'user', content: "Ping test from MountAlgo Pro Terminal. Respon 1 kalimat singkat bahwa koneksi aktif." }],
      "Anda adalah asisten validator koneksi API MountAlgo."
    );

    return {
      success: true,
      latencyMs: testResult.latencyMs,
      provider: testResult.provider,
      model: testResult.model,
      replySnippet: testResult.text.slice(0, 120)
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      provider: config.provider,
      model: config.model || 'default',
      error: err?.message || String(err)
    };
  }
}
