
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, Clock, Loader2 } from 'lucide-react';
import { 
  getQuizSessionByCode, 
  getSessionParticipants, 
  subscribeToSessionUpdates 
} from '@/services/multiplayerService';
import { QuizSession, SessionParticipant } from '@/types/multiplayer';
import { Button } from '@/components/ui/button';
import CatTutor from '@/components/CatTutor';

const MultiplayerPlayer = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Get the session and participants data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionCode) return;
      
      try {
        setIsLoading(true);
        const sessionData = await getQuizSessionByCode(sessionCode);
        
        if (!sessionData) {
          toast.error('Session not found');
          navigate('/');
          return;
        }
        
        setSession(sessionData);
        
        if (sessionData.status === 'active') {
          // If the session is already active, go to the quiz
          navigate(`/quiz/multiplayer/session/${sessionCode}`);
          return;
        }
        
        const participantsData = await getSessionParticipants(sessionData.id);
        setParticipants(participantsData);
      } catch (error) {
        console.error('Error fetching session data:', error);
        toast.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionCode, navigate]);
  
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
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">Joining session...</h2>
          <p className="text-muted-foreground mb-8">Getting ready for the multiplayer quiz</p>
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
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Waiting for host</h1>
        <p className="text-muted-foreground">
          The quiz will start when the host begins the session
        </p>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Session <span className="font-mono">{sessionCode}</span></h2>
          <div className="flex items-center gap-2 text-cat">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Waiting for quiz to start</span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-cat animate-spin mr-2" />
            <span className="text-lg">The host is preparing the quiz...</span>
          </div>
        </div>
        
        <div>
          <h3 className="flex items-center gap-2 font-medium mb-3">
            <Users className="h-5 w-5 text-cat" />
            <span>Players ({participants.length})</span>
          </h3>
          
          <div className="border rounded-lg overflow-hidden">
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
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <CatTutor 
          message="The host is preparing the quiz. Once they start, you'll be able to answer the questions. Good luck!" 
          emotion="happy"
        />
      </div>
      
      <div className="text-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          Leave Session
        </Button>
      </div>
    </div>
  );
};

export default MultiplayerPlayer;
