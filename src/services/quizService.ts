import { toast } from 'sonner';
import { QuizQuestion, GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

// Transform generated questions to our app format with improved reliability
export const transformQuizQuestions = (generatedQuiz: GeneratedQuiz) => {
  try {
    if (!generatedQuiz || !generatedQuiz.quiz || !Array.isArray(generatedQuiz.quiz)) {
      console.error('Invalid quiz format:', generatedQuiz);
      return [];
    }
    
    return generatedQuiz.quiz.map((q, index) => {
      // First check for English format fields
      if ((q.type === 'multiple_choice' || q.type === 'multiple-choice' || q.tipo === 'scelta_multipla')) {
        // Handle multiple choice questions
        const options = q.options || q.opzioni || [];
        let correctAnswer = q.correct_answer || q.risposta_corretta || '';
        // Convert boolean to string if needed
        if (typeof correctAnswer === 'boolean') {
          correctAnswer = correctAnswer.toString();
        }
        const correctIndex = Array.isArray(options) ? options.indexOf(correctAnswer) : 0;
        
        return {
          id: index,
          type: 'multiple-choice',
          question: q.question || q.domanda || '',
          options: options,
          correctAnswer: correctIndex >= 0 ? correctIndex : 0,
          explanation: q.explanation || q.spiegazione || ''
        };
      } else if ((q.type === 'true_false' || q.type === 'true-false' || q.tipo === 'vero_falso')) {
        // Handle true/false questions
        const correctAnswer = q.correct_answer || q.risposta_corretta || '';
        const isTrue = correctAnswer === 'True' || correctAnswer === 'Vero' || 
                       (typeof correctAnswer === 'boolean' && correctAnswer === true);
        
        return {
          id: index,
          type: 'true-false',
          question: q.question || q.domanda || '',
          options: ['True', 'False'],
          correctAnswer: isTrue ? 0 : 1,
          explanation: q.explanation || q.spiegazione || ''
        };
      } else {
        // Default to open-ended questions
        return {
          id: index,
          type: 'open-ended',
          question: q.question || q.domanda || '',
          correctAnswer: q.correct_answer || q.risposta_corretta || '',
          explanation: q.explanation || q.spiegazione || ''
        };
      }
    });
  } catch (error) {
    console.error('Error transforming quiz questions:', error);
    return [];
  }
};

// Generate quiz using Supabase Edge Function
export const generateQuiz = async (
  content: string,
  settings: QuizSettings,
  subjectId?: string,
  documentId?: string
): Promise<GeneratedQuiz | null> => {
  console.log(`Generating quiz with Gemini`);
  console.log(`Content type: ${typeof content}`);
  console.log(`Content length: ${content.length} characters`);
  console.log(`Selected question types:`, settings.questionTypes);
  
  if (!content || content.trim().length < 100) {
    toast.error('Please provide more detailed study material.');
    return null;
  }
  
  try {
    // If we have a document ID, check for previous quizzes to avoid duplicates
    let previousQuestions: string[] = [];
    
    if (subjectId && documentId) {
      console.log(`Checking for previous quizzes on document: ${documentId}`);
      
      // Get the current user's ID for the query
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        console.error('User ID is required but not found in session');
        return null;
      }
      
      // Query previous quizzes for this document and this user only
      const { data: previousQuizzes, error } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('document_id', documentId)
        .eq('subject_id', subjectId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching previous quizzes:', error);
      } else if (previousQuizzes && previousQuizzes.length > 0) {
        console.log(`Found ${previousQuizzes.length} previous quizzes for this document`);
        
        // Extract questions from previous quizzes
        previousQuizzes.forEach(quiz => {
          const questions = quiz.questions as QuizQuestion[];
          if (questions && Array.isArray(questions)) {
            questions.forEach(q => {
              if (q.question) {
                previousQuestions.push(q.question);
              }
            });
          }
        });
        
        console.log(`Extracted ${previousQuestions.length} previous questions`);
        
        // Update settings to indicate this is a repeat quiz
        settings.previousQuizzes = previousQuizzes.length;
      }
    }
    
    // Sanitize input content - ensure it's a string and doesn't have problematic characters
    const sanitizedContent = typeof content === 'string' 
      ? content.replace(/\u0000/g, '') // Remove null bytes
      : String(content);
    
    // Double check that content is proper
    if (!sanitizedContent || sanitizedContent.trim().length < 100) {
      toast.error('Please provide more detailed study material.');
      return null;
    }
    
    // Call the edge function for quiz generation with timeout handling
    console.log('Calling generate-quiz edge function with sanitized content');
    
    // Create a timeout promise
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    // Create the actual request promise
    const requestPromise = supabase.functions.invoke('generate-quiz', {
      body: {
        content: sanitizedContent,
        settings,
        previousQuestions: previousQuestions.length > 0 ? previousQuestions : undefined
      }
    });
    
    // Race the promises to implement a timeout
    const result = await Promise.race([requestPromise, timeoutPromise]) as any;
    
    // Check for errors
    if (!result) {
      console.error('Request timed out or returned null');
      toast.error('Request timed out. Please try again.');
      return null;
    }
    
    if (result.error) {
      console.error('Error calling generate-quiz function:', result.error);
      toast.error(`Error generating quiz: ${result.error.message || 'Unknown error'}`);
      return null;
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('Error from generate-quiz function:', error);
      toast.error(`Error generating quiz: ${error.message || 'Unknown error'}`);
      return null;
    }
    
    if (!data) {
      console.error('No data returned from generate-quiz function');
      toast.error('Failed to generate quiz. Please try again with more detailed content.');
      return null;
    }
    
    if (data.error) {
      console.error('Error returned from generate-quiz function:', data.error);
      toast.error(`Error generating quiz: ${data.error}`);
      return null;
    }
    
    if (!data.quiz || data.quiz.length === 0) {
      console.error('Failed to generate quiz: Empty or invalid response from API', data);
      toast.error('Could not create a quiz from this content. Please provide more detailed study material.');
      return null;
    }
    
    // Filter questions to match the selected question types
    if (settings.questionTypes && settings.questionTypes.length > 0) {
      const typeMapping = {
        'multiple-choice': ['multiple_choice', 'multiple-choice', 'scelta_multipla'],
        'true-false': ['true_false', 'true-false', 'vero_falso'],
        'open-ended': ['open_ended', 'open-ended', 'risposta_aperta']
      };
      
      // Only keep questions of the selected types
      const filteredQuiz = {
        ...data,
        quiz: data.quiz.filter(q => {
          // Get the question type, checking both .type and .tipo fields
          const questionType = q.type || q.tipo || '';
          
          // Check if this question type is in any of the selected categories
          return settings.questionTypes.some(selectedType => 
            typeMapping[selectedType].includes(questionType)
          );
        })
      };
      
      // If we filtered out all questions, use the original result
      if (filteredQuiz.quiz.length === 0) {
        console.warn('Filtering removed all questions, using original result');
        return data;
      }
      
      return filteredQuiz;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error(`Error generating quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Return a minimal valid quiz structure to avoid complete failure
    return {
      quiz: [
        {
          type: "multiple_choice",
          question: "Could not generate a complete quiz. Please try again with different content.",
          options: ["Try again", "Use different content", "Contact support"],
          correct_answer: "Try again",
          explanation: "There was an error generating this quiz."
        }
      ]
    };
  }
};

// Grade quiz using Supabase Edge Function
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  try {
    console.log('Starting quiz grading process...');
    console.log('Questions to grade:', questions);
    console.log('User answers to grade:', userAnswers);
    
    // Make sure we have valid data to send
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid questions data:', questions);
      toast.error('Invalid questions data. Please try again.');
      return null;
    }
    
    if (!userAnswers || !Array.isArray(userAnswers)) {
      console.error('Invalid user answers:', userAnswers);
      toast.error('Invalid user answers. Please try again.');
      return null;
    }
    
    // Ensure all questions have the required properties
    const validatedQuestions = questions.map(q => {
      // Make sure each question has the necessary properties
      return {
        id: q.id || 0,
        type: q.type || 'multiple-choice',
        question: q.question || 'Unknown question',
        options: q.options || [],
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : '',
        explanation: q.explanation || ''
      };
    });
    
    // Ensure all user answers are in the correct format
    // Replace null/undefined with empty strings for open-ended questions
    // or 0 for multiple-choice questions
    const validatedAnswers = userAnswers.map((answer, index) => {
      const questionType = validatedQuestions[index]?.type;
      
      if (answer === null || answer === undefined) {
        // Provide default values for null/undefined answers
        if (questionType === 'multiple-choice' || questionType === 'true-false') {
          return 0; // Default to first option for choice questions
        } else {
          return ''; // Empty string for open-ended
        }
      }
      
      // Convert to appropriate format based on question type
      if (questionType === 'multiple-choice' || questionType === 'true-false') {
        // For multiple choice, ensure we have a number
        return typeof answer === 'number' ? answer : 0;
      } else {
        // For open-ended, ensure we have a string
        return String(answer || '');
      }
    });
    
    console.log('Validated questions:', validatedQuestions);
    console.log('Validated answers:', validatedAnswers);
    
    try {
      // Call the edge function for quiz grading with increased timeout
      const { data, error } = await supabase.functions.invoke('grade-quiz', {
        body: {
          questions: validatedQuestions,
          userAnswers: validatedAnswers,
          provider: 'gemini'
        }
      });
      
      if (error) {
        console.error('Error calling grade-quiz function:', error);
        toast.error(`Error grading quiz: ${error.message}`);
        console.log('AI grading error, falling back to manual grading:', error);
        // Fall back to manual grading
        return createManualGradingResponse(validatedQuestions, validatedAnswers);
      }
      
      // Validate the quiz results
      if (!data || !data.risultati || !Array.isArray(data.risultati)) {
        console.error('Invalid quiz results format:', data);
        toast.error('Invalid quiz results returned by AI. Please try again.');
        return createManualGradingResponse(validatedQuestions, validatedAnswers);
      }
      
      console.log('Received quiz results:', data);
      return data;
    } catch (error) {
      console.error('Error grading quiz:', error);
      console.log('AI grading error, falling back to manual grading:', error);
      toast.error(`Error grading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fall back to manual grading
      return createManualGradingResponse(validatedQuestions, validatedAnswers);
    }
  } catch (error) {
    console.error('Error in gradeQuiz function:', error);
    toast.error(`Error grading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Manual grading when AI grading fails
function createManualGradingResponse(questions: any[], userAnswers: any[]): QuizResults {
  console.log('Using manual grading as fallback');
  
  const results = questions.map((question, index) => {
    const userAnswer = userAnswers[index] || '';
    let isCorrect = false;
    let score = 0;
    
    // Simple automated grading for multiple-choice and true-false
    if (question.type !== 'open-ended') {
      // For multiple-choice or true-false
      if (typeof userAnswer === 'number' && userAnswer === question.correctAnswer) {
        isCorrect = true;
        score = 1;
      }
    }
    
    return {
      domanda: question.question || `Question ${index + 1}`,
      risposta_utente: String(userAnswer),
      corretto: isCorrect,
      punteggio: score,
      spiegazione: isCorrect ? 
        "Your answer is correct." : 
        "The system couldn't evaluate this answer in detail, but it doesn't match the expected answer."
    };
  });
  
  // Calculate total score
  const totalPoints = results.reduce((sum, r) => sum + r.punteggio, 0);
  const maxPoints = questions.reduce((sum, q) => sum + (q.type === 'open-ended' ? 5 : 1), 0);
  
  return {
    risultati: results,
    punteggio_totale: maxPoints > 0 ? totalPoints / maxPoints : 0,
    total_points: totalPoints,
    max_points: maxPoints,
    feedback_generale: "Your quiz was graded using a basic evaluation method due to AI service issues."
  };
}

// XP levels data
export const xpLevels = [
  { name: 'Scholarly Kitten', minXP: 0, maxXP: 100 },
  { name: 'Curious Cat', minXP: 100, maxXP: 500 },
  { name: 'Clever Feline', minXP: 500, maxXP: 1000 },
  { name: 'Academic Tabby', minXP: 1000, maxXP: 2500 },
  { name: 'Wisdom Tiger', minXP: 2500, maxXP: 5000 }
];

// Get level based on XP
export const getLevelInfo = (xp: number) => {
  let currentLevel = xpLevels[0];
  let nextLevel = xpLevels[1];
  
  for (let i = 0; i < xpLevels.length; i++) {
    if (xp >= xpLevels[i].minXP) {
      currentLevel = xpLevels[i];
      nextLevel = xpLevels[i + 1] || xpLevels[i];
    } else {
      break;
    }
  }
  
  return {
    current: currentLevel,
    next: nextLevel
  };
};

// Always returns true since we're using backend-only Gemini
export const hasValidApiKey = (): boolean => {
  return true;
};

// Get the appropriate model to use based on provider
export const getDefaultModel = (): string => {
  return 'gemini-2-flash';
};

// Set the specific model to use
export const setModelToUse = (model: string): void => {
  localStorage.setItem('selected_model', model);
};

// Get the selected model 
export const getSelectedModel = (): string => {
  return 'gemini-2-flash';
};

// Save the most recently uploaded text for the current subject
export const saveRecentText = async (subjectId: string, textData: {
  name: string;
  content: string;
}): Promise<void> => {
  try {
    // Store text data keyed by subject ID and user ID
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id || 'anonymous';
    const textKey = `recent_text_${subjectId}_${userId}`;
    localStorage.setItem(textKey, JSON.stringify(textData));
    console.log(`Saved recent text for subject ${subjectId} and user ${userId}`);
  } catch (error) {
    console.error('Error saving recent text:', error);
  }
};

// Get the most recently uploaded text for the current subject
export const getRecentText = async (subjectId: string): Promise<{
  name: string;
  content: string;
} | null> => {
  try {
    // Get text data keyed by subject ID and user ID
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id || 'anonymous';
    const textKey = `recent_text_${subjectId}_${userId}`;
    const storedData = localStorage.getItem(textKey);
    
    if (!storedData) {
      return null;
    }
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving recent text:', error);
    return null;
  }
};
