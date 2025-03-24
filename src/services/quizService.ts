import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { updateUserXP, calculateQuizXP } from './experienceService';
import { updateQuizResults, createQuiz } from '@/services/subjectService';
import { getDefaultModel } from '@/services/aiProviderService';

let currentModel = localStorage.getItem('selectedModel') || getDefaultModel();

export const getSelectedModel = (): string => {
  return currentModel || getDefaultModel();
};

export const setModelToUse = (modelId: string): void => {
  currentModel = modelId;
  localStorage.setItem('selectedModel', modelId);
  console.log(`Model set to: ${modelId}`);
};

export const generateQuiz = async (
  content: string,
  settings: any,
  subjectId: string,
  documentId: string | null
): Promise<any> => {
  try {
    console.log('Generating quiz with settings:', settings);
    
    const previousQuestions = [];
    
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content,
        settings,
        previousQuestions
      }
    });
    
    if (error) {
      console.error('Error generating quiz:', error);
      toast.error(`Error generating quiz: ${error.message || 'Unknown error'}`);
      return null;
    }
    
    if (!data) {
      console.error('No data returned from quiz generation');
      toast.error('Quiz generation failed');
      return null;
    }
    
    console.log('Quiz generated successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    toast.error(`Error generating quiz: ${error.message || 'Unknown error'}`);
    return null;
  }
};

export const transformQuizQuestions = (generatedQuiz: any): any[] => {
  try {
    if (!generatedQuiz || !generatedQuiz.quiz || !Array.isArray(generatedQuiz.quiz)) {
      console.error('Invalid quiz format:', generatedQuiz);
      return [];
    }
    
    return generatedQuiz.quiz.map((q: any) => {
      let questionType = '';
      
      if (q.type === 'multiple_choice') {
        questionType = 'multiple-choice';
      } else if (q.type === 'true_false') {
        questionType = 'true-false';
      } else if (q.type === 'open_ended') {
        questionType = 'open-ended';
      } else {
        questionType = q.type;
      }
      
      const question: any = {
        type: questionType,
        question: q.question,
        explanation: q.explanation || ''
      };
      
      if (questionType === 'multiple-choice') {
        question.options = q.options || [];
        if (typeof q.correct_answer === 'number') {
          question.correctAnswer = q.correct_answer;
        } else if (typeof q.correct_answer === 'string') {
          const index = question.options.findIndex((opt: string) => 
            opt === q.correct_answer || 
            opt.charAt(0).toUpperCase() === q.correct_answer
          );
          question.correctAnswer = index >= 0 ? index : 0;
        } else {
          question.correctAnswer = 0;
        }
      } else if (questionType === 'true-false') {
        question.options = ['False', 'True'];
        if (typeof q.correct_answer === 'boolean') {
          question.correctAnswer = q.correct_answer ? 1 : 0;
        } else if (typeof q.correct_answer === 'string') {
          const answer = q.correct_answer.toLowerCase();
          question.correctAnswer = (answer === 'true' || answer === 't') ? 1 : 0;
        } else if (typeof q.correct_answer === 'number') {
          question.correctAnswer = q.correct_answer > 0 ? 1 : 0;
        } else {
          question.correctAnswer = 0;
        }
      } else if (questionType === 'open-ended') {
        question.correctAnswer = q.correct_answer || '';
      }
      
      return question;
    });
  } catch (error) {
    console.error('Error transforming quiz questions:', error);
    return [];
  }
};

export const saveQuizResults = async (quizId: string, results: any): Promise<boolean> => {
  try {
    console.log('Saving quiz results to Supabase:', { quizId, results });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('Cannot save quiz results: User not logged in');
      toast.error('You must be logged in to save quiz results');
      return false;
    }

    const updatedQuiz = await updateQuizResults(quizId, results);
    
    if (!updatedQuiz) {
      console.error('Failed to save quiz results to Supabase');
      toast.error('Failed to save your quiz results');
      return false;
    }
    
    console.log('Quiz results saved successfully to Supabase');
    
    await awardQuizXP(results);
    
    return true;
  } catch (error) {
    console.error('Error saving quiz results:', error);
    toast.error('Error saving quiz results');
    return false;
  }
};

const awardQuizXP = async (results: any): Promise<void> => {
  try {
    if (!results) return;
    
    let score = 0;
    
    if (typeof results.total_points === 'number' && typeof results.max_points === 'number' && results.max_points > 0) {
      score = results.total_points / results.max_points;
    } else if (typeof results.punteggio_totale === 'number') {
      score = results.punteggio_totale;
    } else if (results.risultati && Array.isArray(results.risultati)) {
      const totalPoints = results.risultati.reduce((sum: number, result: any) => {
        return sum + (typeof result.punteggio === 'number' ? result.punteggio : 0);
      }, 0);
      
      const maxPoints = results.risultati.length;
      
      if (maxPoints > 0) {
        score = totalPoints / maxPoints;
      }
    }
    
    score = Math.max(0, Math.min(1, score));
    console.log(`Calculated normalized score for XP award: ${score}`);
    
    const xpEarned = calculateQuizXP(score);
    console.log(`XP to be awarded: ${xpEarned}`);
    
    const result = await updateUserXP(xpEarned);
    
    if (result.leveledUp && result.newLevel) {
      toast.success(`Level Up! You are now ${result.newLevel}!`, {
        duration: 5000,
        icon: '🏆'
      });
    } else {
      toast.success(`You earned ${xpEarned} XP!`);
    }
  } catch (error) {
    console.error('Error awarding quiz XP:', error);
  }
};

export const gradeQuiz = async (
  questions: any[],
  userAnswers: any[],
  provider: 'openai' | 'gemini' | 'claude' | 'mistral' = 'gemini'
): Promise<any> => {
  try {
    console.log('Grading quiz:', { 
      questions: questions.length, 
      userAnswers: userAnswers.length, 
      provider 
    });
    
    const { data, error } = await supabase.functions.invoke('grade-quiz', {
      body: {
        questions,
        userAnswers,
        provider
      }
    });
    
    if (error) {
      console.error('Error grading quiz:', error);
      toast.error(`Error grading quiz: ${error.message || 'Unknown error'}`);
      return null;
    }
    
    if (!data) {
      console.error('No data returned from quiz grading');
      toast.error('Quiz grading failed');
      return null;
    }
    
    console.log('Quiz graded successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error grading quiz:', error);
    toast.error(`Error grading quiz: ${error.message || 'Unknown error'}`);
    return null;
  }
};

export const saveQuizToHistory = async (quiz: any): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error('Cannot save quiz history: User not logged in');
      return;
    }
    
    const historyKey = `quizHistory_${userId}`;
    
    const existingHistoryStr = localStorage.getItem(historyKey);
    let history = [];
    
    if (existingHistoryStr) {
      try {
        history = JSON.parse(existingHistoryStr);
      } catch (e) {
        console.error('Invalid quiz history format in localStorage');
        history = [];
      }
    }
    
    const quizWithTimestamp = {
      ...quiz,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(quizWithTimestamp);
    
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history));
    console.log('Quiz saved to history');
  } catch (error) {
    console.error('Error saving quiz to history:', error);
  }
};

export const getQuizHistory = async (): Promise<any[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error('Cannot get quiz history: User not logged in');
      return [];
    }
    
    const historyKey = `quizHistory_${userId}`;
    
    const existingHistoryStr = localStorage.getItem(historyKey);
    
    if (!existingHistoryStr) {
      return [];
    }
    
    try {
      const history = JSON.parse(existingHistoryStr);
      return Array.isArray(history) ? history : [];
    } catch (e) {
      console.error('Invalid quiz history format in localStorage');
      return [];
    }
  } catch (error) {
    console.error('Error getting quiz history:', error);
    return [];
  }
};

export const getRecentText = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log('No user ID available for getting recent text');
      return '';
    }
    
    const key = `recentText_${userId}`;
    return localStorage.getItem(key) || '';
  } catch (error) {
    console.error('Error getting recent text:', error);
    return '';
  }
};

export const saveRecentText = async (text: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.log('No user ID available for saving recent text');
      return;
    }
    
    const key = `recentText_${userId}`;
    localStorage.setItem(key, text);
  } catch (error) {
    console.error('Error saving recent text:', error);
  }
};

export const createNewQuizFromQuestions = async (
  title: string,
  subjectId: string,
  documentId: string | null,
  questions: any[],
  settings: any = {}
): Promise<string | null> => {
  try {
    console.log('Creating new quiz from questions:', {
      title,
      subjectId,
      documentId,
      questionCount: questions.length
    });
    
    const newQuiz = await createQuiz({
      title,
      subjectId,
      documentId,
      questions,
      settings
    });
    
    if (!newQuiz || !newQuiz.id) {
      console.error('Failed to create quiz');
      toast.error('Failed to create quiz');
      return null;
    }
    
    console.log('Quiz created successfully with ID:', newQuiz.id);
    toast.success('Quiz created successfully!');
    
    return newQuiz.id;
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    toast.error(`Error creating quiz: ${error.message || 'Unknown error'}`);
    return null;
  }
};

export const validateQuiz = (quiz: any): boolean => {
  if (!quiz) return false;
  
  if (!quiz.id || !quiz.title || !quiz.subjectId) {
    console.error('Quiz missing required properties:', quiz);
    return false;
  }
  
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    console.error('Quiz has no questions or questions is not an array:', quiz);
    return false;
  }
  
  for (const question of quiz.questions) {
    if (!question.question) {
      console.error('Question missing text:', question);
      return false;
    }
    
    if (question.type === 'multiple-choice') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        console.error('Multiple-choice question has invalid options:', question);
        return false;
      }
      if (typeof question.correctAnswer !== 'number') {
        console.error('Multiple-choice question has invalid correctAnswer:', question);
        return false;
      }
    } else if (question.type === 'true-false') {
      if (typeof question.correctAnswer !== 'number' || (question.correctAnswer !== 0 && question.correctAnswer !== 1)) {
        console.error('True-false question has invalid correctAnswer:', question);
        return false;
      }
    } else if (question.type === 'open-ended') {
      if (!question.correctAnswer) {
        console.error('Open-ended question has no correctAnswer:', question);
        return false;
      }
    } else {
      console.error('Question has invalid type:', question);
      return false;
    }
  }
  
  return true;
};
