
import { toast } from 'sonner';
import { 
  AIProvider, 
  getSelectedProvider, 
  getApiKey,
  supportsFileUpload 
} from './aiProviderService';
import { 
  extractTextFromFile, 
  generateQuiz as generateOpenAIQuiz,
  gradeQuiz as gradeOpenAIQuiz 
} from './openaiService';
import {
  generateQuizWithGemini,
  gradeQuizWithGemini
} from './geminiService';

// Types for quiz generation
export interface QuizQuestion {
  tipo: string;
  domanda: string;
  opzioni?: string[];
  risposta_corretta: string;
}

export interface GeneratedQuiz {
  quiz: QuizQuestion[];
}

export interface QuizResults {
  risultati: Array<{
    domanda: string;
    risposta_utente: string | number;
    corretto: boolean | string;
    punteggio: number;
    spiegazione: string;
  }>;
  punteggio_totale: number;
}

// Transform generated questions to our app format
export const transformQuizQuestions = (generatedQuiz: GeneratedQuiz) => {
  return generatedQuiz.quiz.map((q, index) => {
    if (q.tipo === 'scelta_multipla') {
      return {
        id: index,
        type: 'multiple-choice',
        question: q.domanda,
        options: q.opzioni || [],
        correctAnswer: q.opzioni?.indexOf(q.risposta_corretta) || 0,
        explanation: ''
      };
    } else if (q.tipo === 'vero_falso') {
      return {
        id: index,
        type: 'true-false',
        question: q.domanda,
        options: ['Vero', 'Falso'],
        correctAnswer: q.risposta_corretta === 'Vero' ? 0 : 1,
        explanation: ''
      };
    } else {
      return {
        id: index,
        type: 'open-ended',
        question: q.domanda,
        correctAnswer: q.risposta_corretta || '',
        explanation: ''
      };
    }
  });
};

// Generate quiz based on the selected AI provider
export const generateQuiz = async (content: string): Promise<GeneratedQuiz | null> => {
  const provider = getSelectedProvider();
  
  switch (provider) {
    case 'openai':
      return generateOpenAIQuiz(content);
    case 'gemini':
      return generateQuizWithGemini(content);
    case 'claude':
    case 'mistral':
      toast.error(`Integration with ${provider} is coming soon!`);
      return null;
    default:
      toast.error('Unknown AI provider');
      return null;
  }
};

// Grade quiz based on the selected AI provider
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  const provider = getSelectedProvider();
  
  switch (provider) {
    case 'openai':
      return gradeOpenAIQuiz(questions, userAnswers);
    case 'gemini':
      return gradeQuizWithGemini(questions, userAnswers);
    case 'claude':
    case 'mistral':
      toast.error(`Integration with ${provider} is coming soon!`);
      return null;
    default:
      toast.error('Unknown AI provider');
      return null;
  }
};

// Check if the provider has a valid API key
export const hasValidApiKey = (): boolean => {
  const provider = getSelectedProvider();
  const apiKey = getApiKey(provider);
  return !!apiKey;
};

// Check if the provider supports file upload
export const providerSupportsFileUpload = (): boolean => {
  return supportsFileUpload();
};

// Process file based on AI provider capabilities
export const processFile = async (file: File): Promise<string> => {
  const provider = getSelectedProvider();
  
  if (supportsFileUpload(provider)) {
    // For providers that support direct file processing, we'll just extract the text
    // In a real app, we would handle direct file uploads to these providers
    return extractTextFromFile(file);
  } else {
    // For providers that don't support file upload, we extract the text locally
    return extractTextFromFile(file);
  }
};
