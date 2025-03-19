import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, BookOpen, Settings, Sparkles, ArrowRight } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import CatTutor from '@/components/CatTutor';
import { toast } from 'sonner';

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

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setCatMessage(`Good choice! "${file.name}" looks like interesting study material. Let's make a quiz from it!`);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
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

  const handleCreateQuiz = async () => {
    if (!selectedFile && textInput.trim().length < 50) {
      toast.error("Please upload a file or enter more text to generate a quiz");
      setCatMessage("I need more material to work with! Please upload a file or add more text.");
      return;
    }

    setCatMessage("Processing your materials... This is exciting! I'm creating challenging questions just for you.");
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      toast.success("Quiz created successfully!");
      
      sessionStorage.setItem('quizData', JSON.stringify({
        source: selectedFile ? selectedFile.name : 'Text input',
        difficulty,
        questionTypes: selectedQuestionTypes,
        numQuestions,
        createdAt: new Date().toISOString()
      }));
      
      navigate('/quiz');
    } catch (error) {
      toast.error("Failed to create quiz. Please try again.");
      setCatMessage("Oops! Something went wrong. Let's try again, shall we?");
      setIsProcessing(false);
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
        <CatTutor message={catMessage} emotion="thinking" />
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileUp className="w-5 h-5 text-cat" />
          <h2 className="text-xl font-medium">Upload Document</h2>
        </div>
        
        <FileUpload 
          onFileUpload={handleFileUpload} 
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
        />
        
        <div className="mt-6">
          <p className="text-sm text-center text-muted-foreground">or paste your text below</p>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-cat" />
          <h2 className="text-xl font-medium">Paste Your Text</h2>
        </div>
        
        <textarea
          className="w-full h-40 p-4 border rounded-lg focus:ring-cat focus:border-cat focus:outline-none transition-colors"
          placeholder="Paste your study notes, text or content here..."
          value={textInput}
          onChange={handleTextInputChange}
        ></textarea>
      </div>
      
      <div className="glass-card p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-cat" />
          <h2 className="text-xl font-medium">Quiz Settings</h2>
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
                max="30"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cat"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5</span>
                <span>30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleCreateQuiz}
          disabled={isProcessing}
          className="cat-button"
        >
          {isProcessing ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              Generating Quiz...
            </>
          ) : (
            <>
              Create Quiz
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Upload;
