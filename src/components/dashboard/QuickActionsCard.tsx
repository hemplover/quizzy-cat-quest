
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, FolderPlus, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface QuickActionsCardProps {
  onCreateSubject: () => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ onCreateSubject }) => {
  const { t } = useLanguage();

  return (
    <div className="glass-card p-6 rounded-xl w-full md:w-1/3">
      <h2 className="text-xl font-bold mb-4">{t('quickActions')}</h2>
      
      <div className="space-y-3">
        <Link 
          to="/upload" 
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-cat/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-cat" />
          </div>
          <div>
            <h3 className="font-medium">{t('createNewQuiz')}</h3>
            <p className="text-xs text-muted-foreground">{t('uploadDocument')}</p>
          </div>
        </Link>
        
        <button
          onClick={onCreateSubject}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium">{t('newSubject')}</h3>
            <p className="text-xs text-muted-foreground">{t('createYourFirstSubject')}</p>
          </div>
        </button>
        
        <Link 
          to="/subjects" 
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium">{t('subjects')}</h3>
            <p className="text-xs text-muted-foreground">{t('subjectManager')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default QuickActionsCard;
