import { supabase } from "@/integrations/supabase/client";
import { QuizSession, SessionParticipant } from "@/types/multiplayer";
import { QuizQuestion } from "@/types/quiz";
import { nanoid } from "nanoid";

// Generate a unique, readable session code
export const generateSessionCode = (): string => {
  // Generate a 6-character alphanumeric code
  return nanoid(6).toUpperCase();
};

// Create a new quiz session
export const createQuizSession = async (quizId: string, creatorId: string | null): Promise<QuizSession | null> => {
  try {
    const sessionCode = generateSessionCode();
    
    // Check if the quiz exists first
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quizData) {
      console.error('Error finding quiz:', quizError);
      throw new Error(`Quiz with ID ${quizId} not found`);
    }
    
    // Create the quiz session
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        quiz_id: quizId,
        creator_id: creatorId,
        session_code: sessionCode,
        status: 'waiting',
        settings: {}
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating quiz session:', error);
      throw new Error(`Failed to create quiz session: ${error.message}`);
    }
    
    console.log('Created new quiz session with code:', sessionCode);
    return data as QuizSession;
  } catch (error) {
    console.error('Failed to create quiz session:', error);
    throw error;
  }
};

// Normalize a session code by removing unwanted characters and formatting properly
export const normalizeSessionCode = (code: string): string => {
  if (!code) return '';
  
  // Remove quotes, spaces, hyphens and any non-alphanumeric characters
  // First, check if the code has quotes around it (which can happen from logs/debugging)
  if (code.startsWith('"') && code.endsWith('"')) {
    code = code.substring(1, code.length - 1);
  }
  
  // Then remove any non-alphanumeric characters
  return code.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
};

// Join a quiz session as a participant
export const joinQuizSession = async (
  sessionCode: string, 
  username: string, 
  userId: string | null
): Promise<{ session: QuizSession; participant: SessionParticipant } | null> => {
  try {
    // Normalize the session code
    const cleanCode = normalizeSessionCode(sessionCode);
    console.log('Joining quiz session with code:', cleanCode);
    
    // First, get the session by code
    const session = await getQuizSessionByCode(cleanCode);
    
    if (!session) {
      console.error(`No session found with code: ${cleanCode}`);
      return null;
    }
    
    if (session.status !== 'waiting') {
      console.error(`Session with code ${cleanCode} is not in waiting status, current status: ${session.status}`);
      return null;
    }
    
    // Add the participant to the session
    const { data: participantData, error: participantError } = await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        username: username,
        score: 0,
        completed: false,
        answers: []
      })
      .select('*')
      .single();
    
    if (participantError) {
      console.error('Error joining quiz session:', participantError);
      return null;
    }
    
    console.log('Successfully joined session:', session.session_code);
    return {
      session: session,
      participant: participantData as SessionParticipant
    };
  } catch (error) {
    console.error('Failed to join quiz session:', error);
    return null;
  }
};

// Get a quiz session by code
export const getQuizSessionByCode = async (sessionCode: string): Promise<QuizSession | null> => {
  try {
    if (!sessionCode) {
      console.error('No session code provided');
      return null;
    }

    // Normalize the session code
    const cleanCode = normalizeSessionCode(sessionCode);
    console.log('Getting quiz session with code:', cleanCode);
    
    // Try to get the session with an exact match first
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_code', cleanCode)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting quiz session (exact match):', error);
      console.error('SQL query used:', `SELECT * FROM quiz_sessions WHERE session_code = '${cleanCode}'`);
      return null;
    }
    
    if (data) {
      console.log('Found session with exact match:', data);
      return data as QuizSession;
    }
    
    // If exact match fails, try case-insensitive match
    console.log(`No exact match found for code: ${cleanCode}, trying case-insensitive search...`);
    const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .ilike('session_code', cleanCode)
      .maybeSingle();
    
    if (caseInsensitiveError) {
      console.error('Error getting quiz session (case-insensitive):', caseInsensitiveError);
      return null;
    }
    
    if (caseInsensitiveData) {
      console.log('Found session with case-insensitive match:', caseInsensitiveData);
      return caseInsensitiveData as QuizSession;
    }
    
    // If still no match, try to get a list of all available sessions for debugging
    console.log('No session found with code (both exact and case-insensitive):', cleanCode);
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('quiz_sessions')
      .select('session_code, status, creator_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allSessionsError) {
      console.error('Error getting all sessions:', allSessionsError);
    } else {
      console.log('Available sessions:', allSessions);
      console.log('Session codes comparison:');
      if (allSessions && allSessions.length > 0) {
        allSessions.forEach(session => {
          console.log(`DB session code: "${session.session_code}" vs. Requested: "${cleanCode}"`);
          console.log(`- Exact match: ${session.session_code === cleanCode}`);
          console.log(`- Lowercase comparison: ${session.session_code.toLowerCase() === cleanCode.toLowerCase()}`);
          console.log(`- Normalized DB code: "${normalizeSessionCode(session.session_code)}"`);
        });
      } else {
        console.log('No active sessions found in the database');
      }
    }
    
    // As a last resort, try a partial match search
    const { data: partialMatch, error: partialMatchError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .ilike('session_code', `%${cleanCode}%`)
      .limit(1)
      .maybeSingle();
      
    if (partialMatchError) {
      console.error('Error on partial match search:', partialMatchError);
    }
    
    if (partialMatch) {
      console.log('Found partial match session:', partialMatch);
      console.log(`WARNING: Using partial match. Requested: "${cleanCode}", Found: "${partialMatch.session_code}"`);
      return partialMatch as QuizSession;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get quiz session:', error);
    return null;
  }
};

// Get participants in a session
export const getSessionParticipants = async (sessionId: string): Promise<SessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    
    if (error) {
      console.error('Error getting session participants:', error);
      return [];
    }
    
    return data as SessionParticipant[];
  } catch (error) {
    console.error('Failed to get session participants:', error);
    return [];
  }
};

// Start a quiz session
export const startQuizSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error starting quiz session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to start quiz session:', error);
    return false;
  }
};

// Update participant score and answers
export const updateParticipantProgress = async (
  participantId: string,
  score: number,
  answers: any[],
  completed: boolean = false
): Promise<boolean> => {
  try {
    const updates: any = {
      score,
      answers
    };
    
    if (completed) {
      updates.completed = true;
    }
    
    const { error } = await supabase
      .from('session_participants')
      .update(updates)
      .eq('id', participantId);
    
    if (error) {
      console.error('Error updating participant progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update participant progress:', error);
    return false;
  }
};

// Complete a quiz session
export const completeQuizSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error completing quiz session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to complete quiz session:', error);
    return false;
  }
};

// Get quiz questions for a session
export const getQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('questions')
      .eq('id', quizId)
      .single();
    
    if (error || !data) {
      console.error('Error getting quiz questions:', error);
      return [];
    }
    
    return data.questions as QuizQuestion[];
  } catch (error) {
    console.error('Failed to get quiz questions:', error);
    return [];
  }
};

// Subscribe to session changes
export const subscribeToSessionUpdates = (
  sessionId: string,
  onParticipantsUpdate: (participants: SessionParticipant[]) => void,
  onSessionUpdate: (session: QuizSession) => void
) => {
  // Subscribe to participants changes
  const participantsChannel = supabase
    .channel(`participants-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${sessionId}`
      },
      async () => {
        const participants = await getSessionParticipants(sessionId);
        onParticipantsUpdate(participants);
      }
    )
    .subscribe();

  // Subscribe to session changes
  const sessionChannel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_sessions',
        filter: `id=eq.${sessionId}`
      },
      async (payload) => {
        onSessionUpdate(payload.new as QuizSession);
      }
    )
    .subscribe();

  // Return a cleanup function
  return () => {
    supabase.removeChannel(participantsChannel);
    supabase.removeChannel(sessionChannel);
  };
};
