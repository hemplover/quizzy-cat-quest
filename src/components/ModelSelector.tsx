
import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { 
  getSelectedProvider,
  AI_PROVIDERS
} from '@/services/aiProviderService';
import { getSelectedModel, setModelToUse } from '@/services/quizService';
import { toast } from 'sonner';

interface ModelSelectorProps {
  className?: string;
  onModelChange?: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  className,
  onModelChange
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModel());
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string, description: string}>>([]);
  
  useEffect(() => {
    const provider = getSelectedProvider();
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    
    if (providerConfig) {
      // Make sure to use models with description property
      setAvailableModels(providerConfig.models);
      
      // Check if the currently selected model is valid for this provider
      const validModel = providerConfig.models.find(m => m.id === selectedModel);
      if (!validModel) {
        // If not valid, set to default model
        const newModel = providerConfig.defaultModel;
        setSelectedModel(newModel);
        setModelToUse(newModel);
        if (onModelChange) {
          onModelChange(newModel);
        }
      }
    }
  }, [getSelectedProvider()]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setModelToUse(modelId);
    
    if (onModelChange) {
      onModelChange(modelId);
    }
    
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      toast.success(`Switched to ${model.name}`);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-cat" />
        <h3 className="text-sm font-medium">AI Model</h3>
      </div>
      
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-xs text-muted-foreground mt-1">
        {availableModels.find(m => m.id === selectedModel)?.description || 'Select a model to generate your quiz'}
      </p>
    </div>
  );
};

export default ModelSelector;
