import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  PlayCircle, 
  Clock, 
  RefreshCw, 
  Copy, 
  Share2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { 
  getQuizSessionByCode, 
  getSessionParticipants, 
  startQuizSession, 
  subscribeToSessionUpdates,
  getQuizQuestions,
  joinQuizSession
} from '@/services/multiplayerService';
import { QuizSession, SessionParticipant } from '@/types/multiplayer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CatTutor from '@/components/CatTutor';
import { QuizQuestion } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const MultiplayerHost = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const sessionUrl = sessionCode ? `${window.location.origin}/quiz/multiplayer/join/${sessionCode}` : '';
  
  // Get the session and participants data
  useEffect(() => {
    let isMounted = true;
    
    const fetchSessionData = async () => {
      if (!sessionCode) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching host session with code:', sessionCode);
        const formattedCode = sessionCode.trim().toUpperCase();
        const sessionData = await getQuizSessionByCode(formattedCode);
        
        if (!sessionData) {
          toast({
            title: 'Session not found',
            description: 'The session could not be found',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        if (isMounted) setSession(sessionData);
        
        if (sessionData.status === 'active') {
          // If the session is already active, go to the quiz
          navigate(`/quiz/multiplayer/session/${formattedCode}`);
          return;
        }
        
        // Ora recuperiamo i partecipanti (dovrebbe includere l'host aggiunto dal service)
        console.log(`[DEBUG] Fetching participants for session ${sessionData.id} after ensuring host was added during creation.`);
        const participantsData = await getSessionParticipants(sessionData.id);
        if (isMounted) setParticipants(participantsData);
        
        // Get quiz questions
        const questionsData = await getQuizQuestions(sessionData.quiz_id);
        if (isMounted) setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching session data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchSessionData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [sessionCode, navigate, toast, user]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!session) return;
    
    const cleanup = subscribeToSessionUpdates(
      session.id,
      (updatedParticipants) => {
        setParticipants(updatedParticipants);
      },
      (updatedSession) => {
        setSession(updatedSession);
        
        // If the session becomes active, navigate to the quiz
        if (updatedSession.status === 'active') {
          navigate(`/quiz/multiplayer/session/${sessionCode}`);
        }
      }
    );
    
    return cleanup;
  }, [session, sessionCode, navigate]);
  
  // Aggiunta: ricarica automatica della lista partecipanti ogni 3 secondi
  useEffect(() => {
    if (!session) return;
    
    const intervalId = setInterval(async () => {
      try {
        const refreshedParticipants = await getSessionParticipants(session.id);
        setParticipants(refreshedParticipants);
        console.log("[REFRESH] Participants list refreshed automatically");
      } catch (err) {
        console.error("Error refreshing participants:", err);
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [session]);
  
  const handleStartQuiz = async () => {
    if (!session) return;
    
    if (participants.length === 0) {
      toast({
        title: 'No participants',
        description: 'Wait for at least one participant to join',
        variant: 'destructive',
      });
      return;
    }
    
    setIsStarting(true);
    try {
      const success = await startQuizSession(session.id);
      
      if (success) {
        toast({
          title: 'Quiz started!',
          description: 'The quiz has been started successfully',
        });
        navigate(`/quiz/multiplayer/session/${sessionCode}`);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start quiz',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };
  
  const copySessionCode = () => {
    if (!sessionCode) return;
    
    navigator.clipboard.writeText(sessionCode);
    setCopySuccess(true);
    toast({
      title: 'Copied!',
      description: 'Session code copied to clipboard',
    });
    
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };
  
  const shareSessionLink = () => {
    if (!sessionUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join my quiz!',
        text: `Join my quiz session with code: ${sessionCode}`,
        url: sessionUrl,
      })
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(sessionUrl);
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">Loading your session...</h2>
          <p className="text-muted-foreground mb-8">Setting up the multiplayer experience</p>
          <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
        <p className="text-muted-foreground mb-8">The quiz session you're looking for doesn't exist</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Waiting for players</h1>
        <p className="text-muted-foreground">
          Share the code below with friends to let them join your quiz
        </p>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium mb-2">Session Code</h2>
          <div className="flex justify-center items-center gap-4">
            <div className="px-6 py-3 bg-gray-100 rounded-lg font-mono text-3xl font-bold tracking-widest">
              {sessionCode}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copySessionCode}
              aria-label="Copy session code"
            >
              {copySuccess ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="flex items-center gap-2 font-medium mb-3">
              <Users className="h-5 w-5 text-cat" />
              <span>Players ({participants.length})</span>
            </h3>
            
            <div className="border rounded-lg overflow-hidden">
              {participants.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  <ul className="divide-y">
                    {participants.map((participant, index) => (
                      <li key={participant.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cat flex items-center justify-center text-white font-medium">
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{participant.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-2">Waiting for players to join...</p>
                  <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
                </div>
              )}
            </div>
            
            {session && (
              <div className="flex justify-between mt-3">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-1/2 mr-1"
                  onClick={async () => {
                    if (!session) return;
                    const participantsData = await getSessionParticipants(session.id);
                    setParticipants(participantsData);
                    toast({
                      title: 'Aggiornato',
                      description: `${participantsData.length} partecipanti trovati`,
                    });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aggiorna Lista
                </Button>
                
                <Button 
                  variant="default"
                  size="sm" 
                  className="w-1/2 ml-1 bg-cat hover:bg-cat/90 text-white"
                  onClick={async () => {
                    if (!session) return;
                    
                    try {
                      const hostUsername = user?.email?.split('@')[0] || 'Host';
                      
                      const { data, error } = await supabase
                        .from('session_participants')
                        .insert({
                          session_id: session.id,
                          user_id: user?.id,
                          username: hostUsername,
                          score: 0,
                          completed: false,
                          answers: []
                        });
                      
                      if (error) {
                        console.error('Errore:', error);
                        toast({
                          title: 'Errore',
                          description: error.message,
                          variant: 'destructive',
                        });
                      } else {
                        toast({
                          title: 'Successo',
                          description: 'Aggiunto come host',
                        });
                        
                        const participantsData = await getSessionParticipants(session.id);
                        setParticipants(participantsData);
                      }
                    } catch (err) {
                      console.error('Errore:', err);
                    }
                  }}
                >
                  Unisciti Come Host
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="flex items-center gap-2 font-medium mb-3">
              <Share2 className="h-5 w-5 text-cat" />
              <span>Share with Friends</span>
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-700">
                  Players can join by entering the code or using the direct link below.
                </p>
              </div>

              {/* Direct Link Display and Copy Button */}
              {sessionUrl && (
                <div className="space-y-2">
                  <Label htmlFor="session-link-display">Direct Join Link:</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="session-link-display"
                      type="text" 
                      value={sessionUrl} 
                      readOnly 
                      className="bg-gray-100 border-gray-300"
                    />
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(sessionUrl);
                        toast({
                          title: 'Link Copied!',
                          description: 'The join link has been copied to your clipboard.',
                        });
                      }}
                      aria-label="Copy join link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Existing Share Button (uses navigator.share or fallback to copy link) */}
              <Button 
                variant="outline" 
                className="w-full flex justify-center items-center gap-2" // Centered content
                onClick={shareSessionLink} // This function already handles navigator.share and fallback
              >
                <Share2 className="h-4 w-4" />
                <span>Share via... (Recommended)</span>
              </Button>
              
              <div className="flex gap-2 items-center">
                <Clock className="h-4 w-4 text-cat" />
                <span className="text-xs text-muted-foreground">
                  Session automatically expires after 24 hours
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <PlayCircle className="h-5 w-5 text-cat" />
                <span>Start Quiz</span>
              </h3>
              
              <Button 
                className="w-full" 
                onClick={handleStartQuiz}
                disabled={isStarting || participants.length === 0}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Quiz ({questions.length} questions)
                  </>
                )}
              </Button>
              
              {participants.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Wait for at least one player to join
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <CatTutor 
          message="Waiting for your friends to join the quiz session. Once everyone is ready, click 'Start Quiz' to begin!" 
          emotion="happy"
        />
      </div>
    </div>
  );
};

export default MultiplayerHost;
