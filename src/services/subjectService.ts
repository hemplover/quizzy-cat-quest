
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  subjectId: string;
  name: string;
  content: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
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
}

// Get all subjects
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting subjects:', error);
      toast.error('Failed to load subjects');
      return [];
    }
    
    // Transform to match our interface
    return data.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      icon: subject.icon || '📚',
      color: subject.color || '#4f46e5',
      createdAt: subject.created_at,
      updatedAt: subject.updated_at
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
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
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
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting subject:', error);
    return null;
  }
};

// Create a new subject
export const createSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
        color: subject.color
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
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating subject:', error);
    toast.error('Failed to create subject');
    throw error;
  }
};

// Update a subject
export const updateSubject = async (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Subject | null> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
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
      updatedAt: data.updated_at
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
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
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
    const { data, error } = await supabase
      .from('documents')
      .select('*')
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
      uploadedAt: doc.uploaded_at
    }));
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
};

// Get documents by subject ID
export const getDocumentsBySubjectId = async (subjectId: string): Promise<Document[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('subject_id', subjectId)
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
      uploadedAt: doc.uploaded_at
    }));
  } catch (error) {
    console.error('Error getting documents by subject ID:', error);
    return [];
  }
};

// Get a document by ID
export const getDocumentById = async (id: string): Promise<Document | null> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
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
      uploadedAt: data.uploaded_at
    };
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

// Create a new document
export const createDocument = async (document: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        subject_id: document.subjectId,
        name: document.name,
        content: document.content,
        file_type: document.fileType,
        file_size: document.fileSize
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
      uploadedAt: data.uploaded_at
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
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
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting quizzes:', error);
      return [];
    }
    
    return data.map(quiz => ({
      id: quiz.id,
      subjectId: quiz.subject_id,
      documentId: quiz.document_id,
      title: quiz.title,
      questions: Array.isArray(quiz.questions) ? quiz.questions : JSON.parse(quiz.questions as string),
      settings: quiz.settings,
      results: quiz.results,
      createdAt: quiz.created_at
    }));
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return [];
  }
};

// Get quizzes by subject ID
export const getQuizzesBySubjectId = async (subjectId: string): Promise<Quiz[]> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting quizzes by subject ID:', error);
      return [];
    }
    
    return data.map(quiz => ({
      id: quiz.id,
      subjectId: quiz.subject_id,
      documentId: quiz.document_id,
      title: quiz.title,
      questions: Array.isArray(quiz.questions) ? quiz.questions : JSON.parse(quiz.questions as string),
      settings: quiz.settings,
      results: quiz.results,
      createdAt: quiz.created_at
    }));
  } catch (error) {
    console.error('Error getting quizzes by subject ID:', error);
    return [];
  }
};

// Get a quiz by ID
export const getQuizById = async (id: string): Promise<Quiz | null> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
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
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error getting quiz:', error);
    return null;
  }
};

// Create a new quiz
export const createQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        subject_id: quiz.subjectId,
        document_id: quiz.documentId,
        title: quiz.title,
        questions: quiz.questions,
        settings: quiz.settings || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
    
    return {
      id: data.id,
      subjectId: data.subject_id,
      documentId: data.document_id,
      title: data.title,
      questions: Array.isArray(data.questions) ? data.questions : JSON.parse(data.questions as string),
      settings: data.settings,
      results: data.results,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Update a quiz with results
export const updateQuizResults = async (id: string, results: any): Promise<Quiz | null> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ results })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating quiz results:', error);
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
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error updating quiz results:', error);
    return null;
  }
};

// Delete a quiz
export const deleteQuiz = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting quiz:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
  }
};

// Initialize with some default subjects if there are none
export const initializeSubjectsIfNeeded = async (): Promise<void> => {
  try {
    const subjects = await getSubjects();
    
    if (subjects.length === 0) {
      const defaultSubjects = [
        {
          name: 'Mathematics',
          description: 'Algebra, Calculus, Geometry, etc.',
          icon: '📐',
          color: '#4f46e5'
        },
        {
          name: 'Science',
          description: 'Physics, Chemistry, Biology, etc.',
          icon: '🔬',
          color: '#16a34a'
        },
        {
          name: 'History',
          description: 'World History, Ancient Civilizations, etc.',
          icon: '📜',
          color: '#b45309'
        },
        {
          name: 'Languages',
          description: 'English, Spanish, French, etc.',
          icon: '🗣️',
          color: '#db2777'
        }
      ];
      
      for (const subject of defaultSubjects) {
        await createSubject(subject);
      }
    }
  } catch (error) {
    console.error('Error initializing subjects:', error);
  }
};
