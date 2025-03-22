
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Process the auth callback
    const processAuth = async () => {
      try {
        // Get the URL hash
        const { hash, search } = window.location;
        
        // OAuth providers like Google use URL hash fragments
        if (hash && hash.includes('access_token')) {
          console.log('Processing token from hash fragment');
          
          // The hash contains all the token information
          // Let Supabase Auth handle it with a side effect
          const { error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error processing auth callback:', error);
            navigate('/auth');
            return;
          }
          
          // Wait a moment to ensure auth state is processed
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else if (search && search.includes('error')) {
          // Handle errors from the OAuth provider
          console.error('Auth error:', search);
          navigate('/auth');
        } else {
          // If no hash with token, redirect to sign in
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/auth');
      }
    };
    
    processAuth();
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
