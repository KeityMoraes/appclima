import { alertLevel } from './weather-utils.js';
const $ = id => document.getElementById(id);
let currentCity = 'Goiânia, GO', demoMode = false, controller, currentWeather = null;
const chatHistory = [];
const states = {'Goiás':'GO','Distrito Federal':'DF','Rio de Janeiro':'RJ','São Paulo':'SP','Minas Gerais':'MG','Bahia':'BA','Paraná':'PR','Santa Catarina':'SC','Rio Grande do Sul':'RS','Mato Grosso':'MT','Mato Grosso do Sul':'MS','Tocantins':'TO','Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Ceará':'CE','Espírito Santo':'ES','Maranhão':'MA','Pará':'PA','Paraíba':'PB','Pernambuco':'PE','Piauí':'PI','Rio Grande do Norte':'RN','Rondônia':'RO','Roraima':'RR','Sergipe':'SE'};
const presets = {'Goiânia': [32,27,'Clear','01d','céu limpo','GO'], 'Rio Verde':[31,18,'Clear','01d','céu limpo','GO'], 'Anápolis':[29,29,'Clouds','02d','poucas nuvens','GO'], 'Brasília':[28,19,'Clear','01d','céu limpo','DF'], 'Rio de Janeiro':[26,76,'Rain','10d','chuva leve','RJ'], 'São Paulo':[22,65,'Clouds','04d','nublado','SP']};
function demo(city) {
  const name = city.split(',')[0].trim();
  const item = presets[name];
  if (!item) { $('error').textContent = 'No modo de demonstração, escolha uma das seis cidades sugeridas. Configure a chave para buscar outras cidades.'; $('error').hidden = false; return false; }
  const now = Math.floor(Date.now()/1000);
  render({city:name,state:item[5],country:'BR',timestamp:now,offset:-10800,temp:item[0],feelsLike:item[0]+1,humidity:item[1],wind:12.6,condition:item[2],icon:item[3],description:item[4],range:{min:item[0]-7,max:item[0]+2,samples:4},forecast:Array.from({length:8},(_,i)=>({timestamp:now+(i+1)*10800,temp:item[0]-i*.8,icon:i>3?'02n':item[3],description:i>3?'poucas nuvens':item[4],rain:item[2]==='Rain'?60:0}))},true);
  return true;
}
function localDate(timestamp,offset,options) { return new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',...options}).format(new Date((timestamp+offset)*1000)); }
function image(icon,description) {
  const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${icon}@2x.png`; img.alt = description; img.width=56;img.height=56;
  img.addEventListener('error',()=>{ const text=document.createElement('span');text.textContent=description;text.style.fontSize='10px';img.replaceWith(text); },{once:true});
  return img;
}
function render(data,isDemo=false) {
  currentWeather={...data,demo:isDemo};
  demoMode=isDemo; $('demo-banner').hidden=!isDemo;
  $('location').textContent = `${data.city}, ${states[data.state] || data.state || data.country} · Brasil`;
  $('timestamp').textContent = `${isDemo?'Exemplo simulado':'Atualizado'} · ${localDate(data.timestamp,data.offset,{weekday:'long',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}`;
  $('temp').textContent = Math.round(data.temp); $('description').textContent=data.description;
  $('icon').src=`https://openweathermap.org/img/wn/${data.icon}@4x.png`; $('icon').alt=data.description;
  $('icon').onerror=()=>{ $('icon').hidden=true; }; $('icon').hidden=false;
  $('range').textContent = data.range ? `↓ ${Math.round(data.range.min)}° mín.    ↑ ${Math.round(data.range.max)}° máx.` : 'Previsão do dia indisponível';
  $('range-note').textContent = data.range ? 'Mín./máx. dos intervalos previstos para hoje' : 'Temperaturas em Celsius';
  $('source').textContent=isDemo?'Dados simulados':'OpenWeatherMap';
  $('humidity').textContent=`${data.humidity}%`;
  $('wind').replaceChildren(document.createTextNode(data.wind.toLocaleString('pt-BR',{maximumFractionDigits:1})+' ')); const unit=document.createElement('small');unit.textContent='km/h';$('wind').append(unit);
  $('feels').textContent=`${Math.round(data.feelsLike)}°C`;
  const level=alertLevel(data.humidity);
  $('humidity-tag').textContent={normal:'Sem alerta',attention:'Atenção',emergency:'Emergência'}[level];$('humidity-tag').className=`metric-tag ${level}`;
  $('alert').hidden=level==='normal';$('alert').className=`environment-alert ${level}`;
  $('alert-title').textContent=level==='emergency'?'Emergência ambiental · umidade abaixo de 20%':'Atenção ambiental · umidade abaixo de 30%';
  $('alert-text').textContent=`${isDemo?'Neste exemplo, a':'A'} umidade de ${data.humidity}% indica ar muito seco: risco elevado de queimadas e agravamento de problemas respiratórios, especialmente no Cerrado e em Goiás.`;
  $('alert-value').textContent=`${data.humidity}%`;
  document.querySelector('.weather-card').classList.toggle('rainy',['Rain','Drizzle','Thunderstorm'].includes(data.condition));document.querySelector('.weather-card').classList.toggle('night',data.icon.endsWith('n'));
  $('forecast').replaceChildren();
  for (const entry of data.forecast) {
    const card=document.createElement('article');card.className='forecast-item';
    const time=document.createElement('time');time.dateTime=new Date(entry.timestamp*1000).toISOString();time.textContent=localDate(entry.timestamp,data.offset,{hour:'2-digit',minute:'2-digit'});
    const temp=document.createElement('strong');temp.textContent=`${Math.round(entry.temp)}°`;
    const rain=document.createElement('p');rain.textContent=`Chuva ${entry.rain}%`;
    card.append(time,image(entry.icon,entry.description),temp,rain);$('forecast').append(card);
  }
  if (!data.forecast.length) $('forecast').textContent='Previsão temporariamente indisponível. Os dados atuais estão disponíveis acima.';
  document.querySelectorAll('[data-city]').forEach(button=>{const active=button.dataset.city===currentCity;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
async function load(city,forceLive=false) {
  controller?.abort();controller=new AbortController();const request=controller;
  $('error').hidden=true;currentCity=city;
  if(demoMode&&!forceLive){return demo(city);}
  $('status').textContent=`Consultando ${city}…`;$('dashboard').setAttribute('aria-busy','true');$('refresh').disabled=true;
  try {
    const response=await fetch(`/api/weather?city=${encodeURIComponent(city)}`,{signal:request.signal});const data=await response.json();
    if (!response.ok) {
      if (data.code==='MISSING_KEY'&&!forceLive) {return demo(city);}
      throw new Error(data.error || 'Não foi possível consultar o clima.');
    }
    render(data);$('status').textContent='Consulta atualizada.';return true;
  } catch(error) {if(error.name!=='AbortError'){$('error').textContent=error.message==='Failed to fetch'?'Não foi possível conectar. Verifique sua conexão e tente novamente.':error.message;$('error').hidden=false;}return false;}
  finally {if(controller===request){$('dashboard').setAttribute('aria-busy','false');$('refresh').disabled=false;if($('status').textContent.startsWith('Consultando'))$('status').textContent=demoMode?'Explore as cidades com dados de demonstração.':'';}}
}
$('search').addEventListener('submit',event=>{event.preventDefault();const city=$('city').value.trim();if(city)load(city);});
document.querySelectorAll('[data-city]').forEach(button=>button.addEventListener('click',()=>{ $('city').value=button.dataset.city;load(button.dataset.city); }));
$('refresh').addEventListener('click',()=>load(currentCity));$('live').addEventListener('click',()=>load(currentCity,true));
load(currentCity);


function normalizeCity(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR'); }
function cityMentioned(message) {
  const normalized=normalizeCity(message);
  const known=Object.keys(presets).sort((a,b)=>b.length-a.length).find(name=>normalized.includes(normalizeCity(name)));
  if(known) return known;
  const prepositions=[...message.matchAll(/\b(?:em|para|pra|no|na|do|da)\s+/gi)];
  if(!prepositions.length) return null;
  const last=prepositions.at(-1), start=last.index+last[0].length;
  let candidate=message.slice(start).split(/[?.!,;]/,1)[0].trim();
  const timeMarker=candidate.search(/\s+(?=(?:hoje|amanh[ãa]|agora|a\s+tarde|à\s+tarde|de\s+manhã|pela\s+manhã|pela\s+tarde|nos\s+próximos|próximas?\s+horas?|final\s+de\s+semana|para|pra)\b)/i);
  if(timeMarker>=0) candidate=candidate.slice(0,timeMarker).trim();
  candidate=candidate.replace(/^(?:cidade\s+de\s+)/i,'').trim();
  if(!candidate||candidate.length>80||/^(?:hoje|amanh[ãa]|agora|tarde|manhã|momento|próximas?\s+horas?|próximos?\s+dias?|fim\s+de\s+semana|segunda(?:-feira)?|terça(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|domingo|tempo|clima|previsão|chuva|cidade|céu)$/i.test(candidate)) return null;
  return candidate;
}
const chatLog = $('chat-log');
const assistantDialog = $('assistant-dialog');
const assistantLauncher = $('assistant-launcher');
assistantLauncher.addEventListener('click',()=>{ if(!assistantDialog.open){assistantDialog.showModal();assistantLauncher.setAttribute('aria-expanded','true');$('chat-input').focus();} });
$('assistant-close').addEventListener('click',()=>assistantDialog.close());
assistantDialog.addEventListener('close',()=>{assistantLauncher.setAttribute('aria-expanded','false');assistantLauncher.focus();});
assistantDialog.addEventListener('click',event=>{if(event.target===assistantDialog)assistantDialog.close();});
function addChatMessage(text, role) {
  const message=document.createElement('p');
  message.className=`chat-message ${role}-message`;
  message.textContent=text;
  chatLog.append(message);
  chatLog.scrollTop=chatLog.scrollHeight;
}
async function askAssistant(message) {
  const input=$('chat-input'), button=$('chat-send'), status=$('chat-status');
  input.value=''; input.disabled=true; button.disabled=true; status.textContent='Pensando…';
  addChatMessage(message,'user');
  const waitNotice=setTimeout(()=>{status.textContent='A resposta está demorando um pouco; ainda aguardando o Gemini…';},12000);
  const history=chatHistory.slice(-8);
  try {
    const city=cityMentioned(message);
    if(city) {
      const sameCity=currentWeather?.city && normalizeCity(currentWeather.city)===normalizeCity(city.split(',')[0]);
      if(!sameCity) {
        status.textContent=`Atualizando o painel para ${city}…`;
        const loaded=await load(city);
        if(!loaded) {
          addChatMessage(demoMode ? `Ainda não há dados de demonstração para ${city}. Escolha uma das cidades sugeridas ou consulte dados reais.` : `Não consegui carregar os dados de ${city}. Confira o nome da cidade e tente novamente.`,'assistant');
          status.textContent='';
          return;
        }
      }
    }
    status.textContent='Pensando…';
    const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,weather:currentWeather})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||'Não foi possível obter uma resposta.');
    addChatMessage(result.answer,'assistant');
    chatHistory.push({role:'user',text:message},{role:'model',text:result.answer});
    if(chatHistory.length>8) chatHistory.splice(0,chatHistory.length-8);
    status.textContent='Resposta recebida.';
  } catch(error) { addChatMessage(error.message,'assistant'); status.textContent=''; }
  finally { clearTimeout(waitNotice); input.disabled=false; button.disabled=false; if(assistantDialog.open) input.focus(); }
}
$('chat-form').addEventListener('submit',event=>{event.preventDefault();const message=$('chat-input').value.trim();if(message)askAssistant(message);});
document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>askAssistant(button.dataset.prompt)));
