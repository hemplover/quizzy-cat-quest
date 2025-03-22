
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import CatTutor from '@/components/CatTutor';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import CreateSubjectModal from '@/components/CreateSubjectModal';
import { getSubjects, getQuizzesBySubjectId, getSubjectById } from '@/services/subjectService';
import XPBar from '@/components/XPBar';

// XP levels data
const xpLevels = [
  { name: 'Scholarly Kitten', minXP: 0, maxXP: 100 },
  { name: 'Curious Cat', minXP: 100, maxXP: 500 },
  { name: 'Clever Feline', minXP: 500, maxXP: 1000 },
  { name: 'Academic Tabby', minXP: 1000, maxXP: 2500 },
  { name: 'Wisdom Tiger', minXP: 2500, maxXP: 5000 }
];

// Get level based on XP
const getLevelInfo = (xp: number) => {
  let currentLevel = xpLevels[0];
  let nextLevel = xpLevels[1];
  
  for (let i = 0; i < xpLevels.length; i++) {
    if (xp >= xpLevels[i].minXP) {
      currentLevel = xpLevels[i];
      nextLevel = xpLevels[i + 1] || xpLevels[i];
    } else {
      break;
    }
  }
  
  return {
    current: currentLevel,
    next: nextLevel
  };
};

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
        let quizzesWithResults = 0;
        
        quizzes.forEach(quiz => {
          if (quiz.results && typeof quiz.results.punteggio_totale === 'number') {
            totalScore += quiz.results.punteggio_totale;
            quizzesWithResults++;
            console.log(`Quiz ${quiz.id} score: ${quiz.results.punteggio_totale * 100}%`);
          }
        });
        
        const averageScore = quizzesWithResults > 0 ? (totalScore / quizzesWithResults) * 100 : 0;
        
        return {
          ...subject,
          quizCount: quizzes.length,
          completedQuizCount: quizzesWithResults,
          averageScore: Math.round(averageScore)
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
  
  // Calculate average score from quizResults
  const calculateAverageScore = () => {
    if (quizResults.length === 0) return 0;
    
    const validResults = quizResults.filter(result => 
      typeof result.score === 'number' && typeof result.totalQuestions === 'number'
    );
    
    if (validResults.length === 0) return 0;
    
    const totalPercentage = validResults.reduce((sum, result) => 
      sum + (result.score / result.totalQuestions) * 100, 0);
    
    return Math.round(totalPercentage / validResults.length);
  };
  
  // Identify weakest subjects (lowest scores)
  const weakestSubjects = [...subjects]
    .filter(subject => subject.completedQuizCount > 0) // Only consider subjects with graded quizzes
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* User progress card */}
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
              level={t(levelInfo.current.name.toLowerCase().replace(' ', ''))}
              nextLevel={t(levelInfo.next.name.toLowerCase().replace(' ', ''))}
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
                {subjects.reduce((total, subject) => total + subject.quizCount, 0)}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{t('averageScore')}</span>
              </div>
              <p className="text-2xl font-bold">
                {subjects.some(s => s.completedQuizCount > 0) 
                  ? Math.round(subjects
                      .filter(s => s.completedQuizCount > 0)
                      .reduce((sum, s) => sum + s.averageScore, 0) / 
                      subjects.filter(s => s.completedQuizCount > 0).length)
                  : '-'}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick actions card */}
        <div className="glass-card p-6 rounded-xl w-full md:w-1/3">
          <h2 className="text-xl font-bold mb-4">{t('quickActions')}</h2>
          
          <div className="space-y-3">
            <Link 
              to="/upload" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-cat/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-cat" />
              </div>
              <div>
                <h3 className="font-medium">{t('createNewQuiz')}</h3>
                <p className="text-xs text-muted-foreground">{t('uploadDocument')}</p>
              </div>
            </Link>
            
            <button
              onClick={() => setCreateSubjectOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">{t('newSubject')}</h3>
                <p className="text-xs text-muted-foreground">{t('createYourFirstSubject')}</p>
              </div>
            </button>
            
            <Link 
              to="/subjects" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">{t('subjects')}</h3>
                <p className="text-xs text-muted-foreground">{t('subjectManager')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Subjects and recent quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subjects */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cat" />
              {t('subjects')}
            </h2>
            
            <button
              onClick={() => setCreateSubjectOpen(true)}
              className="text-cat hover:bg-cat/10 p-2 rounded-full"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading subjects...</p>
              </div>
            ) : subjects.length > 0 ? (
              subjects.map((subject) => (
                <Link 
                  key={subject.id}
                  to={`/subjects/${subject.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">{subject.quizCount} {t(subject.quizCount === 1 ? 'quiz' : 'quizzes').toLowerCase()}</p>
                    </div>
                  </div>
                  
                  {subject.completedQuizCount > 0 && (
                    <div 
                      className={cn(
                        "px-2 py-1 rounded text-xs font-semibold",
                        subject.averageScore >= 70 ? "bg-green-100 text-green-800" :
                        subject.averageScore >= 40 ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      )}
                    >
                      {subject.averageScore}%
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-600 mb-2">{t('noSubjectsFound')}</h3>
                <button
                  onClick={() => setCreateSubjectOpen(true)}
                  className="cat-button-secondary inline-flex mt-2"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t('createYourFirstSubject')}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent quizzes */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cat" />
            {t('recentQuizzes')}
          </h2>
          
          {subjects.some(s => s.quizCount > 0) ? (
            <div className="space-y-4">
              {subjects
                .filter(subject => subject.quizCount > 0)
                .slice(0, 3)
                .map((subject, index) => (
                  <Link 
                    key={index}
                    to={`/subjects/${subject.id}`}
                    className="p-4 bg-white rounded-lg border flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: subject.color }}
                      >
                        {subject.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{subject.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {subject.quizCount} {t(subject.quizCount === 1 ? 'quiz' : 'quizzes').toLowerCase()}
                        </p>
                      </div>
                    </div>
                    
                    {subject.completedQuizCount > 0 && (
                      <div className="text-right">
                        <p className="font-bold">{subject.averageScore}%</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.completedQuizCount} {t('completed').toLowerCase()}
                        </p>
                      </div>
                    )}
                  </Link>
                ))}

              <Link 
                to="/upload"
                className="cat-button w-full justify-center mt-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('createNewQuiz')}
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">{t('noRecentQuizzes')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('takeYourFirstQuiz')}
              </p>
              <Link to="/upload" className="cat-button-secondary inline-flex">
                <Upload className="w-4 h-4 mr-2" />
                {t('createNewQuiz')}
              </Link>
            </div>
          )}
        </div>
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
