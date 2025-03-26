
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getQuizzesBySubjectId, getSubjectById } from '@/services/subjectService';
import { getLevelInfo } from '@/services/experienceService';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
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
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        console.log('No user ID found, cannot load subjects');
        setSubjects([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching subjects for user ID: ${userId}`);
      const loadedSubjects = await getSubjects();
      console.log(`Subjects fetched for user: ${loadedSubjects.length}`);
      console.log('Loaded subjects:', loadedSubjects);
      
      // Load quizzes for each subject
      const subjectsWithQuizzes = await Promise.all(loadedSubjects.map(async (subject) => {
        console.log(`Fetching quizzes for subject ID: ${subject.id} and user ID: ${userId}`);
        
        // Get all quizzes for this subject
        const { data: quizzes, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error fetching quizzes for subject ${subject.id}:`, error);
          return { ...subject, quizzes: [], quizCount: 0 };
        }
        
        console.log(`Quizzes fetched for subject ${subject.id}: ${quizzes.length}`);
        
        let totalCorrectAnswers = 0;
        let totalQuestions = 0;
        let totalPoints = 0;
        let maxPoints = 0;
        let quizzesWithResults = 0;
        
        console.log(`Subject ${subject.name} has ${quizzes.length} quizzes`);
        
        return {
          ...subject,
          quizzes: quizzes || [],
          quizCount: quizzes.length,
          completedQuizCount: quizzes.filter(q => q.results).length,
          totalCorrectAnswers,
          totalQuestions,
          totalPoints,
          maxPoints
        };
      }));
      
      setSubjects(subjectsWithQuizzes);
    } catch (error) {
      console.error("Error loading subjects:", error);
      setSubjects([]);
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
