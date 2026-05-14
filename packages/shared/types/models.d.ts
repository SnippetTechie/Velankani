export type AIProvider = 'anthropic' | 'openai' | 'google' | 'perplexity' | 'xai' | 'meta' | 'deepseek' | 'mistral';
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
export declare const AI_MODELS: AIModel[];
export declare const CONSENSUS_MODEL_IDS: readonly ["claude-sonnet-4", "gpt-4o", "gemini-1-5-pro"];
export declare const CONSENSUS_CREDITS = 19;
export type UserPlan = 'free' | 'pro' | 'pro_byok' | 'teams' | 'enterprise';
export declare const PLAN_MODEL_ACCESS: Record<UserPlan, string[]>;
export declare const getModel: (id: string) => AIModel | undefined;
export declare const getAvailableModels: () => AIModel[];
export declare const getModelsForPlan: (plan: string) => AIModel[];
export declare const getModelsByProvider: (provider: AIProvider) => AIModel[];
