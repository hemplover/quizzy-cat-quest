
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, PlusCircle, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface SubjectsSectionProps {
  subjects: any[];
  isLoading: boolean;
  onCreateSubject: () => void;
}

const SubjectsSection: React.FC<SubjectsSectionProps> = ({
  subjects,
  isLoading,
  onCreateSubject
}) => {
  const { t } = useLanguage();

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cat" />
          {t('subjects')}
        </h2>
        
        <button
          onClick={onCreateSubject}
          className="text-cat hover:bg-cat/10 p-2 rounded-full"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading subjects...</p>
          </div>
        ) : subjects.length > 0 ? (
          subjects.map((subject) => (
            <Link 
              key={subject.id}
              to={`/subjects/${subject.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: subject.color }}
                >
                  {subject.icon}
                </div>
                <div>
                  <h3 className="font-medium">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground">{subject.quizCount} {t(subject.quizCount === 1 ? 'quiz' : 'quizzes').toLowerCase()}</p>
                </div>
              </div>
              
              {subject.completedQuizCount > 0 && (
                <div 
                  className={cn(
                    "px-2 py-1 rounded text-xs font-semibold",
                    subject.averageScore >= 70 ? "bg-green-100 text-green-800" :
                    subject.averageScore >= 40 ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  )}
                >
                  {subject.averageScore}%
                </div>
              )}
            </Link>
          ))
        ) : (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-600 mb-2">{t('noSubjectsFound')}</h3>
            <button
              onClick={onCreateSubject}
              className="cat-button-secondary inline-flex mt-2"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {t('createYourFirstSubject')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectsSection;
