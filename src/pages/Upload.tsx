import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ListBullet, File as FileIcon, TextIcon, Clock } from 'lucide-react';
import { generateQuiz, transformQuizQuestions } from '@/services/quizService';
import { saveRecentText, getRecentText } from '@/services/quizService';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultModel, getSelectedModel } from '@/services/quizService';

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [uploadType, setUploadType] = useState<'file' | 'text' | 'recent'>('file');
  const [uploadedFile, setUploadedFile] = useState<{ file: File; text?: string } | null>(null);
  const [textContent, setTextContent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(['multiple-choice']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [recentText, setRecentText] = useState<{ name: string; content: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [availableModels, setAvailableModels] = useState([getDefaultModel()]);
  const [useUploadedDocument, setUseUploadedDocument] = useState(false);
  
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await supabase.from('subjects').select('id, name');
        if (data) {
          setSubjects(data);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error(t("Failed to load subjects. Please refresh the page."));
      }
    };
    
    fetchSubjects();
  }, [t]);
  
  useEffect(() => {
    const loadRecentText = async () => {
      if (selectedSubject) {
        const recent = await getRecentText(selectedSubject);
        setRecentText(recent);
      }
    };
    
    loadRecentText();
  }, [selectedSubject]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5000000) {
      toast.error(t("File size exceeds the limit of 5MB."));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setUploadedFile({ file: file, text: text });
    };
    reader.onerror = () => {
      toast.error(t("Error reading the file."));
    };
    reader.readAsText(file);
  };
  
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(event.target.value);
  };
  
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };
  
  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
  };
  
  const handleNumQuestionsChange = (value: number[]) => {
    setNumQuestions(value[0]);
  };
  
  const toggleQuestionType = (type: string) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  interface CreateQuizOptions {
    subjectId: string;
    documentId?: string | null;
    title: string;
    questions: any[];
  }
  
  const createQuiz = async (options: CreateQuizOptions): Promise<string | null> => {
    try {
      const { subjectId, documentId, title, questions } = options;
      
      // Get the current user's ID
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        console.error('User ID is required but not found in session');
        return null;
      }
      
      // Insert the quiz into the database
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .insert([
          {
            subject_id: subjectId,
            document_id: documentId,
            title: title,
            questions: questions,
            settings: {
              difficulty: difficulty,
              questionTypes: selectedQuestionTypes,
              numQuestions: numQuestions,
              model: getSelectedModel()
            },
            user_id: userId
          }
        ])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating quiz:', error);
        toast.error(t("Failed to create quiz in database."));
        return null;
      }
      
      console.log('Quiz created successfully with ID:', quizData.id);
      return quizData.id;
    } catch (error) {
      console.error('Error in createQuiz function:', error);
      toast.error(t("Error creating quiz. Please try again."));
      return null;
    }
  };
  
  // This part needs to be fixed to use the updated createQuiz function that takes an object parameter
  const handleCreateQuiz = async () => {
    try {
      setIsGenerating(true);
      let content = '';
      
      if (uploadType === 'file' && uploadedFile) {
        content = uploadedFile.text || '';
      } else if (uploadType === 'text' && textContent) {
        content = textContent;
      } else if (uploadType === 'recent' && recentText) {
        content = recentText.content;
      }
      
      if (content.trim().length < 100) {
        toast.error(t("Please provide more detailed content for quiz generation"));
        setIsGenerating(false);
        return;
      }
      
      // Quiz generation settings
      const settings = {
        difficulty: difficulty,
        questionTypes: selectedQuestionTypes,
        numQuestions: Number(numQuestions),
        model: getSelectedModel()
      };
      
      // Generate quiz using the content
      const generatedQuiz = await generateQuiz(content, settings, selectedSubject, uploadedDocumentId);
      
      if (!generatedQuiz || !generatedQuiz.quiz || generatedQuiz.quiz.length === 0) {
        toast.error(t("Failed to generate quiz. Please try with different content"));
        setIsGenerating(false);
        return;
      }
      
      // Transform the generated questions to our app format
      const transformedQuestions = transformQuizQuestions(generatedQuiz);
      
      if (transformedQuestions.length === 0) {
        toast.error(t("Failed to transform quiz questions"));
        setIsGenerating(false);
        return;
      }
      
      // Save the transformed questions to session storage
      sessionStorage.setItem('quizQuestions', JSON.stringify(transformedQuestions));
      
      // Save quiz metadata
      const quizData = {
        source: uploadType === 'file' && uploadedFile ? uploadedFile.file.name : 
               (uploadType === 'recent' && recentText ? recentText.name : t("Custom text")),
        difficulty: difficulty,
        questionTypes: selectedQuestionTypes,
        numQuestions: transformedQuestions.length,
        createdAt: new Date().toISOString(),
        subjectId: selectedSubject || '',
        documentId: uploadedDocumentId,
        model: getSelectedModel()
      };
      
      // Save quiz data to session storage
      sessionStorage.setItem('quizData', JSON.stringify(quizData));
      
      // Save quiz to the database if a subject is selected
      if (selectedSubject) {
        const quizTitle = uploadType === 'file' && uploadedFile ? uploadedFile.file.name : 
                         (uploadType === 'recent' && recentText ? recentText.name : t("Quiz") + ` ${new Date().toLocaleDateString()}`);
        
        // Use the updated function that takes an options object
        const quizId = await createQuiz({
          subjectId: selectedSubject,
          documentId: uploadedDocumentId,
          title: quizTitle,
          questions: transformedQuestions
        });
        
        if (quizId) {
          // Save quiz ID to session storage for later use when saving results
          sessionStorage.setItem('currentQuizId', quizId);
          console.log('Saved quiz ID to session storage:', quizId);
        }
      }
      
      setIsGenerating(false);
      navigate('/quiz');
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error(t("Error creating quiz. Please try again."));
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">{t("Create a New Quiz")}</h1>
      
      {/* Upload Type Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("Choose Upload Type")}</h2>
        <div className="flex space-x-4">
          <button
            className={`flex items-center justify-center px-4 py-2 rounded-md border ${uploadType === 'file' ? 'border-cat bg-cat/5 font-semibold' : 'border-gray-300 hover:border-cat/50'}`}
            onClick={() => setUploadType('file')}
          >
            <FileIcon className="mr-2 h-4 w-4" />
            {t("Upload File")}
          </button>
          <button
            className={`flex items-center justify-center px-4 py-2 rounded-md border ${uploadType === 'text' ? 'border-cat bg-cat/5 font-semibold' : 'border-gray-300 hover:border-cat/50'}`}
            onClick={() => setUploadType('text')}
          >
            <TextIcon className="mr-2 h-4 w-4" />
            {t("Enter Text")}
          </button>
          {recentText && (
            <button
              className={`flex items-center justify-center px-4 py-2 rounded-md border ${uploadType === 'recent' ? 'border-cat bg-cat/5 font-semibold' : 'border-gray-300 hover:border-cat/50'}`}
              onClick={() => setUploadType('recent')}
            >
              <Clock className="mr-2 h-4 w-4" />
              {t("Use Recent Text")}
            </button>
          )}
        </div>
      </div>
      
      {/* File Upload Section */}
      {uploadType === 'file' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{t("Upload File")}</h2>
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadedFile && (
            <p className="mt-2 text-sm text-gray-600">{t("Uploaded file")}: {uploadedFile.file.name}</p>
          )}
        </div>
      )}
      
      {/* Text Input Section */}
      {uploadType === 'text' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{t("Enter Text Content")}</h2>
          <Textarea
            placeholder={t("Enter your text here...")}
            className="w-full h-40 border rounded-md focus:ring-cat focus:border-cat focus:outline-none transition-colors"
            value={textContent}
            onChange={handleTextChange}
          />
        </div>
      )}
      
      {/* Use Recent Text Section */}
      {uploadType === 'recent' && recentText && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{t("Using Recent Text")}</h2>
          <div className="p-4 border rounded-md bg-gray-50">
            <p className="text-gray-800">{recentText.name}</p>
            <p className="text-sm text-gray-600 mt-2">{t("Content preview")}: {recentText.content.substring(0, 100)}...</p>
          </div>
        </div>
      )}
      
      {/* Subject Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("Select Subject")}</h2>
        <Select onValueChange={handleSubjectChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("Select a subject")} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Difficulty Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("Select Difficulty")}</h2>
        <Select onValueChange={handleDifficultyChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("Select difficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">{t("Easy")}</SelectItem>
            <SelectItem value="medium">{t("Medium")}</SelectItem>
            <SelectItem value="hard">{t("Hard")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Number of Questions Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("Number of Questions")}</h2>
        <Slider
          defaultValue={[5]}
          max={20}
          min={1}
          step={1}
          onValueChange={handleNumQuestionsChange}
        />
        <p className="text-sm text-gray-600 mt-2">{t("Selected number of questions")}: {numQuestions}</p>
      </div>
      
      {/* Question Types Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("Select Question Types")}</h2>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiple-choice"
              checked={selectedQuestionTypes.includes('multiple-choice')}
              onCheckedChange={() => toggleQuestionType('multiple-choice')}
            />
            <Label htmlFor="multiple-choice">{t("Multiple Choice")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="true-false"
              checked={selectedQuestionTypes.includes('true-false')}
              onCheckedChange={() => toggleQuestionType('true-false')}
            />
            <Label htmlFor="true-false">{t("True/False")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="open-ended"
              checked={selectedQuestionTypes.includes('open-ended')}
              onCheckedChange={() => toggleQuestionType('open-ended')}
            />
            <Label htmlFor="open-ended">{t("Open-ended")}</Label>
          </div>
        </div>
      </div>
      
      {/* Create Quiz Button */}
      <Button
        className="w-full bg-cat text-white hover:bg-cat/90 font-semibold py-3 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={handleCreateQuiz}
        disabled={isGenerating || !selectedSubject || (uploadType === 'file' && !uploadedFile) || (uploadType === 'text' && !textContent && !recentText)}
      >
        {isGenerating ? t("Generating Quiz...") : t("Generate Quiz")}
      </Button>
    </div>
  );
};

export default Upload;
