import { toast } from 'sonner';
import { 
  AIProvider, 
  getSelectedProvider, 
  getApiKey,
  getDefaultModel
} from './aiProviderService';
import { 
  generateQuiz as generateOpenAIQuiz,
  gradeQuiz as gradeOpenAIQuiz 
} from './openaiService';
import {
  generateQuizWithGemini,
  gradeQuizWithGemini
} from './geminiService';
import { QuizQuestion, GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

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

// Generate quiz based on the selected AI provider with improved filtering by question type
export const generateQuiz = async (
  content: string,
  settings: QuizSettings
): Promise<GeneratedQuiz | null> => {
  const provider = getSelectedProvider();
  console.log(`Generating quiz with provider: ${provider}`);
  console.log(`Content type: ${typeof content}`);
  console.log(`Selected question types:`, settings.questionTypes);
  
  try {
    let result = null;
    
    switch (provider) {
      case 'openai':
        result = await generateOpenAIQuiz(content, settings);
        break;
      case 'gemini':
        result = await generateQuizWithGemini(content, settings);
        break;
      case 'claude':
      case 'mistral':
        toast.error(`Integration with ${provider} is coming soon!`);
        return null;
      default:
        toast.error('Unknown AI provider');
        return null;
    }
    
    if (!result || !result.quiz || result.quiz.length === 0) {
      console.error('Failed to generate quiz: Empty or invalid response from API');
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
        ...result,
        quiz: result.quiz.filter(q => {
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
        return result;
      }
      
      return filteredQuiz;
    }
    
    return result;
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error(`Error generating quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Grade quiz based on the selected AI provider
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  const provider = getSelectedProvider();
  
  try {
    let result: QuizResults | null = null;
    
    switch (provider) {
      case 'openai':
        result = await gradeOpenAIQuiz(questions, userAnswers);
        break;
      case 'gemini':
        result = await gradeQuizWithGemini(questions, userAnswers);
        break;
      case 'claude':
      case 'mistral':
        toast.error(`Integration with ${provider} is coming soon!`);
        return null;
      default:
        toast.error('Unknown AI provider');
        return null;
    }
    
    // Validate the quiz results
    if (!result || !result.risultati || !Array.isArray(result.risultati)) {
      console.error('Invalid quiz results format:', result);
      toast.error('Invalid quiz results returned by AI. Please try again.');
      return null;
    }
    
    // Make sure we have the same number of results as questions
    if (result.risultati.length !== questions.length) {
      console.warn(`Result count mismatch: ${result.risultati.length} results for ${questions.length} questions`);
      
      // Pad or truncate results to match question count
      if (result.risultati.length < questions.length) {
        // Pad with dummy results if we have too few
        const padding = Array(questions.length - result.risultati.length).fill(0).map((_, i) => ({
          domanda: questions[result.risultati.length + i].question,
          risposta_utente: String(userAnswers[result.risultati.length + i]),
          corretto: false,
          punteggio: 0,
          spiegazione: 'Answer could not be evaluated'
        }));
        
        result.risultati = [...result.risultati, ...padding];
      } else {
        // Truncate if we have too many
        result.risultati = result.risultati.slice(0, questions.length);
      }
      
      // Recalculate total score
      const totalScore = result.risultati.reduce((sum, r) => sum + (r.punteggio || 0), 0) / questions.length;
      result.punteggio_totale = totalScore;
    }
    
    return result;
  } catch (error) {
    console.error('Error grading quiz:', error);
    toast.error(`Error grading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Check if the provider has a valid API key
export const hasValidApiKey = (): boolean => {
  const provider = getSelectedProvider();
  const apiKey = getApiKey(provider);
  return !!apiKey;
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
