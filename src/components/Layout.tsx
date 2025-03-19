
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileUp, 
  Book, 
  BarChart3, 
  Menu, 
  X,
  Cat
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
  { name: 'Upload', path: '/upload', icon: <FileUp className="w-5 h-5" /> },
  { name: 'Quiz', path: '/quiz', icon: <Book className="w-5 h-5" /> },
  { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
];

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-cat rounded-full p-1.5">
              <Cat className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold hidden sm:inline-block">QuizzyPurr</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname === item.path
                    ? "bg-cat/10 text-cat"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden container mx-auto px-4 pb-3 border-t border-border/5 animate-fade-in">
            <nav className="flex flex-col space-y-1 mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    location.pathname === item.path
                      ? "bg-cat/10 text-cat"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 page-transition">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2023 QuizzyPurr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
