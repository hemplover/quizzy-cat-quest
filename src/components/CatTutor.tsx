
import React, { useState, useEffect } from 'react';
import { Cat, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatTutorProps {
  message?: string;
  randomMessages?: boolean;
  emotion?: 'happy' | 'thinking' | 'excited' | 'confused';
  withSpeechBubble?: boolean;
  className?: string;
}

const randomCatMessages = [
  "Meow! Ready to learn something new?",
  "Did you know cats spend 70% of their lives sleeping? Don't follow my example!",
  "Focus! The quiz isn't going to solve itself... though I wish it would.",
  "Remember, every correct answer gets you one step closer to being as smart as a cat!",
  "Stuck? Just do what I do - stare at it intensely until it makes sense.",
  "Purr-haps you should review that last chapter again?",
  "Your progress is looking paw-sitively amazing!",
  "Feline good about this study session?",
  "That's right! You're almost as clever as me... almost.",
  "Look at you! Learning like a pro while I just sit here looking cute."
];

const CatTutor: React.FC<CatTutorProps> = ({
  message,
  randomMessages = false,
  emotion = 'happy',
  withSpeechBubble = true,
  className
}) => {
  const [currentMessage, setCurrentMessage] = useState(message || randomCatMessages[0]);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const [bubbleKey, setBubbleKey] = useState(0); // For re-triggering animations

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setIsMessageVisible(true);
      setBubbleKey(prev => prev + 1);
    }
  }, [message]);

  useEffect(() => {
    if (randomMessages) {
      const interval = setInterval(() => {
        setIsMessageVisible(false);
        
        setTimeout(() => {
          const newMessage = randomCatMessages[Math.floor(Math.random() * randomCatMessages.length)];
          setCurrentMessage(newMessage);
          setIsMessageVisible(true);
          setBubbleKey(prev => prev + 1);
        }, 500);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [randomMessages]);

  const getEmotionClasses = () => {
    switch (emotion) {
      case 'happy':
        return 'bg-cat text-cat-foreground animate-bounce-subtle';
      case 'thinking':
        return 'bg-blue-500 text-white animate-pulse-subtle';
      case 'excited':
        return 'bg-orange-500 text-white animate-bounce-subtle';
      case 'confused':
        return 'bg-yellow-500 text-white animate-pulse-subtle';
      default:
        return 'bg-cat text-cat-foreground animate-bounce-subtle';
    }
  };

  return (
    <div className={cn("flex items-end gap-3", className)}>
      {withSpeechBubble && isMessageVisible && (
        <div 
          key={bubbleKey}
          className="relative max-w-xs p-4 rounded-2xl rounded-bl-none bg-white border border-border shadow-md animate-fade-in-left"
        >
          <p className="text-sm">{currentMessage}</p>
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-white border-b border-r border-border transform translate-x-(-50%) rotate-45 -translate-y-1/2"></div>
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <div className={cn(
          "rounded-full p-3 shadow-lg", 
          getEmotionClasses()
        )}>
          <Cat className="w-6 h-6" />
        </div>
        
        {!withSpeechBubble && isMessageVisible && (
          <div className="mt-2 text-center max-w-[200px]">
            <p className="text-xs text-muted-foreground">{currentMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatTutor;
