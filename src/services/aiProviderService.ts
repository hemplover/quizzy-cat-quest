
import { toast } from 'sonner';

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mistral';

interface AIProviderConfig {
  id: AIProvider;
  name: string;
  icon: string;
  description: string;
  models: Array<{ id: string; name: string }>;
  defaultModel: string;
  apiKeyRequired: boolean;
  supportsFileUpload: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'Powerful AI models for text and image understanding',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (File Upload Support)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
    defaultModel: 'gpt-4o',
    apiKeyRequired: true,
    supportsFileUpload: true
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🌐',
    description: 'Google\'s multimodal AI system',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
    ],
    defaultModel: 'gemini-pro',
    apiKeyRequired: true,
    supportsFileUpload: false
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: '🧠',
    description: 'Claude models prioritize safety and helpfulness',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
    ],
    defaultModel: 'claude-3-sonnet',
    apiKeyRequired: true,
    supportsFileUpload: false
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '✨',
    description: 'Open source large language models',
    models: [
      { id: 'mistral-large', name: 'Mistral Large' },
      { id: 'mistral-medium', name: 'Mistral Medium' },
      { id: 'mistral-small', name: 'Mistral Small' },
    ],
    defaultModel: 'mistral-medium',
    apiKeyRequired: true,
    supportsFileUpload: false
  }
];

// Get a provider configuration by ID
export const getProviderConfig = (provider: AIProvider): AIProviderConfig | undefined => {
  return AI_PROVIDERS.find(p => p.id === provider);
};

// Get the selected provider from localStorage or default to OpenAI
export const getSelectedProvider = (): AIProvider => {
  const savedProvider = localStorage.getItem('selected_provider');
  if (!savedProvider) {
    localStorage.setItem('selected_provider', 'openai');
    return 'openai';
  }
  return savedProvider as AIProvider;
};

// Set the selected provider
export const setSelectedProvider = (provider: AIProvider): void => {
  localStorage.setItem('selected_provider', provider);
};

// Get the API key for a provider
export const getApiKey = (provider: AIProvider): string | null => {
  return localStorage.getItem(`${provider}_api_key`);
};

// Set the API key for a provider
export const setApiKey = (provider: AIProvider, apiKey: string): void => {
  localStorage.setItem(`${provider}_api_key`, apiKey);
  toast.success(`${provider.toUpperCase()} API key saved successfully`);
};

// Get available models for the selected provider
export const getAvailableModels = (provider?: AIProvider): Array<{ id: string; name: string }> => {
  const selectedProvider = provider || getSelectedProvider();
  const providerConfig = getProviderConfig(selectedProvider);
  return providerConfig?.models || [];
};

// Check if the provider supports file upload
export const supportsFileUpload = (provider?: AIProvider): boolean => {
  const selectedProvider = provider || getSelectedProvider();
  const providerConfig = getProviderConfig(selectedProvider);
  return providerConfig?.supportsFileUpload || false;
};

// Get default model for the selected provider
export const getDefaultModel = (provider?: AIProvider): string => {
  const selectedProvider = provider || getSelectedProvider();
  const providerConfig = getProviderConfig(selectedProvider);
  return providerConfig?.defaultModel || 'gpt-4o';
};
