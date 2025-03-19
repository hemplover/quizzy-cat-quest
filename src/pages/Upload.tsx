
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, BookOpen, Settings, Sparkles, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import CatTutor from '@/components/CatTutor';
import { toast } from 'sonner';
import { extractTextFromFile, generateQuiz, transformQuizQuestions } from '@/services/openaiService';
import ApiKeyForm from '@/components/ApiKeyForm';

const difficultyLevels = [
  { id: 'beginner', name: 'Beginner', description: 'Basic recall questions' },
  { id: 'intermediate', name: 'Intermediate', description: 'Application of concepts' },
  { id: 'advanced', name: 'Advanced', description: 'Analysis and synthesis' },
];

const questionTypes = [
  { id: 'multiple-choice', name: 'Multiple Choice' },
  { id: 'true-false', name: 'True/False' },
  { id: 'open-ended', name: 'Open Ended' },
];

const Upload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple-choice', 'true-false']);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [catMessage, setCatMessage] = useState("Upload your notes or paste your text. I'll help create the perfect quiz!");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isTextExtracted, setIsTextExtracted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  useEffect(() => {
    // Check if API key is already set
    const key = localStorage.getItem('openai_api_key');
    setHasApiKey(!!key);
  }, []);

  const handleApiKeySubmit = (key: string) => {
    setHasApiKey(true);
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setCatMessage(`Processing "${file.name}"... Let me extract the text from it.`);
    setIsTextExtracted(false);
    setExtractedText(null);
    setIsProcessing(true);
    
    try {
      // Extract text from the file
      const text = await extractTextFromFile(file);
      
      if (!text || text.trim().length < 100) {
        toast.error("Impossibile estrarre abbastanza testo dal file. Prova con un altro file o incolla il testo direttamente.");
        setCatMessage("I couldn't extract enough text from that file. Please try another one or paste text directly.");
        setIsProcessing(false);
        return;
      }
      
      setExtractedText(text);
      setIsTextExtracted(true);
      setIsProcessing(false);
      toast.success(`Successfully processed ${file.name}`);
      setCatMessage(`Great! I've extracted the text from "${file.name}". You can review it below before creating a quiz.`);
    } catch (error) {
      console.error("Error extracting text from file:", error);
      toast.error("Failed to process file. Please try again or paste text directly.");
      setCatMessage("Sorry, I had trouble processing that file. Could you try a different format or paste your text directly?");
      setIsProcessing(false);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setExtractedText(null);
    setIsTextExtracted(false);
    
    if (e.target.value.length > 200 && !selectedFile) {
      setCatMessage("That's a good amount of text! I can definitely create some challenging questions from this.");
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

  const handleExtractText = () => {
    if (textInput.trim().length > 100) {
      setExtractedText(textInput);
      setIsTextExtracted(true);
      setCatMessage("Great! I've processed your text. You can review it before creating a quiz.");
      toast.success("Text processed successfully!");
    } else {
      toast.error("Please enter more text (at least 100 characters).");
      setCatMessage("I need more text to work with. Please enter at least a paragraph or two.");
    }
  };

  const handleCreateQuiz = async () => {
    if (!extractedText || extractedText.trim().length < 200) {
      toast.error("Please provide more detailed content to generate a quality quiz");
      setCatMessage("I need more material to work with! Please upload a file or add more text.");
      return;
    }

    // Check if we have an API key
    if (!hasApiKey) {
      toast.error("Please set your OpenAI API key first");
      return;
    }

    setCatMessage("Processing your materials... This is exciting! I'm creating challenging questions based exactly on your content.");
    setIsGeneratingQuiz(true);

    try {
      // Generate quiz using OpenAI
      const generatedQuiz = await generateQuiz(extractedText);
      
      if (generatedQuiz && generatedQuiz.quiz && generatedQuiz.quiz.length > 0) {
        // Transform the quiz to our app's format
        const questions = transformQuizQuestions(generatedQuiz);
        
        // Store quiz in session storage
        sessionStorage.setItem('quizQuestions', JSON.stringify(questions));
        sessionStorage.setItem('quizData', JSON.stringify({
          source: selectedFile ? selectedFile.name : 'Text input',
          difficulty,
          questionTypes: selectedQuestionTypes,
          numQuestions: questions.length,
          createdAt: new Date().toISOString()
        }));
        
        toast.success("Quiz created successfully!");
        navigate('/quiz');
      } else {
        setCatMessage("I couldn't create a good quiz from this content. Please provide more detailed study material.");
        toast.error("Unable to generate quiz. Please provide more detailed content or try a different file.");
        setIsGeneratingQuiz(false);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
      setCatMessage("Oops! Something went wrong. Let's try again, shall we?");
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Study Materials</h1>
          <p className="text-muted-foreground">
            Upload your notes, documents, or paste text to generate personalized quiz questions
          </p>
        </div>
        <div className="flex flex-col items-end">
          <CatTutor message={catMessage} emotion={isProcessing ? "thinking" : isTextExtracted ? "happy" : "neutral"} />
          <div className="mt-2">
            <ApiKeyForm onKeySubmit={handleApiKeySubmit} />
          </div>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileUp className="w-5 h-5 text-cat" />
          <h2 className="text-xl font-medium">Step 1: Upload Document or Paste Text</h2>
        </div>
        
        <div className="mb-6">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
        
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-cat" />
            <h2 className="text-xl font-medium">Or Paste Your Text</h2>
          </div>
          
          <textarea
            className="w-full h-40 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
            placeholder="Paste your study notes, text or content here..."
            value={textInput}
            onChange={handleTextInputChange}
            disabled={isProcessing}
          ></textarea>
          
          {!isTextExtracted && textInput.trim().length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleExtractText}
                disabled={isProcessing || textInput.trim().length < 100}
                className="cat-button-secondary"
              >
                <FileText className="w-5 h-5 mr-2" />
                Process Text
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isTextExtracted && extractedText && (
        <div className="glass-card p-6 rounded-xl mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-medium">Step 2: Extracted Content</h2>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto mb-4">
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {extractedText}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            This is the text that will be used to generate your quiz. Make sure it contains the key information you want to be tested on.
          </p>
        </div>
      )}
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-cat" />
          <h2 className="text-xl font-medium">Step 3: Quiz Settings</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
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
              <label className="block text-sm font-medium mb-2">Question Types</label>
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
                Number of Questions: {numQuestions}
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
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleCreateQuiz}
          disabled={isGeneratingQuiz || !isTextExtracted || !extractedText}
          className={`cat-button ${(!isTextExtracted || !extractedText) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGeneratingQuiz ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse mr-2" />
              Generating Quiz...
            </>
          ) : (
            <>
              Create Quiz
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Upload;
