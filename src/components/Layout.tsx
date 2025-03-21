
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Home, Upload, BookOpen, BarChart2, Folder, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        isActive ? "bg-cat text-white" : "hover:bg-cat/10 text-gray-700"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Check if window width is mobile on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r z-30 transition-all duration-300",
          isSidebarCollapsed ? "w-16" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cat flex items-center justify-center text-white font-bold text-xl">
                Q
              </div>
              {!isSidebarCollapsed && <span className="font-bold text-lg">{t('appName')}</span>}
            </div>
            
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hidden md:block"
            >
              {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
            </button>
            
            <button
              onClick={closeMobileMenu}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="p-3 space-y-1 flex-1">
            <NavLink
              to="/"
              icon={<Home className="w-5 h-5" />}
              label={isSidebarCollapsed ? "" : t('home')}
              onClick={closeMobileMenu}
            />
            <NavLink
              to="/upload"
              icon={<Upload className="w-5 h-5" />}
              label={isSidebarCollapsed ? "" : t('upload')}
              onClick={closeMobileMenu}
            />
            <NavLink
              to="/quiz"
              icon={<BookOpen className="w-5 h-5" />}
              label={isSidebarCollapsed ? "" : t('quiz')}
              onClick={closeMobileMenu}
            />
            <NavLink
              to="/dashboard"
              icon={<BarChart2 className="w-5 h-5" />}
              label={isSidebarCollapsed ? "" : t('dashboard')}
              onClick={closeMobileMenu}
            />
            <NavLink
              to="/subjects"
              icon={<Folder className="w-5 h-5" />}
              label={isSidebarCollapsed ? "" : t('subjects')}
              onClick={closeMobileMenu}
            />
          </nav>

          <div className="p-3 border-t">
            {!isSidebarCollapsed && <LanguageSwitcher />}
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        {/* Mobile header */}
        <header className="bg-white border-b p-4 sticky top-0 flex justify-between items-center z-20 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cat flex items-center justify-center text-white font-bold text-xl">
              Q
            </div>
            <span className="font-bold text-lg">{t('appName')}</span>
          </div>
          
          <LanguageSwitcher />
        </header>
        
        {/* Desktop header */}
        <header className="bg-white border-b p-4 sticky top-0 hidden md:flex justify-end items-center z-20">
          <LanguageSwitcher />
        </header>
        
        {/* Page content */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}
    </div>
  );
};

export default Layout;
