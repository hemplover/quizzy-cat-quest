import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Document {
  id: string;
  subjectId: string;
  name: string;
  content: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  documentId: string | null;
  title: string;
  questions: any[];
  createdAt: string;
  settings?: any;
  results?: any;
  userId: string;
}

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    console.error('No user ID found, user might not be logged in');
    return null;
  }
  return session.user.id;
}

// Get all subjects
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return [];
    }

    console.log('Fetching subjects for user ID:', userId);

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting subjects:', error);
      toast.error('Failed to load subjects');
      return [];
    }
    
    console.log('Subjects fetched for user:', data.length);
    
    // Transform to match our interface
    return data.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      icon: subject.icon || '📚',
      color: subject.color || '#4f46e5',
      createdAt: subject.created_at,
      updatedAt: subject.updated_at,
      userId: subject.user_id
    }));
  } catch (error) {
    console.error('Error getting subjects:', error);
    toast.error('Failed to load subjects');
    return [];
  }
};

// Get a subject by ID
export const getSubjectById = async (id: string): Promise<Subject | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return null;
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error getting subject:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || '📚',
      color: data.color || '#4f46e5',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error getting subject:', error);
    return null;
  }
};

// Create a new subject
export const createSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Subject> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
        color: subject.color,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
      throw error;
    }
    
    toast.success(`Subject ${subject.name} created successfully`);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || '📚',
      color: data.color || '#4f46e5',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error creating subject:', error);
    toast.error('Failed to create subject');
    throw error;
  }
};

// Update a subject
export const updateSubject = async (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Subject | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subjects')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
      return null;
    }
    
    toast.success(`Subject ${data.name} updated successfully`);
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || '📚',
      color: data.color || '#4f46e5',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error updating subject:', error);
    toast.error('Failed to update subject');
    return null;
  }
};

// Delete a subject
export const deleteSubject = async (id: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
      return false;
    }
    
    toast.success('Subject deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting subject:', error);
    toast.error('Failed to delete subject');
    return false;
  }
};

// Get all documents
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return [];
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Error getting documents:', error);
      return [];
    }
    
    return data.map(doc => ({
      id: doc.id,
      subjectId: doc.subject_id,
      name: doc.name,
      content: doc.content,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      userId: doc.user_id
    }));
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
};

// Get documents by subject ID
export const getDocumentsBySubjectId = async (subjectId: string): Promise<Document[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return [];
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Error getting documents by subject ID:', error);
      return [];
    }
    
    return data.map(doc => ({
      id: doc.id,
      subjectId: doc.subject_id,
      name: doc.name,
      content: doc.content,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      userId: doc.user_id
    }));
  } catch (error) {
    console.error('Error getting documents by subject ID:', error);
    return [];
  }
};

// Get a document by ID
export const getDocumentById = async (id: string): Promise<Document | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return null;
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error getting document:', error);
      return null;
    }
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      name: data.name,
      content: data.content,
      fileType: data.file_type,
      fileSize: data.file_size,
      uploadedAt: data.uploaded_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

// Create a new document
export const createDocument = async (document: Omit<Document, 'id' | 'uploadedAt' | 'userId'>): Promise<Document> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        subject_id: document.subjectId,
        name: document.name,
        content: document.content,
        file_type: document.fileType,
        file_size: document.fileSize,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document:', error);
      throw error;
    }
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      name: data.name,
      content: data.content,
      fileType: data.file_type,
      fileSize: data.file_size,
      uploadedAt: data.uploaded_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

// Get all quizzes
export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return [];
    }

    console.log('Fetching quizzes for user ID:', userId);

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting quizzes:', error);
      return [];
    }
    
    console.log('Quizzes fetched for user:', data.length);
    
    return data.map(quiz => ({
      id: quiz.id,
      subjectId: quiz.subject_id,
      documentId: quiz.document_id,
      title: quiz.title,
      questions: Array.isArray(quiz.questions) ? quiz.questions : JSON.parse(quiz.questions as string),
      settings: quiz.settings,
      results: quiz.results,
      createdAt: quiz.created_at,
      userId: quiz.user_id
    }));
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return [];
  }
};

// Get quizzes by subject ID
export const getQuizzesBySubjectId = async (subjectId: string): Promise<Quiz[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return [];
    }

    console.log(`Fetching quizzes for subject ID: ${subjectId} and user ID: ${userId}`);

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting quizzes by subject ID:', error);
      return [];
    }
    
    console.log(`Quizzes fetched for subject ${subjectId}:`, data.length);
    
    return data.map(quiz => ({
      id: quiz.id,
      subjectId: quiz.subject_id,
      documentId: quiz.document_id,
      title: quiz.title,
      questions: Array.isArray(quiz.questions) ? quiz.questions : JSON.parse(quiz.questions as string),
      settings: quiz.settings,
      results: quiz.results,
      createdAt: quiz.created_at,
      userId: quiz.user_id
    }));
  } catch (error) {
    console.error('Error getting quizzes by subject ID:', error);
    return [];
  }
};

// Get a quiz by ID
export const getQuizById = async (id: string): Promise<Quiz | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      return null;
    }

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error getting quiz:', error);
      return null;
    }
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      documentId: data.document_id,
      title: data.title,
      questions: Array.isArray(data.questions) ? data.questions : JSON.parse(data.questions as string),
      settings: data.settings,
      results: data.results,
      createdAt: data.created_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error getting quiz:', error);
    return null;
  }
};

// Create a new quiz
export const createQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt' | 'userId'>): Promise<Quiz> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    console.log('Creating new quiz for user ID:', userId);

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        subject_id: quiz.subjectId,
        document_id: quiz.documentId,
        title: quiz.title,
        questions: quiz.questions,
        settings: quiz.settings || {},
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
    
    console.log('Quiz created successfully with ID:', data.id);
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      documentId: data.document_id,
      title: data.title,
      questions: Array.isArray(data.questions) ? data.questions : JSON.parse(data.questions as string),
      settings: data.settings,
      results: data.results,
      createdAt: data.created_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Update a quiz with results - enhanced to ensure consistent format
export const updateQuizResults = async (id: string, results: any): Promise<Quiz | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, user might not be logged in');
      throw new Error('User not authenticated');
    }

    // Ensure results is an object with consistent format
    let formattedResults = results;
    
    // If results is a string, parse it
    if (typeof formattedResults === 'string') {
      try {
        formattedResults = JSON.parse(formattedResults);
      } catch (e) {
        console.error('Failed to parse results string:', e);
      }
    }
    
    // Always ensure we have total_points and max_points for consistency
    if (formattedResults && typeof formattedResults === 'object' && 
        (!formattedResults.total_points || !formattedResults.max_points) && 
        formattedResults.risultati && Array.isArray(formattedResults.risultati)) {
      
      // Get the quiz to count questions
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('id', id)
        .single();
      
      let questionCount = 0;
      if (quizData && quizData.questions) {
        if (Array.isArray(quizData.questions)) {
          questionCount = quizData.questions.length;
        } else if (typeof quizData.questions === 'string') {
          try {
            questionCount = JSON.parse(quizData.questions).length;
          } catch (e) {
            console.error('Failed to parse questions string:', e);
          }
        }
      }
      
      // Calculate total points
      const totalPoints = formattedResults.risultati.reduce(
        (sum, r) => sum + (Number(r.punteggio) || 0), 0
      );
      
      const maxPoints = questionCount > 0 ? 
        formattedResults.risultati.reduce(
          (sum, r) => sum + ((r.tipo === 'open-ended' || r.type === 'open-ended') ? 5 : 1), 0
        ) : formattedResults.risultati.length;
      
      formattedResults.total_points = totalPoints;
      formattedResults.max_points = maxPoints;
      
      console.log(`Calculated total_points: ${totalPoints}, max_points: ${maxPoints}`);
    }
    
    console.log('Saving quiz results:', formattedResults);

    const { data, error } = await supabase
      .from('quizzes')
      .update({ results: formattedResults })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating quiz results:', error);
      return null;
    }
    
    console.log('Quiz results updated successfully:', data);
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      documentId: data.document_id,
      title: data.title,
      questions: Array.isArray(data.questions) ? data.questions : JSON.parse(data.questions as string),
      settings: data.settings,
      results: data.results,
      createdAt: data.created_at,
      userId: data.user_id
    };
  } catch (error) {
    console.error('Error updating quiz results:', error);
    return null;
  }
};

// Initialize without any default subjects
export const initializeSubjectsIfNeeded = async (): Promise<void> => {
  console.log('No predefined subjects will be created');
  return;
};
