
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Award, Upload } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface RecentQuizzesSectionProps {
  subjects: any[];
}

const RecentQuizzesSection: React.FC<RecentQuizzesSectionProps> = ({ subjects }) => {
  const { t } = useLanguage();
  const hasQuizzes = subjects.some(s => s.quizCount > 0);

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-cat" />
        {t('recentQuizzes')}
      </h2>
      
      {hasQuizzes ? (
        <div className="space-y-4">
          {subjects
            .filter(subject => subject.quizCount > 0)
            .slice(0, 3)
            .map((subject, index) => (
              <Link 
                key={index}
                to={`/subjects/${subject.id}`}
                className="p-4 bg-white rounded-lg border flex justify-between items-center"
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
                    <p className="text-xs text-muted-foreground">
                      {subject.quizCount} {t(subject.quizCount === 1 ? 'quiz' : 'quizzes').toLowerCase()}
                    </p>
                  </div>
                </div>
                
                {subject.completedQuizCount > 0 && (
                  <div className="text-right">
                    <p className="font-bold">{subject.averageScore}%</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.completedQuizCount} {t('completed').toLowerCase()}
                    </p>
                  </div>
                )}
              </Link>
            ))}

          <Link 
            to="/upload"
            className="cat-button w-full justify-center mt-4"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('createNewQuiz')}
          </Link>
        </div>
      ) : (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-600 mb-2">{t('noRecentQuizzes')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('takeYourFirstQuiz')}
          </p>
          <Link to="/upload" className="cat-button-secondary inline-flex">
            <Upload className="w-4 h-4 mr-2" />
            {t('createNewQuiz')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentQuizzesSection;
