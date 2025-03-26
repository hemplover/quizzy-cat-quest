
export interface QuizQuestion {
  id?: number;
  type?: string;
  tipo?: string;
  question?: string;
  domanda?: string;
  options?: string[];
  opzioni?: string[];
  risposta_corretta?: string | boolean;
  correct_answer?: string | boolean;
  spiegazione?: string;
  explanation?: string;
}

export interface GeneratedQuiz {
  quiz: QuizQuestion[];
}

export interface QuizResultItem {
  domanda: string;
  risposta_utente: string | number;
  corretto: boolean | string;
  punteggio: number;
  spiegazione: string;
  [key: string]: any; // Add index signature to make it compatible with Json type
}

export interface QuizResults {
  risultati: QuizResultItem[];
  punteggio_totale: number;
  feedback_generale?: string;
  total_points?: number;
  max_points?: number;
  timeSpent?: number;
  completedAt?: string;
  earnedXP?: number;
  [key: string]: any; // Add index signature to make it compatible with Json type
}

export interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  model?: string;
  previousQuizzes?: number;
  documentId?: string;
}

export interface ProcessedFile {
  file: File;
  text?: string;
}

export interface QuizData {
  source: string;
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  createdAt: string;
  model?: string;
  subjectId?: string;
  documentId?: string;
}

export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  subject_id: string;
  document_id?: string;
  questions: any[];
  settings: any;
  results: QuizResults | null;
  user_id: string;
}
