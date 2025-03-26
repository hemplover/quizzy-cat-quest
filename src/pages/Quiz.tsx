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
import { gradeQuiz } from '@/services/quizService';
import { supabase } from '@/integrations/supabase/client';
import { QuizResultItem } from '@/types/quiz';

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
          setQuestions(parsedQuestions);
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
      
      setUserAnswers([...userAnswers, {
        questionId: currentQuestion.id,
        userAnswer: openEndedAnswer
      }]);
    } else {
      if (selectedOption === null) {
        toast.error("Please select an answer");
        return;
      }
      
      const isCorrectAnswer = selectedOption === currentQuestion.correctAnswer;
      setIsCorrect(isCorrectAnswer);
      
      setUserAnswers([...userAnswers, {
        questionId: currentQuestion.id,
        userAnswer: selectedOption
      }]);
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
      console.log("Sending questions and answers for grading:", questions);
      console.log("User answers to grade:", userAnswers);
      
      // Map user answers to match the order of questions for grading
      const answersForGrading = questions.map((question, index) => {
        const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
        return userAnswer ? userAnswer.userAnswer : '';
      });
      
      console.log("Prepared answers for grading:", answersForGrading);
      
      // Send to API for grading
      const results = await gradeQuiz(questions, answersForGrading);
      
      if (results) {
        console.log("Received grading results:", results);
        setAiGradingResults(results);
        
        let totalPoints = 0;
        let maxPoints = 0;
        
        if (results.total_points !== undefined && results.max_points !== undefined) {
          totalPoints = results.total_points;
          maxPoints = results.max_points;
          console.log(`Using pre-calculated scores: ${totalPoints}/${maxPoints}`);
        } else {
          results.risultati.forEach((result, index) => {
            const question = questions[index];
            const pointValue = question.type === 'open-ended' ? 5 : 1;
            
            maxPoints += pointValue;
            totalPoints += result.punteggio;
            
            console.log(`Question ${index+1} (${question.type}): ${result.punteggio}/${pointValue} points`);
          });
          console.log(`Calculated scores: ${totalPoints}/${maxPoints}`);
        }
        
        // Ensure the results object always has these properties
        results.total_points = totalPoints;
        results.max_points = maxPoints;
        
        const percentageScore = Math.round((totalPoints / maxPoints) * 100);
        setScore(percentageScore);
        console.log(`Final percentage score: ${percentageScore}%`);
        
        // Check if we're in an environment where we can save to Supabase
        const quizId = sessionStorage.getItem('currentQuizId');
        if (quizId) {
          console.log('Saving intermediate results to quiz ID:', quizId);
          try {
            // This is a separate save attempt just to ensure results are saved
            // even if the user doesn't click "Finish Quiz"
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Create a structured results object to save to the database
              // Convert to a simple object with no complex types to satisfy Supabase JSON requirements
              const resultsToSave = {
                risultati: results.risultati.map(r => ({
                  domanda: r.domanda,
                  risposta_utente: String(r.risposta_utente),
                  corretto: typeof r.corretto === 'boolean' ? r.corretto : String(r.corretto),
                  punteggio: Number(r.punteggio),
                  spiegazione: String(r.spiegazione)
                })),
                score: percentageScore,
                punteggio_totale: percentageScore / 100,
                total_points: totalPoints,
                max_points: maxPoints,
                timeSpent,
                completedAt: new Date().toISOString()
              };
              
              console.log('Saving structured results object:', resultsToSave);
              
              const { error } = await supabase
                .from('quizzes')
                .update({ results: resultsToSave })
                .eq('id', quizId)
                .eq('user_id', session.user.id);
                
              if (error) {
                console.error('Error saving intermediate results:', error);
              } else {
                console.log('Intermediate results saved successfully');
              }
            }
          } catch (err) {
            console.error('Error in intermediate results save:', err);
          }
        }
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
    try {
      // Get the quiz data from session storage to update it with results
      const quizDataStr = sessionStorage.getItem('quizData');
      const quizData = quizDataStr ? JSON.parse(quizDataStr) : null;
      
      const results = {
        score,
        totalQuestions: questions.length,
        timeSpent,
        completedAt: new Date().toISOString(),
        aiGrading: aiGradingResults,
        totalPoints: aiGradingResults?.total_points || 0,
        maxPoints: aiGradingResults?.max_points || 0
      };
      
      // Save quiz results to session storage for history
      const savedResults = JSON.parse(sessionStorage.getItem('quizResults') || '[]');
      sessionStorage.setItem('quizResults', JSON.stringify([...savedResults, results]));
      
      // Update XP
      const currentXP = parseInt(localStorage.getItem('userXP') || '0');
      const earnedXP = Math.round((results.totalPoints / results.maxPoints) * (questions.length * 10));
      localStorage.setItem('userXP', (currentXP + earnedXP).toString());
      
      // Update quiz results in Supabase if we have a subject ID
      if (quizData && quizData.subjectId) {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Get quiz questions from session storage
          const storedQuestionsStr = sessionStorage.getItem('quizQuestions');
          const quizQuestions = storedQuestionsStr ? JSON.parse(storedQuestionsStr) : questions;
          
          // Get quiz ID if it exists
          const quizId = sessionStorage.getItem('currentQuizId');
          
          // Create a structured results object to save to the database, ensuring all properties are simple types
          const resultsToSave = {
            risultati: aiGradingResults?.risultati.map(r => ({
              domanda: String(r.domanda),
              risposta_utente: String(r.risposta_utente),
              corretto: typeof r.corretto === 'boolean' ? r.corretto : String(r.corretto),
              punteggio: Number(r.punteggio),
              spiegazione: String(r.spiegazione)
            })) || [],
            score,
            punteggio_totale: score / 100,
            total_points: results.totalPoints,
            max_points: results.maxPoints,
            timeSpent,
            completedAt: new Date().toISOString(),
            earnedXP
          };
          
          console.log('Saving final quiz results to Supabase with ID:', quizId);
          console.log('Results data to save:', resultsToSave);
          
          if (quizId) {
            // Update existing quiz
            const { error } = await supabase
              .from('quizzes')
              .update({ results: resultsToSave })
              .eq('id', quizId);
              
            if (error) {
              console.error('Error updating quiz results:', error);
              throw new Error(`Failed to save quiz results: ${error.message}`);
            } else {
              console.log('Quiz results saved to Supabase successfully');
            }
          } else {
            // This might happen if the quiz was created but ID wasn't saved in session
            // Let's try to find the most recent quiz for this subject and user
            const { data: recentQuizzes, error: findError } = await supabase
              .from('quizzes')
              .select('id')
              .eq('subject_id', quizData.subjectId)
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (findError) {
              console.error('Error finding recent quiz:', findError);
            } else if (recentQuizzes && recentQuizzes.length > 0) {
              // Found a recent quiz, update it
              const recentQuizId = recentQuizzes[0].id;
              console.log('Found recent quiz ID:', recentQuizId);
              
              const { error: updateError } = await supabase
                .from('quizzes')
                .update({ results: resultsToSave })
                .eq('id', recentQuizId);
                
              if (updateError) {
                console.error('Error updating recent quiz results:', updateError);
              } else {
                console.log('Quiz results saved to recent quiz in Supabase');
                // Store the ID for future reference
                sessionStorage.setItem('currentQuizId', recentQuizId);
              }
            } else {
              console.log('No quiz ID found and no recent quizzes, results not saved to database');
            }
          }
        }
      }
      
      toast.success(`Quiz completed! You earned ${earnedXP} XP!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast.error('There was a problem saving your results');
      navigate('/dashboard');
    }
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
                    <span className={cn(
                      "mt-1",
                      result.corretto === true || result.corretto === "Completamente" 
                        ? "text-green-500" 
                        : result.corretto === "Parzialmente" 
                          ? "text-yellow-500"
                          : "text-red-500"
                    )}>
                      {result.corretto === true || result.corretto === "Completamente" 
                        ? <CheckCircle2 className="w-4 h-4" /> 
                        : result.corretto === "Parzialmente" 
                          ? "⚠️"
                          : <XCircle className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="font-medium mb-1">
                        {result.corretto === true || result.corretto === "Completamente" 
                          ? "Correct" 
                          : result.corretto === "Parzialmente" 
                            ? "Partially Correct"
                            : "Incorrect"}
                        {" "}({result.punteggio} points)
                      </p>
                      <p className="text-muted-foreground">{result.spiegazione}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No questions available</h2>
        <p className="text-muted-foreground mb-8">Please create a new quiz</p>
        <button className="cat-button" onClick={() => navigate('/upload')}>
          Create New Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz in Progress</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Timer className="w-5 h-5 text-cat" />
          <span className="font-mono text-lg">{formatTime(timeSpent)}</span>
        </div>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
        <div 
          className="h-full bg-cat rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      
      <div className="mb-6">
        <CatTutor message={catMessage} emotion={isCorrect === true ? 'happy' : isCorrect === false ? 'confused' : 'thinking'} />
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8 animate-fade-in">
        <h2 className="text-xl font-medium mb-6 flex items-start gap-2">
          <span className="mt-1 flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-cat" />
          </span>
          {currentQuestion.question}
        </h2>
        
        {currentQuestion.type === 'open-ended' ? (
          <div className="space-y-4">
            <textarea
              className="w-full h-40 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
              placeholder="Type your answer here..."
              value={openEndedAnswer}
              onChange={handleOpenEndedChange}
              disabled={isAnswerSubmitted}
            ></textarea>
          </div>
        ) : (
          <div className="space-y-3">
            {(currentQuestion as MultipleChoiceQuestion).options.map((option, index) => (
              <button
                key={index}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  selectedOption === index 
                    ? "border-cat bg-cat/5" 
                    : "border-gray-200 hover:border-cat/50",
                  isAnswerSubmitted && index === (currentQuestion as MultipleChoiceQuestion).correctAnswer
                    ? "bg-green-50 border-green-500" 
                    : "",
                  isAnswerSubmitted && selectedOption === index && index !== (currentQuestion as MultipleChoiceQuestion).correctAnswer
                    ? "bg-red-50 border-red-500" 
                    : ""
                )}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswerSubmitted}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {isAnswerSubmitted && (
                    <>
                      {index === (currentQuestion as MultipleChoiceQuestion).correctAnswer ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        selectedOption === index && <X className="w-5 h-5 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {isAnswerSubmitted && currentQuestion.type !== 'open-ended' && currentQuestion.explanation && (
          <div className={cn(
            "mt-6 p-4 rounded-lg animate-fade-in",
            isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">Incorrect</span>
                </>
              )}
            </h3>
            <p className="text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}
        
        {isAnswerSubmitted && currentQuestion.type === 'open-ended' && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 animate-fade-in">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <span className="text-blue-700">Open-ended Response</span>
            </h3>
            <p className="text-gray-700">
              Your answer has been recorded and will be evaluated at the end of the quiz.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className={cn(
            "px-4 py-2 rounded-lg flex items-center gap-1 transition-colors",
            currentQuestionIndex === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        {!isAnswerSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            className="cat-button"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="cat-button"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;

