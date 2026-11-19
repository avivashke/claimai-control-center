// Client-side Netlify Blobs integration service

export const testNetlifyBlobs = async (): Promise<{ isAvailable: boolean; message: string; latency?: number }> => {
  const start = performance.now();
  try {
    const res = await fetch('/.netlify/functions/blobs-sync?key=healthcheck', {
      method: 'GET'
    });
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      if (data.success !== false) {
        return { isAvailable: true, message: 'Netlify Blobs מחובר ופועל בהצלחה ב-Edge!', latency };
      }
    }
    return { isAvailable: false, message: 'Netlify Blobs זמין בסביבת Netlify בלבד (בדוק אחרי Deploy)', latency };
  } catch (err: any) {
    return { isAvailable: false, message: 'סביבה מקומית / פונקציית Blobs טרם הופעלה' };
  }
};

export const saveSnapshotToBlobs = async (key: string, data: any): Promise<boolean> => {
  try {
    const res = await fetch(`/.netlify/functions/blobs-sync?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const getSnapshotFromBlobs = async (key: string): Promise<any | null> => {
  try {
    const res = await fetch(`/.netlify/functions/blobs-sync?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
    return null;
  } catch {
    return null;
  }
};
