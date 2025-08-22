document.addEventListener('DOMContentLoaded', function() {
  const savedUser = localStorage.getItem('comunicacaoUser');
  
  if (savedUser) {
    const user = JSON.parse(savedUser);
    
    // Se o usuário for SMAS, redirecione para a página SMAS
    if (user.role === 'smas') {
      window.location.replace('comunicacao_smas.html');
      return;
    }
    
    // Configurar a página para usuários TI
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = '(Técnico de TI)';
    
    // Carregar comunicados
    carregarComunicados();
    
    // Mostrar painel de administração para TI
    document.getElementById('admin-panel').classList.remove('hidden');
  } else {
    // Se não estiver logado, mostrar formulário de login
    document.getElementById('login-form').classList.remove('hidden');
  }
  
  // Configura os listeners e funções da página
  setupPageListeners();
});
const validCredentials = [
  // TI
  { email: 'yan.rocha@pipeway.com', password: 'p7NIkCkg', name: 'Yan Rocha', role: 'ti', departamento: 'ti' },
  { email: 'felipe.moreira@pipeway.com', password: 'p7NIkCkg', name: 'Felipe Moreira', role: 'ti', departamento: 'ti' },
  { email: 'renato.francis@pipeway.com', password: 'p7NIkCkg', name: 'Renato Francis', role: 'ti', departamento: 'ti' },

  // SMAS
  { email: 'rafael.muniz@pipeway.com', password: 'p7NIkCkg', name: 'Rafael Muniz', role: 'smas', departamento: 'smas' },
  { email: 'ana.lucia@pipeway.com', password: 'p7NIkCkg', name: 'Ana Lúcia', role: 'smas', departamento: 'smas' },
  { email: 'fabiano.dias@pipeway.com', password: 'p7NIkCkg', name: 'Fabiano Dias', role: 'smas', departamento: 'smas' },
  { email: 'cintia.brito@pipeway.com', password: 'p7NIkCkg', name: 'Cintia Brito', role: 'smas', departamento: 'smas' }
];

document.addEventListener('DOMContentLoaded', function() {
    // --- VERIFICAÇÃO DE SESSÃO NA PÁGINA DE TI ---
    const savedUser = localStorage.getItem('comunicacaoUser');

    if (savedUser) {
        const user = JSON.parse(savedUser);

        // Se um usuário SMAS acessar esta página, redirecione-o para a página correta.
        if (user.role === 'smas') {
            window.location.replace('comunicacao_smas.html');
            return; // Interrompe a execução para garantir o redirecionamento.
        }
        
        // Se for um usuário TI, exiba a tela de comunicação.
        if (user.role === 'ti') {
            showComunicacaoScreen(user);
        }
    }

    // Configura os listeners e funções da página
    setupPageListeners();
});

function setupPageListeners() {
    // Contador de visitantes
    let count = parseInt(localStorage.getItem('visitorCount') || '1245') + 1;
    localStorage.setItem('visitorCount', count);
    if(document.getElementById('visitor-count')) {
        document.getElementById('visitor-count').textContent = count;
    }

    // Carregar comunicados e agenda
    carregarComunicados();
    carregarAgenda();

    // Listeners de eventos
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const comunicadoForm = document.getElementById('comunicadoForm');
    if (comunicadoForm) comunicadoForm.addEventListener('submit', handleComunicadoSubmit);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const filtroDept = document.getElementById('filtro-departamento');
    if (filtroDept) filtroDept.addEventListener('change', filtrarComunicados);

    const filtroPrio = document.getElementById('filtro-prioridade');
    if (filtroPrio) filtroPrio.addEventListener('change', filtrarComunicados);

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('comunicadoAtualizado', handleComunicadoAtualizado);
}

function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const departamento = document.getElementById('departamento').value;
  const errorMessage = document.getElementById('error-message');

  if (!departamento) {
    errorMessage.textContent = 'Por favor, selecione o departamento';
    errorMessage.style.display = 'block';
    return;
  }

  const user = validCredentials.find(cred =>
    cred.email === email &&
    cred.password === password &&
    cred.departamento === departamento
  );

  if (user) {
    // 1. Salva a sessão do usuário
    localStorage.setItem('comunicacaoUser', JSON.stringify(user));

    // 2. DIRECIONA PARA A PÁGINA CORRETA COM BASE NO PERFIL
    if (user.role === 'smas') {
      window.location.replace('comunicacao_smas.html'); // Redireciona SMAS
    } else {
      window.location.replace('comunicacao.html'); // Redireciona TI
    }
    errorMessage.style.display = 'none';

  } else {
    errorMessage.textContent = 'Email, senha ou departamento incorretos. Tente novamente.';
    errorMessage.style.display = 'block';
    document.getElementById('password').value = '';
  }
}


// Nova função para mostrar a interface de TI
function showComunicacaoScreen(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('comunicacao-screen').classList.remove('hidden');
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('user-role').textContent = '(Técnico de TI)';
    document.getElementById('tipo-comunicado').value = 'ti';
}

function logout() {
  localStorage.removeItem('comunicacaoUser');
  // Usamos replace para garantir que o usuário vá para a página de login
  window.location.replace('comunicacao.html'); 
}

// ... O restante das suas funções (handleComunicadoSubmit, salvarComunicado, carregarComunicados, etc.) permanece o mesmo ...
// (COLE O RESTANTE DO SEU CÓDIGO comunicacao.js A PARTIR DAQUI)

// Publicar novo comunicado
function handleComunicadoSubmit(e) {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value;
  const conteudo = document.getElementById('conteudo').value;
  const prioridade = document.getElementById('prioridade').value;
  const tipoComunicado = document.getElementById('tipo-comunicado').value;
  const user = JSON.parse(localStorage.getItem('comunicacaoUser'));

  const novoComunicado = {
    id: Date.now(),
    titulo,
    conteudo,
    prioridade,
    tipo: tipoComunicado,
    data: new Date().toLocaleString('pt-BR'),
    autor: user.name,
    departamento: user.departamento,
    timestamp: Date.now()
  };

  salvarComunicado(novoComunicado);
  carregarComunicados();

  const successMessage = document.getElementById('success-message');
  successMessage.style.display = 'block';

  document.getElementById('titulo').value = '';
  document.getElementById('conteudo').value = '';
  document.getElementById('prioridade').value = 'normal';

  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

// Salvar comunicado no localStorage
function salvarComunicado(comunicado) {
  let comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
  if (!comunicado.id) { comunicado.id = Date.now(); }
  if (!comunicado.timestamp) { comunicado.timestamp = Date.now(); }
  comunicados.unshift(comunicado);
  localStorage.setItem('comunicacoes', JSON.stringify(comunicados));
  const event = new CustomEvent('comunicadoAtualizado', { detail: { comunicado: comunicado } });
  window.dispatchEvent(event);
  localStorage.setItem('ultimo_comunicado_timestamp', Date.now().toString());
}

// Carregar comunicados do localStorage
function carregarComunicados() {
  const muralAvisos = document.getElementById('mural-avisos');
  if (!muralAvisos) return;
  const comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
  const user = JSON.parse(localStorage.getItem('comunicacaoUser'));
  muralAvisos.innerHTML = '';
  if (comunicados.length === 0) {
    muralAvisos.innerHTML = `<div class="comunicacao-card"><p>Nenhum comunicado publicado ainda.</p></div>`;
    return;
  }
  const filtroDepartamento = document.getElementById('filtro-departamento').value;
  const filtroPrioridade = document.getElementById('filtro-prioridade').value;
  const comunicadosFiltrados = comunicados.filter(comunicado => {
    let passaFiltro = true;
    if (filtroDepartamento !== 'todos' && comunicado.departamento !== filtroDepartamento) { passaFiltro = false; }
    if (filtroPrioridade !== 'todos' && comunicado.prioridade !== filtroPrioridade) { passaFiltro = false; }
    return passaFiltro;
  });
  if (comunicadosFiltrados.length === 0) {
    muralAvisos.innerHTML = `<div class="comunicacao-card"><p>Nenhum comunicado encontrado com os filtros selecionados.</p></div>`;
    return;
  }
  comunicadosFiltrados.forEach(comunicado => {
    const card = document.createElement('div');
    card.className = `comunicacao-card ${comunicado.prioridade} ${comunicado.departamento}`;
    const deptColor = comunicado.departamento === 'ti' ? '#4caf50' : '#2196f3';
    const deptLabel = comunicado.departamento === 'ti' ? 'TI' : 'SMAS';
    let botoesAdmin = '';
    if (user && (user.role === 'ti' || user.role === 'smas')) {
      botoesAdmin = `
        <div class="comunicacao-actions">
          <span class="dept-badge" style="background: ${deptColor}">${deptLabel}</span>
          <button class="delete-btn" onclick="excluirComunicado(${comunicado.id})" title="Excluir comunicado">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
    } else {
      botoesAdmin = `<span class="dept-badge" style="background: ${deptColor}">${deptLabel}</span>`;
    }
    card.innerHTML = `
      <h3>${comunicado.titulo}</h3>
      <p>${comunicado.conteudo}</p>
      <div class="comunicacao-meta">
        <span>Por: ${comunicado.autor}</span>
        <span>${comunicado.data}</span>
      </div>
      ${botoesAdmin}`;
    muralAvisos.appendChild(card);
  });
}

function filtrarComunicados() {
  carregarComunicados();
}

function excluirComunicado(id) {
  if (confirm('Tem certeza que deseja excluir este comunicado?')) {
    let comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
    comunicados = comunicados.filter(comunicado => comunicado.id !== id);
    localStorage.setItem('comunicacoes', JSON.stringify(comunicados));
    carregarComunicados();
    const event = new Event('comunicadosAtualizados');
    window.dispatchEvent(event);
  }
}

function carregarAgenda() {
  const agendaList = document.getElementById('agenda-list');
  if (!agendaList) return;
  let agenda = JSON.parse(localStorage.getItem('agendaCorporativa')) || [];
  if (agenda.length === 0) {
    agenda = [
      { data: '25/05/2023 - 10:00', descricao: 'Reunião de equipe - Projeto Alpha' },
      { data: '28/05/2023 - 14:00', descricao: 'Treinamento de segurança' },
      { data: '01/06/2023 - 09:00', descricao: 'Apresentação de resultados' }
    ];
    localStorage.setItem('agendaCorporativa', JSON.stringify(agenda));
  }
  agendaList.innerHTML = '';
  agenda.forEach(evento => {
    const item = document.createElement('li');
    item.className = 'agenda-item';
    item.innerHTML = `
      <div class="agenda-data">${evento.data}</div>
      <div class="agenda-descricao">${evento.descricao}</div>`;
    agendaList.appendChild(item);
  });
}

function handleStorageEvent(e) {
  if (e.key === 'ultimo_comunicado_timestamp') { carregarComunicados(); }
  if (e.key === 'comunicado_novo') { setTimeout(() => { localStorage.removeItem('comunicado_novo'); }, 500); }
}

function handleComunicadoAtualizado(e) {
  carregarComunicados();
}