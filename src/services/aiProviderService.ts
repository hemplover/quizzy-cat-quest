
import { toast } from 'sonner';

export type AIProvider = 'gemini' | 'openai';

interface AIProviderConfig {
  id: AIProvider;
  name: string;
  icon: string;
  description: string;
  models: Array<{ id: string; name: string; description: string }>;
  defaultModel: string;
  apiKeyRequired: boolean;
  supportsFileUpload: boolean;
  apiKeyName: string;
  useBackendOnly: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🌐',
    description: 'Google\'s multimodal AI system',
    models: [
      { id: 'gemini-2-flash', name: 'Gemini 2.0 Flash', description: 'Fast, affordable, high-quality model' },
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced language model' },
    ],
    defaultModel: 'gemini-2-flash',
    apiKeyRequired: true,
    supportsFileUpload: false,
    apiKeyName: 'gemini_api_key',
    useBackendOnly: true  // Force Gemini to use backend API key
  }
];

// Get a provider configuration by ID
export const getProviderConfig = (provider: AIProvider): AIProviderConfig | undefined => {
  return AI_PROVIDERS.find(p => p.id === provider);
};

// Get the selected provider - always returns Gemini
export const getSelectedProvider = (): AIProvider => {
  return 'gemini';
};

// No-op function since we now only use Gemini
export const setSelectedProvider = (provider: AIProvider): void => {
  // No-op since we always use Gemini now
};

// Get the API key for a provider - will always return backend managed for Gemini
export const getApiKey = (provider: AIProvider): string | null => {
  if (provider === 'gemini') {
    return "BACKEND_MANAGED";
  }
  return null;
};

// No-op function since we only use backend API key
export const setApiKey = (provider: AIProvider, apiKey: string): void => {
  toast.info('API keys are managed on the server');
};

// Get available models for Gemini
export const getAvailableModels = (provider?: AIProvider): Array<{ id: string; name: string; description: string }> => {
  const providerConfig = getProviderConfig('gemini');
  return providerConfig?.models || [];
};

// Check if the provider supports file upload - Gemini doesn't
export const supportsFileUpload = (provider?: AIProvider): boolean => {
  return false;
};

// Gemini is always backend-only
export const isBackendOnlyProvider = (provider?: AIProvider): boolean => {
  return true;
};

// Get default model for Gemini
export const getDefaultModel = (provider?: AIProvider): string => {
  const providerConfig = getProviderConfig('gemini');
  return providerConfig?.defaultModel || 'gemini-2-flash';
};
