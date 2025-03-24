
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';

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
  const percentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <div className="font-medium">
          {t('currentLevel')}: <span className="text-cat">{level}</span>
        </div>
        <div className="text-muted-foreground">
          {currentXP} / {nextLevelXP} XP
        </div>
      </div>
      
      <Progress value={percentage} className="h-2 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white z-10">{percentage}%</span>
        </div>
      </Progress>
      
      <div className="text-xs text-right text-muted-foreground">
        {nextLevelXP - currentXP} XP {t('toNextLevel')}: <span className="font-medium">{nextLevel}</span>
      </div>
    </div>
  );
};

export default XPBar;
