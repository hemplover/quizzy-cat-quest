
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuizSession } from '@/services/multiplayerService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Share2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateQuizSessionProps {
  quizId: string;
  onSuccess?: (sessionCode: string) => void;
}

const CreateQuizSession: React.FC<CreateQuizSessionProps> = ({ quizId, onSuccess }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateSession = async () => {
    if (!quizId) {
      toast({
        title: 'Error',
        description: 'Invalid quiz ID',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const session = await createQuizSession(quizId, user?.id || null);
      
      if (session) {
        toast({
          title: 'Quiz session created!',
          description: `Session code: ${session.session_code}`,
        });
        
        if (onSuccess) {
          onSuccess(session.session_code);
        } else {
          navigate(`/quiz/multiplayer/host/${session.session_code}`);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create quiz session',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowDialog(true)} 
        className="flex items-center gap-2"
      >
        <Users className="w-4 h-4" />
        Play with Friends
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a multiplayer quiz</DialogTitle>
            <DialogDescription>
              Create a quiz session to play with friends. You'll get a code to share.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Players will be able to join your session and play the quiz simultaneously. 
                Everyone will see the final leaderboard when completed.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? 'Creating...' : 'Create Session'}
              <Share2 className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateQuizSession;
