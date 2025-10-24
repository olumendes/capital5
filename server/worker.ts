import { CloudflareEnv } from '@shared/database-types';
import { handleAuth } from './routes/auth';
import { handleAPI } from './routes/api';

// Função principal para Cloudflare Workers
export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Headers CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Responder a requisições OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      let response: Response;

      // Rotas de autenticação
      if (path.startsWith('/api/auth/')) {
        response = await handleAuth(request, env);
      }
      // Rotas da API principal
      else if (path.startsWith('/api/')) {
        response = await handleAPI(request, env);
      }
      // Servir arquivos estáticos (SPA)
      else {
        // Try to serve static files from the SPA build
        try {
          const assetPath = path === '/' ? '/index.html' : path;
          const asset = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));

          if (asset.status === 200) {
            return asset;
          }
        } catch (e) {
          // Asset not found, fall through to serve index.html for SPA routing
        }

        // Fallback to index.html for SPA routing
        try {
          const indexResponse = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
          return indexResponse;
        } catch (e) {
          // If assets binding is not available, serve a basic fallback
          const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Capital - Controle Financeiro</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { color: #059669; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 Capital</h1>
        <p class="status">✅ Backend online no Cloudflare Workers</p>
        <p>⏳ Carregando interface...</p>
    </div>
</body>
</html>`;

          response = new Response(htmlContent, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
      }

      // Adicionar headers CORS a todas as respostas
      if (response) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;

    } catch (error) {
      console.error('Erro no servidor:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
