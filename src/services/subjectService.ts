
import { supabase } from '@/integrations/supabase/client';

// Define types for better type safety
export interface Subject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  quizzes?: any[];
  quizCount?: number;
  completedQuizCount?: number;
  averageScore?: number;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  subject_id: string;
  user_id: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: any[];
  settings: any;
  results: any;
  createdAt: string;
  subject_id: string;
  document_id?: string;
  user_id: string;
}

// Fetch all subjects for a user
export const fetchSubjects = async (): Promise<Subject[]> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return [];
    }

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }

    return subjects || [];
  } catch (error) {
    console.error('Error in fetchSubjects:', error);
    return [];
  }
};

// Alias for fetchSubjects to maintain backward compatibility
export const getSubjects = fetchSubjects;

// Create a new subject
export const createSubject = async (
  name: string,
  description: string | null = null,
  color: string | null = null,
  icon: string | null = null
): Promise<Subject | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return null;
    }

    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert([{ name, description, color, icon, user_id: userId }])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return null;
    }

    return newSubject;
  } catch (error) {
    console.error('Error in createSubject:', error);
    return null;
  }
};

// Update an existing subject
export const updateSubject = async (
  id: string,
  { name, description, color, icon }: Partial<Subject>
): Promise<Subject | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return null;
    }

    const { data: updatedSubject, error } = await supabase
      .from('subjects')
      .update({ name, description, color, icon })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating subject:', error);
      return null;
    }

    return updatedSubject;
  } catch (error) {
    console.error('Error in updateSubject:', error);
    return null;
  }
};

// Delete a subject
export const deleteSubject = async (id: string): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return false;
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting subject:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    return false;
  }
};

// Fetch a single subject by ID
export const fetchSubjectById = async (id: string): Promise<Subject | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return null;
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subject by ID:', error);
      return null;
    }

    return subject;
  } catch (error) {
    console.error('Error in fetchSubjectById:', error);
    return null;
  }
};

// Alias for fetchSubjectById to maintain backward compatibility
export const getSubjectById = fetchSubjectById;

// Fetch subjects with quiz counts
export const fetchSubjectsWithQuizCounts = async (): Promise<Subject[]> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return [];
    }

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select(`
        *,
        quizzes (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subjects with quiz counts:', error);
      return [];
    }

    return subjects.map(subject => ({
      ...subject,
      quizCount: subject.quizzes ? subject.quizzes.length : 0,
    })) || [];
  } catch (error) {
    console.error('Error in fetchSubjectsWithQuizCounts:', error);
    return [];
  }
};

// Create a new quiz for a subject
export const createQuiz = async (
  subjectId: string,
  title: string,
  questions: any[],
  settings: any
): Promise<string | null> => {
  try {
    console.log(`Creating new quiz for subject ${subjectId} with ${questions.length} questions`);
    
    // Get the current user's ID
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    
    if (!userId) {
      console.error('User ID is required but not found in session');
      throw new Error('User not authenticated');
    }
    
    // Prepare the quiz data
    const quizData = {
      title,
      subject_id: subjectId,
      user_id: userId,
      questions,
      settings,
      results: null, // Initialize with null, will be updated after grading
      created_at: new Date().toISOString()
    };
    
    console.log('Inserting quiz with data:', quizData);
    
    // Insert the quiz into the database
    const { data: insertedQuiz, error } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating quiz:', error);
      return null;
    }
    
    console.log('Quiz created successfully with ID:', insertedQuiz.id);
    
    // Store the quiz ID in session storage for reference during grading
    sessionStorage.setItem('currentQuizId', insertedQuiz.id);
    
    return insertedQuiz.id;
  } catch (error) {
    console.error('Error in createQuiz:', error);
    return null;
  }
};

// Fetch documents by subject ID
export const getDocumentsBySubjectId = async (subjectId: string): Promise<Document[]> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return [];
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return documents.map(doc => ({
      ...doc,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
    })) || [];
  } catch (error) {
    console.error('Error in getDocumentsBySubjectId:', error);
    return [];
  }
};

// Fetch quizzes by subject ID
export const getQuizzesBySubjectId = async (subjectId: string): Promise<Quiz[]> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return [];
    }

    console.log(`Fetching quizzes for subject ID: ${subjectId} and user ID: ${userId}`);

    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }

    console.log(`Quizzes fetched for subject ${subjectId}: ${quizzes.length}`);

    return quizzes.map(quiz => ({
      ...quiz,
      createdAt: quiz.created_at,
    })) || [];
  } catch (error) {
    console.error('Error in getQuizzesBySubjectId:', error);
    return [];
  }
};

// Delete a document
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return false;
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return false;
  }
};

// Fetch a document by ID
export const getDocumentById = async (documentId: string): Promise<Document | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      console.error('User ID is required but not found in session');
      return null;
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return {
      ...document,
      fileType: document.file_type,
      fileSize: document.file_size,
      uploadedAt: document.uploaded_at,
    };
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    return null;
  }
};

// Create a document
export const createDocument = async ({
  subjectId,
  name,
  content,
  fileType = 'text/plain',
  fileSize = 0
}: {
  subjectId: string;
  name: string;
  content: string;
  fileType?: string;
  fileSize?: number;
}): Promise<Document> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      throw new Error('User ID is required but not found in session');
    }

    const { data: newDocument, error } = await supabase
      .from('documents')
      .insert({
        subject_id: subjectId,
        name,
        content,
        file_type: fileType,
        file_size: fileSize,
        user_id: userId
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }

    return {
      ...newDocument,
      fileType: newDocument.file_type,
      fileSize: newDocument.file_size,
      uploadedAt: newDocument.uploaded_at,
    };
  } catch (error) {
    console.error('Error in createDocument:', error);
    throw error;
  }
};

// Initialize default subjects if needed
export const initializeSubjectsIfNeeded = async (): Promise<void> => {
  try {
    const subjects = await fetchSubjects();
    
    if (subjects.length === 0) {
      // Create a default subject if user has none
      await createSubject(
        'General Knowledge',
        'Default subject for general topics',
        '#4f46e5',
        '📚'
      );
    }
  } catch (error) {
    console.error('Error initializing subjects:', error);
  }
};

// Save quiz results
export const saveQuizResults = async (quizId: string, results: any): Promise<boolean> => {
  try {
    console.log(`Saving quiz results for quiz ID: ${quizId}`, results);
    
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    
    if (!userId) {
      console.error('User ID is required but not found in session');
      return false;
    }
    
    // If quizId is not provided, try to find the most recent quiz
    if (!quizId) {
      console.log('Quiz ID not provided, attempting to find most recent quiz');
      const { data: recentQuizzes, error: recentError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (recentError || !recentQuizzes || recentQuizzes.length === 0) {
        console.error('Could not find a recent quiz to save results to:', recentError);
        return false;
      }
      
      quizId = recentQuizzes[0].id;
      console.log(`Using most recent quiz ID for results: ${quizId}`);
    }
    
    // Ensure the results object has the required properties
    if (typeof results === 'string') {
      try {
        results = JSON.parse(results);
      } catch (e) {
        console.error('Failed to parse results JSON string:', e);
      }
    }
    
    // Ensure we have a properly formatted results object
    const formattedResults = {
      ...results,
      total_points: results.total_points || results.punteggio_totale || 0,
      max_points: results.max_points || results.punteggio_massimo || 1,
      timestamp: new Date().toISOString()
    };
    
    // Update the quiz with the results
    const { error } = await supabase
      .from('quizzes')
      .update({ results: formattedResults })
      .eq('id', quizId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error saving quiz results:', error);
      return false;
    }
    
    console.log(`Quiz results saved successfully for quiz ${quizId}`);
    return true;
  } catch (error) {
    console.error('Error in saveQuizResults:', error);
    return false;
  }
};
