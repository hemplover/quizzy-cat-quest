import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ChevronRight, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Users,
  Flag,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getQuizSessionByCode, 
  getSessionParticipants, 
  getQuizQuestions,
  updateParticipantProgress,
  completeQuizSession,
  subscribeToSessionUpdates
} from '@/services/multiplayerService';
import { QuizSession, SessionParticipant } from '@/types/multiplayer';
import { QuizQuestion } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import CatTutor from '@/components/CatTutor';

const MultiplayerSession = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<SessionParticipant | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLimit, setTimeLimit] = useState(30); // 30 seconds per question
  const [questionTimer, setQuestionTimer] = useState(timeLimit);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get the session and participants data
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionCode) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching session with code:', sessionCode);
        const formattedCode = sessionCode.trim().toUpperCase();
        const sessionData = await getQuizSessionByCode(formattedCode);
        
        if (!sessionData) {
          toast.error('Session not found');
          navigate('/');
          return;
        }
        
        setSession(sessionData);
        
        // If the session is completed and we're not on the results page, go there
        if (sessionData.status === 'completed' && !quizCompleted) {
          setQuizCompleted(true);
        }
        
        const participantsData = await getSessionParticipants(sessionData.id);
        setParticipants(participantsData);
        
        // Se non ci sono partecipanti nella sessione, qualcosa non va
        if (participantsData.length === 0) {
          console.error('[ERROR] No participants found in session');
          return;
        }
        
        // Trova il partecipante corrispondente all'utente corrente
        // Se user.id è presente, proviamo a trovare un partecipante con quell'ID
        let participant = null;
        
        if (user?.id) {
          participant = participantsData.find(p => p.user_id === user.id);
          if (participant) {
            console.log(`[INFO] Found participant matching user ID: ${participant.username} (ID: ${participant.id})`);
          }
        }
        
        // Se non abbiamo trovato un partecipante con l'ID dell'utente o l'utente non è autenticato
        // Utilizziamo l'ultimo partecipante aggiunto nella sessione (di solito quello appena unito)
        if (!participant) {
          // Ordina i partecipanti per data di iscrizione (decrescente)
          const sortedParticipants = [...participantsData].sort(
            (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
          );
          
          participant = sortedParticipants[0];
          console.log(`[INFO] Using most recent participant: ${participant.username} (ID: ${participant.id})`);
        }
        
        setMyParticipant(participant);
        
        // If I've already completed the quiz, go to the results
        if (participant && participant.completed) {
          setQuizCompleted(true);
        }
        
        // Get quiz questions
        const questionsData = await getQuizQuestions(sessionData.quiz_id);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching session data:', error);
        toast.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionCode, navigate, user?.id, quizCompleted]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!session) return;
    
    const cleanup = subscribeToSessionUpdates(
      session.id,
      (updatedParticipants) => {
        setParticipants(updatedParticipants);
        
        // Se non ci sono partecipanti, non possiamo fare nulla
        if (updatedParticipants.length === 0) return;
        
        // Aggiorniamo il nostro partecipante, mantenendo lo stesso di prima se possibile
        if (myParticipant) {
          // Cerca di trovare lo stesso partecipante di prima
          const sameParticipant = updatedParticipants.find(p => p.id === myParticipant.id);
          if (sameParticipant) {
            setMyParticipant(sameParticipant);
            return;
          }
        }
        
        // Se non abbiamo più il nostro partecipante, proviamo a trovarne uno nuovo per ID utente
        if (user?.id) {
          const participant = updatedParticipants.find(p => p.user_id === user.id);
          if (participant) {
            setMyParticipant(participant);
            return;
          }
        }
        
        // Fallback: usa il primo partecipante della lista
        setMyParticipant(updatedParticipants[0]);
      },
      (updatedSession) => {
        setSession(updatedSession);
        
        // If the session becomes completed and we're not on the results page, go there
        if (updatedSession.status === 'completed' && !quizCompleted) {
          setQuizCompleted(true);
        }
      }
    );
    
    return cleanup;
  }, [session, user?.id, quizCompleted, myParticipant]);
  
  // Start the quiz timer when everything is loaded
  useEffect(() => {
    if (
      !isLoading && 
      session?.status === 'active' && 
      !quizCompleted && 
      questions.length > 0 &&
      myParticipant
    ) {
      setTimerActive(true);
    }
  }, [isLoading, session?.status, quizCompleted, questions.length, myParticipant]);
  
  // Handle the question timer
  useEffect(() => {
    if (timerActive && !isAnswerSubmitted) {
      timerRef.current = setInterval(() => {
        setQuestionTimer(prevTime => {
          if (prevTime <= 1) {
            // Time's up, automatically submit the current answer
            clearInterval(timerRef.current!);
            handleSubmitAnswer(true);
            return timeLimit;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, isAnswerSubmitted]);
  
  // Handle the quiz timer
  useEffect(() => {
    if (!quizCompleted && !isLoading && session?.status === 'active') {
      const quizTimer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(quizTimer);
    }
  }, [quizCompleted, isLoading, session?.status]);
  
  const handleOptionSelect = (optionIndex: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionIndex);
    }
  };

  const handleSubmitAnswer = async (isTimeUp = false) => {
    if (!currentQuestion || !myParticipant) {
      console.error('[ERROR] Cannot submit answer: no current question or participant found');
      return;
    }
    
    // Verifica che l'utente abbia un partecipante valido
    // Per utenti autenticati, controlliamo che corrispondano gli ID
    // Per utenti anonimi, accettiamo qualsiasi partecipante assegnato
    if (user?.id && myParticipant.user_id && myParticipant.user_id !== user.id) {
      console.error(`[WARNING] User ID mismatch: participant ID (${myParticipant.user_id}) doesn't match current user (${user.id})`);
      console.log('[INFO] Proceeding anyway as this could be an anonymous participant');
    }
    
    console.log(`[INFO] Submitting answer for participant: ${myParticipant.username} (ID: ${myParticipant.id})`);
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Prepare the answer
    let answer: string | number;
    let isCorrectAnswer = false;
    let points = 0;
    
    if (currentQuestion.type === 'open-ended') {
      if (!isTimeUp && openEndedAnswer.trim().length < 10) {
        toast.error("Please provide a more detailed answer");
        return;
      }
      
      answer = openEndedAnswer;
      // We don't know if it's correct yet, will be graded later
      isCorrectAnswer = false;
      points = 0; // Will be updated after grading
    } else {
      // For multiple choice or true/false
      if (!isTimeUp && selectedOption === null) {
        toast.error("Please select an answer");
        return;
      }
      
      answer = selectedOption !== null ? selectedOption : -1;
      
      if (selectedOption !== null) {
        isCorrectAnswer = selectedOption === (currentQuestion as any).correctAnswer;
        // Award points based on correctness and time spent
        const timeBonus = Math.max(0, questionTimer / timeLimit);
        points = isCorrectAnswer ? Math.round(10 * (0.5 + 0.5 * timeBonus)) : 0;
      } else {
        // No answer selected (time's up)
        isCorrectAnswer = false;
        points = 0;
      }
    }
    
    setIsCorrect(isCorrectAnswer);
    setIsAnswerSubmitted(true);
    
    // Update the answers array
    const newAnswer = {
      question_id: currentQuestion.id || currentQuestionIndex,
      answer,
      correct: isCorrectAnswer,
      time_taken: timeLimit - questionTimer,
      points
    };
    
    const newAnswers = [...userAnswers, newAnswer];
    setUserAnswers(newAnswers);
    
    // Update the score
    const newScore = score + points;
    setScore(newScore);
    
    // Save progress to the server
    try {
      const isLastQuestion = currentQuestionIndex === questions.length - 1;
      console.log(`[INFO] Updating progress for participant ${myParticipant.id} (${myParticipant.username}), completed: ${isLastQuestion}`);
      
      await updateParticipantProgress(
        myParticipant.id,
        newScore,
        newAnswers,
        isLastQuestion
      );
      
      // If this is the last question, complete the quiz for this user
      if (isLastQuestion) {
        // RIMOSSO: Non forziamo più il completamento della sessione quando l'host finisce
        // Ora la sessione verrà completata solo quando tutti i partecipanti avranno finito
        // (logica implementata in updateParticipantProgress)
        // 
        // if (session?.creator_id === user?.id) {
        //   await completeQuizSession(session.id);
        // }
        
        // Set completed locally
        setTimeout(() => {
          setQuizCompleted(true);
        }, 2000);
      }
    } catch (error) {
      console.error('[ERROR] Error updating progress:', error);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setOpenEndedAnswer('');
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    setQuestionTimer(timeLimit);
    setTimerActive(true);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getCurrentRanking = () => {
    if (!myParticipant) return null;
    
    // Sort participants by score
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
    const myRank = sortedParticipants.findIndex(p => p.id === myParticipant.id) + 1;
    
    return myRank;
  };
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">Loading quiz session...</h2>
          <p className="text-muted-foreground mb-8">Getting everything ready</p>
          <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
        <p className="text-muted-foreground mb-8">The quiz session you're looking for doesn't exist</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }
  
  if (!myParticipant) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">In attesa dei partecipanti</h2>
        <p className="text-muted-foreground mb-4">
          Caricamento dei dati della sessione in corso...
        </p>
        <div className="w-12 h-12 border-4 border-cat border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Ricarica pagina
        </Button>
      </div>
    );
  }
  
  if (quizCompleted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
          <p className="text-muted-foreground">
            {participants.filter(p => p.completed).length} of {participants.length} players finished
          </p>
        </div>
        
        <div className="glass-card p-6 rounded-xl mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium mb-4">Your Result</h2>
            <div className="relative w-32 h-32 mx-auto">
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
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - myParticipant.score / (questions.length * 10))}`}
                  strokeLinecap="round"
                />
                <foreignObject x="0" y="0" width="100" height="100">
                  <div className="h-full flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{myParticipant.score}</span>
                    <span className="text-xs text-muted-foreground">points</span>
                  </div>
                </foreignObject>
              </svg>
            </div>
            
            <div className="flex justify-center items-center gap-2 mt-2">
              <Flag className="w-4 h-4 text-cat" />
              <span>Position: #{getCurrentRanking()} of {participants.length}</span>
            </div>
          </div>
          
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cat" />
            <span>Leaderboard</span>
          </h3>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-2 px-4 text-left">#</th>
                  <th className="py-2 px-4 text-left">Player</th>
                  <th className="py-2 px-4 text-right">Score</th>
                  <th className="py-2 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                    <tr 
                      key={participant.id} 
                      className={cn(
                        "transition-colors",
                        participant.id === myParticipant.id && "bg-blue-50"
                      )}
                    >
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-cat flex items-center justify-center text-white font-medium">
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{participant.username}</span>
                          {participant.id === myParticipant.id && (
                            <span className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5">You</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{participant.score}</td>
                      <td className="py-3 px-4 text-right">
                        {participant.completed ? (
                          <span className="inline-flex items-center text-green-600 text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Finished
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 text-sm">
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            In progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl mb-8">
          <h3 className="font-medium mb-4">Quiz Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h4 className="text-sm text-muted-foreground mb-1">Time Spent</h4>
              <p className="font-medium text-xl">{formatTime(timeSpent)}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border">
              <h4 className="text-sm text-muted-foreground mb-1">Questions</h4>
              <p className="font-medium text-xl">{questions.length}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Waiting for all players to complete the quiz. The host can end the session at any time.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <CatTutor 
            message={`Great job! You've completed the quiz and earned ${myParticipant.score} points. Your current position is #${getCurrentRanking()}.`} 
            emotion="happy"
          />
        </div>
        
        <div className="text-center">
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No questions available</h2>
        <p className="text-muted-foreground mb-8">Something went wrong with this quiz</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Multiplayer Quiz</h1>
            <span className="text-xs bg-cat text-white px-2 py-0.5 rounded-full">LIVE</span>
          </div>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cat" />
            <span className="font-medium">{participants.length} players</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-cat" />
            <span className="font-mono text-lg">{formatTime(timeSpent)}</span>
          </div>
        </div>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
        <div 
          className="h-full bg-cat rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cat flex items-center justify-center text-white font-medium">
            {myParticipant.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{myParticipant.username}</span>
          <span className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5">You</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-cat">Rank: #{getCurrentRanking()}</span>
          <span className="font-medium">Score: {score}</span>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium flex items-center gap-2">
            <span>Question {currentQuestionIndex + 1}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {currentQuestion.type === 'multiple-choice' 
                ? 'Multiple Choice' 
                : currentQuestion.type === 'true-false'
                  ? 'True/False'
                  : 'Open-ended'}
            </span>
          </h2>
          
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-white font-medium",
              questionTimer <= 5 ? "bg-red-500" : questionTimer <= 15 ? "bg-yellow-500" : "bg-green-500"
            )}
          >
            <Timer className="w-4 h-4" />
            <span>{questionTimer}s</span>
          </div>
        </div>
        
        <p className="text-lg mb-6">{currentQuestion.question}</p>
        
        {currentQuestion.type === 'open-ended' ? (
          <div className="space-y-4">
            <textarea
              className="w-full h-40 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
              placeholder="Type your answer here..."
              value={openEndedAnswer}
              onChange={(e) => setOpenEndedAnswer(e.target.value)}
              disabled={isAnswerSubmitted}
            ></textarea>
          </div>
        ) : (
          <div className="space-y-3">
            {(currentQuestion as any).options.map((option: string, index: number) => (
              <button
                key={index}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  selectedOption === index 
                    ? "border-cat bg-cat/5" 
                    : "border-gray-200 hover:border-cat/50",
                  isAnswerSubmitted && index === (currentQuestion as any).correctAnswer
                    ? "bg-green-50 border-green-500" 
                    : "",
                  isAnswerSubmitted && selectedOption === index && index !== (currentQuestion as any).correctAnswer
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
                      {index === (currentQuestion as any).correctAnswer ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        selectedOption === index && <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {isAnswerSubmitted && currentQuestion.type !== 'open-ended' && (currentQuestion as any).explanation && (
          <div className={cn(
            "mt-6 p-4 rounded-lg animate-fade-in",
            isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-700">Correct! +{userAnswers[userAnswers.length - 1]?.points} points</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">Incorrect</span>
                </>
              )}
            </h3>
            <p className="text-gray-700">{(currentQuestion as any).explanation}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        {!isAnswerSubmitted ? (
          <Button
            onClick={() => handleSubmitAnswer()}
            className="cat-button"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className="cat-button"
          >
            Next Question
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MultiplayerSession;
