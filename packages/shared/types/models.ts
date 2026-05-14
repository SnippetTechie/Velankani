// ═══════════════════════════════════════════════════════════
// VEL AI — Complete AI Model Registry
// ═══════════════════════════════════════════════════════════

export type AIProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'perplexity'
  | 'xai'
  | 'meta'
  | 'deepseek'
  | 'mistral';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  openRouterId: string;
  directApiModel?: string;
  creditsPerMessage: number;
  contextWindow: number;
  description: string;
  badge?: string;
  color: string;
  available: boolean;
  supportsVision: boolean;
  supportsSearch: boolean;
}

export const AI_MODELS: AIModel[] = [
  // ── Anthropic ────────────────────────────────────────────
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    openRouterId: 'anthropic/claude-opus-4',
    directApiModel: 'claude-opus-4',
    creditsPerMessage: 12,
    contextWindow: 200000,
    description: 'Maximum intelligence, deepest reasoning',
    badge: 'Most Powerful',
    color: '#8B5CF6',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    openRouterId: 'anthropic/claude-sonnet-4',
    directApiModel: 'claude-sonnet-4',
    creditsPerMessage: 8,
    contextWindow: 200000,
    description: 'Balanced speed and intelligence',
    badge: 'Recommended',
    color: '#8B5CF6',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
  {
    id: 'claude-haiku-3-5',
    name: 'Claude Haiku 3.5',
    provider: 'anthropic',
    openRouterId: 'anthropic/claude-3.5-haiku',
    directApiModel: 'claude-3-5-haiku-20241022',
    creditsPerMessage: 3,
    contextWindow: 200000,
    description: 'Fast, efficient, everyday tasks',
    badge: 'Fastest Claude',
    color: '#8B5CF6',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  // ── OpenAI ───────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    openRouterId: 'openai/gpt-4o',
    directApiModel: 'gpt-4o',
    creditsPerMessage: 6,
    contextWindow: 128000,
    description: 'Versatile, multimodal, general purpose',
    color: '#10B981',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
  {
    id: 'gpt-4-1',
    name: 'GPT-4.1',
    provider: 'openai',
    openRouterId: 'openai/gpt-4.1',
    directApiModel: 'gpt-4.1',
    creditsPerMessage: 8,
    contextWindow: 128000,
    description: 'Advanced reasoning and instruction following',
    color: '#10B981',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    openRouterId: 'openai/o3-mini',
    directApiModel: 'o3-mini',
    creditsPerMessage: 5,
    contextWindow: 128000,
    description: 'Fast structured reasoning, math, code',
    badge: 'Reasoning',
    color: '#10B981',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'codex',
    name: 'Codex',
    provider: 'openai',
    openRouterId: 'openai/codex-mini-latest',
    directApiModel: 'codex-mini-latest',
    creditsPerMessage: 5,
    contextWindow: 200000,
    description: 'Purpose-built for code generation',
    badge: 'Code',
    color: '#10B981',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  // ── Google ───────────────────────────────────────────────
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    openRouterId: 'google/gemini-2.0-flash-001',
    creditsPerMessage: 3,
    contextWindow: 1000000,
    description: 'Ultra-fast, massive context window',
    badge: 'Fastest',
    color: '#3B82F6',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    openRouterId: 'google/gemini-pro-1.5',
    creditsPerMessage: 5,
    contextWindow: 2000000,
    description: 'Long context analysis, multimodal',
    color: '#3B82F6',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
  // ── Perplexity ───────────────────────────────────────────
  {
    id: 'perplexity-sonar-pro',
    name: 'Sonar Pro',
    provider: 'perplexity',
    openRouterId: 'perplexity/sonar-pro',
    creditsPerMessage: 4,
    contextWindow: 127000,
    description: 'Live web research with citations',
    badge: 'Web Search',
    color: '#F59E0B',
    available: true,
    supportsVision: false,
    supportsSearch: true,
  },
  // ── xAI ──────────────────────────────────────────────────
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xai',
    openRouterId: 'x-ai/grok-3-beta',
    creditsPerMessage: 6,
    contextWindow: 131072,
    description: 'Real-time context, X/Twitter data',
    color: '#E5E7EB',
    available: true,
    supportsVision: false,
    supportsSearch: true,
  },
  // ── Meta ─────────────────────────────────────────────────
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    openRouterId: 'meta-llama/llama-3.3-70b-instruct',
    creditsPerMessage: 2,
    contextWindow: 128000,
    description: 'Open source powerhouse',
    badge: 'Open Source',
    color: '#6366F1',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  // ── DeepSeek (v2 roadmap) ────────────────────────────────
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    openRouterId: 'deepseek/deepseek-r1',
    creditsPerMessage: 3,
    contextWindow: 128000,
    description: 'Technical reasoning specialist',
    color: '#06B6D4',
    available: false,
    supportsVision: false,
    supportsSearch: false,
  },
  // ── FREE Open Models ─────────────────────────────────────
  {
    id: 'glm-4-5-air',
    name: 'GLM 4.5 Air',
    provider: 'deepseek',
    openRouterId: 'z-ai/glm-4.5-air',
    creditsPerMessage: 2,
    contextWindow: 131072,
    description: 'Best free for reasoning & tool discipline',
    badge: 'FREE',
    color: '#14B8A6',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'hermes-3-405b',
    name: 'Hermes 3 405B',
    provider: 'deepseek',
    openRouterId: 'nousresearch/hermes-3-405b-instruct',
    creditsPerMessage: 4,
    contextWindow: 131072,
    description: 'Deep synthesis & long-form reasoning',
    badge: 'FREE',
    color: '#A855F7',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder 480B',
    provider: 'deepseek',
    openRouterId: 'qwen/qwen3-coder-480b-a35b',
    creditsPerMessage: 3,
    contextWindow: 262144,
    description: 'Multi-file coding, code generation',
    badge: 'FREE',
    color: '#F97316',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'nemotron-super',
    name: 'Nemotron 3 Super',
    provider: 'deepseek',
    openRouterId: 'nvidia/nemotron-3-super-512b',
    creditsPerMessage: 3,
    contextWindow: 262144,
    description: 'Long context RAG, hybrid architecture',
    badge: 'FREE',
    color: '#22C55E',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'mistral-small',
    name: 'Mistral Small 3.1',
    provider: 'mistral',
    openRouterId: 'mistralai/mistral-small-3.1-24b-instruct',
    creditsPerMessage: 2,
    contextWindow: 128000,
    description: 'Fast loops, summaries, lightweight',
    badge: 'FREE',
    color: '#EC4899',
    available: true,
    supportsVision: false,
    supportsSearch: false,
  },
  {
    id: 'gemma-3-27b',
    name: 'Gemma 3 27B',
    provider: 'google',
    openRouterId: 'google/gemma-3-27b-it',
    creditsPerMessage: 2,
    contextWindow: 131072,
    description: 'Clean instruction following, multimodal',
    badge: 'FREE',
    color: '#3B82F6',
    available: true,
    supportsVision: true,
    supportsSearch: false,
  },
];

export const CONSENSUS_MODEL_IDS = ['claude-sonnet-4', 'gpt-4o', 'gemini-1-5-pro'] as const;
export const CONSENSUS_CREDITS = 19; // 8 + 6 + 5

export type UserPlan = 'free' | 'pro' | 'pro_byok' | 'teams' | 'enterprise';

export const PLAN_MODEL_ACCESS: Record<UserPlan, string[]> = {
  free: ['claude-haiku-3-5', 'gpt-4o', 'gemini-2-flash', 'llama-3-3-70b'],
  pro: ['*'],
  pro_byok: ['*'],
  teams: ['*'],
  enterprise: ['*'],
};

export const getModel = (id: string): AIModel | undefined =>
  AI_MODELS.find((m) => m.id === id);

export const getAvailableModels = (): AIModel[] =>
  AI_MODELS.filter((m) => m.available);

export const getModelsForPlan = (plan: string): AIModel[] => {
  const available = getAvailableModels();
  const allowed =
    PLAN_MODEL_ACCESS[plan as UserPlan] || PLAN_MODEL_ACCESS.free;

  if (allowed[0] === '*') return available;
  return available.filter((model) => allowed.includes(model.id));
};

export const getModelsByProvider = (provider: AIProvider): AIModel[] =>
  AI_MODELS.filter((m) => m.provider === provider && m.available);
