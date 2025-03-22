import { GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

// Generate quiz with OpenAI - no longer used
export const generateQuiz = async (
  content: string,
  settings: QuizSettings
): Promise<GeneratedQuiz> => {
  throw new Error('OpenAI is not supported. Only Gemini is used.');
};

// Grade quiz with OpenAI - no longer used
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults> => {
  throw new Error('OpenAI is not supported. Only Gemini is used.');
};
