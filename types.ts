export enum InterviewState {
  WELCOME = 'WELCOME',
  SELECTION = 'SELECTION',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK',
}

export enum Role {
    USER = 'user',
    ASSISTANT = 'assistant',
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Feedback {
  overallSummary: string;
  strengths: string;
  areasForImprovement: string;
  missedConcepts: string;
  keyTakeaways: string;
}