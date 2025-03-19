
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

// Mock quiz data
const mockQuestions = [
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

// Cat reaction messages based on performance
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

const Quiz = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [catMessage, setCatMessage] = useState(catMessages.encouragement[0]);
  
  const currentQuestion = mockQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === mockQuestions.length - 1;
  
  // Timer effect
  useEffect(() => {
    if (!quizCompleted) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizCompleted]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Update cat message when question changes
  useEffect(() => {
    if (!isAnswerSubmitted) {
      const randomIndex = Math.floor(Math.random() * catMessages.encouragement.length);
      setCatMessage(catMessages.encouragement[randomIndex]);
    }
  }, [currentQuestionIndex, isAnswerSubmitted]);

  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionIndex);
    }
  };

  const handleOpenEndedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOpenEndedAnswer(e.target.value);
  };

  const handleSubmitAnswer = () => {
    if (currentQuestion.type === 'open-ended') {
      if (openEndedAnswer.trim().length < 10) {
        toast.error("Please provide a more detailed answer");
        return;
      }
      
      // Simple check for keywords in the answer (in a real app, you'd use AI to evaluate)
      const keywords = currentQuestion.correctAnswer.toLowerCase().split(' ');
      const answerWords = openEndedAnswer.toLowerCase().split(' ');
      const matchCount = keywords.filter(word => 
        word.length > 4 && answerWords.includes(word)
      ).length;
      
      const correctThreshold = keywords.filter(word => word.length > 4).length / 3;
      const isCorrectAnswer = matchCount >= correctThreshold;
      
      setIsCorrect(isCorrectAnswer);
      if (isCorrectAnswer) setScore(prev => prev + 1);
    } else {
      // For multiple choice and true/false
      if (selectedOption === null) {
        toast.error("Please select an answer");
        return;
      }
      
      const isCorrectAnswer = selectedOption === currentQuestion.correctAnswer;
      setIsCorrect(isCorrectAnswer);
      if (isCorrectAnswer) setScore(prev => prev + 1);
    }
    
    setIsAnswerSubmitted(true);
    
    // Set cat message based on correctness
    const messageType = isCorrect ? 'correct' : 'incorrect';
    const randomIndex = Math.floor(Math.random() * catMessages[messageType].length);
    setCatMessage(catMessages[messageType][randomIndex]);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setOpenEndedAnswer('');
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    
    if (isLastQuestion) {
      setQuizCompleted(true);
      const randomIndex = Math.floor(Math.random() * catMessages.completion.length);
      setCatMessage(catMessages.completion[randomIndex]);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
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

  const handleFinishQuiz = () => {
    // Save results to session storage for the dashboard
    const results = {
      score,
      totalQuestions: mockQuestions.length,
      timeSpent,
      completedAt: new Date().toISOString(),
    };
    
    const savedResults = JSON.parse(sessionStorage.getItem('quizResults') || '[]');
    sessionStorage.setItem('quizResults', JSON.stringify([...savedResults, results]));
    
    // Add XP
    const currentXP = parseInt(localStorage.getItem('userXP') || '0');
    const earnedXP = score * 10;
    localStorage.setItem('userXP', (currentXP + earnedXP).toString());
    
    toast.success(`Quiz completed! You earned ${earnedXP} XP!`);
    navigate('/dashboard');
  };

  if (quizCompleted) {
    // Quiz completion screen
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 rounded-xl mb-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
          
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
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / mockQuestions.length)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{Math.round((score / mockQuestions.length) * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Correct Answers: {score}/{mockQuestions.length}</span>
            </div>
            <div className="flex justify-center items-center gap-2">
              <Timer className="w-5 h-5 text-cat" />
              <span>Time Spent: {formatTime(timeSpent)}</span>
            </div>
          </div>
          
          <div className="mb-8 relative">
            <CatTutor message={catMessage} />
          </div>
          
          <button
            onClick={handleFinishQuiz}
            className="cat-button mx-auto"
          >
            View Your Progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Quiz header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz in Progress</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {mockQuestions.length}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Timer className="w-5 h-5 text-cat" />
          <span className="font-mono text-lg">{formatTime(timeSpent)}</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
        <div 
          className="h-full bg-cat rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / mockQuestions.length) * 100}%` }}
        ></div>
      </div>
      
      {/* Cat tutor */}
      <div className="mb-6">
        <CatTutor message={catMessage} emotion={isCorrect === true ? 'happy' : isCorrect === false ? 'confused' : 'thinking'} />
      </div>
      
      {/* Question card */}
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
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  selectedOption === index 
                    ? "border-cat bg-cat/5" 
                    : "border-gray-200 hover:border-cat/50",
                  isAnswerSubmitted && index === currentQuestion.correctAnswer
                    ? "bg-green-50 border-green-500" 
                    : "",
                  isAnswerSubmitted && selectedOption === index && index !== currentQuestion.correctAnswer
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
                      {index === currentQuestion.correctAnswer ? (
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
        
        {/* Explanation after answering */}
        {isAnswerSubmitted && (
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
      </div>
      
      {/* Quiz controls */}
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
