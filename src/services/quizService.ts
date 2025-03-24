
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { updateUserXP, calculateQuizXP } from './experienceService';
import { updateQuizResults, createQuiz } from '@/services/subjectService';

// Save quiz results to Supabase
export const saveQuizResults = async (quizId: string, results: any): Promise<boolean> => {
  try {
    console.log('Saving quiz results to Supabase:', { quizId, results });
    
    // First make sure we have a user ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error('Cannot save quiz results: User not logged in');
      toast.error('You must be logged in to save quiz results');
      return false;
    }

    // Save to Supabase
    const updatedQuiz = await updateQuizResults(quizId, results);
    
    if (!updatedQuiz) {
      console.error('Failed to save quiz results to Supabase');
      toast.error('Failed to save your quiz results');
      return false;
    }
    
    console.log('Quiz results saved successfully to Supabase');
    
    // Calculate and award XP
    await awardQuizXP(results);
    
    return true;
  } catch (error) {
    console.error('Error saving quiz results:', error);
    toast.error('Error saving quiz results');
    return false;
  }
};

// Award XP for completing a quiz
const awardQuizXP = async (results: any): Promise<void> => {
  try {
    // Ensure we have valid results with a score
    if (!results) return;
    
    let score = 0;
    
    // First try with the new format (total_points / max_points)
    if (typeof results.total_points === 'number' && typeof results.max_points === 'number' && results.max_points > 0) {
      score = results.total_points / results.max_points;
    }
    // Then try with legacy format (punteggio_totale as a percentage 0-1)
    else if (typeof results.punteggio_totale === 'number') {
      score = results.punteggio_totale;
    }
    // Finally try to calculate from risultati if available
    else if (results.risultati && Array.isArray(results.risultati)) {
      const totalPoints = results.risultati.reduce((sum: number, result: any) => {
        return sum + (typeof result.punteggio === 'number' ? result.punteggio : 0);
      }, 0);
      
      const maxPoints = results.risultati.length;
      
      if (maxPoints > 0) {
        score = totalPoints / maxPoints;
      }
    }
    
    // Normalize score to 0-1 range
    score = Math.max(0, Math.min(1, score));
    console.log(`Calculated normalized score for XP award: ${score}`);
    
    // Calculate XP based on performance
    const xpEarned = calculateQuizXP(score);
    console.log(`XP to be awarded: ${xpEarned}`);
    
    // Update user XP
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

// Generate a quiz using the grade-quiz Supabase edge function
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
    
    // Call Supabase Edge Function
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

// Save a quiz to localStorage for a logged in user
export const saveQuizToHistory = async (quiz: any): Promise<void> => {
  try {
    // First make sure we have a user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error('Cannot save quiz history: User not logged in');
      return;
    }
    
    const historyKey = `quizHistory_${userId}`;
    
    // Get existing history
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
    
    // Add new quiz to history
    const quizWithTimestamp = {
      ...quiz,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(quizWithTimestamp);
    
    // Limit history size (optional)
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Save back to localStorage
    localStorage.setItem(historyKey, JSON.stringify(history));
    console.log('Quiz saved to history');
  } catch (error) {
    console.error('Error saving quiz to history:', error);
  }
};

// Get recent quizzes history
export const getQuizHistory = async (): Promise<any[]> => {
  try {
    // First make sure we have a user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error('Cannot get quiz history: User not logged in');
      return [];
    }
    
    const historyKey = `quizHistory_${userId}`;
    
    // Get existing history
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

// Get most recent text used for generating quizzes
export const getRecentText = async (): Promise<string> => {
  try {
    // First make sure we have a user ID
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

// Save most recent text used for generating quizzes
export const saveRecentText = async (text: string): Promise<void> => {
  try {
    // First make sure we have a user ID
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

// Helper to create a new quiz directly from generated questions
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
    
    // Create quiz in Supabase
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

// Function to deep validate a quiz object to ensure it has all required properties
export const validateQuiz = (quiz: any): boolean => {
  if (!quiz) return false;
  
  // Check required top-level properties
  if (!quiz.id || !quiz.title || !quiz.subjectId) {
    console.error('Quiz missing required properties:', quiz);
    return false;
  }
  
  // Check that questions is an array
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    console.error('Quiz has no questions or questions is not an array:', quiz);
    return false;
  }
  
  // Validate each question
  for (const question of quiz.questions) {
    if (!question.question) {
      console.error('Question missing text:', question);
      return false;
    }
    
    // Validate by question type
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
