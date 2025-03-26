import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import CatTutor from '@/components/CatTutor';
import XPBar from '@/components/XPBar';
import { BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';

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
  
  const calculateOverallAverageScore = () => {
    console.log('Calculating overall average score with subjects:', subjects);
    
    if (!subjects || subjects.length === 0) {
      console.log('No subjects found');
      return '-';
    }
    
    let totalPoints = 0;
    let totalMaxPoints = 0;
    let quizCount = 0;
    
    subjects.forEach(subject => {
      if (!subject.quizzes || !Array.isArray(subject.quizzes)) {
        console.log(`Subject ${subject.name} has no quizzes array`);
        return;
      }
      
      subject.quizzes.forEach(quiz => {
        if (!quiz || !quiz.results) return;
        
        console.log(`Found quiz with results:`, quiz.id, quiz.results);
        quizCount++;
        
        if (quiz.results.total_points !== undefined && quiz.results.max_points !== undefined) {
          totalPoints += quiz.results.total_points;
          totalMaxPoints += quiz.results.max_points;
          console.log(`Added points: ${quiz.results.total_points}/${quiz.results.max_points}`);
        }
        else if (quiz.results.punteggio_totale !== undefined) {
          if (quiz.results.risultati && Array.isArray(quiz.results.risultati)) {
            quiz.results.risultati.forEach(result => {
              if (result.punteggio !== undefined) {
                totalPoints += result.punteggio;
                totalMaxPoints += (result.tipo === 'open-ended' || result.type === 'open-ended') ? 5 : 1;
              }
            });
            console.log(`Added points from risultati: ${totalPoints}`);
          } 
          else if (quiz.questions && Array.isArray(quiz.questions)) {
            const questionCount = quiz.questions.length;
            const earnedPoints = quiz.results.punteggio_totale * questionCount;
            
            totalPoints += earnedPoints;
            totalMaxPoints += questionCount;
            console.log(`Added points from percentage: ${earnedPoints}/${questionCount}`);
          }
        }
      });
    });
    
    console.log(`Total points: ${totalPoints}/${totalMaxPoints} from ${quizCount} quizzes with results`);
    
    if (totalMaxPoints === 0 || quizCount === 0) {
      console.log('No valid quiz data found for scoring');
      return '-';
    }
    
    const overallPercentage = Math.round((totalPoints / totalMaxPoints) * 100);
    console.log(`Final overall percentage: ${overallPercentage}%`);
    return overallPercentage;
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
            {calculateOverallAverageScore()}
            {calculateOverallAverageScore() !== '-' ? '%' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProgressCard;
