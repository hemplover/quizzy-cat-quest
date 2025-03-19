import { toast } from 'sonner';
import { 
  AIProvider, 
  getSelectedProvider, 
  getApiKey,
  supportsFileUpload,
  getDefaultModel
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
import { QuizQuestion, GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

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
export const generateQuiz = async (
  content: string | File,
  settings: QuizSettings
): Promise<GeneratedQuiz | null> => {
  const provider = getSelectedProvider();
  
  switch (provider) {
    case 'openai':
      return generateOpenAIQuiz(content, settings);
    case 'gemini':
      return generateQuizWithGemini(content, settings);
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

// Process file based on AI provider capabilities - now returns the file directly 
// if the provider supports direct file upload
export const processFile = async (file: File): Promise<string | File> => {
  const provider = getSelectedProvider();
  
  if (supportsFileUpload(provider)) {
    // For providers that support direct file uploads, return the file directly
    console.log(`Provider ${provider} supports direct file upload, passing file through`);
    return file;
  } else {
    // For providers that don't support file upload, extract the text locally
    console.log(`Provider ${provider} doesn't support direct file upload, extracting text`);
    return extractTextFromFile(file);
  }
};

// Get the appropriate model to use based on provider
export const getModelToUse = (): string => {
  return getDefaultModel();
};
