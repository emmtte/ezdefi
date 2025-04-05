// app/api/proxy/route.js

export async function OPTIONS(req) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

export async function POST(req) {
    const targetUrl = 'https://sepolia.drpc.org/';
  
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers.get('content-type'),
          // Ajouter d'autres en-têtes si nécessaire
        },
        body: await req.text(),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      return Response.json({ error: 'Proxy error' }, { status: 500 });
    }
  }
  
  export async function GET(req) {
      const targetUrl = 'https://sepolia.drpc.org/';
  
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': req.headers.get('content-type'),
          // Ajouter d'autres en-têtes si nécessaire
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      return Response.json({ error: 'Proxy error' }, { status: 500 });
    }
  }