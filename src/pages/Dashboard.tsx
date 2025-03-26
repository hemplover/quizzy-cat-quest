
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getQuizzesBySubjectId, getSubjectById } from '@/services/subjectService';
import { getLevelInfo } from '@/services/experienceService';
import { useLanguage } from '@/i18n/LanguageContext';
import CreateSubjectModal from '@/components/CreateSubjectModal';
import UserProgressCard from '@/components/dashboard/UserProgressCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import SubjectsSection from '@/components/dashboard/SubjectsSection';
import RecentQuizzesSection from '@/components/dashboard/RecentQuizzesSection';

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userXP, setUserXP] = useState(0);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load user XP from localStorage
    const storedXP = parseInt(localStorage.getItem('userXP') || '0');
    setUserXP(storedXP);
    
    // Load subjects and quizzes
    loadSubjects();
    
    // Load quiz history from localStorage
    const storedQuizHistory = localStorage.getItem('quizHistory');
    if (storedQuizHistory) {
      try {
        setQuizResults(JSON.parse(storedQuizHistory));
      } catch (error) {
        console.error('Error parsing quiz history:', error);
        setQuizResults([]);
      }
    }
  }, []);

  // Calculate level information
  const levelInfo = getLevelInfo(userXP);
  const nextLevelXP = levelInfo.next.minXP;
  
  // Load all subjects from Supabase
  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const loadedSubjects = await getSubjects();
      console.log('Loaded subjects:', loadedSubjects);
      
      // Calculate stats for each subject
      const subjectsWithStats = await Promise.all(loadedSubjects.map(async (subject) => {
        const quizzes = await getQuizzesBySubjectId(subject.id);
        
        console.log(`Subject ${subject.name} has ${quizzes.length} quizzes`);
        
        // Calculate scores properly
        let totalCorrectAnswers = 0;
        let totalQuestions = 0;
        let totalPoints = 0;
        let maxPoints = 0;
        let quizzesWithResults = 0;
        
        quizzes.forEach(quiz => {
          if (quiz.results && quiz.questions && quiz.questions.length > 0) {
            // Count this as a completed quiz
            quizzesWithResults++;
            
            // Check if we have the new points format
            if (quiz.results.total_points !== undefined && quiz.results.max_points !== undefined) {
              totalPoints += quiz.results.total_points;
              maxPoints += quiz.results.max_points;
              console.log(`Quiz ${quiz.id} has point data: ${quiz.results.total_points}/${quiz.results.max_points} points`);
            } 
            // Check for older punteggio_totale format (normalized 0-1 score)
            else if (typeof quiz.results.punteggio_totale === 'number') {
              // Convert to points based on question count
              const quizScore = quiz.results.punteggio_totale;
              const questionCount = quiz.questions.length;
              
              // Estimate points: if punteggio_totale is 0.75 and there are 4 questions,
              // we estimate 3 points out of possible 4
              const earnedPoints = Math.round(quizScore * questionCount);
              
              totalCorrectAnswers += earnedPoints;
              totalQuestions += questionCount;
              totalPoints += earnedPoints;
              maxPoints += questionCount;
              
              console.log(`Quiz ${quiz.id} score: ${earnedPoints} out of ${questionCount} points (${quizScore * 100}%)`);
            }
          }
        });
        
        console.log(`Subject ${subject.name}: ${totalCorrectAnswers} correct answers out of ${totalQuestions} total questions`);
        console.log(`Subject ${subject.name}: ${totalPoints} points earned out of ${maxPoints} maximum points`);
        
        // Calculate average score as a percentage
        const averageScore = maxPoints > 0 ? 
          Math.round((totalPoints / maxPoints) * 100) : 0;
        
        console.log(`Subject ${subject.name} average score: ${averageScore}%`);
        
        return {
          ...subject,
          quizCount: quizzes.length,
          completedQuizCount: quizzesWithResults,
          averageScore: averageScore,
          totalQuestions: totalQuestions,
          totalCorrectAnswers: totalCorrectAnswers,
          totalPoints: totalPoints,
          maxPoints: maxPoints
        };
      }));
      
      console.log('Subjects with stats:', subjectsWithStats);
      setSubjects(subjectsWithStats);
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubjectCreated = async (subjectId: string) => {
    await loadSubjects();
    const newSubject = await getSubjectById(subjectId);
    if (newSubject) {
      navigate(`/subjects/${subjectId}`);
    }
  };

  // Format level names for translation
  const currentLevelFormatted = t(levelInfo.current.name.toLowerCase().replace(' ', ''));
  const nextLevelFormatted = t(levelInfo.next.name.toLowerCase().replace(' ', ''));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* User progress card */}
        <UserProgressCard 
          userXP={userXP}
          nextLevelXP={nextLevelXP}
          currentLevel={currentLevelFormatted}
          nextLevel={nextLevelFormatted}
          subjects={subjects}
        />
        
        {/* Quick actions card */}
        <QuickActionsCard onCreateSubject={() => setCreateSubjectOpen(true)} />
      </div>
      
      {/* Subjects and recent quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subjects */}
        <SubjectsSection 
          subjects={subjects}
          isLoading={isLoading}
          onCreateSubject={() => setCreateSubjectOpen(true)}
        />
        
        {/* Recent quizzes */}
        <RecentQuizzesSection subjects={subjects} />
      </div>

      <CreateSubjectModal
        open={createSubjectOpen}
        onOpenChange={setCreateSubjectOpen}
        onSubjectCreated={handleSubjectCreated}
      />
    </div>
  );
};

export default Dashboard;
