export interface Scan {
  id: string;
  user_id: string;
  raw_text: string | null;
  ai_summary: string | null;
  document_type: string | null;
  key_points: string[] | null;
  flags: string[] | null;
  created_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  scan_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ExplainResponse {
  title: string;
  summary: string;
  document_type: string;
  key_points: string[];
  flags: string[];
  scan_id: string;
}

export interface ChatResponse {
  reply: string;
}
