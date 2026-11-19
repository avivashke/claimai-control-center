import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || 'crm-summary';

  try {
    const store = getStore({
      name: 'claimai-data',
      consistency: 'strong'
    });

    if (req.method === 'GET') {
      const data = await store.get(key, { type: 'json' });
      return new Response(JSON.stringify({ success: true, key, data }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      await store.setJSON(key, body);
      return new Response(JSON.stringify({ success: true, key, message: 'Saved to Netlify Blobs' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Netlify Blobs operation failed' 
    }), {
      status: 200, // Return 200 with error info so client can gracefully fallback
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
