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
    const isLive = params?.isLive === true || params?.isLive === 'true';
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
    // Envoie le body pour les requêtes POST avec des paramètres
    if (
      method !== 'GET' &&
      paramsSansIsLive &&
      Object.keys(paramsSansIsLive).length > 0
    ) {
      fetchOptions.body = JSON.stringify(paramsSansIsLive);
    }

    console.log('API Bubble - URL:', url);
    console.log('API Bubble - Options:', fetchOptions);
    console.log('API Bubble - Body envoyé:', fetchOptions.body);

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
      console.log('API Bubble - Réponse non-JSON (probablement JS):', text);
      // Si ce n'est pas du JSON, c'est probablement du JavaScript de Bubble
      // On parse la réponse JavaScript et on la convertit en JSON propre
      try {
        // Utiliser Function pour évaluer la réponse JavaScript de manière sécurisée
        const jsData = new Function('return ' + text)();
        console.log(
          'API Bubble - Réponse parsée et convertie en JSON:',
          jsData
        );
        return new Response(JSON.stringify(jsData), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.log('API Bubble - Erreur lors du parsing JS:', parseError);
        return new Response(
          JSON.stringify({
            error: 'Impossible de parser la réponse de Bubble',
            status: response.status,
            raw: text,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
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
