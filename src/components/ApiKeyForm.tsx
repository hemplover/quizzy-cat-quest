
import React, { useState, useEffect } from 'react';
import { Settings, Key, Check, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { 
  AI_PROVIDERS, 
  AIProvider,
  getSelectedProvider, 
  setApiKey,
  getApiKey,
  isBackendOnlyProvider
} from '@/services/aiProviderService';
import AIProviderSelector from './AIProviderSelector';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyFormProps {
  onKeySubmit: (key: string, provider: AIProvider) => void;
  className?: string;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  onKeySubmit,
  className
}) => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(getSelectedProvider());
  const [hasKeys, setHasKeys] = useState<Record<string, boolean>>({});
  const [useBackend, setUseBackend] = useState(true);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const isBackendOnly = isBackendOnlyProvider(selectedProvider);

  useEffect(() => {
    const keysStatus: Record<string, boolean> = {};
    const savedKeys: Record<string, string> = {};
    
    AI_PROVIDERS.forEach(provider => {
      const storedKey = getApiKey(provider.id);
      keysStatus[provider.id] = !!storedKey;
      
      if (storedKey) {
        savedKeys[provider.id] = storedKey;
      } else {
        savedKeys[provider.id] = '';
      }
    });
    
    setHasKeys(keysStatus);
    setApiKeys(savedKeys);
    
    const checkBackendKeys = async () => {
      try {
        setIsCheckingBackend(true);
        
        const { data, error } = await supabase.functions.invoke('check-api-keys', {
          body: {}
        });
        
        if (error) {
          console.error('Error checking backend API keys:', error);
          setUseBackend(false);
          return;
        }
        
        if (data && data.keys) {
          const backendKeysStatus = { ...keysStatus };
          
          Object.entries(data.keys).forEach(([provider, hasKey]) => {
            backendKeysStatus[provider as AIProvider] = !!hasKey;
          });
          
          setHasKeys(backendKeysStatus);
          setUseBackend(true);
        } else {
          setUseBackend(false);
        }
      } catch (error) {
        console.error('Failed to check backend API keys:', error);
        setUseBackend(false);
      } finally {
        setIsCheckingBackend(false);
      }
    };
    
    checkBackendKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);
    if (!currentProvider) {
      toast.error("Invalid provider selected");
      return;
    }
    
    // Skip submission for backend-only providers
    if (isBackendOnly) {
      toast.info(`${currentProvider.name} API keys are managed on the server`);
      return;
    }
    
    const apiKey = apiKeys[selectedProvider];
    if (!apiKey || apiKey.trim().length < 10) {
      toast.error(`Please enter a valid API key for ${currentProvider.name}`);
      return;
    }

    if (useBackend) {
      try {
        const { error } = await supabase.functions.invoke('set-api-key', {
          body: {
            provider: selectedProvider,
            apiKey: apiKey
          }
        });
        
        if (error) {
          toast.error(`Failed to save API key: ${error.message}`);
          return;
        }
        
        setHasKeys({
          ...hasKeys,
          [selectedProvider]: true
        });
        
        toast.success(`${currentProvider.name} API key saved securely on the server`);
      } catch (error) {
        console.error('Error saving API key to backend:', error);
        toast.error('Failed to save API key to backend');
      }
    } else {
      setApiKey(selectedProvider, apiKey);
      
      setHasKeys({
        ...hasKeys,
        [selectedProvider]: true
      });
      
      onKeySubmit(apiKey, selectedProvider);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, provider: AIProvider) => {
    setApiKeys({
      ...apiKeys,
      [provider]: e.target.value
    });
  };

  if (!isVisible && Object.values(hasKeys).some(Boolean)) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="w-3 h-3" />
        <span>Manage API Keys</span>
      </button>
    );
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="cat-button-secondary text-sm"
      >
        <Settings className="w-4 h-4" />
        Set AI API Keys
      </button>
    );
  }

  return (
    <div className={`glass-card p-4 rounded-xl mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-cat" />
          <h3 className="text-sm font-medium">AI Provider API Keys</h3>
        </div>
        <button 
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      
      <AIProviderSelector 
        onProviderChange={handleProviderChange} 
        className="mb-4"
      />
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {isBackendOnly ? (
          <Alert className="bg-blue-50 border-blue-100 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API keys are managed securely on the server. 
              No frontend configuration is needed.
            </AlertDescription>
          </Alert>
        ) : useBackend ? (
          <Alert className="bg-blue-50 border-blue-100 mb-3">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700">
              API keys are stored securely on the server. Your keys won't be exposed in the browser.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enter your API key for the selected provider. For demo purposes, the key is stored in your browser.
            In a production app, this would be handled server-side.
          </p>
        )}
        
        {!isBackendOnly && (
          <div className="relative">
            <Input
              type="password"
              value={apiKeys[selectedProvider] || ''}
              onChange={(e) => handleInputChange(e, selectedProvider)}
              placeholder={`${selectedProvider === 'openai' ? 'sk-...' : 'Enter API key'}`}
              className="w-full text-sm focus:ring-cat focus:border-cat"
            />
            
            {hasKeys[selectedProvider] && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
        )}
        
        {!isBackendOnly && (
          <div className="flex gap-2">
            <button
              type="submit"
              className="cat-button-secondary text-xs py-1 px-3"
            >
              Save Key
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ApiKeyForm;
