
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
      
      // Query previous quizzes for this document
      const { data: previousQuizzes, error } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('document_id', documentId)
        .eq('subject_id', subjectId);
      
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
    
    // Call the edge function for quiz generation
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content,
        settings,
        previousQuestions: previousQuestions.length > 0 ? previousQuestions : undefined
      }
    });
    
    if (error) {
      console.error('Error calling generate-quiz function:', error);
      toast.error(`Error generating quiz: ${error.message}`);
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
    return null;
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
    
    // Call the edge function for quiz grading
    const { data, error } = await supabase.functions.invoke('grade-quiz', {
      body: {
        questions,
        userAnswers,
        provider: 'gemini'
      }
    });
    
    if (error) {
      console.error('Error calling grade-quiz function:', error);
      toast.error(`Error grading quiz: ${error.message}`);
      return null;
    }
    
    // Validate the quiz results
    if (!data || !data.risultati || !Array.isArray(data.risultati)) {
      console.error('Invalid quiz results format:', data);
      toast.error('Invalid quiz results returned by AI. Please try again.');
      return null;
    }
    
    console.log('Received quiz results:', data);
    
    // Make sure we have the same number of results as questions
    if (data.risultati.length !== questions.length) {
      console.warn(`Result count mismatch: ${data.risultati.length} results for ${questions.length} questions`);
      
      // Pad or truncate results to match question count
      if (data.risultati.length < questions.length) {
        // Pad with dummy results if we have too few
        const padding = Array(questions.length - data.risultati.length).fill(0).map((_, i) => ({
          domanda: questions[data.risultati.length + i].question,
          risposta_utente: String(userAnswers[data.risultati.length + i]),
          corretto: false,
          punteggio: 0,
          spiegazione: 'Answer could not be evaluated'
        }));
        
        data.risultati = [...data.risultati, ...padding];
      } else {
        // Truncate if we have too many
        data.risultati = data.risultati.slice(0, questions.length);
      }
    }
    
    // Double-check that total_points and max_points are properly calculated
    if (data.total_points === undefined || data.max_points === undefined) {
      console.log('Calculating total_points and max_points...');
      
      let totalPoints = 0;
      let maxPoints = 0;
      
      data.risultati.forEach((result, index) => {
        const question = questions[index];
        const pointValue = question.type === 'open-ended' ? 5 : 1;
        
        maxPoints += pointValue;
        totalPoints += result.punteggio;
        
        console.log(`Question ${index+1} (${question.type}): ${result.punteggio}/${pointValue} points`);
      });
      
      data.total_points = totalPoints;
      data.max_points = maxPoints;
      
      // Recalculate total score as a ratio
      data.punteggio_totale = maxPoints > 0 ? totalPoints / maxPoints : 0;
      
      console.log(`Total score: ${totalPoints}/${maxPoints} (${data.punteggio_totale.toFixed(2)})`);
    }
    
    return data;
  } catch (error) {
    console.error('Error grading quiz:', error);
    toast.error(`Error grading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
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
export const saveRecentText = (subjectId: string, textData: {
  name: string;
  content: string;
}): void => {
  try {
    // Store text data keyed by subject ID
    const textKey = `recent_text_${subjectId}`;
    localStorage.setItem(textKey, JSON.stringify(textData));
    console.log(`Saved recent text for subject ${subjectId}`);
  } catch (error) {
    console.error('Error saving recent text:', error);
  }
};

// Get the most recently uploaded text for the current subject
export const getRecentText = (subjectId: string): {
  name: string;
  content: string;
} | null => {
  try {
    const textKey = `recent_text_${subjectId}`;
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
