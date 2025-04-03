import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, QuizSettings } from '@/types/quiz';

// Import sanitizeTextForDatabase from subjectService
import { sanitizeTextForDatabase } from './subjectService';

export interface GeneratedQuiz {
  quiz: any[];
}

export const generateQuiz = async (
  content: string, 
  settings: QuizSettings, 
  subjectId: string,
  documentId?: string
): Promise<GeneratedQuiz | null> => {
  try {
    const maxContentLength = 20000;
    
    // Truncate content if necessary
    let truncatedContent = content;
    if (content.length > maxContentLength) {
      console.log(`Content is too long (${content.length} chars), truncating to ${maxContentLength}`);
      truncatedContent = content.substring(0, maxContentLength);
    }
    
    // Sanitize content
    const sanitizedContent = sanitizeTextForDatabase(truncatedContent);
    console.log(`Sanitized content for quiz generation, length: ${sanitizedContent.length}`);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        content: sanitizedContent,
        settings: {
          ...settings,
          subjectId,
          documentId
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error generating quiz:', errorText);
      throw new Error(`Error generating quiz: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in quiz generation:', error);
    return null;
  }
}; 