import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Settings, Sparkles, ArrowRight, FileText, CheckCircle2, Pencil, AlertCircle, Loader2 } from 'lucide-react';
import CatTutor from '@/components/CatTutor';
import { toast } from 'sonner';
import { 
  generateQuiz, 
  transformQuizQuestions,
  hasValidApiKey,
  getModelToUse,
  getSelectedModel
} from '@/services/quizService';
import ApiKeyForm from '@/components/ApiKeyForm';
import AIProviderSelector from '@/components/AIProviderSelector';
import ModelSelector from '@/components/ModelSelector';
import SubjectSelector from '@/components/SubjectSelector';
import { 
  AIProvider, 
  getSelectedProvider,
  AI_PROVIDERS
} from '@/services/aiProviderService';
import {
  getSubjects,
  createDocument,
  createQuiz as createQuizRecord,
  getSubjectById,
  initializeSubjectsIfNeeded,
  getDocumentById
} from '@/services/subjectService';
import { QuizSettings } from '@/types/quiz';
import { useLanguage } from '@/i18n/LanguageContext';
import { Textarea } from '@/components/ui/textarea';

const Upload = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSubjectId = queryParams.get('subject');
  const documentId = queryParams.get('document');
  
  const [textInput, setTextInput] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple-choice', 'true-false']);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [catMessage, setCatMessage] = useState(t('uploadInstructions'));
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isReadyToGenerateQuiz, setIsReadyToGenerateQuiz] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>(getSelectedProvider());
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModel());
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubjectId);
  const [uploadStep, setUploadStep] = useState<'content' | 'settings'>('content');
  const [subjectName, setSubjectName] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  
  // Restore text from a previously uploaded document
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setHasApiKey(hasValidApiKey());
      
      // Initialize subjects if needed
      await initializeSubjectsIfNeeded();
      
      const subjects = await getSubjects();
      if (subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(subjects[0].id);
      }
      
      // If a subject ID is provided, fetch its name
      if (initialSubjectId) {
        const subject = await getSubjectById(initialSubjectId);
        if (subject) {
          setSubjectName(subject.name);
        }
      }
      
      // If document ID is provided, we should fetch that document and populate with its content
      if (documentId) {
        const document = await getDocumentById(documentId);
        if (document) {
          setDocumentName(document.name);
          
          if (document.content) {
            // If it's text content
            setTextInput(document.content);
            setProcessedContent(document.content);
            setIsReadyToGenerateQuiz(true);
            setCatMessage(t('documentLoaded').replace('{document}', document.name));
            // Move to settings step
            setUploadStep('settings');
          }
        }
      }
      
      setIsLoading(false);
    };
    
    initialize();
  }, [initialSubjectId, documentId, t]);

  const handleApiKeySubmit = (key: string, provider: AIProvider) => {
    setSelectedAIProvider(provider);
    setHasApiKey(true);
  };
  
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedAIProvider(provider);
    setHasApiKey(hasValidApiKey());
    
    // Reset selected model to provider's default
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    if (providerConfig) {
      setSelectedModel(providerConfig.defaultModel);
    }
  };
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };
  
  const handleSubjectChange = async (subjectId: string) => {
    setSelectedSubject(subjectId);
    const subject = await getSubjectById(subjectId);
    if (subject) {
      setSubjectName(subject.name);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setProcessedContent(null);
    setIsReadyToGenerateQuiz(false);
    
    if (e.target.value.length > 200) {
      setCatMessage(t('enoughText'));
    }
  };

  const handleQuestionTypeToggle = (type: string) => {
    if (selectedQuestionTypes.includes(type)) {
      if (selectedQuestionTypes.length > 1) {
        setSelectedQuestionTypes(selectedQuestionTypes.filter(t => t !== type));
      }
    } else {
      setSelectedQuestionTypes([...selectedQuestionTypes, type]);
    }
  };

  const handleProcessText = () => {
    if (textInput.trim().length > 100) {
      setProcessedContent(textInput);
      setIsReadyToGenerateQuiz(true);
      setCatMessage(t('textProcessed'));
      toast.success(t('textProcessedSuccess'));
      
      // Move to settings step
      setUploadStep('settings');
    } else {
      toast.error(t('enterMoreText'));
      setCatMessage(t('needMoreText'));
    }
  };

  const handleCreateQuiz = async () => {
    if (!processedContent) {
      toast.error(t('provideContent'));
      setCatMessage(t('needMaterialsForQuiz'));
      return;
    }

    if (!selectedSubject) {
      toast.error(t('selectSubject'));
      return;
    }

    if (!hasApiKey) {
      toast.error(t('apiKeyRequired').replace('{provider}', selectedAIProvider.toUpperCase()));
      return;
    }

    setCatMessage(t('processingMaterials'));
    setIsGeneratingQuiz(true);
    
    // Create quiz settings object to pass to the API
    const quizSettings: QuizSettings = {
      difficulty,
      questionTypes: selectedQuestionTypes,
      numQuestions,
      model: selectedModel
    };

    try {
      console.log("Generating quiz with settings:", quizSettings);
      console.log("Content type:", typeof processedContent);
      
      const generatedQuiz = await generateQuiz(processedContent, quizSettings);
      
      if (generatedQuiz && generatedQuiz.quiz && generatedQuiz.quiz.length > 0) {
        const questions = transformQuizQuestions(generatedQuiz);
        
        if (textInput) {
          const document = await createDocument({
            subjectId: selectedSubject,
            name: documentName || 'Text Input ' + new Date().toLocaleString(),
            content: processedContent,
            fileType: 'text/plain',
            fileSize: new Blob([textInput]).size
          });
          
          await createQuizRecord({
            subjectId: selectedSubject,
            documentId: document.id,
            title: `Quiz on ${documentName || 'Text Input'}`,
            questions: questions
          });
        }
        
        sessionStorage.setItem('quizQuestions', JSON.stringify(questions));
        sessionStorage.setItem('quizData', JSON.stringify({
          source: documentName || 'Text input',
          difficulty,
          questionTypes: selectedQuestionTypes,
          numQuestions: questions.length,
          createdAt: new Date().toISOString(),
          model: selectedModel
        }));
        
        toast.success(t('quizCreatedSuccess'));
        navigate('/quiz');
      } else {
        setCatMessage(t('couldNotCreateQuiz'));
        toast.error(t('unableToGenerateQuiz'));
        setIsGeneratingQuiz(false);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error(t('errorCreatingQuiz'));
      setCatMessage(t('quizCreationError'));
      setIsGeneratingQuiz(false);
    }
  };

  // Difficulty level options from translations
  const difficultyLevels = [
    { id: 'beginner', name: t('beginner'), description: t('basicRecall') },
    { id: 'intermediate', name: t('intermediate'), description: t('applicationConcepts') },
    { id: 'advanced', name: t('advanced'), description: t('analysisSynthesis') },
  ];

  // Question type options from translations
  const questionTypes = [
    { id: 'multiple-choice', name: t('multipleChoice') },
    { id: 'true-false', name: t('trueFalse') },
    { id: 'open-ended', name: t('openEnded') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cat animate-spin mr-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('createQuiz')}</h1>
          <p className="text-muted-foreground">
            {subjectName ? t('creatingQuizFor').replace('{subject}', subjectName) : t('enterTextToCreateQuiz')}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <CatTutor 
            message={catMessage} 
            emotion={isProcessing ? "thinking" : isReadyToGenerateQuiz ? "happy" : "confused"} 
          />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <div className="mx-4 flex items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${uploadStep === 'content' ? 'bg-cat text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className={`text-sm font-medium ${uploadStep === 'content' ? 'text-cat' : 'text-gray-500'}`}>{t('enterContent')}</span>
          </div>
          <div className="flex-grow border-t border-gray-300"></div>
          <div className="mx-4 flex items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${uploadStep === 'settings' ? 'bg-cat text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className={`text-sm font-medium ${uploadStep === 'settings' ? 'text-cat' : 'text-gray-500'}`}>{t('configureQuiz')}</span>
          </div>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
      </div>
      
      {uploadStep === 'content' && (
        <div className="glass-card p-6 rounded-xl mb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <AIProviderSelector 
              onProviderChange={handleProviderChange} 
            />
            
            <ApiKeyForm 
              onKeySubmit={handleApiKeySubmit} 
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <SubjectSelector
              selectedSubject={selectedSubject}
              onSubjectChange={handleSubjectChange}
            />
            
            <ModelSelector 
              onModelChange={handleModelChange}
            />
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-cat" />
              <h2 className="text-xl font-medium">{t('pasteText')}</h2>
            </div>
            
            <Textarea
              className="w-full h-40 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
              placeholder={t('pasteTextPlaceholder')}
              value={textInput}
              onChange={handleTextInputChange}
              disabled={isProcessing}
            />
            
            {textInput.trim().length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleProcessText}
                  disabled={isProcessing || textInput.trim().length < 100}
                  className="cat-button-secondary"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {t('processText')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {uploadStep === 'settings' && processedContent && (
        <>
          <div className="glass-card p-6 rounded-xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-medium">{t('contentReady')}</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full border">
                  <Pencil className="w-5 h-5 text-cat" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {documentName || t('textInput')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {`${textInput.length} ${t('characters')}`}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setUploadStep('content');
                  setProcessedContent(null);
                  setIsReadyToGenerateQuiz(false);
                }}
                className="text-xs px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                {t('change')}
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {t('textContentReady')}
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-cat" />
              <h2 className="text-xl font-medium">{t('quizSettings')}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">{t('difficultyLevel')}</label>
                <div className="space-y-3">
                  {difficultyLevels.map((level) => (
                    <label 
                      key={level.id} 
                      className="flex items-start p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={level.id}
                        checked={difficulty === level.id}
                        onChange={() => setDifficulty(level.id)}
                        className="mr-3 mt-1"
                      />
                      <div>
                        <div className="font-medium">{level.name}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('questionTypes')}</label>
                  <div className="flex flex-wrap gap-2">
                    {questionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleQuestionTypeToggle(type.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedQuestionTypes.includes(type.id)
                            ? 'bg-cat text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('numberOfQuestions')}: {numQuestions}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cat"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700">
                    {t('usingModel').replace('{model}', selectedModel)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setUploadStep('content')}
              className="cat-button-secondary"
            >
              {t('back')}
            </button>
            
            <button
              onClick={handleCreateQuiz}
              disabled={isGeneratingQuiz || !isReadyToGenerateQuiz || !selectedSubject}
              className={`cat-button ${(!isReadyToGenerateQuiz || !selectedSubject) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGeneratingQuiz ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse mr-2" />
                  {t('generatingQuiz')}
                </>
              ) : (
                <>
                  {t('createQuiz')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Upload;
