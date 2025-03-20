
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('quizResults')}</DialogTitle>
          <DialogDescription>
            {quiz.results && (
              <div className="mt-2">
                <div className="text-lg font-bold">
                  {Math.round(quiz.results.punteggio_totale * 100)}% {t('score')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {quiz.results.feedback_generale}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {quiz.questions.map((question, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                quiz.results?.risultati?.[index]?.corretto === true ? 
                'bg-green-50 border-green-200' : 
                quiz.results?.risultati?.[index]?.corretto === false ?
                'bg-red-50 border-red-200' :
                'bg-white'
              }`}
            >
              <div className="flex items-start gap-2">
                {quiz.results?.risultati?.[index]?.corretto === true ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : quiz.results?.risultati?.[index]?.corretto === false ? (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : null}
                
                <div className="flex-1">
                  <h3 className="font-medium">
                    {index + 1}. {question.question}
                  </h3>
                  
                  {question.type === 'multiple-choice' && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option: string, optIndex: number) => (
                        <div 
                          key={optIndex}
                          className={`p-2 rounded ${
                            quiz.results?.risultati?.[index]?.risposta_utente === optIndex ?
                              optIndex === question.correctAnswer ? 
                                'bg-green-100' : 'bg-red-100' :
                              optIndex === question.correctAnswer ?
                                'bg-green-50' : ''
                          }`}
                        >
                          {option}
                          {quiz.results?.risultati?.[index]?.risposta_utente === optIndex && 
                            ' (Your answer)'}
                          {optIndex === question.correctAnswer && 
                            ' (Correct answer)'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true-false' && (
                    <div className="mt-2 space-y-1">
                      <div 
                        className={`p-2 rounded ${
                          quiz.results?.risultati?.[index]?.risposta_utente === 0 ?
                            question.correctAnswer === 0 ? 
                              'bg-green-100' : 'bg-red-100' :
                            question.correctAnswer === 0 ?
                              'bg-green-50' : ''
                        }`}
                      >
                        True
                        {quiz.results?.risultati?.[index]?.risposta_utente === 0 && 
                          ' (Your answer)'}
                        {question.correctAnswer === 0 && 
                          ' (Correct answer)'}
                      </div>
                      <div 
                        className={`p-2 rounded ${
                          quiz.results?.risultati?.[index]?.risposta_utente === 1 ?
                            question.correctAnswer === 1 ? 
                              'bg-green-100' : 'bg-red-100' :
                            question.correctAnswer === 1 ?
                              'bg-green-50' : ''
                        }`}
                      >
                        False
                        {quiz.results?.risultati?.[index]?.risposta_utente === 1 && 
                          ' (Your answer)'}
                        {question.correctAnswer === 1 && 
                          ' (Correct answer)'}
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'open-ended' && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="text-sm font-medium">{t('yourAnswer')}</div>
                        <div className="p-2 border rounded bg-gray-50">
                          {quiz.results?.risultati?.[index]?.risposta_utente || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t('correctAnswer')}</div>
                        <div className="p-2 border rounded bg-green-50">
                          {question.correctAnswer}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {quiz.results?.risultati?.[index]?.spiegazione && (
                    <div className="mt-3">
                      <div className="text-sm font-medium">{t('explanation')}</div>
                      <div className="text-sm text-muted-foreground">
                        {quiz.results.risultati[index].spiegazione}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
