
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired = ({ children }: AuthRequiredProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to auth page');
      // Save the attempted URL for redirection after login
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [user, loading, navigate, location]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return <>{children}</>;
};

export default AuthRequired;
