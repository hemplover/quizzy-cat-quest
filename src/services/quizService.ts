
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
    if (q.tipo === 'scelta_multipla' || q.tipo === 'multiple_choice') {
      return {
        id: index,
        type: 'multiple-choice',
        question: q.domanda || q.question,
        options: q.opzioni || q.options || [],
        correctAnswer: q.opzioni ? q.opzioni.indexOf(q.risposta_corretta) : 
                     (q.options ? q.options.indexOf(q.correct_answer) : 0),
        explanation: q.spiegazione || q.explanation || ''
      };
    } else if (q.tipo === 'vero_falso' || q.tipo === 'true_false') {
      return {
        id: index,
        type: 'true-false',
        question: q.domanda || q.question,
        options: ['True', 'False'],
        correctAnswer: (q.risposta_corretta === 'Vero' || q.correct_answer === 'True') ? 0 : 1,
        explanation: q.spiegazione || q.explanation || ''
      };
    } else {
      return {
        id: index,
        type: 'open-ended',
        question: q.domanda || q.question,
        correctAnswer: q.risposta_corretta || q.correct_answer || '',
        explanation: q.spiegazione || q.explanation || ''
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
  console.log(`Generating quiz with provider: ${provider}`);
  console.log(`Content type: ${typeof content}`);
  
  if (content instanceof File) {
    console.log(`File name: ${content.name}, type: ${content.type}, size: ${content.size} bytes`);
  }
  
  console.log(`Settings:`, settings);
  
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

// Set the specific model to use
export const setModelToUse = (model: string): void => {
  localStorage.setItem('selected_model', model);
};

// Get the selected model 
export const getSelectedModel = (): string => {
  const savedModel = localStorage.getItem('selected_model');
  if (!savedModel) {
    const defaultModel = getDefaultModel();
    localStorage.setItem('selected_model', defaultModel);
    return defaultModel;
  }
  return savedModel;
};
