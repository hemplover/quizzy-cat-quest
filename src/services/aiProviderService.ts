
import { toast } from 'sonner';

// Types for AI provider configuration
export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mistral';

export interface AIProviderConfig {
  name: string;
  id: AIProvider;
  description: string;
  icon: string;
  apiKeyName: string;
  defaultModel: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
  }>;
  supportsFileUpload: boolean;
  supportsedFileTypes: string[];
}

// Available AI providers
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    name: 'OpenAI',
    id: 'openai',
    description: 'Powerful AI models from OpenAI including GPT-4o',
    icon: '🤖',
    apiKeyName: 'openai_api_key',
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most powerful model with vision capabilities',
        capabilities: ['text', 'images', 'files']
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster and more cost-effective',
        capabilities: ['text', 'images', 'files']
      }
    ],
    supportsFileUpload: true,
    supportsedFileTypes: ['.pdf', '.docx', '.txt', '.jpg', '.png']
  },
  {
    name: 'Google Gemini',
    id: 'gemini',
    description: 'Advanced AI from Google',
    icon: '🌀',
    apiKeyName: 'gemini_api_key',
    defaultModel: 'gemini-pro',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'High performance model for text',
        capabilities: ['text', 'images', 'files']
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Supports analyzing images and text',
        capabilities: ['text', 'images', 'files']
      }
    ],
    supportsFileUpload: true,
    supportsedFileTypes: ['.pdf', '.docx', '.txt', '.jpg', '.png']
  },
  {
    name: 'Anthropic Claude',
    id: 'claude',
    description: 'Claude AI models from Anthropic',
    icon: '🧠',
    apiKeyName: 'claude_api_key',
    defaultModel: 'claude-3-opus',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model',
        capabilities: ['text', 'images']
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        capabilities: ['text', 'images']
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most compact Claude model',
        capabilities: ['text', 'images']
      }
    ],
    supportsFileUpload: false,
    supportsedFileTypes: []
  },
  {
    name: 'Mistral',
    id: 'mistral',
    description: 'Powerful open models from Mistral',
    icon: '🌬️',
    apiKeyName: 'mistral_api_key',
    defaultModel: 'mistral-large',
    models: [
      {
        id: 'mistral-large',
        name: 'Mistral Large',
        description: 'Mistral\'s most powerful model',
        capabilities: ['text']
      },
      {
        id: 'mistral-small',
        name: 'Mistral Small',
        description: 'Efficient model with good performance',
        capabilities: ['text']
      }
    ],
    supportsFileUpload: false,
    supportsedFileTypes: []
  }
];

// Get the currently selected AI provider
export const getSelectedProvider = (): AIProvider => {
  const provider = localStorage.getItem('selected_ai_provider') as AIProvider;
  return provider || 'openai'; // Default to OpenAI
};

// Set the selected AI provider
export const setSelectedProvider = (provider: AIProvider): void => {
  localStorage.setItem('selected_ai_provider', provider);
};

// Get API key for the specified provider
export const getApiKey = (provider?: AIProvider): string => {
  const providerToUse = provider || getSelectedProvider();
  const providerConfig = AI_PROVIDERS.find(p => p.id === providerToUse);
  
  if (!providerConfig) {
    toast.error(`Provider configuration not found for ${providerToUse}`);
    return '';
  }
  
  const key = localStorage.getItem(providerConfig.apiKeyName);
  if (!key) {
    toast.error(`API key not found for ${providerConfig.name}. Please set your API key.`);
    return '';
  }
  
  return key;
};

// Get the default model for the specified provider
export const getDefaultModel = (provider?: AIProvider): string => {
  const providerToUse = provider || getSelectedProvider();
  const providerConfig = AI_PROVIDERS.find(p => p.id === providerToUse);
  
  if (!providerConfig) {
    return 'gpt-4o'; // Fallback to OpenAI's default
  }
  
  return providerConfig.defaultModel;
};

// Check if the provider supports file upload
export const supportsFileUpload = (provider?: AIProvider): boolean => {
  const providerToUse = provider || getSelectedProvider();
  const providerConfig = AI_PROVIDERS.find(p => p.id === providerToUse);
  
  if (!providerConfig) {
    return false;
  }
  
  return providerConfig.supportsFileUpload;
};

// Check if a file type is supported by the provider
export const isSupportedFileType = (fileType: string, provider?: AIProvider): boolean => {
  const providerToUse = provider || getSelectedProvider();
  const providerConfig = AI_PROVIDERS.find(p => p.id === providerToUse);
  
  if (!providerConfig || !providerConfig.supportsFileUpload) {
    return false;
  }
  
  return providerConfig.supportsedFileTypes.some(type => 
    fileType.toLowerCase().endsWith(type.toLowerCase()));
};
