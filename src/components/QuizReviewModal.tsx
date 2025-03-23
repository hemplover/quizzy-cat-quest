
import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: {
    questions: any[];
    results?: any;
  } | null;
}

const QuizReviewModal: React.FC<QuizReviewModalProps> = ({ 
  open, 
  onOpenChange,
  quiz
}) => {
  const { t } = useLanguage();
  
  if (!quiz) return null;
  
  // Calculate percentage score if available
  const scorePercentage = quiz.results?.punteggio_totale 
    ? Math.round(quiz.results.punteggio_totale * 100) 
    : null;
    
  // Get points data if available
  const totalPoints = quiz.results?.total_points || 0;
  const maxPoints = quiz.results?.max_points || 0;
  
  // Helper to get point value based on question type
  const getQuestionPointValue = (type: string) => {
    return type === 'open-ended' ? 5 : 1;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('quizResults')}</DialogTitle>
          <DialogDescription>
            {quiz.results && (
              <div className="mt-2">
                <div className="text-lg font-bold">
                  {scorePercentage}% {t('score')}
                  {totalPoints !== undefined && maxPoints !== undefined && (
                    <span className="ml-2 text-sm font-normal">
                      ({totalPoints}/{maxPoints} points)
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {quiz.results.feedback_generale}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {quiz.questions.map((question, index) => {
            const result = quiz.results?.risultati?.[index];
            const isCorrect = result?.corretto === true;
            const isIncorrect = result?.corretto === false;
            const isPartiallyCorrect = result?.corretto === "Parzialmente";
            const pointValue = getQuestionPointValue(question.type);
            const score = result?.punteggio || 0;
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'bg-green-50 border-green-200' : 
                  isPartiallyCorrect ? 'bg-yellow-50 border-yellow-200' :
                  isIncorrect ? 'bg-red-50 border-red-200' :
                  'bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : isIncorrect ? (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : isPartiallyCorrect ? (
                    <div className="w-5 h-5 rounded-full bg-yellow-400 text-white flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold">!</span>
                    </div>
                  ) : null}
                  
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      <span>{index + 1}. {question.question}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {question.type === 'open-ended' ? '5 points' : '1 point'}
                      </span>
                    </h3>
                    
                    {question.type === 'multiple-choice' && (
                      <div className="mt-2 space-y-1">
                        {question.options.map((option: string, optIndex: number) => {
                          const isUserAnswer = result?.risposta_utente === optIndex;
                          const isCorrectAnswer = optIndex === question.correctAnswer;
                          
                          return (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded ${
                                isUserAnswer ? 
                                  isCorrectAnswer ? 'bg-green-100' : 'bg-red-100' :
                                isCorrectAnswer ? 'bg-green-50' : ''
                              }`}
                            >
                              {option}
                              {isUserAnswer && ' (' + t('yourAnswer') + ')'}
                              {isCorrectAnswer && ' (' + t('correctAnswer') + ')'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.type === 'true-false' && (
                      <div className="mt-2 space-y-1">
                        <div 
                          className={`p-2 rounded ${
                            result?.risposta_utente === 0 ?
                              question.correctAnswer === 0 ? 'bg-green-100' : 'bg-red-100' :
                              question.correctAnswer === 0 ? 'bg-green-50' : ''
                          }`}
                        >
                          True
                          {result?.risposta_utente === 0 && ' (' + t('yourAnswer') + ')'}
                          {question.correctAnswer === 0 && ' (' + t('correctAnswer') + ')'}
                        </div>
                        <div 
                          className={`p-2 rounded ${
                            result?.risposta_utente === 1 ?
                              question.correctAnswer === 1 ? 'bg-green-100' : 'bg-red-100' :
                              question.correctAnswer === 1 ? 'bg-green-50' : ''
                          }`}
                        >
                          False
                          {result?.risposta_utente === 1 && ' (' + t('yourAnswer') + ')'}
                          {question.correctAnswer === 1 && ' (' + t('correctAnswer') + ')'}
                        </div>
                      </div>
                    )}
                    
                    {question.type === 'open-ended' && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="text-sm font-medium">{t('yourAnswer')}</div>
                          <div className="p-2 border rounded bg-gray-50">
                            {result?.risposta_utente || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{t('correctAnswer')}</div>
                          <div className="p-2 border rounded bg-green-50">
                            {question.correctAnswer}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center justify-between">
                            <span>{t('score')}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              score === 5 ? 'bg-green-100 text-green-700' :
                              score === 0 ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {score}/{pointValue} points
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result?.spiegazione && (
                      <div className="mt-3">
                        <div className="text-sm font-medium">{t('explanation')}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.spiegazione}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            onClick={() => onOpenChange(false)}
          >
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizReviewModal;
