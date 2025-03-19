
import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { 
  AI_PROVIDERS, 
  AIProvider, 
  getSelectedProvider, 
  setSelectedProvider 
} from '@/services/aiProviderService';
import { toast } from 'sonner';

interface AIProviderSelectorProps {
  onProviderChange?: (provider: AIProvider) => void;
  className?: string;
}

const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({ 
  onProviderChange,
  className
}) => {
  const [selectedProvider, setSelectedAIProvider] = useState<AIProvider>(getSelectedProvider());

  useEffect(() => {
    // Initialize from localStorage
    setSelectedAIProvider(getSelectedProvider());
  }, []);

  const handleProviderChange = (value: string) => {
    const provider = value as AIProvider;
    setSelectedAIProvider(provider);
    setSelectedProvider(provider);
    
    if (onProviderChange) {
      onProviderChange(provider);
    }
    
    toast.success(`Switched to ${AI_PROVIDERS.find(p => p.id === provider)?.name}`);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-cat" />
        <h3 className="text-sm font-medium">AI Provider</h3>
      </div>
      
      <Select value={selectedProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI Provider" />
        </SelectTrigger>
        <SelectContent>
          {AI_PROVIDERS.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2">
                <span>{provider.icon}</span>
                <span>{provider.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-xs text-muted-foreground mt-1">
        {AI_PROVIDERS.find(p => p.id === selectedProvider)?.description}
      </p>
    </div>
  );
};

export default AIProviderSelector;
