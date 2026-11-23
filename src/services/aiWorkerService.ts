import { ChatAction } from '../components/AI/FloatingAIChat';

const WORKER_URL = (import.meta.env.VITE_CLOUDFLARE_WORKER_URL || '').replace(/\/$/, '');
const WORKER_TOKEN = import.meta.env.VITE_WORKER_AUTH_TOKEN || '';

export const isWorkerConfigured = (): boolean => {
  return Boolean(WORKER_URL && WORKER_URL.length > 5);
};

export const getWorkerUrl = (): string => WORKER_URL;

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (WORKER_TOKEN) {
    headers['Authorization'] = `Bearer ${WORKER_TOKEN}`;
    headers['X-ClaimAI-Token'] = WORKER_TOKEN;
  }
  return headers;
};

export const checkWorkerHealth = async (): Promise<{ ok: boolean; info?: any; error?: string }> => {
  if (!isWorkerConfigured()) {
    return { ok: false, error: 'לא הוגדר URL עבור הוורקר ב-Netlify (VITE_CLOUDFLARE_WORKER_URL)' };
  }

  try {
    const res = await fetch(`${WORKER_URL}/api/health`, {
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

export const askWorkerAI = async (
  query: string,
  context: {
    currentUser?: { name?: string; role?: string; email?: string };
    clientsSummary?: Array<{ id: string; name: string; company?: string; status: string; phone?: string; requiresAttention?: boolean }>;
    productSummary?: Array<{ id: string; title: string; priority: string; status: string; client?: string; category?: string }>;
  }
): Promise<{ text: string; actions?: ChatAction[] } | null> => {
  if (!isWorkerConfigured()) return null;

  try {
    const res = await fetch(`${WORKER_URL}/api/chat`, {
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

  try {
    const res = await fetch(`${WORKER_URL}/api/analyze-table`, {
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
