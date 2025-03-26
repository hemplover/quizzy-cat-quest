import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, BookOpen, Users, RefreshCw } from 'lucide-react';
import { QuizQuestion } from '@/types/quiz';
import { getQuiz, getQuizzes } from '@/services/quizService';
import { useAuth } from '@/contexts/AuthContext';
import CatTutor from '@/components/CatTutor';
import CreateQuizSession from '@/components/quiz/CreateQuizSession';
import JoinQuizSession from '@/components/quiz/JoinQuizSession';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      try {
        const fetchedQuizzes = await getQuizzes();
        setQuizzes(fetchedQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch quizzes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [toast]);

  useEffect(() => {
    const quizId = searchParams.get('quizId');
    if (quizId) {
      handleQuizSelect(quizId);
    }
  }, [searchParams]);

  const handleQuizSelect = async (quizId: string) => {
    try {
      const quiz = await getQuiz(quizId);
      setSelectedQuiz(quiz?.questions || null);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quiz',
        variant: 'destructive',
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuiz(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
            <p className="text-muted-foreground">Test your knowledge with generated quizzes</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <JoinQuizSession />
            <Button 
              onClick={() => navigate('/subjects')} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create Quiz
            </Button>
          </div>
        </div>
        
        <CatTutor 
          message="Explore a variety of quizzes or create your own to challenge yourself and others!" 
          emotion="excited"
        />
        
        <Tabs defaultValue="recent" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Recent Quizzes
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              By Subject
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading quizzes...</p>
              </div>
            ) : null}
            
            {!isLoading && quizzes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't created any quizzes yet</p>
                <Button onClick={() => navigate('/subjects')}>
                  Create your first quiz
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="glass-card p-6 rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleQuizSelect(quiz.id)}
                  >
                    <CardTitle className="mb-2 line-clamp-1">{quiz.title}</CardTitle>
                    <div className="text-sm text-muted-foreground mb-4">
                      {quiz.questions.length} questions
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuizSelect(quiz.id);
                        }}
                      >
                        Take Quiz
                      </Button>
                      
                      <CreateQuizSession 
                        quizId={quiz.id}
                        onSuccess={(sessionCode) => {
                          navigate(`/quiz/multiplayer/host/${sessionCode}`);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="subjects" className="mt-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                This feature is coming soon!
              </p>
              <Button disabled>
                Browse by Subject
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {isModalOpen && selectedQuiz ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="glass-card p-8 rounded-xl max-w-3xl w-full">
              <h2 className="text-2xl font-bold mb-4">Quiz Questions</h2>
              <ul>
                {selectedQuiz.map((question, index) => (
                  <li key={index} className="mb-4">
                    <strong>Question {index + 1}:</strong> {question.question}
                  </li>
                ))}
              </ul>
              <div className="text-center mt-6">
                <Button onClick={closeModal}>Close</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Quiz;
