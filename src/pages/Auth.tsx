import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate(redirectPath);
      }
    };
    
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate(redirectPath);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, redirectPath]);
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('Please enter both email and password'));
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(t('Successfully signed in'));
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || t('Error signing in'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('Please enter both email and password'));
      return;
    }
    
    if (password.length < 6) {
      toast.error(t('Password must be at least 6 characters'));
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(t('Account created successfully'));
      toast.info(t('Please check your email for confirmation'));
    } catch (error: any) {
      console.error('Error signing up:', error);
      if (error.message.includes('already registered')) {
        toast.error(t('This email is already registered'));
      } else {
        toast.error(error.message || t('Error creating account'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      if (error) {
        throw error;
      }
      
      // Redirect happens automatically to the Site URL
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error(error.message || t('Error signing in with Google'));
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/10">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Back to home')}
          </Button>
          <Link to="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-center">Quizzy<span className="text-primary">Cat</span></h1>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{authMode === 'sign-in' ? t('Sign in') : t('Create an account')}</CardTitle>
            <CardDescription>
              {authMode === 'sign-in' 
                ? t('Sign in to access your quizzes and study materials')
                : t('Create a new account to start creating quizzes')}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'sign-in' | 'sign-up')}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">{t('Sign in')}</TabsTrigger>
                <TabsTrigger value="sign-up">{t('Sign up')}</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="sign-in">
              <form onSubmit={handleEmailSignIn}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('Email')}</Label>
                    <Input
                      id="email"
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('Password')}</Label>
                      {/* Password reset can be added later */}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {t('Sign in')}
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t('Or continue with')}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="sign-up">
              <form onSubmit={handleEmailSignUp}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('Email')}</Label>
                    <Input
                      id="email"
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('Password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Password must be at least 6 characters')}
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 pt-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {t('Create account')}
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {t('Or continue with')}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
