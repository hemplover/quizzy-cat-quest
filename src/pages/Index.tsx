
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, FileText, BarChart3, Cat } from 'lucide-react';
import CatTutor from '@/components/CatTutor';
import { cn } from '@/lib/utils';

const featuresData = [
  {
    icon: <FileText className="w-6 h-6 text-cat" />,
    title: "AI Quiz Generation",
    description: "Upload your study materials and our AI will create personalized quizzes tailored to your content."
  },
  {
    icon: <Cat className="w-6 h-6 text-cat" />,
    title: "Feline Tutor",
    description: "Study with our intelligent and ironic cat tutor that provides feedback with a touch of humor."
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-cat" />,
    title: "Progress Tracking",
    description: "Track your progress and identify weak areas to focus your study efforts efficiently."
  }
];

const levelsData = [
  { name: "Scholarly Kitten", xp: "0 XP", description: "Just starting out on your learning journey" },
  { name: "Curious Cat", xp: "100 XP", description: "Building knowledge and asking good questions" },
  { name: "Clever Feline", xp: "500 XP", description: "Mastering concepts and connecting ideas" },
  { name: "Academic Tabby", xp: "1000 XP", description: "Applying knowledge in complex scenarios" },
  { name: "Wisdom Tiger", xp: "2500 XP", description: "Teaching others and mastering difficult subjects" }
];

const Index = () => {
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLevel((prev) => (prev + 1) % levelsData.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Learn Smarter with Your <span className="animated-gradient-text">Feline Tutor</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Upload your notes and let our AI create personalized quizzes. 
              Study with style, earn XP, and level up with the help of your cat friend.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/upload" className="cat-button">
                <Upload className="w-5 h-5" /> 
                Upload Your Materials
              </Link>
              
              <Link to="/dashboard" className="cat-button-secondary">
                See How It Works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-cat/20 via-secondary/20 to-primary/20 blur-3xl opacity-70 -z-10"></div>
            <div className="glass-card p-8 rounded-2xl relative">
              <div className="absolute -top-6 right-8">
                <CatTutor
                  message="Hi there! I'm your feline tutor. Let me help you ace those exams!"
                  withSpeechBubble={true}
                  emotion="happy"
                />
              </div>
              
              <div className="pt-8 pb-2">
                <h3 className="text-lg font-medium mb-4">Your Learning Journey</h3>
                
                <div className="space-y-6 mt-8">
                  {levelsData.map((level, index) => (
                    <div 
                      key={level.name} 
                      className={cn(
                        "flex items-center gap-3 transition-all duration-500",
                        currentLevel === index ? "opacity-100 scale-105" : "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white",
                        currentLevel === index ? "bg-cat animate-pulse-subtle" : "bg-gray-300"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{level.name}</h4>
                        <p className="text-xs text-muted-foreground">{level.xp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How QuizzyPurr Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our intelligent cat-powered platform makes studying effective and surprisingly fun
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <div 
              key={feature.title} 
              className="glass-card p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-cat/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cat/30 to-primary/5 opacity-20"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning with Your Cat Tutor?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Upload your study materials and let our AI generate personalized quiz questions. 
            Rise through the ranks from Scholarly Kitten to Wisdom Tiger!
          </p>
          
          <Link to="/upload" className="cat-button inline-flex">
            <Upload className="w-5 h-5" /> 
            Upload Your Materials
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
