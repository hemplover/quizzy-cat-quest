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
import { List, File as FileIcon, TextIcon, Clock } from 'lucide-react';
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
      
      const settings = {
        difficulty: difficulty,
        questionTypes: selectedQuestionTypes,
        numQuestions: Number(numQuestions),
        model: getSelectedModel()
      };
      
      const generatedQuiz = await generateQuiz(content, settings, selectedSubject, uploadedDocumentId);
      
      if (!generatedQuiz || !generatedQuiz.quiz || generatedQuiz.quiz.length === 0) {
        toast.error(t("Failed to generate quiz. Please try with different content"));
        setIsGenerating(false);
        return;
      }
      
      const transformedQuestions = transformQuizQuestions(generatedQuiz);
      
      if (transformedQuestions.length === 0) {
        toast.error(t("Failed to transform quiz questions"));
        setIsGenerating(false);
        return;
      }
      
      sessionStorage.setItem('quizQuestions', JSON.stringify(transformedQuestions));
      
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
      
      sessionStorage.setItem('quizData', JSON.stringify(quizData));
      
      if (selectedSubject) {
        const quizTitle = uploadType === 'file' && uploadedFile ? uploadedFile.file.name : 
                         (uploadType === 'recent' && recentText ? recentText.name : t("Quiz") + ` ${new Date().toLocaleDateString()}`);
        
        const quizId = await createQuiz({
          subjectId: selectedSubject,
          documentId: uploadedDocumentId,
          title: quizTitle,
          questions: transformedQuestions
        });
        
        if (quizId) {
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
      
      {

