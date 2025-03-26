
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
  
  // Calculate the average score with a simplified, more robust approach
  const calculateOverallAverageScore = () => {
    console.log('Calculating overall average score with subjects:', subjects);
    
    // Initial check for empty subjects array
    if (!subjects || subjects.length === 0) {
      console.log('No subjects found');
      return '-';
    }
    
    // Track total points across all quizzes in all subjects
    let totalPointsEarned = 0;
    let totalMaxPoints = 0;
    let quizCount = 0;
    
    // Process each subject to find quizzes with results
    subjects.forEach(subject => {
      console.log(`Processing subject ${subject.name}:`, subject);
      
      // Look for quizzes directly within the subject if available
      if (subject.quizzes && Array.isArray(subject.quizzes)) {
        subject.quizzes.forEach(quiz => {
          if (quiz.results) {
            quizCount++;
            
            // Check for new-style point system first
            if (quiz.results.total_points !== undefined && quiz.results.max_points !== undefined) {
              totalPointsEarned += quiz.results.total_points;
              totalMaxPoints += quiz.results.max_points;
              console.log(`Quiz found with new points format: ${quiz.results.total_points}/${quiz.results.max_points}`);
            }
            // Then check for old-style percentage system
            else if (quiz.results.punteggio_totale !== undefined && quiz.questions && quiz.questions.length > 0) {
              const pointsEarned = quiz.results.punteggio_totale * quiz.questions.length;
              totalPointsEarned += pointsEarned;
              totalMaxPoints += quiz.questions.length;
              console.log(`Quiz found with percentage format: ${quiz.results.punteggio_totale * 100}%`);
            }
          }
        });
      }
      
      // Also check for subject-level metrics
      if (subject.totalPoints && subject.maxPoints && subject.maxPoints > 0) {
        totalPointsEarned += subject.totalPoints;
        totalMaxPoints += subject.maxPoints;
        console.log(`Added subject-level points: ${subject.totalPoints}/${subject.maxPoints}`);
      }
      
      // For old system compatibility
      if (subject.completedQuizCount && subject.completedQuizCount > 0 && 
          subject.averageScore !== undefined && subject.totalQuestions) {
        const subjectPoints = (subject.averageScore / 100) * subject.totalQuestions;
        totalPointsEarned += subjectPoints;
        totalMaxPoints += subject.totalQuestions;
        console.log(`Legacy calculation: Added ${subjectPoints.toFixed(2)} points from subject average`);
      }
    });
    
    console.log(`Total calculation: ${totalPointsEarned.toFixed(2)} points earned out of ${totalMaxPoints} maximum points`);
    console.log(`Found ${quizCount} quizzes with results`);
    
    // If we have no valid data, return a dash
    if (totalMaxPoints === 0) {
      console.log('No valid quiz data found for scoring');
      return '-';
    }
    
    // Calculate and return the overall average as a percentage
    const overallPercentage = Math.round((totalPointsEarned / totalMaxPoints) * 100);
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
