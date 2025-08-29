// Verificar se o usuário está logado como SMAS
document.addEventListener('DOMContentLoaded', function() {
  const savedUser = localStorage.getItem('comunicacaoUser');
  let user = null;

  if (savedUser) {
    user = JSON.parse(savedUser);
  }

  // GUARDA DE SEGURANÇA: Se não houver usuário ou o usuário não for SMAS,
  // redirecione para a página principal e pare a execução do script.
  if (!user || user.role !== 'smas') {
    window.location.replace('comunicacao.html'); 
    return; // Interrompe a execução para que o resto do código não seja lido.
  }
  
  // Se o código chegou até aqui, o usuário é SMAS. Continue com a configuração da página.
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = '(Técnico de SMAS)';
  
  // Carrega o conteúdo específico da página SMAS
  carregarComunicados();
  carregarCarrossel();
  
  // Configura os listeners de eventos da página
  document.getElementById('comunicadoForm').addEventListener('submit', handleComunicadoSubmit);
  document.getElementById('carrosselForm').addEventListener('submit', handleCarrosselSubmit);
  
  // Adicionar listener para eventos de storage
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('comunicadoAtualizado', carregarComunicados);
  
  // Configurar preview de imagem
  const imagemInput = document.getElementById('imagem');
  if (imagemInput) {
    imagemInput.addEventListener('change', handleImagePreview);
  }
  
  // Configurar remoção de imagem
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-image')) {
      e.preventDefault();
      removeImagePreview();
    }
  });
});

// Sair do sistema
function logout() {
  localStorage.removeItem('comunicacaoUser');
  window.location.replace('comunicacao.html');
}

function excluirComunicado(id) {
  if (confirm('Tem certeza que deseja excluir este comunicado?')) {
    let comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
    
    // Filtrar o comunicado a ser excluído
    comunicados = comunicados.filter(comunicado => comunicado.id !== id);
    
    // Salvar no localStorage
    localStorage.setItem('comunicacoes', JSON.stringify(comunicados));
    
    // Atualizar timestamp para sincronização
    localStorage.setItem('ultimo_comunicado_timestamp', Date.now().toString());
    
    // Disparar evento personalizado
    const event = new CustomEvent('comunicadoExcluido', { 
      detail: { id: id, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    // Recarregar a lista
    carregarComunicados();
  }
}

// Publicar novo comunicado SMAS
function handleComunicadoSubmit(e) {
  e.preventDefault();
  
  const titulo = document.getElementById('titulo').value;
  const conteudo = document.getElementById('conteudo').value;
  const prioridade = document.getElementById('prioridade').value;
  const imagemInput = document.getElementById('imagem');
  const user = JSON.parse(localStorage.getItem('comunicacaoUser'));
  
  // Validações básicas
  if (!titulo || !conteudo) {
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }
  
  let imagemData = null;
  if (imagemInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      imagemData = e.target.result;
      salvarComunicadoComImagem(titulo, conteudo, prioridade, imagemData, user);
    };
    reader.readAsDataURL(imagemInput.files[0]);
  } else {
    salvarComunicadoComImagem(titulo, conteudo, prioridade, null, user);
  }
}

function salvarComunicadoComImagem(titulo, conteudo, prioridade, imagemData, user) {
  const novoComunicado = {
    id: Date.now(),
    titulo,
    conteudo,
    prioridade,
    tipo: 'smas',
    data: new Date().toLocaleString('pt-BR'),
    autor: user.name,
    departamento: user.departamento,
    timestamp: Date.now(),
    imagem: imagemData
  };
  
  salvarComunicado(novoComunicado);
  carregarComunicados();
  
  const successMessage = document.getElementById('success-message');
  successMessage.style.display = 'block';
  document.getElementById('comunicadoForm').reset();
  removeImagePreview();
  
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

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

function carregarComunicados() {
  const muralAvisos = document.getElementById('mural-avisos');
  const comunicados = JSON.parse(localStorage.getItem('comunicacoes')) || [];
  const user = JSON.parse(localStorage.getItem('comunicacaoUser'));
  muralAvisos.innerHTML = '';
  
  if (comunicados.length === 0) {
    muralAvisos.innerHTML = `<div class="comunicacao-card"><p>Nenhum comunicado SMAS publicado ainda.</p></div>`;
    return;
  }
  
  const filtroPrioridade = document.getElementById('filtro-prioridade').value;
  const comunicadosSMAS = comunicados.filter(comunicado => 
    comunicado.departamento === 'smas' &&
    (filtroPrioridade === 'todos' || comunicado.prioridade === filtroPrioridade)
  );
  
  if (comunicadosSMAS.length === 0) {
    muralAvisos.innerHTML = `<div class="comunicacao-card"><p>Nenhum comunicado SMAS encontrado com os filtros selecionados.</p></div>`;
    return;
  }
  
  comunicadosSMAS.forEach(comunicado => {
    const card = document.createElement('div');
    card.className = `comunicacao-card ${comunicado.prioridade}`;
    
    let imagemHTML = '';
    if (comunicado.imagem) {
      imagemHTML = `<img src="${comunicado.imagem}" alt="Imagem do comunicado" style="max-width: 100%; border-radius: 5px; margin-bottom: 10px;">`;
    }
    
    let botoesAdmin = '';
    if (user && user.role === 'smas') {
      botoesAdmin = `
        <div class="comunicacao-actions">
          <button class="delete-btn" onclick="excluirComunicado(${comunicado.id})" title="Excluir comunicado">
            <i class="fas fa-trash"></i>
          </button>
        </div>`;
    }
    
    card.innerHTML = `
      <h3>${comunicado.titulo}</h3>
      ${imagemHTML}
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

function handleCarrosselSubmit(e) {
  e.preventDefault();
  const titulo = document.getElementById('carrossel-titulo').value;
  const imagemInput = document.getElementById('carrossel-imagem');
  const link = document.getElementById('carrossel-link').value;
  if (imagemInput.files.length === 0) {
    alert('Por favor, selecione uma imagem para o carrossel.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    adicionarAoCarrossel(titulo, e.target.result, link);
  };
  reader.readAsDataURL(imagemInput.files[0]);
}

// Modificar a função adicionarAoCarrossel para incluir timestamp
function adicionarAoCarrossel(titulo, imagemData, link) {
  let carrossel = JSON.parse(localStorage.getItem('carrosselSMAS')) || [];
  const novaImagem = {
    id: Date.now(),
    titulo,
    imagem: imagemData,
    link: link || null,
    timestamp: Date.now()
  };
  carrossel.unshift(novaImagem);
  if (carrossel.length > 10) { carrossel = carrossel.slice(0, 10); }
  localStorage.setItem('carrosselSMAS', JSON.stringify(carrossel));
  
  // Adicionar timestamp para sincronização
  localStorage.setItem('ultimo_carrossel_timestamp', Date.now().toString());
  
  carregarCarrossel();
  
  // Disparar evento personalizado para outras abas
  const event = new CustomEvent('carrosselAtualizado', { 
    detail: { timestamp: Date.now() } 
  });
  window.dispatchEvent(event);
  
  const successMessage = document.getElementById('carrossel-success');
  successMessage.style.display = 'block';
  document.getElementById('carrosselForm').reset();
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

// Modificar a função removerDoCarrossel para incluir timestamp
function removerDoCarrossel(id) {
  let carrossel = JSON.parse(localStorage.getItem('carrosselSMAS')) || [];
  carrossel = carrossel.filter(item => item.id !== id);
  localStorage.setItem('carrosselSMAS', JSON.stringify(carrossel));
  
  // Adicionar timestamp para sincronização
  localStorage.setItem('ultimo_carrossel_timestamp', Date.now().toString());
  
  // Disparar evento personalizado para outras abas
  const event = new CustomEvent('carrosselAtualizado', { 
    detail: { timestamp: Date.now() } 
  });
  window.dispatchEvent(event);
  
  carregarCarrossel();
}

// Adicionar listener para eventos de carrossel
window.addEventListener('carrosselAtualizado', function() {
  carregarCarrossel();
});

// Adicionar listener para storage events específicos do carrossel
window.addEventListener('storage', function(e) {
  if (e.key === 'carrosselSMAS' || e.key === 'ultimo_carrossel_timestamp') { 
    carregarCarrossel(); 
  }
});
function carregarCarrossel() {
  const listaCarrossel = document.getElementById('lista-carrossel');
  const carrossel = JSON.parse(localStorage.getItem('carrosselSMAS')) || [];
  listaCarrossel.innerHTML = '';
  if (carrossel.length === 0) {
    listaCarrossel.innerHTML = '<p>Nenhuma imagem no carrossel.</p>';
    return;
  }
  carrossel.forEach(item => {
    const carrosselItem = document.createElement('div');
    carrosselItem.className = 'carrossel-item';
    carrosselItem.innerHTML = `
      <img src="${item.imagem}" alt="${item.titulo}">
      <div class="carrossel-item-info">
        <strong>${item.titulo}</strong>
        ${item.link ? `<br><small>Link: ${item.link}</small>` : ''}
      </div>
      <div class="carrossel-item-actions">
        <button onclick="removerDoCarrossel(${item.id})">Remover</button>
      </div>`;
    listaCarrossel.appendChild(carrosselItem);
  });
}

function removerDoCarrossel(id) {
  let carrossel = JSON.parse(localStorage.getItem('carrosselSMAS')) || [];
  carrossel = carrossel.filter(item => item.id !== id);
  localStorage.setItem('carrosselSMAS', JSON.stringify(carrossel));
  carregarCarrossel();
}

function handleStorageEvent(e) {
  if (e.key === 'comunicacoes' || e.key === 'ultimo_comunicado_timestamp') { carregarComunicados(); }
  if (e.key === 'carrosselSMAS') { carregarCarrossel(); }
}

// Função para visualizar imagem antes do upload
function handleImagePreview(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Verificar se é uma imagem
  if (!file.type.match('image.*')) {
    alert('Por favor, selecione apenas arquivos de imagem.');
    e.target.value = '';
    return;
  }
  
  // Verificar tamanho do arquivo (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('A imagem deve ter no máximo 5MB.');
    e.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) {
      // Criar container de preview se não existir
      const container = document.createElement('div');
      container.id = 'image-preview';
      container.className = 'image-preview';
      container.innerHTML = `
        <img src="" alt="Preview da imagem">
        <a href="#" class="remove-image">Remover imagem</a>
      `;
      
      // Inserir após o campo de upload
      const uploadContainer = document.querySelector('.file-upload-container');
      if (uploadContainer) {
        uploadContainer.parentNode.insertBefore(container, uploadContainer.nextSibling);
      }
    }
    
    // Atualizar a imagem
    const previewImg = document.querySelector('#image-preview img');
    previewImg.src = e.target.result;
    
    // Mostrar o preview
    document.getElementById('image-preview').style.display = 'block';
  };
  
  reader.readAsDataURL(file);
  
  // Mostrar nome do arquivo
  const fileNameDisplay = document.getElementById('file-name');
  if (fileNameDisplay) {
    fileNameDisplay.textContent = file.name;
  }
}

// Função para remover preview de imagem
function removeImagePreview() {
  const imagemInput = document.getElementById('imagem');
  if (imagemInput) {
    imagemInput.value = '';
  }
  
  const previewContainer = document.getElementById('image-preview');
  if (previewContainer) {
    previewContainer.style.display = 'none';
    previewContainer.querySelector('img').src = '';
  }
  
  const fileNameDisplay = document.getElementById('file-name');
  if (fileNameDisplay) {
    fileNameDisplay.textContent = '';
  }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo) {
  // Criar elemento de notificação
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 82, 82, 0.9)'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  notificacao.innerHTML = `
    <div style="display: flex; align-items: center;">
      <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="margin-right: 10px;"></i>
      <span>${mensagem}</span>
    </div>
  `;
  
  document.body.appendChild(notificacao);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notificacao.remove();
  }, 5000);
}
