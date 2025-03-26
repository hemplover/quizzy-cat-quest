
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinQuizSession, getQuizSessionByCode, normalizeSessionCode } from '@/services/multiplayerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, LogIn, AlertCircle, InfoIcon, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface JoinQuizSessionProps {
  initialCode?: string;
}

const JoinQuizSession: React.FC<JoinQuizSessionProps> = ({ initialCode = '' }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [sessionCode, setSessionCode] = useState(initialCode);
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [sessionCheckResult, setSessionCheckResult] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const checkSessionExists = async () => {
    if (!sessionCode.trim()) {
      setErrorMessage('Please enter a session code first');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);
    setDebugInfo(null);
    setSessionCheckResult(null);

    try {
      const normalizedCode = normalizeSessionCode(sessionCode);
      console.log(`[DEBUG] Checking if session exists: "${normalizedCode}"`);
      
      const sessionExists = await getQuizSessionByCode(normalizedCode);
      
      if (sessionExists) {
        setSessionCheckResult(`Session found! Status: ${sessionExists.status}`);
        toast({
          title: 'Session exists',
          description: `Found session with code ${normalizedCode}`,
        });
      } else {
        setErrorMessage(`Session with code "${normalizedCode}" was not found.`);
        setSessionCheckResult(`No session found with code: ${normalizedCode}`);
        toast({
          title: 'Session not found',
          description: 'Could not find a session with that code.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[ERROR] Error checking session:', error);
      setErrorMessage(`Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleJoinSession = async () => {
    // Reset any previous error messages
    setErrorMessage(null);
    setDebugInfo(null);
    
    if (!sessionCode.trim()) {
      setErrorMessage('Session code is required');
      toast({
        title: 'Session code required',
        description: 'Please enter a valid session code',
        variant: 'destructive',
      });
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Username is required');
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // Try to join the session - the service will normalize the code
      const normalizedCode = normalizeSessionCode(sessionCode);
      console.log(`[DEBUG] Attempting to join session with code: "${normalizedCode}"`);
      
      // First check if session exists
      const sessionExists = await getQuizSessionByCode(normalizedCode);
      if (!sessionExists) {
        setErrorMessage(`Session with code "${normalizedCode}" not found. Please check the code and try again.`);
        setDebugInfo(`We tried to find a session with code "${normalizedCode}" but couldn't find it. Make sure the code was entered correctly.`);
        toast({
          title: 'Session not found',
          description: 'Could not find a quiz session with that code. Please check the code and try again.',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }
      
      // If session exists, try to join
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
        
        // Use the session code from the result to ensure we have the correct format
        navigate(`/quiz/multiplayer/player/${result.session.session_code}`);
      } else {
        setErrorMessage('Failed to join quiz session. The session may have already started or ended.');
        toast({
          title: 'Cannot join session',
          description: 'The session may have already started or ended',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[ERROR] Error joining session:', error);
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Handle input change for session code 
  const handleSessionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow alphanumeric characters and auto convert to uppercase
    setSessionCode(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    // Clear error message when user types
    if (errorMessage) setErrorMessage(null);
    if (debugInfo) setDebugInfo(null);
    if (sessionCheckResult) setSessionCheckResult(null);
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowDialog(true)} 
        className="flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        Join a Quiz
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a quiz session</DialogTitle>
            <DialogDescription>
              Enter the session code and a username to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-code">Session Code</Label>
              <div className="flex gap-2">
                <Input
                  id="session-code"
                  value={sessionCode}
                  onChange={handleSessionCodeChange}
                  placeholder="Enter 6-character code"
                  className="uppercase"
                  maxLength={6}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={checkSessionExists}
                  disabled={isChecking || !sessionCode.trim()}
                >
                  {isChecking ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The 6-digit code provided by the quiz host (no hyphens or special characters)
              </p>
            </div>
            
            {sessionCheckResult && (
              <div className={`p-3 rounded-md flex items-start gap-2 ${
                sessionCheckResult.includes('found') && !sessionCheckResult.includes('No session') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{sessionCheckResult}</p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="username">Your Name</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                  if (debugInfo) setDebugInfo(null);
                }}
                placeholder="Enter a username"
                maxLength={20}
              />
            </div>
            
            {errorMessage && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}
            
            {debugInfo && (
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800 flex items-start gap-2">
                <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                <p>{debugInfo}</p>
              </div>
            )}
            
            <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
              <h4 className="font-medium text-amber-800 flex items-center gap-1 mb-1">
                <InfoIcon className="w-4 h-4" />
                Troubleshooting Tips
              </h4>
              <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                <li>Make sure the session code is exactly 6 characters</li>
                <li>Check that the quiz creator has started the session but not ended it</li>
                <li>Ensure you're entering the code exactly as shown by the host</li>
                <li>The code should only contain letters and numbers (no spaces or special characters)</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinSession}
              disabled={isJoining || !sessionCode.trim() || !username.trim()}
              className="flex items-center gap-2"
            >
              {isJoining ? 'Joining...' : 'Join Quiz'}
              <Users className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JoinQuizSession;
