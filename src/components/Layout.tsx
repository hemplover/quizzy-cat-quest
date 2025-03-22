
import { ReactNode } from 'react';
import Navigation from './Navigation'; 
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className={cn("flex-1 p-4 pt-6 md:p-8", className)}>
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} QuizzyCat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
