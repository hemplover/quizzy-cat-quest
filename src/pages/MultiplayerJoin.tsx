import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogIn, Users, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizSessionByCode, joinQuizSession, normalizeSessionCode } from '@/services/multiplayerService';
import CatTutor from '@/components/CatTutor';

const MultiplayerJoin = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [username, setUsername] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [normalizedCode, setNormalizedCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const checkSession = async (code: string) => {
    if (!code) {
      navigate('/');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setDebugInfo(null);
      
      // Clean the session code
      const cleanCode = normalizeSessionCode(code);
      setNormalizedCode(cleanCode);
      
      console.log(`[DEBUG] Checking session with code: "${cleanCode}"`);
      
      // Try to get the session
      const session = await getQuizSessionByCode(cleanCode);
      
      if (session) {
        console.log(`[DEBUG] Session found: ID=${session.id}, code="${session.session_code}", status=${session.status}`);
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
        console.log(`[DEBUG] No session found with code: "${cleanCode}"`);
        setDebugInfo(`We tried connecting with code "${cleanCode}" but couldn't find an active session.`);
        setErrorMessage(`Could not find a session with code: ${cleanCode}. The session may have been deleted or the code is incorrect.`);
        toast({
          title: 'Invalid session',
          description: `Could not find a session with code: ${cleanCode}`,
          variant: 'destructive',
        });
        
        // Keep the user on the page but show the error
        setSessionExists(false);
      }
    } catch (error) {
      console.error('[ERROR] Error checking session:', error);
      setErrorMessage(`Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: 'Error',
        description: 'Failed to check session',
        variant: 'destructive',
      });
      setSessionExists(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (sessionCode) {
      checkSession(sessionCode);
    }
  }, [sessionCode, navigate, toast]);
  
  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    await checkSession(normalizedCode || sessionCode || '');
    setIsRefreshing(false);
  };
  
  const handleJoinSession = async () => {
    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }
    
    if (!normalizedCode) {
      return;
    }
    
    setIsJoining(true);
    setErrorMessage(null);
    setDebugInfo(null);
    
    try {
      // Double check that the session still exists and is in waiting status
      const sessionCheck = await getQuizSessionByCode(normalizedCode);
      if (!sessionCheck) {
        setErrorMessage(`Session with code ${normalizedCode} no longer exists. It may have been deleted.`);
        setDebugInfo("The session wasn't found when we tried to join. It might have been deleted or the code may be incorrect.");
        toast({
          title: 'Session not found',
          description: 'The session no longer exists',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }
      
      if (sessionCheck.status !== 'waiting') {
        setErrorMessage(`Session is ${sessionCheck.status}. You can only join sessions that are in waiting status.`);
        toast({
          title: 'Cannot join session',
          description: `The session is ${sessionCheck.status}`,
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }
      
      console.log(`[DEBUG] Joining session: ID=${sessionCheck.id}, code="${sessionCheck.session_code}"`);
      
      const result = await joinQuizSession(
        normalizedCode,
        username.trim(),
        user?.id || null
      );
      
      if (result) {
        toast({
          title: 'Joined quiz session!',
          description: `You've joined the quiz as ${username}`,
        });
        
        console.log(`[DEBUG] Successfully joined, redirecting to player view with code: "${result.session.session_code}"`);
        // Use the session code from the result to ensure we have the correct format
        navigate(`/quiz/multiplayer/player/${result.session.session_code}`);
      } else {
        setErrorMessage('Failed to join session. Please try again or contact the quiz host.');
        setDebugInfo("We couldn't join you to the session even though it exists. There might be a problem with the session configuration.");
        toast({
          title: 'Error',
          description: 'Failed to join quiz session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[ERROR] Error joining session:', error);
      setErrorMessage(`Error joining session: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        <p className="text-muted-foreground mb-8">
          {errorMessage || "The quiz session you're looking for doesn't exist"}
        </p>
        
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-blue-800 text-sm max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
              <p>{debugInfo}</p>
            </div>
          </div>
        )}
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-amber-800 text-sm max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-medium mb-1">Troubleshooting tips:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check if you've entered the correct session code</li>
                <li>Ask the host to verify the session is still active</li>
                <li>Try joining using the JoinQuizSession component from the homepage</li>
                <li>Make sure the code doesn't contain any special characters (letters and numbers only)</li>
                <li>Session codes are 6 characters long and case-insensitive</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={() => navigate('/')}>Go Home</Button>
          <Button 
            variant="outline" 
            onClick={handleRefreshSession}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </div>
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
              {normalizedCode}
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
          
          {errorMessage && (
            <div className="bg-destructive/15 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}
          
          {debugInfo && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800 flex items-start gap-2">
              <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
              <p>{debugInfo}</p>
            </div>
          )}
          
          <Button
            onClick={handleJoinSession}
            disabled={isJoining || !username.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
            <LogIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Session Status'}
            <RefreshCw className="w-4 h-4" />
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
