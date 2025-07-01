export async function POST(request: Request) {
  try {
    const { endpoint, params, method = 'GET' } = await request.json();
    const apiKey = process.env.BUBBLE_API_KEY;

    if (!apiKey) {
      console.error('BUBBLE_API_KEY is not defined');
      return new Response(
        JSON.stringify({
          error: 'Configuration error: BUBBLE_API_KEY not found',
          message: 'Please check your environment variables',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Gestion de l'environnement live/dev
    const isLive = params?.isLive !== undefined ? params.isLive : true;
    let baseUrl = 'https://app.valoramix.com/';
    if (!isLive) {
      baseUrl += 'version-test/';
    }
    baseUrl += 'api/1.1/wf/';

    // On retire isLive des params envoyés à Bubble
    const paramsSansIsLive = { ...params };
    delete paramsSansIsLive.isLive;

    // Sécurise l'URL pour éviter les doubles slashs
    const url = baseUrl + (endpoint || '').replace(/^\//, '');
    const fetchOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };
    if (method !== 'GET' && paramsSansIsLive) {
      fetchOptions.body = JSON.stringify(paramsSansIsLive);
    }

    console.log('API Bubble - URL:', url);
    console.log('API Bubble - Options:', fetchOptions);

    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      console.log('API Bubble - Réponse JSON:', data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      console.log('API Bubble - Réponse non-JSON:', text);
      return new Response(
        JSON.stringify({
          error: 'Réponse non-JSON',
          status: response.status,
          raw: text,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (err) {
    console.log('API Bubble - Erreur fetch:', err);
    return new Response(
      JSON.stringify({
        error: 'Erreur lors du fetch',
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
