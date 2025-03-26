
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookText, Brain, Users, Upload, ArrowRight } from 'lucide-react';
import CatTutor from '@/components/CatTutor';
import JoinQuizSession from '@/components/quiz/JoinQuizSession';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto text-center py-12 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Learn Smarter with AI-Generated Quizzes
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Upload your study materials and get instant quizzes to test your knowledge. 
          Share with friends and learn together!
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <JoinQuizSession />
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="glass-card p-6 rounded-xl">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-green-700" />
            </div>
            <h3 className="text-xl font-medium mb-2">Upload Documents</h3>
            <p className="text-muted-foreground">
              Upload your notes, textbooks, or any study materials in various formats.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-xl font-medium mb-2">Generate Quizzes</h3>
            <p className="text-muted-foreground">
              Our AI will analyze your content and create relevant quizzes to test your knowledge.
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="text-xl font-medium mb-2">Multiplayer Mode</h3>
            <p className="text-muted-foreground">
              Challenge your friends to quizzes and compete in real-time with our multiplayer feature.
            </p>
          </div>
        </div>
        
        <div className="mb-16">
          <CatTutor
            message="Ready to try our new multiplayer quiz feature? Create a quiz and invite your friends to join, or join an existing session with a code!"
            emotion="excited"
          />
        </div>
        
        <div className="glass-card p-8 rounded-xl max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <BookText className="w-5 h-5 text-cat" />
                For Solo Study
              </h3>
              <ol className="list-decimal list-inside text-left space-y-2 mb-4">
                <li>Upload your study materials</li>
                <li>Create a quiz from your content</li>
                <li>Test your knowledge</li>
                <li>Review results and track progress</li>
              </ol>
              <Button 
                onClick={() => navigate('/upload')} 
                className="w-full"
              >
                Start Studying
              </Button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-cat" />
                For Group Learning
              </h3>
              <ol className="list-decimal list-inside text-left space-y-2 mb-4">
                <li>Create a quiz from your materials</li>
                <li>Share the session code with friends</li>
                <li>Everyone takes the quiz in real-time</li>
                <li>Compare results on the leaderboard</li>
              </ol>
              <Button 
                onClick={() => navigate('/quiz')} 
                className="w-full"
                variant="outline"
              >
                Try Multiplayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
