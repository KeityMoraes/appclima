import test from 'node:test';
import assert from 'node:assert/strict';
import { alertLevel, dayRange } from '../weather-utils.js';
import { handler } from '../netlify/functions/weather.mjs';
test('limites de umidade solicitados',()=>{
  for(const [humidity,expected] of [[0,'emergency'],[19,'emergency'],[20,'attention'],[29,'attention'],[30,'normal'],[80,'normal']])assert.equal(alertLevel(humidity),expected);
});
test('previsão respeita a data local da cidade',()=>{
  const now=Date.parse('2026-10-01T23:00:00Z')/1000;
  const list=[{dt:now,main:{temp_min:22,temp_max:30}},{dt:now+3600,main:{temp_min:20,temp_max:28}},{dt:now+14400,main:{temp_min:15,temp_max:25}}];
  assert.deepEqual(dayRange(list,now,-10800),{min:20,max:30,samples:2});assert.equal(dayRange([],now,-10800),null);
});
test('API valida consulta e método',async()=>{
  assert.equal((await handler({httpMethod:'POST'})).statusCode,405);
  assert.equal((await handler({httpMethod:'GET',queryStringParameters:{city:''}})).statusCode,400);
});
test('consulta integra geocoding, unidades e previsão sem expor chave',async()=>{
  const originalFetch=globalThis.fetch,originalKey=process.env.OPENWEATHER_API_KEY;
  process.env.OPENWEATHER_API_KEY='test-secret';let calls=[];
  globalThis.fetch=async url=>{
    calls.push(url);
    const data=url.pathname.includes('geo/')?[{name:'Goiânia',state:'Goiás',country:'BR',lat:-16.6,lon:-49.2}]:url.pathname.endsWith('weather')?{dt:1790881200,timezone:-10800,main:{temp:32,feels_like:33,humidity:19},wind:{speed:5},weather:[{description:'céu limpo',icon:'01d',main:'Clear'}]}:{list:[{dt:1790881200+3600,main:{temp:30,temp_min:28,temp_max:32},weather:[{icon:'01d',description:'céu limpo'}],pop:.2}]};
    return {ok:true,json:async()=>data};
  };
  try{
    const result=await handler({httpMethod:'GET',queryStringParameters:{city:'Goiânia, GO'}});const data=JSON.parse(result.body);
    assert.equal(result.statusCode,200);assert.equal(data.wind,18);assert.equal(data.humidity,19);assert.equal(data.forecast[0].rain,20);
    assert.equal(calls[0].searchParams.get('q'),'Goiânia, GO,BR');assert.equal(calls[1].searchParams.get('units'),'metric');assert.equal(calls[1].searchParams.get('lang'),'pt_br');assert.ok(!result.body.includes('test-secret'));
  }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENWEATHER_API_KEY;else process.env.OPENWEATHER_API_KEY=originalKey;}
});
