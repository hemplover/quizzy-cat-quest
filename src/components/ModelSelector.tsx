
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
import { useLanguage } from '@/i18n/LanguageContext';

interface ModelSelectorProps {
  className?: string;
  onModelChange?: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  className,
  onModelChange
}) => {
  const { t } = useLanguage();
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModel());
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string, description: string}>>([]);
  
  useEffect(() => {
    const provider = getSelectedProvider();
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    
    if (providerConfig) {
      // Ensure all models have a description property
      const modelsWithDescriptions = providerConfig.models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description || `${model.name} model`
      }));
      
      setAvailableModels(modelsWithDescriptions);
      
      // Check if the currently selected model is valid for this provider
      const validModel = modelsWithDescriptions.find(m => m.id === selectedModel);
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
      toast.success(t('switchedToModel').replace('{model}', model.name));
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-cat" />
        <h3 className="text-sm font-medium">{t('aiModel')}</h3>
      </div>
      
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('selectAIModel')} />
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
        {availableModels.find(m => m.id === selectedModel)?.description || t('selectModelDesc')}
      </p>
    </div>
  );
};

export default ModelSelector;
