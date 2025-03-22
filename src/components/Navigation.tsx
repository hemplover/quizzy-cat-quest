
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Home, BookOpen, Upload, BarChart2 } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="items-center space-x-2 flex">
            <span className="hidden font-bold sm:inline-block text-xl">
              Quizzy<span className="text-cat">Cat</span>
            </span>
          </Link>
          <div className="flex gap-1 md:gap-2">
            <Button
              asChild
              variant={isActive('/') ? 'default' : 'ghost'}
              className="text-sm"
              size="sm"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-1" />
                {t('Home')}
              </Link>
            </Button>
            
            <Button
              asChild
              variant={isActive('/upload') ? 'default' : 'ghost'}
              className="text-sm"
              size="sm"
            >
              <Link to="/upload">
                <Upload className="h-4 w-4 mr-1" />
                {t('Create Quiz')}
              </Link>
            </Button>
            
            {user && (
              <>
                <Button
                  asChild
                  variant={isActive('/subjects') ? 'default' : 'ghost'}
                  className="text-sm"
                  size="sm"
                >
                  <Link to="/subjects">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {t('Subjects')}
                  </Link>
                </Button>
                
                <Button
                  asChild
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  className="text-sm"
                  size="sm"
                >
                  <Link to="/dashboard">
                    <BarChart2 className="h-4 w-4 mr-1" />
                    {t('Dashboard')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
