// Sistema de armazenamento local para comunicados
let appData = {
  comunicados: [],
  notificacoes: [],
  tarefas: [],
  noticias: [],
  lastUpdate: null
};

// Estado de autenticação do usuário
let usuarioLogado = null;

// Contador de visitantes (incrementa a cada visita)
document.addEventListener('DOMContentLoaded', function() {
  let count = localStorage.getItem('visitorCount');
  if (count === null) {
    count = 1245;
  } else {
    count = parseInt(count) + 1;
  }
  localStorage.setItem('visitorCount', count);
  document.getElementById('visitor-count').textContent = count;
  
  // Verificar se usuário já está logado
  verificarLogin();
  
  // Carregar dados do localStorage
  carregarDadosDashboard();
  
  // Inicializar o carrossel
  initCarousel();
  
  // Carregar dados dos widgets
  getWeather();
  getDollarRate();
  loadSportsNews();
  loadWorldNews();
  carregarComunicadosTI();
  
  // Atualizar dados a cada 5 minutos
  setInterval(function() {
    getWeather();
    getDollarRate();
    loadSportsNews();
    loadWorldNews();
    carregarComunicadosTI();
  }, 300000);
  
  // Listener para comunicados atualizados via localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === 'comunicacoes' || e.key === 'comunicado_novo') {
      carregarComunicadosTI();
    }
  });
  
  // Processar retorno do OAuth se houver
  processarRetornoOAuth();
  
  // Animação de inicialização
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 1.5s ease-in-out';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 200);
});

// Funções de login
function verificarLogin() {
  const usuarioSalvo = localStorage.getItem('usuarioLogado');
  if (usuarioSalvo) {
    usuarioLogado = JSON.parse(usuarioSalvo);
    atualizarInterfaceLogin();
  }
}

function atualizarInterfaceLogin() {
  const loginIcon = document.querySelector('.login-icon');
  if (usuarioLogado) {
    loginIcon.innerHTML = `
      <i class="fas fa-user-circle"></i>
      <span>${usuarioLogado.nome.split(' ')[0]}</span>
    `;
    loginIcon.setAttribute('title', `Logado como: ${usuarioLogado.email}`);
    loginIcon.onclick = function() { abrirMenuUsuario(); };
  } else {
    loginIcon.innerHTML = `
      <i class="fas fa-user-circle"></i>
      <span>Entrar</span>
    `;
    loginIcon.setAttribute('title', 'Fazer login');
    loginIcon.onclick = function() { abrirModalLogin(); };
  }
}

function abrirModalLogin() {
  document.getElementById('login-modal').classList.remove('hidden');
}

function fecharModalLogin() {
  document.getElementById('login-modal').classList.add('hidden');
}

function fazerLoginGoogle() {
  // Configurações reais do OAuth
  const clientId = '526127069464-2nopus956p46c0m957unc660vcf3ui0d.apps.googleusercontent.com';
  const redirectUri = 'file:///C:/Users/Pipeway/3D%20Objects/INTRANET/oauth2callback.html';
  const scope = 'email profile';
  
  // URL de autenticação do Google
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&include_granted_scopes=true`;
  
  // Redirecionar para a página de autenticação do Google
  window.location.href = authUrl;
}

// Função para processar o retorno do OAuth
function processarRetornoOAuth() {
  // Verificar se há token no URL (após redirecionamento)
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  
  if (accessToken) {
    // Obter informações do usuário com o token
    fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(userInfo => {
      // Salvar dados do usuário
      usuarioLogado = {
        nome: userInfo.name,
        email: userInfo.email,
        departamento: "Engenharia",
        foto: userInfo.picture
      };
      
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
      atualizarInterfaceLogin();
      mostrarNotificacao(`Bem-vindo, ${usuarioLogado.nome.split(' ')[0]}!`, 'success');
    })
    .catch(error => {
      console.error('Erro ao obter informações do usuário:', error);
      mostrarNotificacao('Erro ao fazer login. Tente novamente.', 'error');
    });
  }
}

function validarEmail() {
  const emailInput = document.getElementById('email-input');
  const email = emailInput.value.trim();
  
  if (!email) {
    mostrarNotificacao('Por favor, informe seu e-mail corporativo', 'error');
    return;
  }
  
  // Verificar se é um e-mail do domínio da empresa
  if (!email.endsWith('@pipeway.com.br')) {
    mostrarNotificacao('Somente e-mails do domínio @pipeway.com.br são permitidos', 'error');
    return;
  }
  
  // Simular verificação de e-mail
  emailInput.disabled = true;
  
  setTimeout(() => {
    // Simular envio de e-mail de verificação
    mostrarNotificacao('E-mail de verificação enviado! Por favor, verifique sua caixa de entrada.', 'success');
    
    // Simular login após verificação
    setTimeout(() => {
      const usuarioDemo = {
        nome: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        departamento: "Recursos Humanos", // Departamento padrão
        foto: "https://via.placeholder.com/40"
      };
      
      usuarioLogado = usuarioDemo;
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioDemo));
      atualizarInterfaceLogin();
      fecharModalLogin();
      
      mostrarNotificacao(`Bem-vindo, ${usuarioDemo.nome}!`, 'success');
    }, 2000);
  }, 1000);
}

function fazerLogout() {
  usuarioLogado = null;
  localStorage.removeItem('usuarioLogado');
  atualizarInterfaceLogin();
  mostrarNotificacao('Logout realizado com sucesso', 'info');
}

function abrirMenuUsuario() {
  // Criar menu de usuário
  const menuUsuario = document.createElement('div');
  menuUsuario.className = 'user-menu';
  menuUsuario.style.cssText = `
    position: absolute;
    top: 60px;
    right: 20px;
    background: linear-gradient(135deg, var(--card-bg) 0%, rgba(76, 175, 80, 0.1) 100%);
    border-radius: 10px;
    padding: 15px;
    border: 2px solid var(--card-border);
    box-shadow: var(--glow-effect);
    backdrop-filter: blur(15px);
    z-index: 1000;
    min-width: 200px;
  `;
  
  menuUsuario.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--card-border);">
      <img src="${usuarioLogado.foto}" alt="Foto do usuário" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
      <div>
        <strong>${usuarioLogado.nome}</strong>
        <div style="font-size: 0.8em; color: var(--text-secondary);">${usuarioLogado.email}</div>
      </div>
    </div>
    <div style="margin-bottom: 10px; font-size: 0.9em;">
      <div><i class="fas fa-building" style="margin-right: 5px;"></i> ${usuarioLogado.departamento}</div>
    </div>
    <button onclick="fazerLogout()" style="width: 100%; padding: 8px; background: rgba(255, 82, 82, 0.2); border: 1px solid rgba(255, 82, 82, 0.5); color: #ff5252; border-radius: 5px; cursor: pointer;">
      <i class="fas fa-sign-out-alt"></i> Sair
    </button>
  `;
  
  // Adicionar ao body
  document.body.appendChild(menuUsuario);
  
  // Fechar menu ao clicar fora
  const fecharMenu = function(e) {
    if (!menuUsuario.contains(e.target) && e.target !== document.querySelector('.login-icon')) {
      menuUsuario.remove();
      document.removeEventListener('click', fecharMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', fecharMenu);
  }, 100);
}

function mostrarNotificacao(mensagem, tipo) {
  // Criar elemento de notificação
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? 'rgba(76, 175, 80, 0.9)' : tipo === 'error' ? 'rgba(255, 82, 82, 0.9)' : 'rgba(33, 150, 243, 0.9)'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    max-width: 350px;
  `;
  
  notificacao.innerHTML = `
    <div style="display: flex; align-items: center;">
      <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="margin-right: 10px; font-size: 1.2em;"></i>
      <span>${mensagem}</span>
    </div>
  `;
  
  document.body.appendChild(notificacao);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notificacao.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.parentNode.removeChild(notificacao);
      }
    }, 300);
  }, 5000);
}

// Carregar dados do dashboard do localStorage
function carregarDadosDashboard() {
  const notificacoesSalvas = localStorage.getItem('notificacoes');
  const tarefasSalvas = localStorage.getItem('tarefas');
  const noticiasSalvas = localStorage.getItem('noticias');
  
  if (notificacoesSalvas) {
    appData.notificacoes = JSON.parse(notificacoesSalvas);
    atualizarListaNotificacoes();
  }
  
  if (tarefasSalvas) {
    appData.tarefas = JSON.parse(tarefasSalvas);
    atualizarListaTarefas();
  }
  
  if (noticiasSalvas) {
    appData.noticias = JSON.parse(noticiasSalvas);
    atualizarListaNoticias();
  }
}

// Atualizar listas do dashboard
function atualizarListaNotificacoes() {
  const lista = document.getElementById('notificacoes-list');
  const contador = document.getElementById('notificacoes-count');
  
  lista.innerHTML = '';
  contador.textContent = appData.notificacoes.length;
  
  appData.notificacoes.forEach((notificacao, index) => {
    const li = document.createElement('li');
    li.textContent = notificacao;
    lista.appendChild(li);
  });
}

function atualizarListaTarefas() {
  const lista = document.getElementById('tarefas-list');
  const contador = document.getElementById('tarefas-count');
  
  lista.innerHTML = '';
  contador.textContent = appData.tarefas.length;
  
  appData.tarefas.forEach((tarefa, index) => {
    const li = document.createElement('li');
    li.textContent = tarefa;
    lista.appendChild(li);
  });
}

function atualizarListaNoticias() {
  const lista = document.getElementById('noticias-list');
  
  lista.innerHTML = '';
  
  appData.noticias.forEach((noticia, index) => {
    const li = document.createElement('li');
    li.textContent = noticia;
    lista.appendChild(li);
  });
}

// Funcionalidade do carrossel de imagens
function initCarousel() {
  const carousel = document.querySelector('.carousel');
  const items = document.querySelectorAll('.carousel-item');
  const indicators = document.querySelectorAll('.indicator');
  const prevBtn = document.querySelector('.carousel-nav.prev');
  const nextBtn = document.querySelector('.carousel-nav.next');

  if (!carousel || items.length === 0) return;

  let currentIndex = 0;
  let intervalId;

  // Ajusta a largura dos itens para ocupar o espaço proporcional
  items.forEach(item => {
    item.style.width = `${100 / items.length}%`;
  });
  carousel.style.width = `${items.length * 100}%`;

  function updateCarousel(index) {
    carousel.style.transform = `translateX(-${index * (100 / items.length)}%)`;

    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === index);
    });

    currentIndex = index;
  }

  function nextSlide() {
    let nextIndex = (currentIndex + 1) % items.length;
    updateCarousel(nextIndex);
  }

  function prevSlide() {
    let prevIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel(prevSlide);
  }

  function startAutoSlide() {
    intervalId = setInterval(nextSlide, 4000);
  }

  function stopAutoSlide() {
    clearInterval(intervalId);
  }

  // Botões de navegação
  if (prevBtn) {
    prevBtn.onclick = () => {
      stopAutoSlide();
      prevSlide();
      startAutoSlide();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      stopAutoSlide();
      nextSlide();
      startAutoSlide();
    };
  }

  // Indicadores
  indicators.forEach((indicator, i) => {
    indicator.onclick = () => {
      stopAutoSlide();
      updateCarousel(i);
      startAutoSlide();
    };
  });

  // Pausar ao passar o mouse
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoSlide);
    carouselContainer.addEventListener('mouseleave', startAutoSlide);
  }

  // Inicializa
  updateCarousel(0);
  startAutoSlide();
}

// Função para obter dados meteorológicos
function getWeather() {
  // Primeiro tenta obter a localização do usuário
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Usando OpenWeatherMap API (substitua YOUR_API_KEY por uma chave válida)
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY&units=metric&lang=pt_br`)
          .then(response => response.json())
          .then(data => {
            updateWeatherUI(data);
          })
          .catch(error => {
            console.error('Erro ao obter dados do clima:', error);
            // Fallback para dados simulados se a API falhar
            useSimulatedWeather();
          });
      },
      error => {
        console.error('Erro ao obter localização:', error);
        // Fallback para dados simulados se a geolocalização falhar
        useSimulatedWeather();
      }
    );
  } else {
    // Fallback para dados simulados se a geolocalização não for suportada
    useSimulatedWeather();
  }
}

function updateWeatherUI(data) {
  document.getElementById('widget-weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('widget-weather-location').textContent = `${data.name}`;
}

function useSimulatedWeather() {
  // Simulação de dados - na implementação real, use uma API como OpenWeatherMap
  const weatherData = {
    temp: Math.floor(Math.random() * 10) + 20, // 20-30°C
    location: 'Rio de Janeiro, RJ'
  };

  // Atualizar a interface
  document.getElementById('widget-weather-temp').textContent = `${weatherData.temp}°C`;
  document.getElementById('widget-weather-location').textContent = weatherData.location;
}

// Função para obter cotação do dólar em tempo real
function getDollarRate() {
  // Tenta obter a cotação atual da API do Banco Central
  fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    .then(response => response.json())
    .then(data => {
      const dollarRate = parseFloat(data.USDBRL.bid);
      const variation = parseFloat(data.USDBRL.pctChange);
      
      document.getElementById('widget-dollar-value').textContent = `R$ ${dollarRate.toFixed(2)}`;
      
      let variationText = `${variation.toFixed(2)}%`;
      let variationClass = 'positive';
      
      if (variation > 0) {
        variationText = `+${variationText}`;
      } else if (variation < 0) {
        variationClass = 'negative';
      }
      
      document.getElementById('widget-dollar-variation').textContent = variationText;
      document.getElementById('widget-dollar-variation').className = `dollar-variation ${variationClass}`;
    })
    .catch(error => {
      console.error('Erro ao obter cotação do dólar:', error);
      // Fallback para dados simulados
      const dollarRate = (Math.random() * 0.5 + 5).toFixed(2);
      const variation = (Math.random() * 2 - 1).toFixed(2);
      
      document.getElementById('widget-dollar-value').textContent = `R$ ${dollarRate}`;
      
      let variationText = `${variation}%`;
      let variationClass = 'positive';
      
      if (variation > 0) {
        variationText = `+${variationText}`;
      } else if (variation < 0) {
        variationClass = 'negative';
      }
      
      document.getElementById('widget-dollar-variation').textContent = variationText;
      document.getElementById('widget-dollar-variation').className = `dollar-variation ${variationClass}`;
    });
}

// Função para carregar notícias esportivas
function loadSportsNews() {
  const news = [
    {
      title: "Flamengo conquista vitória importante no Maracanã",
      time: "Há 6h",
      link: "https://www.uol.com.br/esporte/"
    },
    {
      title: "Fórmula 1: Hamilton lidera treino livre no GP do Brasil",
      time: "Há 7h",
      link: "https://www.uol.com.br/esporte/"
    },
    {
      title: "Brasil vence Argentina por 2x1 em amistoso internacional",
      time: "Há 1h",
      link: "https://www.uol.com.br/esporte/"
    }
  ];

  const newsContainer = document.getElementById('widget-sports-news');
  newsContainer.innerHTML = '';

  news.forEach(item => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.innerHTML = `
      <span class="news-title" onclick="window.open('${item.link}', '_blank')">${item.title}</span>
      <span class="news-date">${item.time}</span>
    `;
    newsContainer.appendChild(newsItem);
  });
}

// Função para carregar notícias internacionais
function loadWorldNews() {
  const news = [
    {
      title: "Cúpula do G20 define novas diretrizes econômicas globais",
      time: "Há 1h",
      link: "https://www.bbc.com/portuguese"
    },
    {
      title: "Europa registra crescimento econômico acima do esperado",
      time: "Há 3h",
      link: "https://www.bbc.com/portuguese"
    },
    {
      title: "China anuncia investimentos em energia renovável",
      time: "Há 8h",
      link: "https://www.bbc.com/portuguese"
    }
  ];

  const newsContainer = document.getElementById('widget-world-news');
  newsContainer.innerHTML = '';

  news.forEach(item => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.innerHTML = `
      <span class="news-title" onclick="window.open('${item.link}', '_blank')">${item.title}</span>
      <span class="news-date">${item.time}</span>
    `;
    newsContainer.appendChild(newsItem);
  });
}

// Sistema de comunicados do TI - VERSÃO CORRIGIDA
// Sistema de comunicados do TI e SMAS - VERSÃO ATUALIZADA
// home.js - Atualizar a função carregarComunicadosTI
// Sistema de comunicados do TI - VERSÃO CORRIGIDA
function carregarComunicadosTI() {
  const comunicadosContainer = document.getElementById('comunicados-ti');
  
  if (!comunicadosContainer) {
    console.error('Container de comunicados não encontrado');
    return;
  }
  
  // Carregar comunicados do localStorage
  const comunicadosSalvos = localStorage.getItem('comunicacoes');
  let comunicados = [];
  
  if (comunicadosSalvos) {
    try {
      comunicados = JSON.parse(comunicadosSalvos);
      console.log('Comunicados carregados:', comunicados);
    } catch (e) {
      console.error('Erro ao parsear comunicados:', e);
    }
  }
  
  // Limpar o container
  comunicadosContainer.innerHTML = '';
  
  if (!comunicados || comunicados.length === 0) {
    comunicadosContainer.innerHTML = `
      <div class="comunicado-card">
        <div class="comunicado-header">
          <h3>Nenhum comunicado disponível</h3>
          <span class="comunicado-date">${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
        <p>Não há comunicados no momento. <a href="comunicacao.html" target="_blank">Clique aqui para acessar o portal de comunicação</a>.</p>
      </div>
    `;
    return;
  }
  
  // Filtrar comunicados do TI e SMAS, ordenar por timestamp
  const comunicadosFiltrados = comunicados
    .filter(com => com.departamento === 'ti' || com.departamento === 'smas')
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  console.log('Comunicados filtrados:', comunicadosFiltrados);
  
  if (comunicadosFiltrados.length === 0) {
    comunicadosContainer.innerHTML = `
      <div class="comunicado-card">
        <div class="comunicado-header">
          <h3>Nenhum comunicado disponível</h3>
          <span class="comunicado-date">${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
        <p>Não há comunicados de TI ou SMAS no momento. <a href="comunicacao.html" target="_blank">Clique aqui para acessar o portal de comunicação</a>.</p>
      </div>
    `;
    return;
  }
  
  // Exibir apenas os 6 comunicados mais recentes
  const comunicadosRecentes = comunicadosFiltrados.slice(0, 6);
  
  comunicadosRecentes.forEach(comunicado => {
    const comunicadoCard = document.createElement('div');
    comunicadoCard.className = `comunicado-card ${comunicado.prioridade || 'normal'}`;
    
    // Formatar a data - usar a data do comunicado ou timestamp
    let dataFormatada;
    if (comunicado.timestamp) {
      dataFormatada = new Date(comunicado.timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (comunicado.data) {
      dataFormatada = comunicado.data;
    } else {
      dataFormatada = new Date().toLocaleDateString('pt-BR');
    }
    
    // Definir cor do departamento
    const deptColor = comunicado.departamento === 'ti' ? '#4caf50' : '#2196f3';
    const deptLabel = comunicado.departamento === 'ti' ? 'TI' : 'SMAS';
    
    // Badge de prioridade
    let priorityBadge = '';
    if (comunicado.prioridade === 'urgente') {
      priorityBadge = '<span class="priority-badge urgent">URGENTE</span>';
    } else if (comunicado.prioridade === 'importante') {
      priorityBadge = '<span class="priority-badge important">IMPORTANTE</span>';
    }
    
    // HTML da imagem se existir
    let imagemHTML = '';
    if (comunicado.imagem) {
      imagemHTML = `<img src="${comunicado.imagem}" alt="Imagem do comunicado" class="comunicado-image">`;
    }
    
    comunicadoCard.innerHTML = `
      <div class="comunicado-header">
        <h3>${comunicado.titulo || 'Comunicado sem título'}</h3>
        <div class="comunicado-badges">
          <span class="dept-badge" style="background: ${deptColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 10px;">${deptLabel}</span>
          ${priorityBadge}
        </div>
      </div>
      ${imagemHTML}
      <div class="comunicado-content">
        <p>${comunicado.conteudo || 'Sem conteúdo'}</p>
      </div>
      <div class="comunicado-footer">
        <span class="comunicado-author">Por: ${comunicado.autor || 'Autor desconhecido'}</span>
        <span class="comunicado-date">${dataFormatada}</span>
      </div>
    `;
    
    comunicadosContainer.appendChild(comunicadoCard);
  });
}

// Função para testar e adicionar comunicados de exemplo (apenas para testes)
function adicionarComunicadoTeste() {
  const comunicadoTeste = {
    id: Date.now(),
    titulo: "Comunicado de Teste - TI",
    conteudo: "Este é um comunicado de teste para verificar se a funcionalidade está funcionando corretamente.",
    prioridade: "importante",
    tipo: "ti",
    data: new Date().toLocaleString('pt-BR'),
    autor: "Sistema de Testes",
    departamento: "ti",
    timestamp: Date.now()
  };
  
  let comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
  comunicados.unshift(comunicadoTeste);
  localStorage.setItem('comunicacoes', JSON.stringify(comunicados));
  
  // Disparar evento para atualizar outras páginas
  const event = new CustomEvent('comunicadoAtualizado', { detail: { comunicado: comunicadoTeste } });
  window.dispatchEvent(event);
  
  // Recarregar comunicados
  carregarComunicadosTI();
  
  console.log('Comunicado de teste adicionado:', comunicadoTeste);
}

// Atualizar a função DOMContentLoaded para incluir debug
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado, iniciando aplicação...');
  
  // Verificar se o container existe
  const comunicadosContainer = document.getElementById('comunicados-ti');
  if (!comunicadosContainer) {
    console.error('Container #comunicados-ti não encontrado no DOM!');
  } else {
    console.log('Container #comunicados-ti encontrado');
  }
  
  // Incrementar contador de visitantes
  let count = localStorage.getItem('visitorCount');
  if (count === null) {
    count = 1245;
  } else {
    count = parseInt(count) + 1;
  }
  localStorage.setItem('visitorCount', count);
  const visitorCountElement = document.getElementById('visitor-count');
  if (visitorCountElement) {
    visitorCountElement.textContent = count;
  }
  
  // Verificar se usuário já está logado
  verificarLogin();
  
  // Carregar dados do dashboard
  carregarDadosDashboard();
  
  // Inicializar o carrossel
  initCarousel();
  
  // Carregar dados dos widgets
  getWeather();
  getDollarRate();
  loadSportsNews();
  loadWorldNews();
  
  // Carregar comunicados - com debug
  console.log('Carregando comunicados...');
  carregarComunicadosTI();
  
  // Listener para comunicados atualizados via localStorage
  window.addEventListener('storage', function(e) {
    console.log('Storage event detected:', e.key);
    if (e.key === 'comunicacoes' || e.key === 'ultimo_comunicado_timestamp' || e.key === 'comunicado_novo') {
      console.log('Recarregando comunicados devido a mudança no storage');
      setTimeout(() => carregarComunicadosTI(), 500); // Pequeno delay para garantir que os dados foram salvos
    }
  });
  
  // Listener para eventos customizados
  window.addEventListener('comunicadoAtualizado', function(e) {
    console.log('Evento comunicadoAtualizado recebido:', e.detail);
    carregarComunicadosTI();
  });
  
  // Processar retorno do OAuth se houver
  processarRetornoOAuth();
  
  // Animação de inicialização
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 1.5s ease-in-out';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 200);
  
  // Atualizar dados a cada 5 minutos
  setInterval(function() {
    getWeather();
    getDollarRate();
    loadSportsNews();
    loadWorldNews();
    carregarComunicadosTI();
  }, 300000);
  
  // Carregar carrossel personalizado
  carregarCarrosselHome();
  
  // Configurar auto-refresh
  setupAutoRefresh();
});

// Função para debug - verificar dados no localStorage
function debugComunicados() {
  const dados = localStorage.getItem('comunicacoes');
  console.log('Dados no localStorage:', dados);
  
  if (dados) {
    try {
      const comunicados = JSON.parse(dados);
      console.log('Comunicados parseados:', comunicados);
      console.log('Total de comunicados:', comunicados.length);
      
      comunicados.forEach((com, index) => {
        console.log(`Comunicado ${index}:`, com);
      });
    } catch (e) {
      console.error('Erro ao fazer parse dos dados:', e);
    }
  } else {
    console.log('Nenhum dado encontrado no localStorage');
  }
}

// Adicionar função global para facilitar debug no console
window.debugComunicados = debugComunicados;
window.carregarComunicadosTI = carregarComunicadosTI;
window.adicionarComunicadoTeste = adicionarComunicadoTeste;

// Funções para abrir e fechar modais
function abrirModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function fecharModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
}

// Função para editar tarefas
function editarTarefas() {
  const modal = document.getElementById('edit-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  modalTitle.textContent = 'Editar Tarefas';
  
  modalBody.innerHTML = `
    <div class="form-group">
      <label for="tarefas-input">Tarefas (uma por linha):</label>
      <textarea id="tarefas-input" rows="8">${appData.tarefas.join('\n')}</textarea>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

// Função para salvar edições
function salvarEdicao() {
  const modalTitle = document.getElementById('modal-title').textContent;
  
  if (modalTitle === 'Editar Tarefas') {
    const tarefasInput = document.getElementById('tarefas-input');
    const tarefas = tarefasInput.value.split('\n').filter(tarefa => tarefa.trim() !== '');
    
    appData.tarefas = tarefas;
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
    atualizarListaTarefas();
  }
  
  fecharModal();
}

// Event listener para fechar o modal com a tecla ESC
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    fecharModal();
    fecharModalLogin();
  }
});

// Event listener para clicar fora do modal para fechar
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      fecharModal();
      fecharModalLogin();
    }
  });
});

function carregarCarrosselSMAS() {
  const carrosselData = JSON.parse(localStorage.getItem('carrosselSMAS')) || [];
  const carousel = document.getElementById('carousel');
  const indicatorsContainer = document.querySelector('.carousel-indicators');

  if (!carousel || !indicatorsContainer) return;

  carousel.innerHTML = '';
  indicatorsContainer.innerHTML = '';

  if (carrosselData.length === 0) {
    // Se não houver imagens, mostra os slides padrão
    carousel.innerHTML = `
      <div class="carousel-item">
        <div style="background: linear-gradient(45deg, #0d4f0d, #4caf50); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: white; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
          Engenharia Industrial
        </div>
      </div>
      <div class="carousel-item">
        <div style="background: linear-gradient(45deg, #388e3c, #66bb6a); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: white; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
          Tubulações Industriales
        </div>
      </div>
      <div class="carousel-item">
        <div style="background: linear-gradient(45deg, #2e7d32, #81c784); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: white; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
          Projeto de Engenharia
        </div>
      </div>
      <div class="carousel-item">
        <div style="background: linear-gradient(45deg, #1b5e20, #4caf50); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: white; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
          Sistemas de Tubulação
        </div>
      </div>
    `;
    indicatorsContainer.innerHTML = `
      <div class="indicator active" data-index="0"></div>
      <div class="indicator" data-index="1"></div>
      <div class="indicator" data-index="2"></div>
      <div class="indicator" data-index="3"></div>
    `;
    return;
  }

  carrosselData.forEach((item, idx) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-item';
    slide.innerHTML = `
      <img src="${item.imagem}" alt="${item.titulo}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">
      <div style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,0.5);color:#fff;padding:5px 12px;border-radius:8px;font-family:'Orbitron',sans-serif;">
        ${item.titulo}
      </div>
    `;
    carousel.appendChild(slide);

    const indicator = document.createElement('div');
    indicator.className = 'indicator' + (idx === 0 ? ' active' : '');
    indicator.setAttribute('data-index', idx);
    indicatorsContainer.appendChild(indicator);
  });
}

// Função para carregar carrossel na página inicial
function carregarCarrosselHome() {
  const carousel = document.getElementById('carousel');
  const carrosselData = localStorage.getItem('carrosselSMAS');
  let imagensCarrossel = [];
  
  if (carrosselData) {
    try {
      imagensCarrossel = JSON.parse(carrosselData);
    } catch (e) {
      console.error('Erro ao parsear dados do carrossel:', e);
    }
  }
  
  // Se não houver imagens no carrossel, usar as padrão
  if (imagensCarrossel.length === 0) {
    return; // Mantém as imagens padrão já definidas no HTML
  }
  
  // Limpar o carrossel existente
  carousel.innerHTML = '';
  
  // Adicionar as imagens do carrossel
  imagensCarrossel.forEach((item, index) => {
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    
    if (item.link) {
      carouselItem.innerHTML = `
        <a href="${item.link}" target="_blank">
          <img src="${item.imagem}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover;">
          <div class="carousel-caption">${item.titulo}</div>
        </a>
      `;
    } else {
      carouselItem.innerHTML = `
        <img src="${item.imagem}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover;">
        <div class="carousel-caption">${item.titulo}</div>
      `;
    }
    
    carousel.appendChild(carouselItem);
  });
  
  // Atualizar os indicadores
  const indicatorsContainer = document.querySelector('.carousel-indicators');
  indicatorsContainer.innerHTML = '';
  
  imagensCarrossel.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
    indicator.setAttribute('data-index', index);
    indicatorsContainer.appendChild(indicator);
  });
  
  // Reiniciar o carrossel
  initCarousel();
}

// Sistema de atualização automática
function setupAutoRefresh() {
  // Atualizar a cada 30 segundos
  setInterval(() => {
    carregarComunicadosTI();
    carregarCarrosselHome();
  }, 30000);
  
  // Também atualizar quando o foco voltar para a página
  window.addEventListener('focus', () => {
    carregarComunicadosTI();
    carregarCarrosselHome();
  });
}

// Chamar a função de auto-refresh no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // ...código existente...
  carregarCarrosselHome();

  window.addEventListener('storage', function(e) {
    if (e.key === 'carrosselSMAS') {
      carregarCarrosselHome();
    }
  });
});