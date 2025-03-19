
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  Clock, 
  Award, 
  BookOpen,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import CatTutor from '@/components/CatTutor';
import { cn } from '@/lib/utils';

// Subject areas for the skills chart
const subjects = [
  { id: 'biology', name: 'Biology', score: 75 },
  { id: 'history', name: 'History', score: 62 },
  { id: 'mathematics', name: 'Mathematics', score: 48 },
  { id: 'literature', name: 'Literature', score: 85 },
  { id: 'physics', name: 'Physics', score: 35 },
];

// Define user levels based on XP
const levels = [
  { level: 1, name: "Scholarly Kitten", minXP: 0, maxXP: 99 },
  { level: 2, name: "Curious Cat", minXP: 100, maxXP: 499 },
  { level: 3, name: "Clever Feline", minXP: 500, maxXP: 999 },
  { level: 4, name: "Academic Tabby", minXP: 1000, maxXP: 2499 },
  { level: 5, name: "Wisdom Tiger", minXP: 2500, maxXP: Infinity },
];

const Dashboard = () => {
  const [userXP, setUserXP] = useState(0);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState(levels[0]);
  const [sortedSubjects, setSortedSubjects] = useState([...subjects]);
  
  useEffect(() => {
    // Load user XP from localStorage
    const storedXP = parseInt(localStorage.getItem('userXP') || '0');
    setUserXP(storedXP);
    
    // Determine current level
    const level = levels.find(l => storedXP >= l.minXP && storedXP <= l.maxXP) || levels[0];
    setCurrentLevel(level);
    
    // Load quiz results from sessionStorage
    const storedResults = JSON.parse(sessionStorage.getItem('quizResults') || '[]');
    setQuizResults(storedResults);
    
    // Sort subjects by score (highest first)
    setSortedSubjects([...subjects].sort((a, b) => b.score - a.score));
  }, []);
  
  // Calculate progress percentage to next level
  const calculateProgress = () => {
    if (currentLevel.level === levels.length) return 100; // Max level
    
    const currentXP = userXP - currentLevel.minXP;
    const requiredXP = currentLevel.maxXP - currentLevel.minXP;
    return Math.min(Math.round((currentXP / requiredXP) * 100), 100);
  };
  
  // Calculate XP needed for next level
  const xpForNextLevel = () => {
    if (currentLevel.level === levels.length) return 0; // Max level
    return currentLevel.maxXP - userXP + 1;
  };
  
  // Calculate average score
  const calculateAverageScore = () => {
    if (quizResults.length === 0) return 0;
    const totalPercentage = quizResults.reduce((sum, result) => 
      sum + (result.score / result.totalQuestions) * 100, 0);
    return Math.round(totalPercentage / quizResults.length);
  };
  
  // Identify weakest subjects (lowest scores)
  const weakestSubjects = [...subjects].sort((a, b) => a.score - b.score).slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        {/* User progress card */}
        <div className="glass-card p-6 rounded-xl w-full md:w-2/3">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{currentLevel.name}</h2>
              <p className="text-muted-foreground text-sm">Level {currentLevel.level}</p>
            </div>
            
            <CatTutor emotion="happy" withSpeechBubble={false} />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{userXP} XP</span>
              <span>{currentLevel.maxXP === Infinity ? '∞' : currentLevel.maxXP} XP</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-cat rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
          
          {currentLevel.level < levels.length && (
            <p className="text-sm text-muted-foreground">
              <strong>{xpForNextLevel()} XP</strong> needed to reach {levels[currentLevel.level].name}
            </p>
          )}
          
          {quizResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-cat mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Quizzes Taken</span>
                </div>
                <p className="text-2xl font-bold">{quizResults.length}</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Avg. Score</span>
                </div>
                <p className="text-2xl font-bold">{calculateAverageScore()}%</p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Total XP</span>
                </div>
                <p className="text-2xl font-bold">{userXP} XP</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-cat/5 rounded-lg border border-cat/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cat" />
                <p className="text-sm">Complete your first quiz to see your statistics here!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick actions card */}
        <div className="glass-card p-6 rounded-xl w-full md:w-1/3">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <Link 
              to="/upload" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-cat/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-cat" />
              </div>
              <div>
                <h3 className="font-medium">Create New Quiz</h3>
                <p className="text-xs text-muted-foreground">Upload new material</p>
              </div>
            </Link>
            
            <Link 
              to="/quiz" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Continue Learning</h3>
                <p className="text-xs text-muted-foreground">Resume your latest quiz</p>
              </div>
            </Link>
            
            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer"
              onClick={() => {
                // Reset progress (for demo purposes)
                localStorage.setItem('userXP', '0');
                sessionStorage.removeItem('quizResults');
                window.location.reload();
              }}
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium">Reset Progress</h3>
                <p className="text-xs text-muted-foreground">Clear all data (demo only)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skills and recent quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skills progress */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cat" />
            Skills Progress
          </h2>
          
          <div className="space-y-6">
            {sortedSubjects.map((subject) => (
              <div key={subject.id}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{subject.name}</h3>
                  <span className="text-sm font-mono">{subject.score}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      subject.score >= 70 ? "bg-green-500" :
                      subject.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${subject.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {weakestSubjects.length > 0 && (
            <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-medium mb-2 text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas to Improve
              </h3>
              <p className="text-sm text-amber-700">
                Consider focusing more on {weakestSubjects.map(s => s.name).join(' and ')}.
              </p>
            </div>
          )}
        </div>
        
        {/* Recent quizzes */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cat" />
            Recent Quizzes
          </h2>
          
          {quizResults.length > 0 ? (
            <div className="space-y-4">
              {quizResults.slice().reverse().slice(0, 3).map((result, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cat/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cat" />
                    </div>
                    <div>
                      <h3 className="font-medium">Quiz #{quizResults.length - index}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold">
                      {Math.round((result.score / result.totalQuestions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.score}/{result.totalQuestions} correct
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">No quizzes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Take your first quiz to see your results here</p>
              <Link to="/upload" className="cat-button-secondary inline-flex">
                <Upload className="w-4 h-4" />
                Start a Quiz
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
