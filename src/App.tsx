
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Quiz from "./pages/Quiz";
import Dashboard from "./pages/Dashboard";
import SubjectManager from "./pages/SubjectManager";
import SubjectDetail from "./pages/SubjectDetail";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { LanguageProvider } from "./i18n/LanguageContext";

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              path="/dashboard" 
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              } 
            />
            <Route 
              path="/subjects" 
              element={
                <Layout>
                  <SubjectManager />
                </Layout>
              } 
            />
            <Route 
              path="/subjects/:subjectId" 
              element={
                <Layout>
                  <SubjectDetail />
                </Layout>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
