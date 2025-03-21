import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileUp, BookOpen, Settings, Sparkles, ArrowRight, FileText, CheckCircle2, Pencil, AlertCircle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import CatTutor from '@/components/CatTutor';
import { toast } from 'sonner';
import { 
  generateQuiz, 
  transformQuizQuestions,
  hasValidApiKey,
  providerSupportsFileUpload,
  processFile,
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple-choice', 'true-false']);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [catMessage, setCatMessage] = useState(t('uploadInstructions'));
  const [processedContent, setProcessedContent] = useState<string | File | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isReadyToGenerateQuiz, setIsReadyToGenerateQuiz] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>(getSelectedProvider());
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModel());
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubjectId);
  const [uploadStep, setUploadStep] = useState<'choose' | 'content' | 'settings'>('choose');
  const [subjectName, setSubjectName] = useState<string>('');
  const [supportsFileUpload, setSupportsFileUpload] = useState(providerSupportsFileUpload());
  const [documentName, setDocumentName] = useState<string>('');
  
  // Restore file or text from a previously uploaded document
  useEffect(() => {
    setHasApiKey(hasValidApiKey());
    setSupportsFileUpload(providerSupportsFileUpload());
    
    // Initialize subjects if needed
    initializeSubjectsIfNeeded();
    
    const subjects = getSubjects();
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
    
    // If a subject ID is provided, fetch its name
    if (initialSubjectId) {
      const subject = getSubjectById(initialSubjectId);
      if (subject) {
        setSubjectName(subject.name);
      }
    }
    
    // If document ID is provided, we should fetch that document and populate with its content
    if (documentId) {
      const document = getDocumentById(documentId);
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
  }, [initialSubjectId, documentId, t]);

  const handleApiKeySubmit = (key: string, provider: AIProvider) => {
    setSelectedAIProvider(provider);
    setHasApiKey(true);
    setSupportsFileUpload(providerSupportsFileUpload());
  };
  
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedAIProvider(provider);
    setHasApiKey(hasValidApiKey());
    setSupportsFileUpload(providerSupportsFileUpload());
    
    // Reset selected model to provider's default
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    if (providerConfig) {
      setSelectedModel(providerConfig.defaultModel);
    }
  };
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };
  
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    const subject = getSubjectById(subjectId);
    if (subject) {
      setSubjectName(subject.name);
    }
  };

  // Modifica: utilizza processFile per preparare il file prima di inviarlo all'API
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    
    if (!supportsFileUpload) {
      toast.error(t('fileUploadNotSupported'));
      setCatMessage(t('fileUploadNotSupportedMsg'));
      return;
    }
    
    setCatMessage(t('processingFile').replace('{file}', file.name));
    setIsProcessing(true);
    
    try {
      const processed = await processFile(file);
      setProcessedContent(processed);
      setIsReadyToGenerateQuiz(true);
      setIsProcessing(false);
      toast.success(t('fileReadyForQuiz').replace('{file}', file.name));
      setCatMessage(t('fileAnalysisReady').replace('{file}', file.name));
      
      // Move to settings step
      setUploadStep('settings');
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(t('errorProcessingFile'));
      setCatMessage(t('fileProcessingError'));
      setIsProcessing(false);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setProcessedContent(null);
    setIsReadyToGenerateQuiz(false);
    
    if (e.target.value.length > 200 && !selectedFile) {
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
        
        if (selectedFile || textInput) {
          const document = createDocument({
            subjectId: selectedSubject,
            name: selectedFile ? selectedFile.name : documentName || 'Text Input ' + new Date().toLocaleString(),
            content: typeof processedContent === 'string' ? processedContent : 'File Content (Stored as reference)',
            fileType: selectedFile ? selectedFile.type : 'text/plain',
            fileSize: selectedFile ? selectedFile.size : new Blob([textInput]).size
          });
          
          createQuizRecord({
            subjectId: selectedSubject,
            documentId: document.id,
            title: `Quiz on ${selectedFile ? selectedFile.name : documentName || 'Text Input'}`,
            questions: questions
          });
        }
        
        sessionStorage.setItem('quizQuestions', JSON.stringify(questions));
        sessionStorage.setItem('quizData', JSON.stringify({
          source: selectedFile ? selectedFile.name : documentName || 'Text input',
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('uploadTitle')}</h1>
          <p className="text-muted-foreground">
            {subjectName ? t('creatingQuizFor').replace('{subject}', subjectName) : t('uploadSubtitle')}
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
            <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-2 ${uploadStep === 'choose' ? 'bg-cat text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className={`text-sm font-medium ${uploadStep === 'choose' ? 'text-cat' : 'text-gray-500'}`}>{t('chooseSource')}</span>
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
      
      {uploadStep === 'choose' && (
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
          
          {!supportsFileUpload && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">{t('fileUploadNotSupported')}</h4>
                <p className="text-sm text-amber-700">
                  {t('fileUploadNotSupportedMsg')}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <FileUp className="w-5 h-5 text-cat" />
            <h2 className="text-xl font-medium">{t('uploadDocument')}</h2>
          </div>
          
          <div className="mb-6">
            <FileUpload 
              onFileUpload={handleFileUpload} 
              accept=".pdf,.doc,.docx,.txt"
              showUploadButton={true}
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
                  {selectedFile ? (
                    <FileText className="w-5 h-5 text-cat" />
                  ) : (
                    <Pencil className="w-5 h-5 text-cat" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">
                    {selectedFile ? selectedFile.name : documentName || t('textInput')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile ? 
                      `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 
                      `${textInput.length} ${t('characters')}`}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setUploadStep('choose');
                  setProcessedContent(null);
                  setIsReadyToGenerateQuiz(false);
                }}
                className="text-xs px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                {t('change')}
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {selectedFile 
                ? t('fileWillBeSent')
                : t('textContentReady')}
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
              onClick={() => setUploadStep('choose')}
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
