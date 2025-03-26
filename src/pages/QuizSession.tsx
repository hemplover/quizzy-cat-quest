
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getQuiz, gradeQuiz } from '@/services/quizService';
import { QuizQuestion, QuizResults, Quiz } from '@/types/quiz';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import CatTutor from '@/components/CatTutor';

const QuizSession = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | number)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      
      try {
        setIsLoading(true);
        const quizData = await getQuiz(quizId);
        
        if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
          toast({
            title: 'Error',
            description: 'Quiz not found or invalid',
            variant: 'destructive',
          });
          navigate('/quiz');
          return;
        }
        
        setQuiz(quizData);
        setQuestions(quizData.questions as QuizQuestion[]);
        setAnswers(new Array(quizData.questions.length).fill(''));
        
        // Set a time limit of 15 minutes
        setTimeRemaining(15 * 60);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz',
          variant: 'destructive',
        });
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, navigate, toast]);

  // Timer for quiz
  useEffect(() => {
    if (timeRemaining === null || results || isLoading) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, results, isLoading]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerChange = (value: string | number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    try {
      const quizResults = await gradeQuiz(questions, answers);
      
      if (quizResults) {
        setResults(quizResults);
        toast({
          title: 'Quiz completed!',
          description: 'Your quiz has been submitted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to grade quiz',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong while submitting your quiz',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-cat border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium mb-2">Loading quiz...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your questions</p>
        </div>
      </div>
    );
  }

  if (results) {
    // Show quiz results
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="glass-card p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Your Score</span>
              <span className="text-lg font-medium">
                {results.total_points}/{results.max_points} Points
                ({Math.round(results.punteggio_totale * 100)}%)
              </span>
            </div>
            <Progress 
              value={results.punteggio_totale * 100} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-6">
            {results.risultati.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.corretto === true ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.corretto === true ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-medium">Question {index + 1}: {result.domanda}</h3>
                    <p className="text-sm mt-1">Your answer: {result.risposta_utente}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Explanation:</span> {result.spiegazione}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-8">
            <Button onClick={() => navigate('/quiz')}>
              Return to Quizzes
            </Button>
            
            {quiz && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setResults(null);
                  setCurrentQuestionIndex(0);
                  setAnswers(new Array(questions.length).fill(''));
                  setTimeRemaining(15 * 60);
                }}
              >
                Retake Quiz
              </Button>
            )}
          </div>
        </div>
        
        <CatTutor 
          message={results.feedback_generale || "Good job completing the quiz! Review your answers to learn from any mistakes."} 
          emotion={results.punteggio_totale > 0.7 ? "happy" : "thinking"}
        />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl font-medium mb-4">Quiz not found</h2>
        <Button onClick={() => navigate('/quiz')}>Back to Quizzes</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">
            {currentQuestion.question}
          </h3>
          
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <RadioGroup 
              value={answers[currentQuestionIndex]?.toString() || ''} 
              onValueChange={(value) => handleAnswerChange(parseInt(value, 10))}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`} 
                    />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
          
          {currentQuestion.type === 'true-false' && (
            <RadioGroup 
              value={answers[currentQuestionIndex]?.toString() || ''} 
              onValueChange={(value) => handleAnswerChange(parseInt(value, 10))}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </div>
            </RadioGroup>
          )}
          
          {currentQuestion.type === 'open-ended' && (
            <Textarea 
              value={answers[currentQuestionIndex]?.toString() || ''} 
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your answer..."
              className="min-h-[120px]"
            />
          )}
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button 
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
      
      <CatTutor 
        message="Take your time to read each question carefully. You can navigate between questions and change your answers before submitting." 
        emotion="thinking"
      />
    </div>
  );
};

export default QuizSession;
