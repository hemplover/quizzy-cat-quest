import { supabase } from "@/integrations/supabase/client";
import { QuizSession, SessionParticipant, ParticipantAnswer } from "@/types/multiplayer";
import { QuizQuestion } from "@/types/quiz";
import { nanoid } from "nanoid";

// Define the return type for the join_quiz_session RPC function
type JoinQuizSessionResponse = {
  session: QuizSession;
  participant: SessionParticipant;
};

type JoinQuizSessionParams = {
  p_session_code: string;
  p_username: string;
  p_user_id: string | null;
};

// Helper function to normalize session codes (remove spaces, uppercase)
const normalizeSessionCode = (code: string): string => {
  return code.replace(/\s+/g, '').toUpperCase();
};

// Helper function to generate a clean session code
const generateSessionCode = (length = 6): string => {
  // Usa nanoid standard, più semplice
  return nanoid(length);
};

// Get a quiz session by code - uses standard client
export const getQuizSessionByCode = async (sessionCode: string): Promise<QuizSession | null> => {
  try {
    if (!sessionCode) {
      console.error('[ERROR] No session code provided');
      return null;
    }
    const normalizedCode = normalizeSessionCode(sessionCode);
    console.log(`[DEBUG] Looking for session with normalized code: "${normalizedCode}"`);

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_code', normalizedCode)
      .maybeSingle();

    if (error) {
      console.error('[ERROR] Failed query for session code:', error);
      return null;
    } 
    if (data) {
       console.log(`[DEBUG] Found session with normalized code: "${normalizedCode}"`);
       return data as QuizSession;
    } else {
       console.log(`[DEBUG] No session found directly with normalized code: "${normalizedCode}"`);
       // Non fare fallback a get all sessions qui, RLS potrebbe bloccarlo
       return null;
    }

  } catch (error) {
    console.error('[ERROR] Failed to get quiz session by code:', error);
    return null;
  }
};

// Create a new quiz session - uses standard client
export const createQuizSession = async (quizId: string, creatorId: string | null): Promise<QuizSession | null> => {
  try {
    const sessionCode = generateSessionCode();
    console.log(`[DEBUG] Creating new session with code: "${sessionCode}"`);

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single();

    if (quizError || !quizData) {
      console.error('[ERROR] Error finding quiz:', quizError);
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        quiz_id: quizId,
        creator_id: creatorId, // Assicurati che creatorId sia l'ID utente corretto
        session_code: sessionCode,
        status: 'waiting',
        settings: {}
      })
      .select('*')
      .single();

     if (sessionError) {
       console.error('[ERROR] Error creating quiz session:', sessionError.message);
       throw new Error(`Failed to create quiz session: ${sessionError.message}`);
     }
     console.log(`[DEBUG] Created new quiz session with ID: ${sessionData.id}, code: "${sessionData.session_code}"`);

     // Aggiunta Host Sincrona (usa supabase standard)
     if (creatorId) {
       console.log(`[DEBUG] Attempting to add host (${creatorId}) as participant synchronously for session ${sessionData.id}`);
       try {
         const { data: existingParticipant, error: checkError } = await supabase
           .from('session_participants')
           .select('id') 
           .eq('session_id', sessionData.id)
           .eq('user_id', creatorId)
           .maybeSingle(); 

         if (checkError) {
           console.error('[ERROR] Error checking for existing host participant:', checkError);
         } else if (!existingParticipant) {
           console.log(`[DEBUG] Host not found, inserting host (${creatorId}) as participant...`);
           const { error: insertError } = await supabase
             .from('session_participants')
             .insert({
               session_id: sessionData.id,
               user_id: creatorId,
               username: 'Host', 
               score: 0,
               completed: false,
               answers: []
             });
           if (insertError) {
             console.error('[ERROR] Failed to insert host as participant:', insertError);
           } else {
             console.log('[SUCCESS] Host added as participant successfully.');
           }
         }
       } catch (hostAddError) {
         console.error('[ERROR] Exception while adding host synchronously:', hostAddError);
       }
     }
     return sessionData as QuizSession;

   } catch (error) {
     console.error('[ERROR] Failed to create quiz session:', error);
     return null;
   }
};

// Join a quiz session - uses standard client
export const joinQuizSession = async (
  sessionCode: string, 
  username: string, 
  userId: string | null
): Promise<{ session: QuizSession; participant: SessionParticipant } | null> => {
  try {
    const normalizedCode = normalizeSessionCode(sessionCode);
    console.log(`[DEBUG] Joining quiz session with normalized code: "${normalizedCode}"`);

    const session = await getQuizSessionByCode(normalizedCode); // Già usa supabase standard
    if (!session) {
      console.error(`[ERROR] No session found with code: "${normalizedCode}"`);
      return null;
    }
    console.log(`[DEBUG] Found session ${session.id} with code: "${session.session_code}"`);

    if (session.status !== 'waiting') {
      console.error(`[ERROR] Session ${session.id} is not in waiting status, current status: ${session.status}`);
      return null;
    }

    const { data: participantData, error: participantError } = await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        username: username,
        score: 0,
        completed: false,
        answers: [] // Inizializza come array vuoto JSON valido
      })
      .select('*')
      .single();

    if (participantError) {
      console.error('[ERROR] Error joining quiz session:', participantError);
       if (participantError.message.includes('duplicate key value violates unique constraint')) {
          console.warn('[WARN] User might already be a participant.');
          const { data: existingData, error: existingError } = await supabase
             .from('session_participants')
             .select('*')
             .eq('session_id', session.id)
             .eq(userId ? 'user_id' : 'username', userId || username)
             .single();
          if (!existingError && existingData) {
             console.log('[DEBUG] Returning existing participant data.');
             // Cast sicuro dopo il fetch
             return {
                session: session,
                participant: existingData as unknown as SessionParticipant
             };
          } else {
             console.error('[ERROR] Failed to retrieve existing participant after duplicate error:', existingError);
          }
       }
      return null;
    }

    console.log(`[DEBUG] Successfully joined session with ID: ${session.id}, code: "${session.session_code}"`);
    // Cast sicuro dopo l'insert
    return {
      session: session,
      participant: participantData as unknown as SessionParticipant
    };

  } catch (error) {
    console.error('[ERROR] Failed to join quiz session:', error);
    return null;
  }
};

// Get participants in a session - uses standard client
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
    // Cast sicuro dopo il fetch
    return data as unknown as SessionParticipant[];
  } catch (error) {
    console.error('[ERROR] Failed to get session participants:', error);
    return [];
  }
};

// Start a quiz session - uses standard client
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

// Update participant progress - uses standard client
export const updateParticipantProgress = async (
  participantId: string,
  currentQuestionIndex: number,
  isCorrect: boolean,
  score: number,
  answer: any
): Promise<boolean> => {
  try {
    const { data: participant, error: fetchError } = await supabase
      .from('session_participants')
      .select('answers')
      .eq('id', participantId)
      .single();

    if (fetchError || !participant) {
      console.error('[ERROR] Error fetching participant for progress update:', fetchError);
      return false;
    }

    const currentAnswers: ParticipantAnswer[] = 
      Array.isArray(participant.answers) ? participant.answers as unknown as ParticipantAnswer[] : [];
      
    const existingAnswerIndex = currentAnswers.findIndex(a => a.questionIndex === currentQuestionIndex);
    if (existingAnswerIndex === -1) {
        currentAnswers.push({ questionIndex: currentQuestionIndex, answer, isCorrect });
    } else {
        console.warn(`[WARN] Attempted to update progress for already answered question index: ${currentQuestionIndex}`);
    }

    const { error } = await supabase
      .from('session_participants')
      .update({
        score: score,
        // Usa 'any' per il cast durante l'update, Supabase gestirà la serializzazione JSON
        answers: currentAnswers as any 
      })
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

// Mark a participant as completed - uses standard client
export const markParticipantCompleted = async (participantId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_participants')
      .update({ completed: true })
      .eq('id', participantId);

    if (error) {
      console.error('[ERROR] Error marking participant completed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to mark participant completed:', error);
    return false;
  }
};

// Complete a quiz session - uses standard client
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

// Get quiz questions for a session - uses standard client
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

// Subscribe to session updates - uses standard client
export const subscribeToSessionUpdates = (
  sessionId: string,
  onParticipantsUpdate: (participants: SessionParticipant[]) => void,
  onSessionUpdate: (session: QuizSession) => void
) => {
  // Usa il client standard supabase per le sottoscrizioni
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
        const participants = await getSessionParticipants(sessionId); // Già usa supabase standard
        onParticipantsUpdate(participants);
      }
    )
    .subscribe();

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
         if (payload.new) {
            onSessionUpdate(payload.new as QuizSession);
         }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(participantsChannel);
    supabase.removeChannel(sessionChannel);
  };
};

// Test database access - uses standard client
export const testDatabaseAccess = async (): Promise<boolean> => {
  try {
    // Usa il client standard
    const { error: quizzesError } = await supabase
      .from('quizzes')
      .select('id', { count: 'exact', head: true }) // Più efficiente per un test
      .limit(0);

    if (quizzesError) {
      console.error('[ERROR] Failed to access quizzes:', quizzesError);
      return false;
    }
    console.log('[DEBUG] Successfully tested access to quizzes table');

    const { error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select('id', { count: 'exact', head: true })
      .limit(0);

    if (sessionsError) {
      console.error('[ERROR] Failed to access quiz_sessions:', sessionsError);
      return false;
    }
    console.log('[DEBUG] Successfully tested access to quiz_sessions table');

    return true;
  } catch (error) {
    console.error('[ERROR] Failed to test database access:', error);
    return false;
  }
};
