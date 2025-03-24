
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: string;
  nextLevel: string;
}

const XPBar: React.FC<XPBarProps> = ({ 
  currentXP, 
  nextLevelXP,
  level,
  nextLevel
}) => {
  const { t } = useLanguage();
  
  // Ensure XP values are numbers
  const current = typeof currentXP === 'number' ? currentXP : 0;
  const target = typeof nextLevelXP === 'number' ? nextLevelXP : 100;
  
  // Calculate percentage - ensure it's between 0-100
  const percentage = Math.min(Math.round((current / Math.max(target, 1)) * 100), 100) || 0;
  
  console.log(`XP Bar - Current: ${current}, Target: ${target}, Percentage: ${percentage}%`);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <div className="font-medium">
          {t('currentLevel')}: <span className="text-cat">{level}</span>
        </div>
        <div className="text-muted-foreground">
          {current} / {target} XP
        </div>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          "h-2 bg-gray-100",
          "relative overflow-hidden"
        )}
      >
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-all duration-500"
          )}>
          <span className="text-xs font-medium text-white z-10">{percentage}%</span>
        </div>
      </Progress>
      
      <div className="text-xs text-right text-muted-foreground">
        {target - current} XP {t('toNextLevel')}: <span className="font-medium">{nextLevel}</span>
      </div>
    </div>
  );
};

export default XPBar;
