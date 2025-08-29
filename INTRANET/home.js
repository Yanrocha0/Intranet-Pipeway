// --- CONFIGURAÇÃO DA API GOOGLE ---
const CLIENT_ID = '106308503361-n7cs1cf8mh8bm73ejdv3o66fo3hgreom.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.profile';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
  setupVisitorCounter();
  getDollarRate();
  carregarComunicadosGerais();
  carregarCarrosselHome();
  initCarousel();
  setupEventListeners();
  setupAutoRefresh();
});

// --- FUNÇÕES DE INTEGRAÇÃO COM GOOGLE ---

/**
 * Chamado quando a biblioteca GAPI (Google API) é carregada.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Inicializa o cliente da GAPI com os documentos de descoberta das APIs.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [
      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
      "https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest"
    ],
  });
  gapiInited = true;
}

/**
 * Chamado quando a biblioteca GIS (Google Identity Services) é carregada.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // O callback é tratado dinamicamente no momento da chamada
  });
  gisInited = true;
}

/**
 * Inicia o fluxo de login com o Google.
 */
function fazerLoginGoogle() {
  if (!gapiInited || !gisInited) {
    alert("Serviços do Google ainda não carregaram. Tente novamente em alguns segundos.");
    return;
  }

  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      console.error(resp.error);
      alert("Erro durante a autenticação. Verifique o console para mais detalhes.");
      return;
    }
    fecharModalLogin();
    buscarDadosDoUsuario();
  };

  // Solicita o token de acesso. Se o usuário já deu consentimento, a janela não aparecerá.
  tokenClient.requestAccessToken({ prompt: '' });
}

/**
 * Orquestra a busca de dados do usuário (perfil, tarefas, reuniões) após o login.
 */
async function buscarDadosDoUsuario() {
  try {
    const profileResponse = await gapi.client.oauth2.userinfo.get();
    const nomeUsuario = profileResponse.result.name;
    atualizarUIUsuarioLogado(nomeUsuario);

    // Busca tarefas e reuniões em paralelo para mais agilidade
    await Promise.all([
      buscarTarefas(),
      buscarReunioes()
    ]);

  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
    alert("Ocorreu um erro ao buscar seus dados do Google.");
  }
}

/**
 * Busca e exibe as tarefas do Google Tasks.
 */
async function buscarTarefas() {
  const tarefasContainer = document.getElementById('tarefas-list');
  tarefasContainer.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> Carregando tarefas...</li>';
  
  try {
    const response = await gapi.client.tasks.tasks.list({
      'tasklist': '@default',
      'showCompleted': false,
      'maxResults': 10
    });

    const tarefas = response.result.items || [];
    document.getElementById('tarefas-count').textContent = tarefas.length;
    tarefasContainer.innerHTML = '';

    if (tarefas.length > 0) {
      tarefas.forEach(tarefa => {
        const item = document.createElement('li');
        item.textContent = tarefa.title;
        if (tarefa.due) {
          const dataVencimento = new Date(tarefa.due).toLocaleDateString('pt-BR');
          item.textContent += ` (Vence em: ${dataVencimento})`;
        }
        tarefasContainer.appendChild(item);
      });
    } else {
      tarefasContainer.innerHTML = '<li>Nenhuma tarefa pendente.</li>';
    }
  } catch (err) {
    console.error("Erro ao buscar tarefas:", err);
    tarefasContainer.innerHTML = '<li>Erro ao carregar tarefas.</li>';
  }
}

/**
 * Busca e exibe os próximos eventos do Google Calendar.
 */
async function buscarReunioes() {
  const reunioesContainer = document.getElementById('reunioes-list');
  reunioesContainer.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> Carregando reuniões...</li>';

  try {
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 5,
      'orderBy': 'startTime'
    });

    const eventos = response.result.items || [];
    reunioesContainer.innerHTML = '';

    if (eventos.length > 0) {
      eventos.forEach(evento => {
        const quando = evento.start.dateTime || evento.start.date;
        const dataFormatada = new Date(quando).toLocaleString('pt-BR', {
          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const item = document.createElement('li');
        item.textContent = `${evento.summary} - ${dataFormatada}`;
        reunioesContainer.appendChild(item);
      });
    } else {
      reunioesContainer.innerHTML = '<li>Nenhuma reunião encontrada para os próximos dias.</li>';
    }
  } catch (err) {
    console.error("Erro ao buscar reuniões:", err);
    reunioesContainer.innerHTML = '<li>Erro ao carregar reuniões.</li>';
  }
}


// --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI) ---

function atualizarUIUsuarioLogado(nome) {
    document.getElementById('login-text').textContent = `Olá, ${nome.split(' ')[0]}`;
    document.getElementById('dashboard-google').style.display = 'grid';
    document.querySelector('.login-icon').onclick = null; // Opcional: desativa o modal após login
}

function getDollarRate() {
  fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    .then(response => response.json())
    .then(data => {
      const dollarRate = parseFloat(data.USDBRL.bid);
      const variation = parseFloat(data.USDBRL.pctChange);
      const variationElement = document.getElementById('widget-dollar-variation');
      
      document.getElementById('widget-dollar-value').textContent = `R$ ${dollarRate.toFixed(3)}`;
      
      let variationText = `${variation.toFixed(2)}%`;
      let variationClass = (variation >= 0) ? 'positive' : 'negative';
      let iconClass = (variation >= 0) ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
      if (variation >= 0) variationText = `+${variationText}`;

      variationElement.className = `dollar-variation ${variationClass}`;
      variationElement.innerHTML = `<i class="fas ${iconClass}"></i> ${variationText}`;
    })
    .catch(error => {
      console.error('Erro ao obter cotação do dólar:', error);
      document.getElementById('widget-dollar-value').textContent = 'Erro';
    });
}

function carregarComunicadosGerais() {
  const container = document.getElementById('comunicados-gerais');
  if (!container) return;
  const comunicados = JSON.parse(localStorage.getItem('comunicacoes') || '[]');
  const filtrados = comunicados
    .filter(c => c && (c.departamento === 'ti' || c.departamento === 'smas'))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  container.innerHTML = '';
  if (filtrados.length === 0) {
    container.innerHTML = `<div class="sem-comunicados"><p>Não há comunicados no momento.</p></div>`;
    return;
  }
  filtrados.slice(0, 6).forEach(com => {
    const card = document.createElement('div');
    card.className = `comunicado-card ${com.prioridade || 'normal'}`;
    const data = new Date(com.timestamp || com.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const deptColor = com.departamento === 'ti' ? 'var(--primary-color)' : '#2196f3';
    let priorityBadge = '';
    if (com.prioridade === 'urgente') priorityBadge = '<span class="priority-badge urgent">URGENTE</span>';
    if (com.prioridade === 'importante') priorityBadge = '<span class="priority-badge important">IMPORTANTE</span>';
    card.innerHTML = `
      <div class="comunicado-header">
        <h3>${com.titulo}</h3>
        <div class="comunicado-badges">
          <span class="dept-badge" style="background:${deptColor};">${com.departamento.toUpperCase()}</span>
          ${priorityBadge}
        </div>
      </div>
      ${com.imagem ? `<img src="${com.imagem}" alt="Imagem do comunicado" class="comunicado-image">` : ''}
      <div class="comunicado-content"><p>${com.conteudo}</p></div>
      <div class="comunicado-footer">
        <span class="comunicado-author">Por: ${com.autor}</span>
        <span class="comunicado-date">${data}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function carregarCarrosselHome() {
  const carousel = document.getElementById('carousel');
  const indicatorsContainer = document.getElementById('carousel-indicators');
  if (!carousel || !indicatorsContainer) return;

  const carrosselData = localStorage.getItem('carrosselSMAS');
  const imagensCarrossel = carrosselData ? JSON.parse(carrosselData) : [];

  carousel.innerHTML = '';
  indicatorsContainer.innerHTML = '';

  if (imagensCarrossel.length > 0) {
    imagensCarrossel.forEach((item, index) => {
      const content = `<img src="${item.imagem}" alt="${item.titulo}"><div class="carousel-caption">${item.titulo}</div>`;
      carousel.innerHTML += `<div class="carousel-item">${item.link ? `<a href="${item.link}" target="_blank">${content}</a>` : content}</div>`;
      indicatorsContainer.innerHTML += `<div class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
    });
  } else {
    carousel.innerHTML = `
        <div class="carousel-item"><div style="background:linear-gradient(45deg, #0d4f0d, #4caf50); width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-family:'Orbitron'; font-size:1.5em;">Engenharia Industrial</div></div>
        <div class="carousel-item"><div style="background:linear-gradient(45deg, #388e3c, #66bb6a); width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-family:'Orbitron'; font-size:1.5em;">Tubulações Industriais</div></div>
    `;
    indicatorsContainer.innerHTML = `<div class="indicator active" data-index="0"></div><div class="indicator" data-index="1"></div>`;
  }
  initCarousel();
}

function initCarousel() {
  const carousel = document.querySelector('.carousel');
  const items = document.querySelectorAll('.carousel-item');
  if (!carousel || items.length === 0) return;
  let currentIndex = 0;
  let intervalId;
  const totalItems = items.length;
  carousel.style.width = `${totalItems * 100}%`;
  items.forEach(item => item.style.width = `${100 / totalItems}%`);
  const update = (index) => {
    currentIndex = index;
    carousel.style.transform = `translateX(-${currentIndex * (100 / totalItems)}%)`;
    document.querySelectorAll('.indicator').forEach((ind, i) => ind.classList.toggle('active', i === currentIndex));
  };
  const next = () => update((currentIndex + 1) % totalItems);
  const start = () => { clearInterval(intervalId); intervalId = setInterval(next, 5000); };
  const stop = () => clearInterval(intervalId);
  document.querySelector('.carousel-nav.next')?.addEventListener('click', () => { stop(); next(); start(); });
  document.querySelector('.carousel-nav.prev')?.addEventListener('click', () => { stop(); update((currentIndex - 1 + totalItems) % totalItems); start(); });
  document.querySelectorAll('.indicator').forEach(ind => ind.addEventListener('click', (e) => { stop(); update(parseInt(e.target.dataset.index)); start(); }));
  document.querySelector('.carousel-container')?.addEventListener('mouseenter', stop);
  document.querySelector('.carousel-container')?.addEventListener('mouseleave', start);
  update(0);
  start();
}


// --- FUNÇÕES DE SETUP E EVENTOS ---

function setupEventListeners() {
  // Sincroniza dados entre abas abertas
  window.addEventListener('storage', function(e) {
    if (['comunicacoes', 'ultimo_comunicado_timestamp'].includes(e.key)) { carregarComunicadosGerais(); }
    if (['carrosselSMAS', 'ultimo_carrossel_timestamp'].includes(e.key)) { carregarCarrosselHome(); }
  });
  // Atualiza dados quando o usuário volta para a aba
  window.addEventListener('focus', () => {
    getDollarRate();
    carregarComunicadosGerais();
    carregarCarrosselHome();
  });
}

function setupAutoRefresh() {
  // Atualiza a cotação do dólar a cada 5 minutos
  setInterval(getDollarRate, 300000);
}

function setupVisitorCounter() {
  let count = localStorage.getItem('visitorCount') || 1245;
  count = parseInt(count) + 1;
  localStorage.setItem('visitorCount', count);
  document.getElementById('visitor-count').textContent = count;
}

function abrirModalLogin() { document.getElementById('login-modal').classList.remove('hidden'); }
function fecharModalLogin() { document.getElementById('login-modal').classList.add('hidden'); }