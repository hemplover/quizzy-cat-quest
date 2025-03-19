
import React, { useState, useEffect } from 'react';
import { Settings, Key, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyFormProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    // Check if key already exists in local storage
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setHasKey(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || apiKey.trim().length < 10) {
      toast.error("Please enter a valid API key");
      return;
    }

    // Store in localStorage for demo purposes
    // In a real app, this should be handled server-side
    localStorage.setItem('openai_api_key', apiKey);
    onKeySubmit(apiKey);
    setHasKey(true);
    toast.success("API key saved successfully");
  };

  if (!isVisible && hasKey) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="w-3 h-3" />
        <span>Change API Key</span>
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
        Set OpenAI API Key
      </button>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-cat" />
        <h3 className="text-sm font-medium">OpenAI API Key</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Enter your OpenAI API key to generate custom quizzes. For demo purposes, the key is stored in your browser. In a production app, this would be server-side.
        </p>
        
        <div className="relative">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full p-2 text-sm border rounded focus:ring-cat focus:border-cat focus:outline-none"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setIsVisible(false)}
          >
            {hasKey ? <Check className="w-4 h-4 text-green-500" /> : null}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="cat-button-secondary text-xs py-1 px-3"
          >
            Save Key
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApiKeyForm;
