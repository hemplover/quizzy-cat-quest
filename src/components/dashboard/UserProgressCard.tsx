
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
  
  // Calculate the average score for all subjects with completed quizzes
  const calculateOverallAverageScore = () => {
    console.log('Calculating overall average score with subjects:', subjects);
    
    // Get all subjects with completed quizzes
    const subjectsWithScores = subjects.filter(s => {
      // A subject has scores if it has completed quizzes
      if (s.completedQuizCount && s.completedQuizCount > 0) {
        console.log(`Subject ${s.name} has completed quizzes: ${s.completedQuizCount}`);
        return true;
      }
      
      // Or if it has totalPoints and maxPoints defined
      if (s.totalPoints !== undefined && s.maxPoints !== undefined && s.maxPoints > 0) {
        console.log(`Subject ${s.name} has points: ${s.totalPoints}/${s.maxPoints}`);
        return true;
      }
      
      // Or if it has averageScore defined
      if (s.averageScore !== undefined && s.averageScore > 0) {
        console.log(`Subject ${s.name} has average score: ${s.averageScore}%`);
        return true;
      }
      
      return false;
    });
    
    console.log('Filtered subjects with scores:', subjectsWithScores);
    
    if (subjectsWithScores.length === 0) {
      console.log('No subjects with completed quizzes found');
      return '-';
    }
    
    // Total points earned and total maximum points across all subjects
    let totalPointsEarned = 0;
    let totalMaxPoints = 0;
    
    subjectsWithScores.forEach(subject => {
      console.log(`Subject ${subject.name}:`, subject);
      
      if (subject.totalPoints !== undefined && subject.maxPoints !== undefined && subject.maxPoints > 0) {
        // If we have the new weighted point system
        totalPointsEarned += subject.totalPoints;
        totalMaxPoints += subject.maxPoints;
        console.log(`Added ${subject.totalPoints} points earned out of ${subject.maxPoints} maximum points`);
      } else if (subject.averageScore !== undefined && subject.totalQuestions !== undefined && subject.totalQuestions > 0) {
        // Legacy calculation (pre-weighted scoring)
        // Convert percentage to points (assuming 1 point per question)
        const subjectPointsEarned = (subject.averageScore / 100) * subject.totalQuestions;
        totalPointsEarned += subjectPointsEarned;
        totalMaxPoints += subject.totalQuestions;
        console.log(`Legacy calculation: Added ${subjectPointsEarned.toFixed(2)} points earned out of ${subject.totalQuestions} maximum points`);
      }
    });
    
    console.log(`Final totals: ${totalPointsEarned.toFixed(2)} points earned out of ${totalMaxPoints} maximum points`);
    
    // If no questions were answered, return '-'
    if (totalMaxPoints === 0) {
      console.log('No points found in any subject');
      return '-';
    }
    
    // Calculate and return the overall average as a percentage
    const overallPercentage = Math.round((totalPointsEarned / totalMaxPoints) * 100);
    console.log(`Overall percentage: ${overallPercentage}%`);
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
