
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import CatTutor from '@/components/CatTutor';
import XPBar from '@/components/XPBar';
import { BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProgressCardProps {
  userXP: number;
  nextLevelXP: number;
  currentLevel: string;
  nextLevel: string;
  subjects: any[];
}

const UserProgressCard: React.FC<UserProgressCardProps> = ({
  userXP,
  nextLevelXP,
  currentLevel,
  nextLevel,
  subjects
}) => {
  const { t } = useLanguage();
  const [averageScore, setAverageScore] = useState<number | string>('-');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchQuizResults();
  }, [subjects]);
  
  const fetchQuizResults = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all quiz results directly from database...');
      
      // Get current user ID
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        console.log('No user ID found, cannot fetch quiz results');
        setAverageScore('-');
        setIsLoading(false);
        return;
      }
      
      // Improved query to get only quizzes with non-null results
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .not('results', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching quizzes with results:', error);
        setAverageScore('-');
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${quizzes?.length || 0} quizzes with results`);
      
      if (!quizzes || quizzes.length === 0) {
        console.log('No quizzes with results found');
        setAverageScore('-');
        setIsLoading(false);
        return;
      }
      
      // Calculate overall score with enhanced result format handling
      let totalCalculatedPoints = 0;
      let totalCalculatedMaxPoints = 0;
      let validQuizCount = 0;
      
      for (const quiz of quizzes) {
        if (!quiz.results) continue;
        
        console.log(`Processing quiz ${quiz.id} with results:`, quiz.results);
        
        try {
          // Handle different result formats
          let resultsObj = quiz.results;
          
          // If results is a string, try to parse it
          if (typeof resultsObj === 'string') {
            try {
              resultsObj = JSON.parse(resultsObj);
            } catch (err) {
              console.error(`Failed to parse results string for quiz ${quiz.id}:`, err);
              continue;
            }
          }
          
          if (typeof resultsObj !== 'object' || resultsObj === null) {
            console.log(`Quiz ${quiz.id} has invalid results format, skipping`);
            continue;
          }
          
          // Format: {total_points: X, max_points: Y}
          if ('total_points' in resultsObj && 'max_points' in resultsObj) {
            const quizTotalPoints = Number(resultsObj.total_points);
            const quizMaxPoints = Number(resultsObj.max_points);
            
            if (!isNaN(quizTotalPoints) && !isNaN(quizMaxPoints) && quizMaxPoints > 0) {
              totalCalculatedPoints += quizTotalPoints;
              totalCalculatedMaxPoints += quizMaxPoints;
              validQuizCount++;
              console.log(`Quiz ${quiz.id} has ${quizTotalPoints}/${quizMaxPoints} points`);
            }
          } 
          // Format: {punteggio_totale: X} (score as ratio)
          else if ('punteggio_totale' in resultsObj) {
            // Get questions count
            const questionCount = Array.isArray(quiz.questions) 
              ? quiz.questions.length 
              : (typeof quiz.questions === 'string' 
                  ? JSON.parse(quiz.questions).length 
                  : 0);
            
            if (questionCount > 0) {
              // For punteggio_totale (ratio), multiply by question count to get points
              const scoreRatio = Number(resultsObj.punteggio_totale);
              if (!isNaN(scoreRatio)) {
                const earnedPoints = scoreRatio * questionCount;
                totalCalculatedPoints += earnedPoints;
                totalCalculatedMaxPoints += questionCount;
                validQuizCount++;
                console.log(`Quiz ${quiz.id} has ratio score ${scoreRatio} (${earnedPoints}/${questionCount} points)`);
              }
            }
          }
          // Format: {risultati: [{punteggio: X}]}
          else if ('risultati' in resultsObj && Array.isArray(resultsObj.risultati)) {
            let quizPoints = 0;
            let quizMaxPoints = 0;
            
            resultsObj.risultati.forEach((result: any) => {
              if (result && typeof result === 'object' && 'punteggio' in result) {
                const punteggio = Number(result.punteggio);
                if (!isNaN(punteggio)) {
                  quizPoints += punteggio;
                  quizMaxPoints += (result.tipo === 'open-ended' || result.type === 'open-ended') ? 5 : 1;
                }
              }
            });
            
            if (quizMaxPoints > 0) {
              totalCalculatedPoints += quizPoints;
              totalCalculatedMaxPoints += quizMaxPoints;
              validQuizCount++;
              console.log(`Quiz ${quiz.id} has ${quizPoints}/${quizMaxPoints} points from risultati`);
            }
          }
          // Attempt to directly use score if available
          else if ('score' in resultsObj) {
            const score = Number(resultsObj.score);
            if (!isNaN(score)) {
              const questionCount = Array.isArray(quiz.questions) 
                ? quiz.questions.length 
                : (typeof quiz.questions === 'string' 
                    ? JSON.parse(quiz.questions).length 
                    : 1);
              totalCalculatedPoints += score * questionCount;
              totalCalculatedMaxPoints += questionCount;
              validQuizCount++;
              console.log(`Quiz ${quiz.id} has direct score: ${score}`);
            }
          }
          // Handle results from backend grading
          else if ('correct_count' in resultsObj && 'total_count' in resultsObj) {
            const correctCount = Number(resultsObj.correct_count);
            const totalCount = Number(resultsObj.total_count);
            
            if (!isNaN(correctCount) && !isNaN(totalCount) && totalCount > 0) {
              totalCalculatedPoints += correctCount;
              totalCalculatedMaxPoints += totalCount;
              validQuizCount++;
              console.log(`Quiz ${quiz.id} has ${correctCount}/${totalCount} correct answers`);
            }
          }
        } catch (err) {
          console.error(`Error processing quiz ${quiz.id} results:`, err);
        }
      }
      
      console.log(`Total calculation: ${totalCalculatedPoints}/${totalCalculatedMaxPoints} points from ${validQuizCount} valid quizzes`);
      
      if (totalCalculatedMaxPoints === 0 || validQuizCount === 0) {
        console.log('No valid scoring data found in quizzes');
        setAverageScore('-');
      } else {
        const overallPercentage = Math.round((totalCalculatedPoints / totalCalculatedMaxPoints) * 100);
        console.log(`Final overall percentage: ${overallPercentage}%`);
        setAverageScore(overallPercentage);
      }
    } catch (error) {
      console.error('Error calculating average score:', error);
      setAverageScore('-');
      toast({
        title: "Error",
        description: "Failed to calculate average score. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl w-full md:w-2/3">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t('dashboard')}</h2>
          <p className="text-muted-foreground text-sm">{t('skillsProgress')}</p>
        </div>
        
        <CatTutor emotion="happy" withSpeechBubble={false} />
      </div>
      
      {/* XP Progress Bar */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">{t('experienceProgress')}</h3>
        <XPBar 
          currentXP={userXP} 
          nextLevelXP={nextLevelXP}
          level={currentLevel}
          nextLevel={nextLevel}
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-cat mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">{t('subjects')}</span>
          </div>
          <p className="text-2xl font-bold">{subjects.length}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{t('quizzes')}</span>
          </div>
          <p className="text-2xl font-bold">
            {subjects.reduce((total, subject) => total + (subject.quizCount || 0), 0)}
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{t('averageScore')}</span>
          </div>
          <p className="text-2xl font-bold">
            {isLoading ? '...' : averageScore}
            {!isLoading && averageScore !== '-' ? '%' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProgressCard;
