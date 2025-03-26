
export interface QuizSession {
  id: string;
  creator_id: string | null;
  quiz_id: string;
  session_code: string;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  settings: {
    maxParticipants?: number;
    waitForAll?: boolean;
    timeLimit?: number;
  };
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string | null;
  username: string;
  score: number;
  completed: boolean;
  answers: Array<{
    question_id: number;
    answer: string | number;
    correct: boolean;
    time_taken?: number;
    points: number;
  }>;
  joined_at: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  position: number;
  isCurrentUser: boolean;
  completedAt?: string;
}
