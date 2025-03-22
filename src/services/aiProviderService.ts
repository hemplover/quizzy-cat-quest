import { toast } from 'sonner';

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mistral';

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
  useBackendOnly?: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'Powerful AI models for text and image understanding',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (File Upload Support)', description: 'High performance model with file upload support' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and more affordable version' },
    ],
    defaultModel: 'gpt-4o',
    apiKeyRequired: true,
    supportsFileUpload: true,
    apiKeyName: 'openai_api_key'
  },
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
    apiKeyName: 'gemini_api_key'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: '🧠',
    description: 'Claude models prioritize safety and helpfulness',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced capability and speed' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest Claude model' },
    ],
    defaultModel: 'claude-3-sonnet',
    apiKeyRequired: true,
    supportsFileUpload: false,
    apiKeyName: 'claude_api_key'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '✨',
    description: 'Open source large language models',
    models: [
      { id: 'mistral-large', name: 'Mistral Large', description: 'Most powerful Mistral model' },
      { id: 'mistral-medium', name: 'Mistral Medium', description: 'Balanced performance model' },
      { id: 'mistral-small', name: 'Mistral Small', description: 'Efficient and fast model' },
    ],
    defaultModel: 'mistral-medium',
    apiKeyRequired: true,
    supportsFileUpload: false,
    apiKeyName: 'mistral_api_key'
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
  const providerConfig = getProviderConfig(provider);
  
  // If provider is backend-only, return a placeholder value
  if (providerConfig?.useBackendOnly) {
    return "BACKEND_MANAGED";
  }
  
  return localStorage.getItem(`${provider}_api_key`);
};

// Set the API key for a provider
export const setApiKey = (provider: AIProvider, apiKey: string): void => {
  const providerConfig = getProviderConfig(provider);
  
  // Don't allow setting API keys for backend-only providers
  if (providerConfig?.useBackendOnly) {
    toast.info(`${providerConfig.name} API keys are managed on the server`);
    return;
  }
  
  localStorage.setItem(`${provider}_api_key`, apiKey);
  toast.success(`${provider.toUpperCase()} API key saved successfully`);
};

// Get available models for the selected provider
export const getAvailableModels = (provider?: AIProvider): Array<{ id: string; name: string; description: string }> => {
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

// Check if the provider is backend-only
export const isBackendOnlyProvider = (provider?: AIProvider): boolean => {
  const selectedProvider = provider || getSelectedProvider();
  const providerConfig = getProviderConfig(selectedProvider);
  return !!providerConfig?.useBackendOnly;
};

// Get default model for the selected provider
export const getDefaultModel = (provider?: AIProvider): string => {
  const selectedProvider = provider || getSelectedProvider();
  const providerConfig = getProviderConfig(selectedProvider);
  return providerConfig?.defaultModel || 'gpt-4o';
};
