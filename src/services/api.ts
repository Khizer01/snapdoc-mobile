import { supabase } from './supabase';
import { ExplainResponse, ChatResponse, Scan, Message } from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (HTTP ${res.status}). Please try again.`);
  }
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

export async function explainDocument(imageBase64: string): Promise<ExplainResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/explain`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: imageBase64 }),
  });
  return handleResponse<ExplainResponse>(res);
}

export async function sendChatMessage(
  scanId: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<ChatResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ scan_id: scanId, message, history }),
  });
  return handleResponse<ChatResponse>(res);
}

export async function getScans(): Promise<Scan[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/scans`, { headers });
  const json = await handleResponse<{ scans: Scan[] }>(res);
  return json.scans;
}

export async function getScan(scanId: string): Promise<{ scan: Scan; messages: Message[] }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/scans/${scanId}`, { headers });
  return handleResponse<{ scan: Scan; messages: Message[] }>(res);
}

export interface ProfileUpdate {
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export async function updateProfile(data: ProfileUpdate): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  await handleResponse<{ user: unknown }>(res);
}

export async function deleteScan(scanId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/scans/${scanId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as any).error ?? `HTTP ${res.status}`);
  }
}

export async function archiveScan(scanId: string, archived: boolean): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/scans/${scanId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ archived }),
  });
  await handleResponse<{ scan: unknown }>(res);
}

export async function getArchivedScans(): Promise<Scan[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/scans/archived`, { headers });
  const json = await handleResponse<{ scans: Scan[] }>(res);
  return json.scans;
}
