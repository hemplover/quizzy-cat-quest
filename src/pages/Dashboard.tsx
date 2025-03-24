
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getQuizzesBySubjectId, getSubjectById } from '@/services/subjectService';
import { getLevelInfo, getUserXP } from '@/services/experienceService';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import CreateSubjectModal from '@/components/CreateSubjectModal';
import UserProgressCard from '@/components/dashboard/UserProgressCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import SubjectsSection from '@/components/dashboard/SubjectsSection';
import RecentQuizzesSection from '@/components/dashboard/RecentQuizzesSection';
import { toast } from 'sonner';

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userXP, setUserXP] = useState(0);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      // Load user XP from localStorage
      const storedXP = await getUserXP();
      setUserXP(storedXP);
      
      // Load subjects and quizzes
      await loadSubjects();
      
      // Load quiz history from localStorage
      const storedQuizHistory = localStorage.getItem(`quizHistory_${user?.id}`);
      if (storedQuizHistory) {
        try {
          setQuizResults(JSON.parse(storedQuizHistory));
        } catch (error) {
          console.error('Error parsing quiz history:', error);
          setQuizResults([]);
        }
      }
    };
    
    fetchData();
  }, [user]);

  // Calculate level information
  const levelInfo = getLevelInfo(userXP);
  const nextLevelXP = levelInfo.next.minXP;
  
  // Load all subjects from Supabase
  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const loadedSubjects = await getSubjects();
      console.log('Loaded subjects:', loadedSubjects);
      
      if (!loadedSubjects.length) {
        setSubjects([]);
        setIsLoading(false);
        return;
      }
      
      // Calculate stats for each subject
      const subjectsWithStats = await Promise.all(loadedSubjects.map(async (subject) => {
        const quizzes = await getQuizzesBySubjectId(subject.id);
        
        console.log(`Subject ${subject.name} has ${quizzes.length} quizzes`);
        
        // Calculate scores properly
        let totalPointsEarned = 0;
        let totalMaxPoints = 0;
        let quizzesWithResults = 0;
        
        quizzes.forEach(quiz => {
          if (quiz.results) {
            // Check for total_points and max_points first (new format)
            if (typeof quiz.results.total_points === 'number' && 
                typeof quiz.results.max_points === 'number') {
              totalPointsEarned += quiz.results.total_points;
              totalMaxPoints += quiz.results.max_points;
              quizzesWithResults++;
              console.log(`Quiz ${quiz.id} score: ${quiz.results.total_points} of ${quiz.results.max_points} points`);
            } 
            // Then check for punteggio_totale (legacy format)
            else if (typeof quiz.results.punteggio_totale === 'number' && quiz.questions && quiz.questions.length > 0) {
              // For legacy format, convert to points based on question count
              const pointsForThisQuiz = quiz.results.punteggio_totale * quiz.questions.length;
              totalPointsEarned += pointsForThisQuiz;
              totalMaxPoints += quiz.questions.length;
              quizzesWithResults++;
              console.log(`Quiz ${quiz.id} score (legacy): ${pointsForThisQuiz} of ${quiz.questions.length} points`);
            }
            // Make a third attempt to get at least some data
            else if (quiz.results.risultati && Array.isArray(quiz.results.risultati)) {
              let quizPoints = 0;
              let quizMaxPoints = 0;
              
              quiz.results.risultati.forEach(result => {
                if (typeof result.punteggio === 'number') {
                  quizPoints += result.punteggio;
                  quizMaxPoints += result.punteggio > 0 ? 1 : 1; // Count as 1 point per question
                }
              });
              
              if (quizMaxPoints > 0) {
                totalPointsEarned += quizPoints;
                totalMaxPoints += quizMaxPoints;
                quizzesWithResults++;
                console.log(`Quiz ${quiz.id} score (fallback): ${quizPoints} of ${quizMaxPoints} points`);
              }
            }
          }
        });
        
        console.log(`Subject ${subject.name}: ${totalPointsEarned.toFixed(2)} points earned out of ${totalMaxPoints} total points`);
        
        // Calculate average score as a percentage
        const averageScore = totalMaxPoints > 0 ? 
          Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0;
        
        console.log(`Subject ${subject.name} average score: ${averageScore}%`);
        
        return {
          ...subject,
          quizCount: quizzes.length,
          completedQuizCount: quizzesWithResults,
          averageScore: averageScore,
          totalPoints: totalPointsEarned,
          maxPoints: totalMaxPoints
        };
      }));
      
      console.log('Subjects with stats:', subjectsWithStats);
      setSubjects(subjectsWithStats);
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
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
