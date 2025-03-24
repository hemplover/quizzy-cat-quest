
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
    
    if (data.quiz && Array.isArray(data.quiz)) {
      if (settings.questionTypes && settings.questionTypes.length > 0) {
        const allowedTypes = new Set(settings.questionTypes.map(type => {
          if (type === 'multiple-choice') return 'multiple_choice';
          if (type === 'true-false') return 'true_false';
          if (type === 'open-ended') return 'open_ended';
          return type;
        }));
        
        const hasIncorrectTypes = data.quiz.some(q => !allowedTypes.has(q.type));
        
        if (hasIncorrectTypes) {
          console.error('Quiz contains question types not requested by user:', 
            data.quiz.map(q => q.type));
          toast.error('The generated quiz contains incorrect question types. Please try again.');
          return null;
        }
      }
      
      if (data.quiz.length !== settings.numQuestions) {
        console.warn(`Quiz contains ${data.quiz.length} questions, but ${settings.numQuestions} were requested.`);
      }
      
      // Ensure each question has an ID
      data.quiz = data.quiz.map((q, index) => ({
        ...q,
        id: index + 1
      }));
    }
    
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
    
    return generatedQuiz.quiz.map((q: any, index: number) => {
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
        id: q.id || index + 1,
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
        question.options = ['True', 'False'];
        if (typeof q.correct_answer === 'boolean') {
          question.correctAnswer = q.correct_answer ? 0 : 1;
        } else if (typeof q.correct_answer === 'string') {
          const answer = q.correct_answer.toLowerCase();
          question.correctAnswer = (answer === 'true' || answer === 't') ? 0 : 1;
        } else if (typeof q.correct_answer === 'number') {
          question.correctAnswer = q.correct_answer > 0 ? 0 : 1;
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
    
    const processedAnswers = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      let answer = null;
      
      const userAnswerObj = userAnswers.find(a => a.questionId === question.id);
      
      if (userAnswerObj) {
        answer = userAnswerObj.userAnswer;
      } else if (i < userAnswers.length) {
        answer = typeof userAnswers[i] === 'object' ? userAnswers[i].userAnswer : userAnswers[i];
      }
      
      processedAnswers.push(answer);
    }
    
    console.log('Grading quiz with processed answers:', processedAnswers);
    
    try {
      const { data, error } = await supabase.functions.invoke('grade-quiz', {
        body: {
          questions,
          userAnswers: processedAnswers,
          provider
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Unknown error grading quiz');
      }
      
      if (!data) {
        throw new Error('No data returned from quiz grading');
      }
      
      if (!data.risultati || !Array.isArray(data.risultati)) {
        throw new Error('Invalid quiz results format');
      }
      
      // Validate and fix results if needed
      const validatedResults = validateAndFixResults(data, questions, processedAnswers);
      
      console.log('Quiz graded successfully:', validatedResults);
      return validatedResults;
    } catch (aiError) {
      console.error('AI grading error, falling back to manual grading:', aiError);
      // Fallback to manual grading
      return manualGrading(questions, processedAnswers);
    }
  } catch (error: any) {
    console.error('Error grading quiz:', error);
    toast.error(`Error grading quiz: ${error.message || 'Unknown error'}`);
    return null;
  }
};

const validateAndFixResults = (data: any, questions: any[], userAnswers: any[]): any => {
  // Initialize the structure if it doesn't exist
  if (!data.risultati || !Array.isArray(data.risultati)) {
    data.risultati = [];
  }
  
  // Ensure we have results for each question
  if (data.risultati.length < questions.length) {
    console.warn(`AI grading returned fewer results (${data.risultati.length}) than questions (${questions.length}). Adding missing results.`);
    for (let i = data.risultati.length; i < questions.length; i++) {
      data.risultati.push({
        domanda: questions[i].question,
        risposta_utente: userAnswers[i],
        corretto: false,
        punteggio: 0,
        spiegazione: "Result was not provided by grading service"
      });
    }
  }
  
  // Calculate points properly for each question
  let totalPoints = 0;
  let maxPoints = 0;
  
  data.risultati.forEach((result: any, index: number) => {
    const question = questions[index];
    if (!question) return;
    
    const pointValue = question.type === 'open-ended' ? 5 : 1;
    maxPoints += pointValue;
    
    // Fix issues with result format
    if (result.domanda === undefined && question.question) {
      result.domanda = question.question;
    }
    
    if (result.risposta_utente === undefined && userAnswers[index] !== undefined) {
      result.risposta_utente = userAnswers[index];
    }
    
    // Validate and fix scores
    if (question.type === 'open-ended') {
      // For open-ended, ensure score is between 0-5
      if (typeof result.punteggio !== 'number' || result.punteggio < 0 || result.punteggio > 5) {
        console.warn(`Invalid score for open-ended question: ${result.punteggio}, fixing...`);
        result.punteggio = Math.min(5, Math.max(0, Math.round(result.punteggio || 0)));
      }
    } else {
      // For multiple-choice and true-false, scores should be either 0 or 1
      if (typeof result.punteggio !== 'number' || (result.punteggio !== 0 && result.punteggio !== 1)) {
        console.warn(`Invalid score for ${question.type} question: ${result.punteggio}, fixing...`);
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const userAnswer = userAnswers[index];
          const correctAnswer = question.correctAnswer;
          result.punteggio = userAnswer === correctAnswer ? 1 : 0;
          result.corretto = userAnswer === correctAnswer;
        } else {
          result.punteggio = 0;
          result.corretto = false;
        }
      }
    }
    
    // Ensure explanation exists
    if (!result.spiegazione) {
      result.spiegazione = question.explanation || 'No explanation provided';
    }
    
    totalPoints += result.punteggio;
  });
  
  // Update total points and max points
  data.total_points = totalPoints;
  data.max_points = maxPoints;
  
  // If punteggio_totale isn't set, calculate it as normalized score (0-1)
  if (typeof data.punteggio_totale !== 'number' && maxPoints > 0) {
    data.punteggio_totale = totalPoints / maxPoints;
  }
  
  // Ensure feedback exists
  if (!data.feedback_generale) {
    const scorePercentage = Math.round((totalPoints / maxPoints) * 100);
    let feedbackMessage = '';
    
    if (scorePercentage >= 80) {
      feedbackMessage = 'Excellent work! You demonstrated a strong understanding of the material.';
    } else if (scorePercentage >= 60) {
      feedbackMessage = 'Good job! You have a good grasp of most concepts, but there\'s still room for improvement.';
    } else if (scorePercentage >= 40) {
      feedbackMessage = 'You\'re making progress, but you should review the material more thoroughly to strengthen your understanding.';
    } else {
      feedbackMessage = 'This topic seems challenging for you. Consider revisiting the material and trying again.';
    }
    
    data.feedback_generale = feedbackMessage;
  }
  
  return data;
};

const manualGrading = (questions: any[], userAnswers: any[]): any => {
  console.log('Using manual grading as fallback');
  
  const results = {
    risultati: [],
    total_points: 0,
    max_points: 0,
    punteggio_totale: 0,
    feedback_generale: ''
  };
  
  let totalPoints = 0;
  let maxPoints = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const pointValue = question.type === 'open-ended' ? 5 : 1;
    maxPoints += pointValue;
    
    let isCorrect = false;
    let points = 0;
    let explanation = '';
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      isCorrect = userAnswer === question.correctAnswer;
      points = isCorrect ? 1 : 0;
      explanation = question.explanation || (isCorrect ? 
        'Your answer is correct.' : 
        `The correct answer is: ${question.options[question.correctAnswer]}`);
    } else if (question.type === 'open-ended') {
      // For open-ended, we give partial credit of 2 out of 5 without AI grading
      points = 2;
      isCorrect = false; // Change from 'Partially' string to a boolean to match the type
      explanation = 'We were unable to fully assess your answer. Please review the correct answer.';
    }
    
    results.risultati.push({
      domanda: question.question,
      risposta_utente: userAnswer,
      corretto: isCorrect,
      punteggio: points,
      spiegazione: explanation
    });
    
    totalPoints += points;
  });
  
  results.total_points = totalPoints;
  results.max_points = maxPoints;
  results.punteggio_totale = maxPoints > 0 ? totalPoints / maxPoints : 0;
  
  // Generate overall feedback
  const scorePercentage = Math.round((totalPoints / maxPoints) * 100);
  
  if (scorePercentage >= 80) {
    results.feedback_generale = 'Excellent work! You demonstrated a strong understanding of the material.';
  } else if (scorePercentage >= 60) {
    results.feedback_generale = 'Good job! You have a good grasp of most concepts, but there\'s still room for improvement.';
  } else if (scorePercentage >= 40) {
    results.feedback_generale = 'You\'re making progress, but you should review the material more thoroughly to strengthen your understanding.';
  } else {
    results.feedback_generale = 'This topic seems challenging for you. Consider revisiting the material and trying again.';
  }
  
  return results;
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
    
    // Ensure all questions have an ID
    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: q.id || index + 1
    }));
    
    const newQuiz = await createQuiz({
      title,
      subjectId,
      documentId,
      questions: questionsWithIds,
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
    
    if (!question.id) {
      console.error('Question missing ID:', question);
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
