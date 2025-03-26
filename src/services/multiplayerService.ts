
import { supabase } from "@/integrations/supabase/client";
import { QuizSession, SessionParticipant } from "@/types/multiplayer";
import { QuizQuestion } from "@/types/quiz";
import { nanoid } from "nanoid";

// Generate a unique, readable session code
export const generateSessionCode = (): string => {
  // Generate a 6-character alphanumeric code (uppercase only)
  return nanoid(6).replace(/[^A-Z0-9]/g, 'A').toUpperCase();
};

// Normalize a session code by removing unwanted characters and formatting properly
export const normalizeSessionCode = (code: string): string => {
  if (!code) return '';
  // Remove any non-alphanumeric characters and convert to uppercase
  return code.replace(/[^A-Z0-9]/g, '').toUpperCase();
};

// Get a quiz session by code - completely rewritten for reliability
export const getQuizSessionByCode = async (sessionCode: string): Promise<QuizSession | null> => {
  try {
    if (!sessionCode) {
      console.error('No session code provided');
      return null;
    }

    // Clean up the code first
    const normalizedCode = normalizeSessionCode(sessionCode);
    console.log(`[DEBUG] Looking for session with normalized code: "${normalizedCode}"`);
    
    // Get all sessions for debugging
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('quiz_sessions')
      .select('*');
    
    if (allSessionsError) {
      console.error('[ERROR] Failed to get all sessions:', allSessionsError);
      return null;
    }

    console.log(`[DEBUG] Total sessions in database: ${allSessions?.length || 0}`);
    
    if (allSessions && allSessions.length > 0) {
      // Debug log all sessions
      console.log('[DEBUG] All available sessions:');
      allSessions.forEach(s => {
        const dbNormalized = normalizeSessionCode(s.session_code);
        console.log(`[DEBUG] - ID: ${s.id}, Code: "${s.session_code}", Normalized: "${dbNormalized}", Status: ${s.status}`);
      });
      
      // Exact direct match by session_code (case sensitive)
      const exactMatch = allSessions.find(
        s => s.session_code === normalizedCode
      );
      
      if (exactMatch) {
        console.log(`[DEBUG] Found exact match for code: "${normalizedCode}"`);
        return exactMatch as QuizSession;
      }
      
      console.log(`[DEBUG] No exact match found, trying normalized comparison`);
      
      // Try with normalized code comparison
      const normalizedMatch = allSessions.find(
        s => normalizeSessionCode(s.session_code) === normalizedCode
      );
      
      if (normalizedMatch) {
        console.log(`[DEBUG] Found normalized match: DB "${normalizedMatch.session_code}" vs. Requested "${normalizedCode}"`);
        return normalizedMatch as QuizSession;
      }
      
      console.log(`[DEBUG] No session found with normalized code: "${normalizedCode}"`);
      console.log('[DEBUG] Available normalized codes in DB:');
      allSessions.forEach(s => {
        console.log(`[DEBUG] - "${normalizeSessionCode(s.session_code)}"`);
      });
    } else {
      console.log('[DEBUG] No sessions found in the database');
    }
    
    // Try a direct query as a last resort
    const { data: directQueryData, error: directQueryError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_code', normalizedCode)
      .maybeSingle();
    
    if (directQueryError) {
      console.error('[ERROR] Direct query error:', directQueryError);
    } else if (directQueryData) {
      console.log(`[DEBUG] Direct query found session: ${directQueryData.id}`);
      return directQueryData as QuizSession;
    } else {
      console.log('[DEBUG] Direct query found no results');
    }
    
    return null;
  } catch (error) {
    console.error('[ERROR] Failed to get quiz session:', error);
    return null;
  }
};

// Create a new quiz session
export const createQuizSession = async (quizId: string, creatorId: string | null): Promise<QuizSession | null> => {
  try {
    // Generate a session code without any special characters
    const sessionCode = generateSessionCode();
    console.log(`[DEBUG] Creating new session with code: "${sessionCode}"`);
    
    // Check if the quiz exists first
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quizData) {
      console.error('[ERROR] Error finding quiz:', quizError);
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
      console.error('[ERROR] Error creating quiz session:', error);
      throw new Error(`Failed to create quiz session: ${error.message}`);
    }
    
    console.log(`[DEBUG] Created new quiz session with ID: ${data.id}, code: "${data.session_code}"`);
    
    // Verify the session was created properly
    const verifySession = await getQuizSessionByCode(sessionCode);
    if (verifySession) {
      console.log(`[DEBUG] Verified session can be retrieved with code: "${sessionCode}"`);
    } else {
      console.error(`[ERROR] WARNING: Created session could not be retrieved with code: "${sessionCode}"`);
    }
    
    return data as QuizSession;
  } catch (error) {
    console.error('[ERROR] Failed to create quiz session:', error);
    throw error;
  }
};

// Join a quiz session as a participant
export const joinQuizSession = async (
  sessionCode: string, 
  username: string, 
  userId: string | null
): Promise<{ session: QuizSession; participant: SessionParticipant } | null> => {
  try {
    // Normalize the session code
    const normalizedCode = normalizeSessionCode(sessionCode);
    console.log(`[DEBUG] Joining quiz session with normalized code: "${normalizedCode}"`);
    
    // First, get the session by code
    const session = await getQuizSessionByCode(normalizedCode);
    
    if (!session) {
      console.error(`[ERROR] No session found with code: "${normalizedCode}"`);
      return null;
    }
    
    console.log(`[DEBUG] Found session ${session.id} with code: "${session.session_code}"`);
    
    if (session.status !== 'waiting') {
      console.error(`[ERROR] Session ${session.id} is not in waiting status, current status: ${session.status}`);
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
      console.error('[ERROR] Error joining quiz session:', participantError);
      return null;
    }
    
    console.log(`[DEBUG] Successfully joined session with ID: ${session.id}, code: "${session.session_code}"`);
    return {
      session: session,
      participant: participantData as SessionParticipant
    };
  } catch (error) {
    console.error('[ERROR] Failed to join quiz session:', error);
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
      console.error('[ERROR] Error getting session participants:', error);
      return [];
    }
    
    return data as SessionParticipant[];
  } catch (error) {
    console.error('[ERROR] Failed to get session participants:', error);
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
      console.error('[ERROR] Error starting quiz session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to start quiz session:', error);
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
      console.error('[ERROR] Error updating participant progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to update participant progress:', error);
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
      console.error('[ERROR] Error completing quiz session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to complete quiz session:', error);
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
      console.error('[ERROR] Error getting quiz questions:', error);
      return [];
    }
    
    return data.questions as QuizQuestion[];
  } catch (error) {
    console.error('[ERROR] Failed to get quiz questions:', error);
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
