
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinQuizSession, getQuizSessionByCode } from '@/services/multiplayerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, LogIn } from 'lucide-react';
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
  const [showDialog, setShowDialog] = useState(false);
  const [sessionCode, setSessionCode] = useState(initialCode);
  const [username, setUsername] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      toast({
        title: 'Session code required',
        description: 'Please enter a valid session code',
        variant: 'destructive',
      });
      return;
    }

    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // First check if the session exists
      const formattedCode = sessionCode.trim().toUpperCase();
      console.log('Attempting to join session with code:', formattedCode);
      
      const session = await getQuizSessionByCode(formattedCode);
      
      if (!session) {
        toast({
          title: 'Invalid session',
          description: 'The session code you entered is invalid or the session has ended',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }
      
      if (session.status !== 'waiting') {
        toast({
          title: 'Session unavailable',
          description: session.status === 'active' 
            ? 'This session has already started' 
            : 'This session has ended',
          variant: 'destructive',
        });
        
        if (session.status === 'active') {
          navigate(`/quiz/multiplayer/session/${formattedCode}`);
        }
        
        setIsJoining(false);
        return;
      }
      
      // Now try to join the session
      const result = await joinQuizSession(
        formattedCode,
        username.trim(),
        user?.id || null
      );
      
      if (result) {
        toast({
          title: 'Joined quiz session!',
          description: `You've joined the quiz as ${username}`,
        });
        
        navigate(`/quiz/multiplayer/player/${formattedCode}`);
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
              <Input
                id="session-code"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder="Enter 6-character code"
                className="uppercase"
                maxLength={6}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Your Name</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                maxLength={20}
              />
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
