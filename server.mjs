import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { handler } from './netlify/functions/weather.mjs';
// Carrega somente a chave local; as variáveis do ambiente de produção têm prioridade.
try {
  const env = await readFile(new URL('.env', import.meta.url), 'utf8');
  const match = env.match(/^\s*OPENWEATHER_API_KEY\s*=\s*(.*?)\s*$/m);
  if (match && !process.env.OPENWEATHER_API_KEY) process.env.OPENWEATHER_API_KEY = match[1].replace(/^['"]|['"]$/g, '');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/weather-utils.js': ['weather-utils.js', 'text/javascript'] };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/weather') {
    const result = await handler({ httpMethod: req.method, queryStringParameters: Object.fromEntries(url.searchParams) });
    res.writeHead(result.statusCode, result.headers); res.end(result.body); return;
  }
  const file = files[url.pathname];
  if (!file) { res.writeHead(404); res.end('Não encontrado'); return; }
  try { res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(await readFile(new URL(file[0], import.meta.url))); }
  catch { res.writeHead(500); res.end('Erro ao carregar arquivo'); }
}).listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log('Clima Cerrado: http://localhost:5173'));

