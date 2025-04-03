import { supabase } from "@/integrations/supabase/client";
import { QuizSession, SessionParticipant } from "@/types/multiplayer";
import { QuizQuestion } from "@/types/quiz";
import { nanoid } from "nanoid";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  'https://lsozzejwfkuexbyynnom.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzb3p6ZWp3Zmt1ZXhieXlubm9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjYzMjQ3OSwiZXhwIjoyMDU4MjA4NDc5fQ.suw5bZaWyWvJlp3AsX6oE1FLg5P3C0bpq_GszykLznc'
);

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

// Generate a unique, readable session code without any special characters
export const generateSessionCode = (): string => {
  // Generate a 6-character alphanumeric code (uppercase only, no special chars)
  return nanoid(6).replace(/[^A-Z0-9]/g, '0').toUpperCase();
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
      console.error('[ERROR] No session code provided');
      return null;
    }

    // Clean up the code first
    const normalizedCode = normalizeSessionCode(sessionCode);
    console.log(`[DEBUG] Looking for session with normalized code: "${normalizedCode}"`);
    
    // First try: Direct exact match
    const { data: exactMatchData, error: exactMatchError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_code', normalizedCode)
      .maybeSingle();
    
    if (exactMatchError) {
      console.error('[ERROR] Failed with exact match query:', exactMatchError);
    } else if (exactMatchData) {
      console.log(`[DEBUG] Found exact match for code: "${normalizedCode}"`);
      return exactMatchData as QuizSession;
    }
    
    // Second try: Get all sessions and compare
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
    
    return null;
  } catch (error) {
    console.error('[ERROR] Failed to get quiz session:', error);
    return null;
  }
};

// Create a new quiz session with a consistent code format
export const createQuizSession = async (quizId: string, creatorId: string | null): Promise<QuizSession | null> => {
  try {
    // Generate a clean 6-character session code without any special characters
    const sessionCode = generateSessionCode();
    console.log(`[DEBUG] Creating new session with code: "${sessionCode}"`);
    
    // Check if the quiz exists first
    console.log(`[DEBUG] Checking if quiz with ID ${quizId} exists`);
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single();
    
    if (quizError || !quizData) {
      console.error('[ERROR] Error finding quiz:', quizError);
      throw new Error(`Quiz with ID ${quizId} not found`);
    }
    
    console.log(`[DEBUG] Quiz found, creating session with creatorId: ${creatorId}`);
    
    // Attempt to create the quiz session
    const { data: sessionData, error: sessionError } = await supabase
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
    
    if (sessionError) {
      console.error('[ERROR] Error creating quiz session:', sessionError.message);
      if (sessionError.details) console.error('[ERROR] Details:', sessionError.details);
      if (sessionError.hint) console.error('[ERROR] Hint:', sessionError.hint);
      console.error('[DEBUG] Full error object:', JSON.stringify(sessionError, null, 2));
      
      throw new Error(`Failed to create quiz session: ${sessionError.message}`);
    }
    
    console.log(`[DEBUG] Created new quiz session with ID: ${sessionData.id}, code: "${sessionData.session_code}"`);
    
    // --- INIZIO MODIFICA: Aggiunta Host Sincrona --- 
    if (creatorId) { // Aggiungi l'host solo se creatorId è valido
      console.log(`[DEBUG] Attempting to add host (${creatorId}) as participant synchronously for session ${sessionData.id}`);
      try {
        // Controlla se l'host esiste GIÀ per questa sessione
        const { data: existingParticipant, error: checkError } = await supabase
          .from('session_participants')
          .select('id') // Seleziona solo l'ID, è più leggero
          .eq('session_id', sessionData.id)
          .eq('user_id', creatorId)
          .maybeSingle(); // Usiamo maybeSingle per gestire il caso in cui non esista

        if (checkError) {
          console.error('[ERROR] Error checking for existing host participant:', checkError);
          // Non blocchiamo la creazione della sessione per questo, ma logghiamo l'errore
        } else if (existingParticipant) {
          console.log('[INFO] Host is already a participant in this session. Skipping addition.');
        } else {
          // Se non esiste, proviamo ad inserirlo
          console.log(`[DEBUG] Host not found, inserting host (${creatorId}) as participant...`);
          const { error: insertError } = await supabase
            .from('session_participants')
            .insert({
              session_id: sessionData.id,
              user_id: creatorId,
              username: 'Host', // Potremmo voler usare un username reale se disponibile
              score: 0,
              completed: false,
              answers: []
            });

          if (insertError) {
            console.error('[ERROR] Failed to insert host as participant:', insertError);
            // Anche qui, logghiamo ma non blocchiamo necessariamente
          } else {
            console.log('[SUCCESS] Host added as participant successfully.');
          }
        }
      } catch (addHostError) {
        console.error('[ERROR] Exception during synchronous host addition:', addHostError);
        // Loggare l'errore ma continuare
      }
    }
    // --- FINE MODIFICA --- 
    
    // Restituisce i dati della sessione creata
    return sessionData as QuizSession;
    
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
    console.log(`[INFO] Updating participant ${participantId} - score: ${score}, answers: ${answers.length}, completed: ${completed}`);
    
    // Prima, verifichiamo che il partecipante esista
    const { data: participantData, error: fetchError } = await supabase
      .from('session_participants')
      .select('id, username, user_id, session_id')
      .eq('id', participantId)
      .single();
      
    if (fetchError || !participantData) {
      console.error(`[ERROR] Participant ${participantId} not found:`, fetchError);
      return false;
    }
    
    console.log(`[INFO] Found participant: ${participantData.username} (user_id: ${participantData.user_id}) in session ${participantData.session_id}`);
    
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
    
    console.log(`[SUCCESS] Updated participant ${participantId} successfully`);
    
    // Se il partecipante ha completato, controlliamo se tutti hanno completato
    if (completed) {
      try {
        // Utilizziamo l'ID sessione già ottenuto dalla verifica iniziale
        const sessionId = participantData.session_id;
        
        // Ora controlliamo se tutti i partecipanti hanno completato
        const { data: allParticipants } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId);
          
        if (allParticipants && allParticipants.length > 0) {
          console.log(`[INFO] Checking completion status for all ${allParticipants.length} participants in session ${sessionId}`);
          
          const allCompleted = allParticipants.every(p => p.completed);
          const completedCount = allParticipants.filter(p => p.completed).length;
          
          console.log(`[INFO] ${completedCount}/${allParticipants.length} participants have completed the quiz`);
          
          // Se tutti hanno completato, marca la sessione come completata
          if (allCompleted) {
            console.log('[INFO] All participants completed, marking session as completed');
            await completeQuizSession(sessionId);
          } else {
            console.log('[INFO] Not all participants completed yet, session remains active');
          }
        }
      } catch (err) {
        console.error('[ERROR] Error checking completion status:', err);
      }
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

// Test database access
export const testDatabaseAccess = async (): Promise<boolean> => {
  try {
    // Try to get all quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .limit(1);
    
    if (quizzesError) {
      console.error('[ERROR] Failed to access quizzes:', quizzesError);
      return false;
    }
    
    console.log('[DEBUG] Successfully accessed quizzes table');
    console.log('[DEBUG] Number of quizzes:', quizzes?.length || 0);
    
    // Try to get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('[ERROR] Failed to access quiz_sessions:', sessionsError);
      return false;
    }
    
    console.log('[DEBUG] Successfully accessed quiz_sessions table');
    console.log('[DEBUG] Number of sessions:', sessions?.length || 0);
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to test database access:', error);
    return false;
  }
};
