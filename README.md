# Clima Cerrado
SPA responsiva em português, inspirada no Google Clima, com JavaScript, HTML e CSS, sem dependências de execução externas. Backend em Node.js e Netlify Functions. Requer Node.js 20.11 ou superior; o Netlify está configurado com Node.js 22.

## Rodar localmente
1. Abra o terminal nesta pasta.
2. Copie `.env.example` para `.env` e substitua o valor de `OPENWEATHER_API_KEY` pela chave da sua conta OpenWeatherMap. Não compartilhe nem versione `.env`.
3. Execute `npm run dev` e abra http://localhost:5173.

Sem chave, o aplicativo exibe exemplos simulados e um aviso permanente de demonstração. A busca de demonstração aceita as seis cidades sugeridas. Rio Verde e Brasília demonstram emergência; Goiânia e Anápolis demonstram atenção; São Paulo e Rio demonstram ausência de alerta. Para consultar qualquer cidade brasileira, configure a chave. Buscas ambíguas podem ser refinadas com UF, por exemplo `Anápolis, GO`.

## Publicar em produção no Netlify
O projeto está preparado, mas a publicação exige uma conta Netlify autenticada e a chave OpenWeatherMap.
1. Crie um repositório com os arquivos deste projeto e importe-o no Netlify (Add new project / Import an existing project).
2. A configuração `netlify.toml` define build `npm run build`, diretório público `dist` e funções `netlify/functions`. Não publique apenas a pasta dist por upload manual: a aplicação necessita da função de servidor para dados reais.
3. No Netlify, adicione `OPENWEATHER_API_KEY` em Environment variables, disponível no escopo Functions; não coloque o segredo em netlify.toml ou nos arquivos públicos.
4. Execute um novo deploy e abra a URL de produção. Use a busca e confirme que o banner de demonstração não aparece. Variáveis adicionadas ou alteradas depois do último deploy só passam a valer a partir do deploy seguinte; se `/api/weather` ainda responder `MISSING_KEY`, publique de novo.
5. Alternativa por CLI, após instalar o Netlify CLI e autenticar: execute `netlify init`, configure a variável pelo painel e execute `netlify deploy --build --prod`.

## Funcionalidades e critérios
- Busca restrita ao Brasil pela API de geocodificação; cidade e UF (quando retornada) exibidas.
- Temperatura, sensação, umidade, descrição e ícones oficiais dinâmicos.
- Vento em km/h, convertido de m/s multiplicando por 3,6.
- Horário da medição convertido pelo deslocamento local fornecido pela API; não representa o instante do relógio do navegador.
- Próximos oito intervalos de previsão de três horas, com probabilidade de chuva.
- Mínima/máxima agregadas dos intervalos disponíveis da previsão para a data local de hoje. Não são extremos observados nem previsão diária completa; no fim do dia pode não haver intervalos restantes. A interface informa indisponibilidade nesse caso.
- Umidade < 30%: atenção; < 20%: emergência, conforme os limites pedidos no enunciado. 20% é atenção; 30% não dispara alerta. A classificação é a regra deste projeto e não faz atribuição não verificada à OMS.
- Banner de risco de queimadas e agravamento de problemas respiratórios, com orientações de cuidado, especialmente para Cerrado/Goiás.
- Estados de carregamento, erros de cidade/chave/rede e degradação quando a previsão falha.
- Campos rotulados, mensagens acessíveis, navegação por teclado e layout móvel.
- Chave mantida exclusivamente no servidor; requisições ao provedor têm limite de tempo.

## Verificação
`npm test` testa limites de alerta, datas locais e integração do backend com respostas simuladas.
`npm run build` gera os arquivos de distribuição. Testes com dados reais dependem da configuração da chave e da disponibilidade do provedor.

## Referências
- https://openweathermap.org/current
- https://openweathermap.org/forecast5
- https://openweathermap.org/api/geocoding-api
- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://docs.netlify.com/build/environment-variables/get-started/

