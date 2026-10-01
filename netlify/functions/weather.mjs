import { dayRange } from '../../weather-utils.js';
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const reply = (statusCode, data) => ({ statusCode, headers, body: JSON.stringify(data) });
async function api(path, params, key) {
  const url = new URL(`https://api.openweathermap.org/${path}`);
  url.search = new URLSearchParams({ ...params, appid: key });
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(response.status === 401 ? 'Chave OpenWeatherMap inválida ou ainda não ativada.' : response.status === 429 ? 'Limite de consultas atingido. Tente novamente mais tarde.' : 'O serviço meteorológico está indisponível. Tente novamente.');
  return response.json();
}
export async function handler(event) {
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Método não permitido.' });
  const city = event.queryStringParameters?.city?.trim();
  if (!city || city.length > 100) return reply(400, { error: 'Informe uma cidade brasileira válida.' });
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key || key === 'coloque_sua_chave_aqui') return reply(503, { error: 'Configure OPENWEATHER_API_KEY para consultar dados reais.', code: 'MISSING_KEY' });
  try {
    const places = await api('geo/1.0/direct', { q: `${city},BR`, limit: '5' }, key);
    const place = places.find(item => item.country === 'BR');
    if (!place) return reply(404, { error: 'Cidade não encontrada no Brasil. Confira o nome ou acrescente a UF, como Goiânia, GO.' });
    const params = { lat: String(place.lat), lon: String(place.lon), units: 'metric', lang: 'pt_br' };
    const current = await api('data/2.5/weather', params, key);
    let forecast = null;
    try { forecast = await api('data/2.5/forecast', params, key); } catch { /* O clima atual continua disponível se a previsão falhar. */ }
    return reply(200, {
      city: place.local_names?.pt || place.name, state: place.state || '', country: 'BR',
      timestamp: current.dt, offset: current.timezone, temp: current.main.temp,
      feelsLike: current.main.feels_like, humidity: current.main.humidity,
      wind: current.wind.speed * 3.6, description: current.weather[0].description,
      icon: current.weather[0].icon, condition: current.weather[0].main,
      range: forecast ? dayRange(forecast.list, current.dt, current.timezone) : null,
      forecast: forecast ? forecast.list.filter(item => item.dt > current.dt).slice(0, 8).map(item => ({ timestamp: item.dt, temp: item.main.temp, icon: item.weather[0].icon, description: item.weather[0].description, rain: Math.round((item.pop || 0) * 100) })) : [],
      forecastUnavailable: !forecast
    });
  } catch (error) { return reply(502, { error: error.name === 'TimeoutError' ? 'A consulta demorou demais. Tente novamente.' : error.message }); }
}
