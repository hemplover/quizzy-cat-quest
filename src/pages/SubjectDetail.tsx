import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  ChevronLeft,
  PlusCircle,
  BarChart,
  File
} from 'lucide-react';
import { 
  getSubjectById, 
  getDocumentsBySubjectId, 
  getQuizzesBySubjectId 
} from '@/services/subjectService';
import { toast } from 'sonner';
import CatTutor from '@/components/CatTutor';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const SubjectDetail = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('documents');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!subjectId) {
      toast.error("Subject ID not found");
      return;
    }
    
    const fetchSubjectData = async () => {
      setIsLoading(true);
      try {
        const subjectData = await getSubjectById(subjectId);
        if (!subjectData) {
          toast.error("Subject not found");
          return;
        }
        
        setSubject(subjectData);
        
        const subjectDocuments = await getDocumentsBySubjectId(subjectId);
        setDocuments(subjectDocuments);
        
        const subjectQuizzes = await getQuizzesBySubjectId(subjectId);
        console.log("Fetched quizzes:", subjectQuizzes);
        setQuizzes(subjectQuizzes);
      } catch (error) {
        console.error("Error fetching subject data:", error);
        toast.error("Failed to load subject data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubjectData();
  }, [subjectId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading subject data...</p>
      </div>
    );
  }
  
  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Subject not found</p>
      </div>
    );
  }
  
  // Calculate the average score for this subject - properly fixed calculation
  const calculateSubjectScore = () => {
    if (!quizzes || quizzes.length === 0) {
      console.log('No quizzes found for this subject');
      return 0;
    }
    
    console.log('All quizzes for this subject:', quizzes);
    
    // Filter quizzes with valid results
    const quizzesWithResults = quizzes.filter(quiz => 
      quiz.results && 
      typeof quiz.results.punteggio_totale === 'number' && 
      quiz.questions && 
      quiz.questions.length > 0
    );
    
    console.log('Quizzes with results:', quizzesWithResults);
    
    if (quizzesWithResults.length === 0) {
      console.log('No quizzes with valid results found');
      return 0;
    }
    
    // Calculate total correct answers and total questions
    let totalCorrectAnswers = 0;
    let totalQuestions = 0;
    
    quizzesWithResults.forEach(quiz => {
      const correctAnswers = quiz.results.punteggio_totale;
      const questions = quiz.questions.length;
      
      console.log(`Quiz "${quiz.title}": ${correctAnswers} correct out of ${questions} questions`);
      
      totalCorrectAnswers += correctAnswers;
      totalQuestions += questions;
    });
    
    console.log(`Total for subject: ${totalCorrectAnswers} correct answers out of ${totalQuestions} questions`);
    
    // Calculate the average percentage
    const averagePercentage = Math.round((totalCorrectAnswers / totalQuestions) * 100);
    console.log(`Average score: ${averagePercentage}%`);
    return averagePercentage;
  };
  
  const subjectScore = calculateSubjectScore();
  
  // Prepare data for charts
  const prepareQuizScoreData = () => {
    return quizzes
      .filter(quiz => quiz.results && quiz.questions && quiz.questions.length > 0)
      .map(quiz => {
        const score = Math.round((quiz.results.punteggio_totale / quiz.questions.length) * 100);
        return {
          name: quiz.title.length > 20 ? quiz.title.substring(0, 20) + '...' : quiz.title,
          score: score,
          fullTitle: quiz.title
        };
      });
  };
  
  // Get all completed quizzes for analytics
  const completedQuizzes = quizzes.filter(q => 
    q.results && 
    q.questions && 
    q.questions.length > 0 && 
    typeof q.results.punteggio_totale === 'number'
  );
  
  // Get total questions answered across all quizzes
  const totalQuestionsAnswered = completedQuizzes.reduce((sum, q) => sum + q.questions.length, 0);
  
  // Get best score from all quizzes
  const bestScore = completedQuizzes.length > 0 
    ? Math.max(...completedQuizzes.map(q => 
        Math.round((q.results.punteggio_totale / q.questions.length) * 100)
      ))
    : 0;
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/subjects" className="text-cat hover:text-cat/80 flex items-center gap-1 mb-4">
          <ChevronLeft className="w-4 h-4" />
          Back to Subjects
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
            <p className="text-muted-foreground">{subject.description || 'No description available'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              className="flex flex-col items-center p-4 glass-card rounded-lg"
              title="Your performance score in this subject"
            >
              <span className="text-xs text-muted-foreground mb-1">Score</span>
              <div className={cn(
                "text-xl font-bold",
                subjectScore >= 70 ? "text-green-600" : 
                subjectScore >= 40 ? "text-amber-600" : "text-red-600"
              )}>
                {subjectScore}%
              </div>
            </div>
            
            <Link to={`/upload?subject=${subject.id}`} className="cat-button">
              <PlusCircle className="w-4 h-4 mr-1" />
              Create Quiz
            </Link>
          </div>
        </div>
      </div>
      
      {documents.length === 0 && quizzes.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-xl">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No content yet</h2>
          <p className="text-muted-foreground mb-6">
            Upload study materials to start creating quizzes for this subject
          </p>
          <Link to={`/upload?subject=${subject.id}`} className="cat-button">
            <PlusCircle className="w-4 h-4 mr-1" />
            Upload Materials
          </Link>
          
          <div className="mt-12">
            <CatTutor 
              message="Start by uploading some study materials! I'll help you create quizzes from your content." 
              emotion="happy" 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tabs for Documents and Quizzes */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('documents')}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === 'documents' 
                  ? "border-b-2 border-cat text-cat"
                  : "text-muted-foreground hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Documents ({documents.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('quizzes')}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === 'quizzes' 
                  ? "border-b-2 border-cat text-cat"
                  : "text-muted-foreground hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Quizzes ({quizzes.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === 'analytics' 
                  ? "border-b-2 border-cat text-cat"
                  : "text-muted-foreground hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-1">
                <BarChart className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </div>
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Study Materials</h2>
                <Link to={`/upload?subject=${subject.id}`} className="cat-button-secondary text-sm">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Document
                </Link>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 glass-card rounded-lg">
                  <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="glass-card p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border">
                          <FileText className="w-6 h-6 text-cat" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" title={doc.name}>
                            {doc.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex mt-3 gap-2">
                            <button 
                              className="text-xs px-2 py-1 bg-cat/10 text-cat rounded hover:bg-cat/20"
                              onClick={() => {
                                // View document content
                                toast.info("Document content view not implemented in this demo");
                              }}
                            >
                              View
                            </button>
                            
                            <Link 
                              to={`/upload?subject=${subject.id}&document=${doc.id}`}
                              className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded hover:bg-green-500/20"
                            >
                              Create Quiz
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Quizzes</h2>
                <Link to={`/upload?subject=${subject.id}`} className="cat-button-secondary text-sm">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Create Quiz
                </Link>
              </div>
              
              {quizzes.length === 0 ? (
                <div className="text-center py-8 glass-card rounded-lg">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No quizzes created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => {
                    const scorePercentage = quiz.results && quiz.questions && quiz.questions.length > 0 
                      ? Math.round((quiz.results.punteggio_totale / quiz.questions.length) * 100) 
                      : null;
                    
                    return (
                      <div key={quiz.id} className="glass-card p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border">
                              <BookOpen className="w-6 h-6 text-cat" />
                            </div>
                            
                            <div>
                              <h3 className="font-medium">{quiz.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Created {new Date(quiz.createdAt).toLocaleDateString()} • 
                                {quiz.questions.length} questions
                              </p>
                              
                              <div className="flex mt-3 gap-2">
                                <Link 
                                  to={`/quiz?id=${quiz.id}`}
                                  className="text-xs px-2 py-1 bg-cat/10 text-cat rounded hover:bg-cat/20"
                                >
                                  Take Quiz
                                </Link>
                                
                                {scorePercentage !== null && (
                                  <div className="text-xs px-2 py-1 bg-gray-100 rounded">
                                    Last score: {scorePercentage}%
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {scorePercentage !== null && (
                            <div className={cn(
                              "text-lg font-bold",
                              scorePercentage >= 70 ? "text-green-600" : 
                              scorePercentage >= 40 ? "text-amber-600" : 
                              "text-red-600"
                            )}>
                              {scorePercentage}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Performance Analytics</h2>
              
              {completedQuizzes.length === 0 ? (
                <div className="text-center py-8 glass-card rounded-lg">
                  <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">Complete some quizzes to see your analytics</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Subject Performance</h3>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Overall Score</span>
                        <span className="font-mono">{subjectScore}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            subjectScore >= 70 ? "bg-green-500" :
                            subjectScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${subjectScore}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium">Quiz History</span>
                        <div className="mt-2 space-y-2">
                          {completedQuizzes.map((quiz) => {
                            const score = Math.round((quiz.results.punteggio_totale / quiz.questions.length) * 100);
                            return (
                              <div key={quiz.id} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cat"></div>
                                <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={quiz.title}>
                                  {quiz.title}
                                </div>
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      score >= 70 ? "bg-green-500" :
                                      score >= 40 ? "bg-yellow-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs font-mono">{score}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Chart */}
                    {completedQuizzes.length >= 2 && (
                      <div className="mt-6">
                        <span className="text-sm font-medium">Score Comparison</span>
                        <div className="h-60 mt-2">
                          <ChartContainer config={{
                            score: { 
                              theme: { light: '#7C3AED', dark: '#8B5CF6' },
                              label: 'Score'
                            }
                          }}>
                            <ReBarChart data={prepareQuizScoreData()}>
                              <XAxis 
                                dataKey="name" 
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                domain={[0, 100]}
                                tickCount={6}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="var(--color-score)" />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    labelKey="fullTitle"
                                  />
                                }
                              />
                            </ReBarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Quizzes Completed</h3>
                      <p className="text-2xl font-bold text-cat">
                        {completedQuizzes.length}
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Questions Answered</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {totalQuestionsAnswered}
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Best Score</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {bestScore}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectDetail;
