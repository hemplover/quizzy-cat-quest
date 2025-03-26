import { supabase } from '@/integrations/supabase/client';

// Fetch all subjects for a user
export const fetchSubjects = async (): Promise<any[]> => {
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

// Create a new subject
export const createSubject = async (
  name: string,
  description: string | null,
  color: string | null,
  icon: string | null
): Promise<any | null> => {
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
  name: string,
  description: string | null,
  color: string | null,
  icon: string | null
): Promise<any | null> => {
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
export const fetchSubjectById = async (id: string): Promise<any | null> => {
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

// Fetch subjects with quiz counts
export const fetchSubjectsWithQuizCounts = async (): Promise<any[]> => {
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
