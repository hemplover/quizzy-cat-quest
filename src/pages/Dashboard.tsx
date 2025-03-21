
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  Clock, 
  Award, 
  BookOpen,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileText,
  PlusCircle,
  FolderPlus
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import CreateSubjectModal from '@/components/CreateSubjectModal';
import { getSubjects, getQuizzesBySubjectId, getSubjectById } from '@/services/subjectService';
import { getLevelInfo } from '@/services/experienceService';
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
      
      // Calculate stats for each subject
      const subjectsWithStats = await Promise.all(loadedSubjects.map(async (subject) => {
        const quizzes = await getQuizzesBySubjectId(subject.id);
        
        console.log(`Subject ${subject.name} has ${quizzes.length} quizzes`);
        
        // Calculate total and average score
        let totalScore = 0;
        let totalPossibleScore = 0;
        let quizzesWithResults = 0;
        
        quizzes.forEach(quiz => {
          if (quiz.results && quiz.questions && quiz.questions.length > 0) {
            if (typeof quiz.results.punteggio_totale === 'number') {
              totalScore += quiz.results.punteggio_totale;
              totalPossibleScore += quiz.questions.length;
              quizzesWithResults++;
              console.log(`Quiz ${quiz.id} score: ${(quiz.results.punteggio_totale / quiz.questions.length) * 100}%`);
            }
          }
        });
        
        const averageScore = quizzesWithResults > 0 ? 
          Math.round((totalScore / totalPossibleScore) * 100) : 0;
        
        return {
          ...subject,
          quizCount: quizzes.length,
          completedQuizCount: quizzesWithResults,
          averageScore: averageScore
        };
      }));
      
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
