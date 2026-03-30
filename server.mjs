import http from 'node:http';
import { config as loadEnv } from 'dotenv';
import { generateAnalysis, getProviderHealth } from './lib/ai-runtime.mjs';

loadEnv({ path: '.env.local', override: false });
loadEnv({ path: '.env', override: false });

const PORT = Number(process.env.PORT || 8787);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

function sendJson(response, statusCode, body, origin) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  response.end(JSON.stringify(body));
}

function getOrigin(request) {
  const origin = request.headers.origin;
  return origin && allowedOrigins.has(origin) ? origin : '';
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

const server = http.createServer(async (request, response) => {
  const origin = getOrigin(request);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {}, origin);
    return;
  }

  if (request.url === '/api/health' && request.method === 'GET') {
    sendJson(
      response,
      200,
      {
        ok: true,
        providers: getProviderHealth(),
      },
      origin,
    );
    return;
  }

  if (request.url === '/api/analysis' && request.method === 'POST') {
    try {
      const payload = await readBody(request);
      const result = await generateAnalysis(payload);

      sendJson(response, 200, result, origin);
      return;
    } catch (error) {
      sendJson(
        response,
        500,
        {
          error: error instanceof Error ? error.message : 'Unknown server error',
        },
        origin,
      );
      return;
    }
  }

  sendJson(response, 404, { error: 'Not found' }, origin);
});

server.listen(PORT, () => {
  console.log(`Media Search Workbench API running on http://localhost:${PORT}`);
});
