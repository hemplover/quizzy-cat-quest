
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogIn, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizSessionByCode, joinQuizSession } from '@/services/multiplayerService';
import CatTutor from '@/components/CatTutor';

const MultiplayerJoin = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [username, setUsername] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const checkSession = async () => {
      if (!sessionCode) {
        navigate('/');
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Checking session with code:', sessionCode);
        
        const session = await getQuizSessionByCode(sessionCode);
        
        if (session) {
          console.log('Session found:', session);
          setSessionExists(true);
          
          // If the session is already active or completed, redirect to the relevant page
          if (session.status === 'active') {
            navigate(`/quiz/multiplayer/session/${session.session_code}`);
            return;
          } else if (session.status === 'completed') {
            toast({
              title: 'Session ended',
              description: 'This quiz session has already ended',
              variant: 'destructive',
            });
            navigate('/');
            return;
          }
        } else {
          console.log('No session found with code:', sessionCode);
          toast({
            title: 'Invalid session',
            description: 'Invalid session code',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: 'Error',
          description: 'Failed to check session',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [sessionCode, navigate, toast]);
  
  const handleJoinSession = async () => {
    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }
    
    if (!sessionCode) {
      return;
    }
    
    setIsJoining(true);
    try {
      const result = await joinQuizSession(
        sessionCode,
        username.trim(),
        user?.id || null
      );
      
      if (result) {
        toast({
          title: 'Joined quiz session!',
          description: `You've joined the quiz as ${username}`,
        });
        
        // Use the session code from the result to ensure we have the correct format
        navigate(`/quiz/multiplayer/player/${result.session.session_code}`);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to join quiz session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">Checking session...</h2>
          <p className="text-muted-foreground mb-8">Verifying if the session exists</p>
          <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!sessionExists) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
        <p className="text-muted-foreground mb-8">The quiz session you're looking for doesn't exist</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Join Quiz Session</h1>
        <p className="text-muted-foreground">
          You've been invited to join a multiplayer quiz!
        </p>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cat" />
              <h2 className="text-xl font-medium">Session Details</h2>
            </div>
            <div className="px-3 py-1 bg-cat/10 text-cat rounded-full font-medium">
              {sessionCode?.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              This is how other players will see you in the leaderboard
            </p>
          </div>
          
          <Button
            onClick={handleJoinSession}
            disabled={isJoining || !username.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
            <LogIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <CatTutor 
          message="Ready to join this multiplayer quiz? Enter your name and get ready to compete with other players!" 
          emotion="happy"
        />
      </div>
      
      <div className="text-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MultiplayerJoin;
