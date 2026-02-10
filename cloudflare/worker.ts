// Definição manual para evitar erro de TS se não tiveres @cloudflare/workers-types instalado
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
	// Esta variável será injetada a partir dos secrets do teu Worker
	// Ex: wrangler secret put ODDS_API_KEY
	ODDS_API_KEY: string;

	// O URL do teu site no GitHub Pages para restringir o CORS
	ALLOWED_ORIGIN: string;
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Responde a pedidos OPTIONS para CORS preflight
		if (request.method === 'OPTIONS') {
			return handleOptions(request, env);
		}

		// Roteamento simples
		if (url.pathname.startsWith('/api/')) {
			switch (url.pathname) {
				case '/api/odds': {
					// Exemplo: buscar odds de uma API externa usando a chave secreta
					// const oddsUrl = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${env.ODDS_API_KEY}`;
					// const response = await fetch(oddsUrl);
					// return new Response(response.body, { headers: { ...corsHeaders(env), 'Content-Type': 'application/json' } });

					// Dados mock para demonstração
					const mockData = { message: "Dados de odds viriam daqui" };
					return new Response(JSON.stringify(mockData), { headers: { ...corsHeaders(env), 'Content-Type': 'application/json' } });
				}

				case '/api/proxy': {
					// Proxy simples para contornar CORS ao buscar CSVs
					const targetUrl = url.searchParams.get('url');
					if (!targetUrl) return new Response('Missing URL param', { status: 400, headers: corsHeaders(env) });
					const response = await fetch(targetUrl);
					return new Response(response.body, { headers: { ...corsHeaders(env), 'Content-Type': 'text/csv' } });
				}
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};

function corsHeaders(env: Env) {
	return {
		'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
		'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	};
}

function handleOptions(request: Request, env: Env) {
	if (request.headers.get('Origin') !== null && request.headers.get('Access-Control-Request-Method') !== null) {
		return new Response(null, { headers: corsHeaders(env) });
	}
	return new Response(null, { headers: { Allow: 'GET, HEAD, POST, OPTIONS' } });
}
