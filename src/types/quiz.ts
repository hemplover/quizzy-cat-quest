
export interface QuizQuestion {
  tipo?: string;
  domanda?: string;
  question?: string;
  opzioni?: string[];
  options?: string[];
  risposta_corretta?: string;
  correct_answer?: string;
  spiegazione?: string;
  explanation?: string;
}

export interface GeneratedQuiz {
  quiz: QuizQuestion[];
}

export interface QuizResults {
  risultati: Array<{
    domanda: string;
    risposta_utente: string | number;
    corretto: boolean | string;
    punteggio: number;
    spiegazione: string;
  }>;
  punteggio_totale: number;
  feedback_generale?: string;
}

export interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  model?: string;
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
}
