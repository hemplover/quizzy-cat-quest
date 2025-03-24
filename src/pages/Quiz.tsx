
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import CatTutor from '@/components/CatTutor';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { gradeQuiz, saveQuizResults } from '@/services/quizService';

interface BaseQuestion {
  id: number;
  type: string;
  question: string;
  correctAnswer: string | number;
  explanation: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: number;
}

interface OpenEndedQuestion extends BaseQuestion {
  type: 'open-ended';
  correctAnswer: string;
}

type Question = MultipleChoiceQuestion | OpenEndedQuestion;

interface UserAnswer {
  questionId: number;
  userAnswer: string | number;
}

const catMessages = {
  correct: [
    "Purr-fect! You're getting this!",
    "Meow-velous work! That's exactly right!",
    "Look at you, almost as smart as a cat!",
    "Correct! You've earned a virtual head scratch!"
  ],
  incorrect: [
    "Oops! Even cats make mistakes sometimes.",
    "Not quite right. Let me clean my paw while you try again.",
    "That's not it. If I were you, I'd take a catnap and try again.",
    "Wrong answer! Don't worry, curiosity never killed the student."
  ],
  encouragement: [
    "You're doing great! Keep it up!",
    "Focus! The answer is within your whiskers' reach.",
    "Take your time, I've got nine lives to wait.",
    "You've got this! I believe in you!"
  ],
  completion: [
    "Fantastic job completing the quiz! You're truly the cat's meow!",
    "Quiz finished! Time for a well-deserved catnap.",
    "You've reached the end! Your knowledge is as sharp as my claws.",
    "All done! Your brain is certainly not a hairball today!"
  ]
};

const mockQuestions: Question[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: 'What is the primary function of mitochondria in a cell?',
    options: [
      'Protein synthesis',
      'Energy production',
      'Cell division',
      'Waste removal'
    ],
    correctAnswer: 1,
    explanation: 'Mitochondria are known as the "powerhouse of the cell" because they generate most of the cell\'s supply of ATP, used as a source of chemical energy.'
  },
  {
    id: 2,
    type: 'true-false',
    question: 'The Great Wall of China is visible from space with the naked eye.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'Contrary to popular belief, the Great Wall of China is not visible from space with the naked eye. It requires at least optical aids to be seen from low Earth orbit.'
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: 'Which of the following is NOT a primary color in the RGB color model?',
    options: [
      'Red',
      'Green',
      'Yellow',
      'Blue'
    ],
    correctAnswer: 2,
    explanation: 'In the RGB color model, the primary colors are Red, Green, and Blue. Yellow is a secondary color created by mixing red and green light.'
  },
  {
    id: 4,
    type: 'open-ended',
    question: 'Explain the concept of supply and demand in economics.',
    correctAnswer: 'Supply and demand is an economic model that explains how prices are determined in a market. When demand increases and supply remains unchanged, a shortage occurs, leading to a higher price. When supply increases and demand remains unchanged, a surplus occurs, leading to a lower price.',
    explanation: 'Supply and demand is a fundamental concept in economics that helps explain price determination in markets.'
  },
  {
    id: 5,
    type: 'multiple-choice',
    question: 'Which planet has the most moons in our solar system?',
    options: [
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune'
    ],
    correctAnswer: 1,
    explanation: 'Saturn has the most confirmed moons, with 82 confirmed moons compared to Jupiter\'s 79 (as of recent data).'
  }
];

const Quiz = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [catMessage, setCatMessage] = useState(catMessages.encouragement[0]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [aiGradingResults, setAiGradingResults] = useState<any>(null);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const quizDataStr = sessionStorage.getItem('quizData');
        
        if (!quizDataStr) {
          toast.error("No quiz data found. Please create a quiz first.");
          navigate('/upload');
          return;
        }
        
        const storedQuestionsStr = sessionStorage.getItem('quizQuestions');
        if (storedQuestionsStr) {
          const parsedQuestions = JSON.parse(storedQuestionsStr);
          
          // Ensure all questions have an ID for tracking user answers
          const questionsWithIds = parsedQuestions.map((q: any, index: number) => {
            if (!q.id) {
              return { ...q, id: index + 1 };
            }
            return q;
          });
          
          setQuestions(questionsWithIds);
          console.log("Loaded questions:", questionsWithIds);
        } else {
          setQuestions(mockQuestions);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        toast.error("Failed to load quiz. Please try again.");
        navigate('/upload');
      }
    };
    
    fetchQuestions();
  }, [navigate]);
  
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  useEffect(() => {
    if (!quizCompleted && !isLoading && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizCompleted, isLoading, questions]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (!isAnswerSubmitted && !isLoading && questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * catMessages.encouragement.length);
      setCatMessage(catMessages.encouragement[randomIndex]);
    }
  }, [currentQuestionIndex, isAnswerSubmitted, isLoading, questions]);

  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionIndex);
    }
  };

  const handleOpenEndedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOpenEndedAnswer(e.target.value);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    
    if (currentQuestion.type === 'open-ended') {
      if (openEndedAnswer.trim().length < 10) {
        toast.error("Please provide a more detailed answer");
        return;
      }
      
      // For open-ended questions, we don't determine correctness immediately
      // We'll let the AI grade it later
      setIsCorrect(null);
      
      // Store the answer with the question ID
      setUserAnswers(prev => [...prev, {
        questionId: currentQuestion.id,
        userAnswer: openEndedAnswer
      }]);
      
      console.log(`Submitted open-ended answer for question ${currentQuestion.id}:`, openEndedAnswer);
    } else {
      if (selectedOption === null) {
        toast.error("Please select an answer");
        return;
      }
      
      const isCorrectAnswer = selectedOption === currentQuestion.correctAnswer;
      setIsCorrect(isCorrectAnswer);
      
      // Store the answer with the question ID
      setUserAnswers(prev => [...prev, {
        questionId: currentQuestion.id,
        userAnswer: selectedOption
      }]);
      
      console.log(`Submitted choice ${selectedOption} for question ${currentQuestion.id}:`, isCorrectAnswer ? "Correct" : "Incorrect");
    }
    
    setIsAnswerSubmitted(true);
    
    // Set cat message based on if we know correctness now
    if (currentQuestion.type !== 'open-ended') {
      const messageType = isCorrect ? 'correct' : 'incorrect';
      const randomIndex = Math.floor(Math.random() * catMessages[messageType].length);
      setCatMessage(catMessages[messageType][randomIndex]);
    } else {
      // For open-ended, just show an encouraging message
      const randomIndex = Math.floor(Math.random() * catMessages.encouragement.length);
      setCatMessage(`${catMessages.encouragement[randomIndex]} I'll grade your answer at the end.`);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setOpenEndedAnswer('');
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    
    if (isLastQuestion) {
      setQuizCompleted(true);
      handleQuizCompletion();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuizCompletion = async () => {
    setIsGrading(true);
    const randomIndex = Math.floor(Math.random() * catMessages.completion.length);
    setCatMessage(`${catMessages.completion[randomIndex]} I'm grading your answers now...`);
    
    try {
      // Log all user answers to ensure they're in the correct format
      console.log("Sending questions and answers for grading:", questions, userAnswers);
      
      // Make sure we have an answer for every question
      const answersForAllQuestions = questions.map(question => {
        const existingAnswer = userAnswers.find(answer => answer.questionId === question.id);
        if (existingAnswer) {
          return existingAnswer;
        }
        // If no answer was provided, create a default one
        if (question.type === 'open-ended') {
          return { questionId: question.id, userAnswer: '' };
        }
        return { questionId: question.id, userAnswer: -1 };
      });
      
      console.log("Prepared answers for grading:", answersForAllQuestions.map(a => a.userAnswer));
      
      // Send to API for grading
      const results = await gradeQuiz(questions, answersForAllQuestions);
      
      if (results) {
        console.log("Received grading results:", results);
        setAiGradingResults(results);
        
        // Get the quiz ID from session storage if available
        const quizDataStr = sessionStorage.getItem('quizData');
        if (quizDataStr) {
          const quizData = JSON.parse(quizDataStr);
          if (quizData.quizId) {
            // Save the results to the database
            await saveQuizResults(quizData.quizId, results);
          }
        }
        
        let totalPoints = 0;
        let maxPoints = 0;
        
        if (results.total_points !== undefined && results.max_points !== undefined) {
          totalPoints = results.total_points;
          maxPoints = results.max_points;
          console.log(`Using pre-calculated scores: ${totalPoints}/${maxPoints}`);
        } else {
          results.risultati.forEach((result: any, index: number) => {
            const question = questions[index];
            const pointValue = question.type === 'open-ended' ? 5 : 1;
            
            maxPoints += pointValue;
            totalPoints += result.punteggio;
            
            console.log(`Question ${index+1} (${question.type}): ${result.punteggio}/${pointValue} points`);
          });
          console.log(`Calculated scores: ${totalPoints}/${maxPoints}`);
        }
        
        results.total_points = totalPoints;
        results.max_points = maxPoints;
        
        const percentageScore = Math.round((totalPoints / maxPoints) * 100);
        setScore(percentageScore);
        console.log(`Final percentage score: ${percentageScore}%`);
      }
    } catch (error) {
      console.error("Error grading quiz:", error);
      toast.error("Failed to grade quiz. Please try again.");
    } finally {
      setIsGrading(false);
      const completionIndex = Math.floor(Math.random() * catMessages.completion.length);
      setCatMessage(catMessages.completion[completionIndex]);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setSelectedOption(null);
      setOpenEndedAnswer('');
      setIsAnswerSubmitted(false);
      setIsCorrect(null);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishQuiz = async () => {
    const results = {
      score,
      totalQuestions: questions.length,
      timeSpent,
      completedAt: new Date().toISOString(),
      aiGrading: aiGradingResults,
      totalPoints: aiGradingResults?.total_points || 0,
      maxPoints: aiGradingResults?.max_points || 0
    };
    
    const savedResults = JSON.parse(sessionStorage.getItem('quizResults') || '[]');
    sessionStorage.setItem('quizResults', JSON.stringify([...savedResults, results]));
    
    // Calculate and award XP
    const earnedXP = Math.round((results.totalPoints / results.maxPoints) * (questions.length * 10));
    
    toast.success(`Quiz completed! You earned ${earnedXP} XP!`);
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">Loading your quiz...</h2>
          <p className="text-muted-foreground mb-8">Preparing your personalized questions...</p>
          <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 rounded-xl mb-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
          
          {isGrading ? (
            <div className="my-8 text-center">
              <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">Analyzing your answers...</p>
              <p className="text-muted-foreground">Our AI cat professor is grading your work</p>
            </div>
          ) : (
            <>
              <div className="my-6 flex justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      className="text-gray-200" 
                      strokeWidth="8" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="42" 
                      cx="50" 
                      cy="50" 
                    />
                    <circle 
                      className="text-cat" 
                      strokeWidth="8" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="42" 
                      cx="50" 
                      cy="50" 
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{score}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-center items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Score: {score}% ({aiGradingResults?.total_points || 0}/{aiGradingResults?.max_points || questions.length} points)</span>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <Timer className="w-5 h-5 text-cat" />
                  <span>Time Spent: {formatTime(timeSpent)}</span>
                </div>
              </div>
            </>
          )}
          
          <div className="mb-8 relative">
            <CatTutor message={catMessage} />
          </div>
          
          <button
            onClick={handleFinishQuiz}
            className="cat-button mx-auto"
            disabled={isGrading}
          >
            View Your Progress
          </button>
        </div>
        
        {aiGradingResults && (
          <div className="glass-card p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">Detailed Feedback</h2>
            <div className="space-y-4">
              {aiGradingResults.risultati.map((result: any, index: number) => (
                <div key={index} className={cn(
                  "p-4 rounded-lg",
                  result.corretto === true || result.corretto === "Completamente" 
                    ? "bg-green-50 border border-green-100" 
                    : result.corretto === "Parzialmente" 
                      ? "bg-yellow-50 border border-yellow-100"
                      : "bg-red-50 border border-red-100"
                )}>
                  <p className="font-medium mb-1">{result.domanda}</p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Your answer:</span> {result.risposta_utente}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    {result.corretto === true || result.corretto === "Completamente" ? (
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : result.corretto === "Parzialmente" ? (
                      <div className="w-4 h-4 text-yellow-500 mt-0.5 flex items-center justify-center">
                        <span className="text-xs font-bold">!</span>
                      </div>
                    ) : (
                      <X className="w-4 h-4 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">
                        {result.corretto === true || result.corretto === "Completamente"
                          ? "Correct"
                          : result.corretto === "Parzialmente"
                          ? "Partially Correct"
                          : "Incorrect"}
                        {result.punteggio !== undefined && (
                          <span className="ml-1">
                            ({result.punteggio} {result.punteggio === 1 ? "point" : "points"})
                          </span>
                        )}
                      </p>
                      <p>{result.spiegazione}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {aiGradingResults.feedback_generale && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="font-medium mb-2">Overall Feedback</h3>
                <p className="text-sm">{aiGradingResults.feedback_generale}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Quiz</h1>
          <div className="flex items-center text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <div className="mx-2 h-1 w-1 rounded-full bg-muted-foreground"></div>
            <Timer className="w-4 h-4 mr-1" />
            <span>{formatTime(timeSpent)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <CatTutor 
            message={catMessage} 
            emotion={isCorrect === true ? "happy" : isCorrect === false ? "sad" : isAnswerSubmitted ? "thinking" : "neutral"} 
          />
        </div>
      </div>
      
      {currentQuestion && (
        <div className="glass-card p-6 rounded-xl mb-6">
          <div className="flex items-start gap-2 mb-4">
            <div className="bg-cat text-white w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mt-1">
              <span className="font-medium">{currentQuestionIndex + 1}</span>
            </div>
            <div>
              <div className="text-lg font-medium">{currentQuestion.question}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {currentQuestion.type === 'multiple-choice' && 'Select the best option'}
                {currentQuestion.type === 'true-false' && 'Select True or False'}
                {currentQuestion.type === 'open-ended' && 'Write your answer in the text box'}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={isAnswerSubmitted}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-colors",
                      isAnswerSubmitted && index === currentQuestion.correctAnswer && "bg-green-50 border-green-200",
                      isAnswerSubmitted && selectedOption === index && index !== currentQuestion.correctAnswer && "bg-red-50 border-red-200",
                      !isAnswerSubmitted && selectedOption === index && "bg-cat/10 border-cat",
                      !isAnswerSubmitted && selectedOption !== index && "hover:bg-gray-50",
                      !isAnswerSubmitted && "focus:outline-none focus:ring-2 focus:ring-cat focus:ring-offset-2"
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center mr-3 border",
                        selectedOption === index ? "border-cat bg-cat text-white" : "border-gray-300",
                        isAnswerSubmitted && index === currentQuestion.correctAnswer && "border-green-500 bg-green-500 text-white",
                        isAnswerSubmitted && selectedOption === index && index !== currentQuestion.correctAnswer && "border-red-500 bg-red-500 text-white"
                      )}>
                        {isAnswerSubmitted && index === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {isAnswerSubmitted && selectedOption === index && index !== currentQuestion.correctAnswer && (
                          <X className="w-4 h-4" />
                        )}
                        {!isAnswerSubmitted && selectedOption === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {currentQuestion.type === 'open-ended' && (
              <div>
                <textarea
                  className="w-full h-32 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
                  placeholder="Enter your answer here..."
                  value={openEndedAnswer}
                  onChange={handleOpenEndedChange}
                  disabled={isAnswerSubmitted}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum 10 characters required. The more detailed your answer, the better your score.
                </p>
              </div>
            )}
          </div>
          
          {isAnswerSubmitted && currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Explanation</p>
                  <p className="text-sm mt-1">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0 || isGrading}
          className={cn(
            "cat-button-secondary",
            (currentQuestionIndex === 0) && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        
        {!isAnswerSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={isGrading || 
              (currentQuestion?.type === 'open-ended' && openEndedAnswer.trim().length < 10) ||
              ((currentQuestion?.type === 'multiple-choice' || currentQuestion?.type === 'true-false') && selectedOption === null)
            }
            className="cat-button"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={isGrading}
            className="cat-button"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
