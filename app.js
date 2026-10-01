import { alertLevel } from './weather-utils.js';
const $ = id => document.getElementById(id);
let currentCity = 'Goiânia, GO', demoMode = false, controller;
const states = {'Goiás':'GO','Distrito Federal':'DF','Rio de Janeiro':'RJ','São Paulo':'SP','Minas Gerais':'MG','Bahia':'BA','Paraná':'PR','Santa Catarina':'SC','Rio Grande do Sul':'RS','Mato Grosso':'MT','Mato Grosso do Sul':'MS','Tocantins':'TO','Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Ceará':'CE','Espírito Santo':'ES','Maranhão':'MA','Pará':'PA','Paraíba':'PB','Pernambuco':'PE','Piauí':'PI','Rio Grande do Norte':'RN','Rondônia':'RO','Roraima':'RR','Sergipe':'SE'};
const presets = {'Goiânia': [32,27,'Clear','01d','céu limpo','GO'], 'Rio Verde':[31,18,'Clear','01d','céu limpo','GO'], 'Anápolis':[29,29,'Clouds','02d','poucas nuvens','GO'], 'Brasília':[28,19,'Clear','01d','céu limpo','DF'], 'Rio de Janeiro':[26,76,'Rain','10d','chuva leve','RJ'], 'São Paulo':[22,65,'Clouds','04d','nublado','SP']};
function demo(city) {
  const name = city.split(',')[0].trim();
  const item = presets[name];
  if (!item) { $('error').textContent = 'No modo de demonstração, escolha uma das seis cidades sugeridas. Configure a chave para buscar outras cidades.'; $('error').hidden = false; return; }
  const now = Math.floor(Date.now()/1000);
  render({city:name,state:item[5],country:'BR',timestamp:now,offset:-10800,temp:item[0],feelsLike:item[0]+1,humidity:item[1],wind:12.6,condition:item[2],icon:item[3],description:item[4],range:{min:item[0]-7,max:item[0]+2,samples:4},forecast:Array.from({length:8},(_,i)=>({timestamp:now+(i+1)*10800,temp:item[0]-i*.8,icon:i>3?'02n':item[3],description:i>3?'poucas nuvens':item[4],rain:item[2]==='Rain'?60:0}))},true);
}
function localDate(timestamp,offset,options) { return new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',...options}).format(new Date((timestamp+offset)*1000)); }
function image(icon,description) {
  const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${icon}@2x.png`; img.alt = description; img.width=56;img.height=56;
  img.addEventListener('error',()=>{ const text=document.createElement('span');text.textContent=description;text.style.fontSize='10px';img.replaceWith(text); },{once:true});
  return img;
}
function render(data,isDemo=false) {
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
  if(demoMode&&!forceLive){demo(city);return;}
  $('status').textContent=`Consultando ${city}…`;$('dashboard').setAttribute('aria-busy','true');$('refresh').disabled=true;
  try {
    const response=await fetch(`/api/weather?city=${encodeURIComponent(city)}`,{signal:request.signal});const data=await response.json();
    if (!response.ok) {
      if (data.code==='MISSING_KEY'&&!forceLive) {demo(city);return;}
      throw new Error(data.error || 'Não foi possível consultar o clima.');
    }
    render(data);$('status').textContent='Consulta atualizada.';
  } catch(error) {if(error.name!=='AbortError'){$('error').textContent=error.message==='Failed to fetch'?'Não foi possível conectar. Verifique sua conexão e tente novamente.':error.message;$('error').hidden=false;}}
  finally {if(controller===request){$('dashboard').setAttribute('aria-busy','false');$('refresh').disabled=false;if($('status').textContent.startsWith('Consultando'))$('status').textContent=demoMode?'Explore as cidades com dados de demonstração.':'';}}
}
$('search').addEventListener('submit',event=>{event.preventDefault();const city=$('city').value.trim();if(city)load(city);});
document.querySelectorAll('[data-city]').forEach(button=>button.addEventListener('click',()=>{ $('city').value=button.dataset.city;load(button.dataset.city); }));
$('refresh').addEventListener('click',()=>load(currentCity));$('live').addEventListener('click',()=>load(currentCity,true));
load(currentCity);
