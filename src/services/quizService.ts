
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
  content: string | File,
  settings: QuizSettings
): Promise<GeneratedQuiz | null> => {
  const provider = getSelectedProvider();
  console.log(`Generating quiz with provider: ${provider}`);
  console.log(`Content type: ${typeof content}`);
  console.log(`Selected question types:`, settings.questionTypes);
  
  if (content instanceof File) {
    console.log(`File name: ${content.name}, type: ${content.type}, size: ${content.size} bytes`);
  }
  
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

// Check if the provider supports file upload
export const providerSupportsFileUpload = (provider?: AIProvider): boolean => {
  return supportsFileUpload(provider || getSelectedProvider());
};

// Process file based on AI provider capabilities
export const processFile = async (file: File): Promise<string | File> => {
  const provider = getSelectedProvider();
  
  try {
    console.log(`Processing file for ${provider}...`);
    
    if (supportsFileUpload(provider)) {
      // For providers that support direct file uploads, return the file directly
      console.log(`Provider ${provider} supports direct file upload, passing file through`);
      return file;
    } else {
      // For providers that don't support file upload, extract the text locally
      console.log(`Provider ${provider} doesn't support direct file upload, extracting text`);
      const extractedText = await extractTextFromFile(file);
      console.log(`Extracted text length: ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    toast.error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
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

// Save the most recently uploaded file for the current subject
export const saveRecentFile = (subjectId: string, fileData: {
  name: string;
  type: string;
  content: string | ArrayBuffer;
}): void => {
  try {
    // Store file data keyed by subject ID
    const fileKey = `recent_file_${subjectId}`;
    localStorage.setItem(fileKey, JSON.stringify(fileData));
    console.log(`Saved recent file for subject ${subjectId}`);
  } catch (error) {
    console.error('Error saving recent file:', error);
  }
};

// Get the most recently uploaded file for the current subject
export const getRecentFile = (subjectId: string): {
  name: string;
  type: string;
  content: string | ArrayBuffer;
} | null => {
  try {
    const fileKey = `recent_file_${subjectId}`;
    const storedData = localStorage.getItem(fileKey);
    
    if (!storedData) {
      return null;
    }
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving recent file:', error);
    return null;
  }
};
