import { 
  createContext, 
  useState, 
  useContext, 
  useEffect, 
  ReactNode 
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  getCurrentUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
  getCurrentUserId: () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        console.log("Initial session check completed:", initialSession?.user?.email);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      }
    }).catch(err => {
      if (isMounted) {
         console.error("Error getting initial session:", err);
         setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log(`[AuthContext Listener] Event: ${event}, Session User: ${currentSession?.user?.email}`);
        if (currentSession) {
          console.log('[AuthContext Listener] Full Session Object:', currentSession);
        }

        if (isMounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };
  
  const getCurrentUserId = () => {
    return user?.id || null;
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut,
      isAuthenticated: !!user,
      getCurrentUserId
    }}>
      {children}
    </AuthContext.Provider>
  );
};
