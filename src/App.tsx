
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import SubjectManager from "./pages/SubjectManager";
import SubjectDetail from "./pages/SubjectDetail";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthRequired from "./components/AuthRequired";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import MultiplayerHost from "./pages/MultiplayerHost";
import MultiplayerPlayer from "./pages/MultiplayerPlayer";
import MultiplayerSession from "./pages/MultiplayerSession";
import MultiplayerJoin from "./pages/MultiplayerJoin";
import QuizSession from "./pages/QuizSession";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route 
              path="/" 
              element={
                <Layout>
                  <Index />
                </Layout>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <Layout>
                  <Upload />
                </Layout>
              } 
            />
            <Route 
              path="/quiz" 
              element={
                <Layout>
                  <Quiz />
                </Layout>
              } 
            />
            <Route 
              path="/quiz/session/:quizId" 
              element={
                <Layout>
                  <QuizSession />
                </Layout>
              } 
            />
            <Route 
              path="/quiz/multiplayer/host/:sessionCode" 
              element={
                <Layout>
                  <AuthRequired>
                    <MultiplayerHost />
                  </AuthRequired>
                </Layout>
              } 
            />
            <Route 
              path="/quiz/multiplayer/player/:sessionCode" 
              element={
                <Layout>
                  <MultiplayerPlayer />
                </Layout>
              } 
            />
            <Route 
              path="/quiz/multiplayer/session/:sessionCode" 
              element={
                <Layout>
                  <MultiplayerSession />
                </Layout>
              } 
            />
            <Route 
              path="/quiz/multiplayer/join/:sessionCode" 
              element={
                <Layout>
                  <MultiplayerJoin />
                </Layout>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <AuthRequired>
                    <Dashboard />
                  </AuthRequired>
                </Layout>
              } 
            />
            <Route 
              path="/subjects" 
              element={
                <Layout>
                  <AuthRequired>
                    <SubjectManager />
                  </AuthRequired>
                </Layout>
              } 
            />
            <Route 
              path="/subjects/:subjectId" 
              element={
                <Layout>
                  <AuthRequired>
                    <SubjectDetail />
                  </AuthRequired>
                </Layout>
              } 
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
