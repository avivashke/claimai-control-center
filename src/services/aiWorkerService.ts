import { ChatAction } from '../components/AI/FloatingAIChat';

const STORAGE_WORKER_URL_KEY = 'claimai_custom_worker_url';
const STORAGE_WORKER_TOKEN_KEY = 'claimai_custom_worker_token';

export const getWorkerUrl = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_WORKER_URL_KEY) : null;
  if (custom && custom.trim().length > 5) {
    return custom.trim().replace(/\/$/, '');
  }
  return (import.meta.env.VITE_CLOUDFLARE_WORKER_URL || '').replace(/\/$/, '');
};

export const getWorkerToken = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_WORKER_TOKEN_KEY) : null;
  if (custom && custom.trim()) {
    return custom.trim();
  }
  return import.meta.env.VITE_WORKER_AUTH_TOKEN || '';
};

export const setCustomWorkerConfig = (url: string, token?: string): void => {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim().replace(/\/$/, '');
  if (cleanUrl) {
    localStorage.setItem(STORAGE_WORKER_URL_KEY, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_WORKER_URL_KEY);
  }

  if (token && token.trim()) {
    localStorage.setItem(STORAGE_WORKER_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(STORAGE_WORKER_TOKEN_KEY);
  }
};

export const clearCustomWorkerConfig = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_WORKER_URL_KEY);
  localStorage.removeItem(STORAGE_WORKER_TOKEN_KEY);
};

export const isWorkerConfigured = (): boolean => {
  const url = getWorkerUrl();
  return Boolean(url && url.length > 5);
};

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getWorkerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-ClaimAI-Token'] = token;
  }
  return headers;
};

export const checkWorkerHealth = async (): Promise<{ ok: boolean; info?: any; error?: string }> => {
  if (!isWorkerConfigured()) {
    return { ok: false, error: 'לא הוגדר URL עבור הוורקר. ניתן להגדיר ב-Netlify (VITE_CLOUDFLARE_WORKER_URL) או ישירות בהגדרות המערכת' };
  }

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/health`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      return { ok: false, error: `Worker returned HTTP ${res.status}` };
    }
    const info = await res.json();
    return { ok: true, info };
  } catch (err: any) {
    return { ok: false, error: err.message || 'שגיאת רשת בפנייה לוורקר' };
  }
};

export interface ChatContextPayload {
  currentUser?: { name?: string; role?: string; email?: string };
  stats?: {
    totalClients: number;
    urgentCount: number;
    meetingCount: number;
    importantCount: number;
    statusDistribution: Record<string, number>;
    businessTypeDistribution: Record<string, number>;
    totalTickets: number;
    criticalBugsCount: number;
  };
  matchedClients?: Array<{
    id: string;
    name: string;
    company?: string;
    businessType?: string;
    status: string;
    subStatus?: string;
    phone?: string;
    email?: string;
    lastNote?: string;
    requiresAttention?: boolean;
  }>;
  matchedTickets?: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    client?: string;
    category?: string;
  }>;
  customTablesSummary?: Array<{
    id: string;
    name: string;
    rowCount: number;
  }>;
  clientsSummary?: Array<{ id: string; name: string; company?: string; status: string; phone?: string; requiresAttention?: boolean }>;
  productSummary?: Array<{ id: string; title: string; priority: string; status: string; client?: string; category?: string }>;
}

export const askWorkerAI = async (
  query: string,
  context: ChatContextPayload
): Promise<{ text: string; actions?: ChatAction[] } | null> => {
  if (!isWorkerConfigured()) return null;

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query,
        ...context,
      }),
    });

    if (!res.ok) {
      console.warn(`Cloudflare Worker chat failed with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      text: data.text || '',
      actions: data.actions || [],
    };
  } catch (err) {
    console.warn('Failed to contact Cloudflare Worker AI, falling back to local engine:', err);
    return null;
  }
};

export const analyzeTableWithWorker = async (
  headers: string[],
  sampleRows: Record<string, any>[],
  userPrompt?: string
): Promise<{ tableName: string; description: string; columns: any[] } | null> => {
  if (!isWorkerConfigured()) return null;

  const url = getWorkerUrl();
  try {
    const res = await fetch(`${url}/api/analyze-table`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        headers,
        sampleRows: sampleRows.slice(0, 10),
        userPrompt,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Worker table analysis error:', err);
    return null;
  }
};
