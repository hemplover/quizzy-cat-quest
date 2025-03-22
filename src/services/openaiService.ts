
import { GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

// Stub functions that throw errors since we're only using Gemini now
export const generateQuiz = async (
  content: string,
  settings: QuizSettings
): Promise<GeneratedQuiz> => {
  throw new Error('OpenAI is not supported. Only Gemini is used.');
};

export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults> => {
  throw new Error('OpenAI is not supported. Only Gemini is used.');
};
