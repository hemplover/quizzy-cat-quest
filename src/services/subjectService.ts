
import { toast } from 'sonner';

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
  results?: any;
}

// Get all subjects
export const getSubjects = (): Subject[] => {
  try {
    const subjects = localStorage.getItem('subjects');
    if (!subjects) return [];
    return JSON.parse(subjects);
  } catch (error) {
    console.error('Error getting subjects:', error);
    return [];
  }
};

// Get a subject by ID
export const getSubjectById = (id: string): Subject | null => {
  const subjects = getSubjects();
  return subjects.find(subject => subject.id === id) || null;
};

// Create a new subject
export const createSubject = (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Subject => {
  try {
    const subjects = getSubjects();
    const newSubject: Subject = {
      ...subject,
      id: `subject_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('subjects', JSON.stringify([...subjects, newSubject]));
    toast.success(`Subject ${subject.name} created successfully`);
    return newSubject;
  } catch (error) {
    console.error('Error creating subject:', error);
    toast.error('Failed to create subject');
    throw error;
  }
};

// Update a subject
export const updateSubject = (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>): Subject | null => {
  try {
    const subjects = getSubjects();
    const index = subjects.findIndex(subject => subject.id === id);
    
    if (index === -1) {
      toast.error('Subject not found');
      return null;
    }
    
    const updatedSubject: Subject = {
      ...subjects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    subjects[index] = updatedSubject;
    localStorage.setItem('subjects', JSON.stringify(subjects));
    toast.success(`Subject ${updatedSubject.name} updated successfully`);
    return updatedSubject;
  } catch (error) {
    console.error('Error updating subject:', error);
    toast.error('Failed to update subject');
    return null;
  }
};

// Delete a subject
export const deleteSubject = (id: string): boolean => {
  try {
    const subjects = getSubjects();
    const newSubjects = subjects.filter(subject => subject.id !== id);
    
    if (subjects.length === newSubjects.length) {
      toast.error('Subject not found');
      return false;
    }
    
    localStorage.setItem('subjects', JSON.stringify(newSubjects));
    
    // Also delete associated documents and quizzes
    const documents = getDocumentsBySubjectId(id);
    const quizzes = getQuizzesBySubjectId(id);
    
    documents.forEach(doc => deleteDocument(doc.id));
    quizzes.forEach(quiz => deleteQuiz(quiz.id));
    
    toast.success('Subject deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting subject:', error);
    toast.error('Failed to delete subject');
    return false;
  }
};

// Get all documents
export const getDocuments = (): Document[] => {
  try {
    const documents = localStorage.getItem('documents');
    if (!documents) return [];
    return JSON.parse(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
};

// Get documents by subject ID
export const getDocumentsBySubjectId = (subjectId: string): Document[] => {
  const documents = getDocuments();
  return documents.filter(doc => doc.subjectId === subjectId);
};

// Get a document by ID
export const getDocumentById = (id: string): Document | null => {
  const documents = getDocuments();
  return documents.find(doc => doc.id === id) || null;
};

// Create a new document
export const createDocument = (document: Omit<Document, 'id' | 'uploadedAt'>): Document => {
  try {
    const documents = getDocuments();
    const newDocument: Document = {
      ...document,
      id: `document_${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    
    localStorage.setItem('documents', JSON.stringify([...documents, newDocument]));
    return newDocument;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = (id: string): boolean => {
  try {
    const documents = getDocuments();
    const newDocuments = documents.filter(doc => doc.id !== id);
    
    if (documents.length === newDocuments.length) {
      return false;
    }
    
    localStorage.setItem('documents', JSON.stringify(newDocuments));
    
    // Also delete associated quizzes
    const quizzes = getQuizzes();
    const updatedQuizzes = quizzes.filter(quiz => quiz.documentId !== id);
    localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

// Get all quizzes
export const getQuizzes = (): Quiz[] => {
  try {
    const quizzes = localStorage.getItem('quizzes');
    if (!quizzes) return [];
    return JSON.parse(quizzes);
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return [];
  }
};

// Get quizzes by subject ID
export const getQuizzesBySubjectId = (subjectId: string): Quiz[] => {
  const quizzes = getQuizzes();
  return quizzes.filter(quiz => quiz.subjectId === subjectId);
};

// Get a quiz by ID
export const getQuizById = (id: string): Quiz | null => {
  const quizzes = getQuizzes();
  return quizzes.find(quiz => quiz.id === id) || null;
};

// Create a new quiz
export const createQuiz = (quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz => {
  try {
    const quizzes = getQuizzes();
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('quizzes', JSON.stringify([...quizzes, newQuiz]));
    return newQuiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Update a quiz with results
export const updateQuizResults = (id: string, results: any): Quiz | null => {
  try {
    const quizzes = getQuizzes();
    const index = quizzes.findIndex(quiz => quiz.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedQuiz: Quiz = {
      ...quizzes[index],
      results
    };
    
    quizzes[index] = updatedQuiz;
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    return updatedQuiz;
  } catch (error) {
    console.error('Error updating quiz results:', error);
    return null;
  }
};

// Delete a quiz
export const deleteQuiz = (id: string): boolean => {
  try {
    const quizzes = getQuizzes();
    const newQuizzes = quizzes.filter(quiz => quiz.id !== id);
    
    if (quizzes.length === newQuizzes.length) {
      return false;
    }
    
    localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
  }
};

// Initialize with some default subjects if there are none
export const initializeSubjectsIfNeeded = (): void => {
  const subjects = getSubjects();
  
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
    
    defaultSubjects.forEach(subject => {
      createSubject(subject);
    });
  }
};
