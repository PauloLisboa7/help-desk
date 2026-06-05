/* ============================================
   DASHBOARD
   ============================================ */

document.addEventListener('DOMContentLoaded', async function() {
    const user = authManager.getUser();
    
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Carregar dados do dashboard
    await loadDashboardData();

    console.log('[diag] dashboard loaded for user:', user);

    // Proteger acesso direto ao formulário de novo chamado para N1/N2/N3
    const perfil = user.perfil || user.role;
    if (['n1', 'n2', 'n3'].includes(perfil) && window.location.hash === '#novo-chamado') {
        window.location.hash = '#chamados-abertos';
    }

    // Configurar navegação
    setupNavigation();

    // Se houver hash na URL ao carregar a página, mostrar a seção correspondente
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        if (targetId) {
            await showSection(targetId, true);
        }
    }

    // Carregar categorias dinâmicas para o formulário de novo chamado
    await loadCategories();

    // Carregar perfil do usuário (seção Meu Perfil) apenas para usuários comuns
    const userPerfil = user?.perfil || user?.role;
    if (!['n1', 'n2', 'n3'].includes(userPerfil)) {
        await loadProfile();
    }

    // Configurar formulários
    setupForms();
    setupRealtime();
    setupTriageActions();
});

// redirecionar botão de manutencao caso exista
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && (target.id === 'abrirManutencao' || target.closest('#abrirManutencao'))) {
        window.location.href = '/tecnico';
    }
});

function setupRealtime() {
    // conectar Socket.IO e enviar token
    try {
        const socket = io({ auth: { token: authManager.getToken() } });
        socket.on('connect', () => console.log('Socket conectado'));
        socket.on('onlineCount', data => {
            const el = document.getElementById('adminUsuariosOnline');
            if (el) el.textContent = data.count || 0;
        });
    } catch (err) {
        console.warn('Socket.IO indisponível', err);
    }
}

// Diagnostic click logger to detect overlays/blocking elements
document.addEventListener('click', function diagClickLogger(e) {
    try {
        const tgt = e.target;
        console.log('[diag] click', { x: e.clientX, y: e.clientY, tag: tgt.tagName, id: tgt.id, classes: tgt.className });
    } catch (err) {
        console.warn('[diag] click logger error', err);
    }
});

async function loadDashboardData() {
    try {
        // Buscar estatísticas gerais
        const statsResp = await authManager.fetch('/dashboard/stats');
        if (!statsResp.ok) {
            console.warn('Não foi possível buscar estatísticas gerais');
        } else {
            const stats = await statsResp.json();
            document.getElementById('countAbertos').textContent = stats.chamadosAbertos || 0;
            document.getElementById('countAtendimento').textContent = stats.chamadosEmAtendimento || 0;
            document.getElementById('countResolvidos').textContent = stats.chamadosResolvidos || 0;
            document.getElementById('countSlaVencido').textContent = stats.chamadosFechados || 0;
        }

        const user = authManager.getUser();
        const perfil = user?.perfil || user?.role;
        const menuNovo = document.getElementById('menuNovoChamado');
        const btnNovo = document.getElementById('btnNovoChamado');
        const menuInventario = document.getElementById('menuInventario');
        const menuTermo = document.getElementById('menuTermoTransferencia');
        const menuPerfil = document.getElementById('menuPerfil');
        const summaryCards = document.getElementById('summaryCards');

        if (['n1', 'n2', 'n3'].includes(perfil)) {
            if (menuNovo) menuNovo.style.display = 'none';
            if (btnNovo) btnNovo.style.display = 'none';
            if (menuInventario) menuInventario.style.display = 'block';
            if (menuTermo) menuTermo.style.display = 'block';
            if (menuPerfil) menuPerfil.style.display = 'none';
            if (summaryCards) summaryCards.style.display = 'none';
        } else {
            if (menuNovo) menuNovo.style.display = 'block';
            if (btnNovo) btnNovo.style.display = 'block';
            if (menuInventario) menuInventario.style.display = 'none';
            if (menuTermo) menuTermo.style.display = 'none';
            if (menuPerfil) menuPerfil.style.display = '';
            if (summaryCards) summaryCards.style.display = '';
        }

        // Renderizar painel específico por perfil
        if (!user) return;
        if (!user.perfil && user.role) {
            user.perfil = user.role;
        }

        if (perfil === 'administrador') {
            const resp = await authManager.fetch('/dashboard/admin');
            if (resp.ok) {
                const data = await resp.json();
                renderAdminPanel(data);
                // Exibir o bloco geral de chamados recentes no painel de administrador
                const recentesCard = document.getElementById('recentesCard');
                if (recentesCard) {
                    recentesCard.style.display = 'block';
                }
                const chamados = (data.recentChamados || []).map(c => ({
                    id: c.id,
                    numero: c.numero_chamado,
                    titulo: c.titulo,
                    prioridade: c.prioridade || 'media',
                    status: c.status,
                    data: c.criado_em
                }));
                updateChamadosTable(chamados);
            }
        } else if (perfil === 'tecnico') {
            const resp = await authManager.fetch('/dashboard/tecnico');
            if (resp.ok) {
                const data = await resp.json();
                renderTecnicoPanel(data);
                const recentesCard = document.getElementById('recentesCard');
                if (recentesCard) {
                    recentesCard.style.display = 'block';
                }
                const chamados = (data.assigned || []).map(c => ({
                    id: c.id,
                    numero: c.numero_chamado || c.id,
                    titulo: c.titulo,
                    prioridade: c.prioridade || 'media',
                    status: c.status,
                    data: c.criado_em
                }));
                updateChamadosTable(chamados);
            }
        } else if (['n1', 'n2', 'n3'].includes(perfil)) {
            const resp = await authManager.fetch('/dashboard/nivel');
            if (resp.ok) {
                const data = await resp.json();
                renderNivelPanel(perfil, data);
            }
            const menuNovo = document.getElementById('menuNovoChamado');
            const btnNovo = document.getElementById('btnNovoChamado');
            if (menuNovo) menuNovo.style.display = 'none';
            if (btnNovo) btnNovo.style.display = 'none';
        } else {
            const resp = await authManager.fetch('/dashboard/usuario');
            if (resp.ok) {
                const data = await resp.json();
                renderUsuarioPanel(data);
                // Usuário comum já vê seus chamados recentes no painel do usuário.
                // Não renderizamos a tabela geral duplicada para evitar conteúdo repetido.
            }
        }

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function renderAdminPanel(data) {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;
    panel.style.display = 'block';

    document.getElementById('adminTotalUsuarios').textContent = data.totalUsers || 0;
    document.getElementById('adminUsuariosOnline').textContent = data.onlineUsers || 0;
    document.getElementById('adminChamadosTotais').textContent = data.totalChamados || 0;

    const tbody = document.querySelector('#adminChamadosTable tbody');
    tbody.innerHTML = '';
    (data.recentChamados || []).forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.numero_chamado || c.id}</td>
            <td>${escapeHtml(c.titulo)}</td>
            <td>${escapeHtml(c.usuario_nome || '')}</td>
            <td>${String(c.status).replace(/_/g,' ')}</td>
            <td>${formatDate(c.criado_em)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTecnicoPanel(data) {
    const panel = document.getElementById('tecnicoPanel');
    if (!panel) return;
    panel.style.display = 'block';

    const body = panel.querySelector('.card-body');
    const stats = data.stats || {};
    const assigned = data.assigned || [];

    let html = `<p>Chamados atribuídos: <strong>${assigned.length}</strong></p>`;
    html += `<p>Em atendimento: <strong>${stats.em_atendimento || 0}</strong> — Resolvidos: <strong>${stats.resolvidos || 0}</strong></p>`;
    html += '<div class="table-responsive mt-2"><table class="table table-sm"><thead><tr><th>#</th><th>Título</th><th>Status</th><th>Data</th></tr></thead><tbody>';
    assigned.slice(0,20).forEach(c => {
        html += `<tr><td>${c.numero_chamado || c.id}</td><td>${escapeHtml(c.titulo)}</td><td>${String(c.status).replace(/_/g,' ')}</td><td>${formatDate(c.criado_em)}</td></tr>`;
    });
    html += '</tbody></table></div>';

    body.innerHTML = html;
}

function renderUsuarioPanel(data) {
    const panel = document.getElementById('usuarioPanel');
    if (!panel) return;
    panel.style.display = 'block';

    const tbody = document.querySelector('#usuarioMeusChamadosTable tbody');
    if (!tbody) return;

    const chamados = data.meusChamados || [];
    tbody.innerHTML = '';

    if (chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum chamado encontrado</td></tr>';
        return;
    }

    chamados.forEach(chamado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(chamado.numero_chamado || chamado.id)}</td>
            <td>${escapeHtml(chamado.titulo)}</td>
            <td>${escapeHtml(chamado.prioridade)}</td>
            <td>${escapeHtml(String(chamado.status).replace(/_/g, ' '))}</td>
            <td>${formatDate(chamado.criado_em)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderNivelPanel(perfil, data) {
    const panel = document.getElementById('nivelPanel');
    if (!panel) return;
    panel.style.display = 'block';

    const stats = data.stats || {};

    const chamados = data.chamadosAbertos || [];
    const total = chamados.length;
    const levelLabel = perfil.toUpperCase();
    const abertosCount = chamados.filter(c => c.status === 'aberto').length;
    const emAtendimentoCount = chamados.filter(c => c.status === 'em_atendimento').length;
    const aguardandoCount = total - (abertosCount + emAtendimentoCount);

    panel.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-3 mb-3">
                <div class="card bg-light h-100">
                    <div class="card-body p-3">
                        <h6 class="text-muted">Nível</h6>
                        <h4>${escapeHtml(levelLabel)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                        <div class="card bg-light h-100">
                    <div class="card-body p-3">
                        <h6 class="text-muted">Chamados disponíveis</h6>
                        <h3>${abertosCount}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                        <div class="card bg-light h-100">
                    <div class="card-body p-3">
                        <h6 class="text-muted">Em atendimento</h6>
                        <h3>${emAtendimentoCount}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                        <div class="card bg-light h-100">
                    <div class="card-body p-3">
                        <h6 class="text-muted">Resolvidos</h6>
                        <h3>${stats.resolvidos || 0}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                        <div class="card bg-light h-100">
                    <div class="card-body p-3">
                        <h6 class="text-muted">Aguardando triagem</h6>
                        <h3>${aguardandoCount}</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-wrap gap-2 my-3" id="nivelActionButtons">
            <button id="btnNivelRefresh" class="btn btn-outline-primary btn-sm">Atualizar fila</button>
            <button id="btnNivelReport" class="btn btn-outline-secondary btn-sm">Gerar relatório rápido</button>
            <button id="btnNivelFocus" class="btn btn-outline-success btn-sm">Ir para Chamados Abertos</button>
        </div>
        <div class="alert alert-info alert-sm">
            Selecione a aba <em>Chamados Abertos</em> para atender os chamados do seu nível.
        </div>
        <div class="table-responsive">
            <table class="table table-sm table-striped" id="nivelChamadosTable">
                <thead>
                            <tr>
                                <th>#</th>
                                <th>Título</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Anexo</th>
                                <th>Patrimônio</th>
                                <th>Data</th>
                                <th>Ação</th>
                            </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;

    renderNivelChamadosTable(chamados);
    setupNivelPanelActions(perfil);
}

function renderNivelChamadosTable(chamados) {
    const tbody = document.querySelector('#nivelChamadosTable tbody');
    if (!tbody) return;

    if (!chamados || chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum chamado disponível para o seu nível no momento.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    chamados.forEach(chamado => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${chamado.numero_chamado || chamado.id}</td>
            <td>${escapeHtml(chamado.titulo)}</td>
            <td>${escapeHtml(priorityLabel(chamado.prioridade))}</td>
            <td>${escapeHtml(String(chamado.status).replace(/_/g, ' '))}</td>
            <td>${chamado.has_attachment ? '<i class="fas fa-paperclip" title="Possui anexo"></i>' : ''}</td>
            <td>${escapeHtml(chamado.patrimonio_maquina || chamado.patrimonio || '')}</td>
            <td>${formatDate(chamado.criado_em)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary nivel-action-view" data-id="${chamado.id}">Ver</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupNivelPanelActions(perfil) {
    const refreshBtn = document.getElementById('btnNivelRefresh');
    const reportBtn = document.getElementById('btnNivelReport');
    const focusBtn = document.getElementById('btnNivelFocus');
    const actionTable = document.getElementById('nivelChamadosTable');

    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            try {
                const resp = await authManager.fetch('/dashboard/nivel');
                if (!resp.ok) throw new Error('Falha ao atualizar fila');
                const data = await resp.json();
                renderNivelPanel(perfil, data);
                showAlert(document.getElementById('alertArea'), 'Fila de chamados atualizada.', 'success');
            } catch (err) {
                console.error('Erro ao atualizar fila do nível:', err);
                showAlert(document.getElementById('alertArea'), 'Erro ao atualizar fila', 'danger');
            }
        };
    }

    if (reportBtn) {
        reportBtn.onclick = async () => {
            try {
                const resp = await authManager.fetch('/dashboard/nivel');
                if (!resp.ok) throw new Error('Falha ao gerar relatório');
                const data = await resp.json();
                const chamados = data.chamadosAbertos || [];
                const total = chamados.length;
                const abertos = chamados.filter(c => c.status === 'aberto').length;
                const emAtendimento = chamados.filter(c => c.status === 'em_atendimento').length;
                const aguardando = total - (abertos + emAtendimento);
                const message = `Relatório rápido ${perfil.toUpperCase()}: Total ${total}, Abertos ${abertos}, Em atendimento ${emAtendimento}, Aguardando triagem ${aguardando}`;
                showAlert(document.getElementById('alertArea'), message, 'info');
            } catch (err) {
                console.error('Erro gerando relatório rápido:', err);
                showAlert(document.getElementById('alertArea'), 'Erro ao gerar relatório', 'danger');
            }
        };
    }

    if (focusBtn) {
        focusBtn.onclick = () => { window.location.hash = '#chamados-abertos'; };
    }

    if (actionTable) {
        actionTable.removeEventListener('click', nivelTableClickHandler);
        actionTable.addEventListener('click', nivelTableClickHandler);
    }
}

async function nivelTableClickHandler(event) {
    const button = event.target.closest('.nivel-action-view');
    if (!button) return;
    const chamadoId = button.getAttribute('data-id');
    if (!chamadoId) return;

    try {
        const resp = await authManager.fetch(`/chamados/${chamadoId}`);
        if (!resp.ok) {
            const errorData = await resp.json();
            throw new Error(errorData.error || 'Erro ao carregar detalhes do chamado');
        }

        const chamado = await resp.json();
        showChamadoDetalhes(chamado);
    } catch (err) {
        console.error('Erro ao abrir detalhes do chamado:', err);
        alert('Não foi possível carregar os detalhes do chamado. Verifique o console para mais informações.');
    }
}

function showChamadoDetalhes(chamado) {
    const modalTitle = document.getElementById('chamadoDetalhesModalLabel');
    const modalBody = document.getElementById('chamadoDetalhesBody');

    if (!modalTitle || !modalBody) {
        alert(`Chamado #${chamado.numero_chamado || chamado.id}: patrimônio ${chamado.patrimonio_maquina || chamado.patrimonio || 'não informado'}`);
        return;
    }

    const attachmentHtml = chamado.attachments && chamado.attachments.length
        ? chamado.attachments.map(anexo => {
            const url = escapeHtml(anexo.caminho_arquivo || '');
            const name = escapeHtml(anexo.nome_arquivo || 'Anexo');
            if (anexo.tipo_mime && anexo.tipo_mime.startsWith('image/')) {
                return `<div class="mb-3">
                            <p><strong>Anexo:</strong> ${name}</p>
                            <img src="${url}" alt="${name}" class="img-fluid rounded shadow-sm" style="max-height:250px; max-width:100%;" />
                        </div>`;
            }
            return `<p><strong>Anexo:</strong> <a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></p>`;
        }).join('')
        : '<p><strong>Anexo:</strong> Nenhum anexo</p>';

    modalTitle.textContent = `Detalhes do Chamado ${chamado.numero_chamado || chamado.id}`;
    modalBody.innerHTML = `
        <p><strong>Título:</strong> ${escapeHtml(chamado.titulo)}</p>
        <p><strong>Descrição:</strong> ${escapeHtml(chamado.descricao || 'Sem descrição')}</p>
        <p><strong>Status:</strong> ${escapeHtml(String(chamado.status).replace(/_/g, ' '))}</p>
        <p><strong>Prioridade:</strong> ${escapeHtml(priorityLabel(chamado.prioridade))}</p>
        <p><strong>Categoria:</strong> ${escapeHtml(chamado.categoria_nome || 'Não informada')}</p>
        <p><strong>Solicitante:</strong> ${escapeHtml(chamado.usuario_nome || 'Não informado')}</p>
        <p><strong>Patrimônio:</strong> ${escapeHtml(chamado.patrimonio_maquina || chamado.patrimonio || 'Não informado')}</p>
        <p><strong>Criado em:</strong> ${formatDate(chamado.criado_em)}</p>
        ${attachmentHtml}
    `;

    const modalElement = document.getElementById('chamadoDetalhesModal');
    if (modalElement && window.bootstrap && window.bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[s];
    });
}

function updateChamadosTable(chamados) {
    const tbody = document.getElementById('chamadosTable');
    
    if (chamados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum chamado encontrado</td></tr>';
        return;
    }

    // Construir os elementos DOM para evitar problemas com CSP e handlers inline
    tbody.innerHTML = '';
    chamados.forEach(chamado => {
        const tr = document.createElement('tr');

        const tdNum = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = chamado.numero;
        tdNum.appendChild(strong);
        tr.appendChild(tdNum);

        const tdTitulo = document.createElement('td');
        tdTitulo.textContent = chamado.titulo;
        tr.appendChild(tdTitulo);

        const tdPrior = document.createElement('td');
        const spanPrior = document.createElement('span');
        spanPrior.className = `badge badge-${getPriorityBadge(chamado.prioridade)}`;
        spanPrior.textContent = priorityLabel(chamado.prioridade);
        tdPrior.appendChild(spanPrior);
        tr.appendChild(tdPrior);

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = `badge badge-${getStatusBadge(chamado.status)}`;
        // Label legível
        const statusLabel = String(chamado.status).replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        spanStatus.textContent = statusLabel;
        tdStatus.appendChild(spanStatus);
        tr.appendChild(tdStatus);

        const tdData = document.createElement('td');
        tdData.textContent = formatDate(chamado.data);
        tr.appendChild(tdData);

        const tdAcao = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.type = 'button';
        btn.addEventListener('click', () => viewChamado(chamado.id));
        const i = document.createElement('i');
        i.className = 'fas fa-eye';
        btn.appendChild(i);
        tdAcao.appendChild(btn);
        tr.appendChild(tdAcao);

        tbody.appendChild(tr);
    });
}

const loadedSections = new Set();

function setupTriageActions() {
    const tbody = document.getElementById('chamadosAbertosTable');
    if (!tbody) return;

    tbody.removeEventListener('click', handleTriageApplyClick);
    tbody.addEventListener('click', handleTriageApplyClick);
}

async function loadChamadosAbertos() {
    try {
        const user = authManager.getUser();
        const perfil = user?.perfil || user?.role || 'usuario';
        const endpoint = ['n1', 'n2', 'n3'].includes(perfil) ? '/dashboard/nivel' : '/dashboard/chamados-abertos';

        const resp = await authManager.fetch(endpoint);
        if (!resp.ok) {
            throw new Error('Falha ao carregar chamados abertos');
        }

        const data = await resp.json();
        const tbody = document.getElementById('chamadosAbertosTable');
        const infoContainer = document.getElementById('chamadosAbertosInfo');
        const alertContainer = document.getElementById('chamadosAbertosAlert');
        const actionHeader = document.getElementById('chamadosAbertosActionHeader');

        if (!tbody) {
            console.warn('Tabela de chamados abertos não encontrada');
            return;
        }

        tbody.innerHTML = '';

        if (infoContainer) {
            if (['n1', 'n2', 'n3'].includes(perfil)) {
                const label = perfil.toUpperCase();
                infoContainer.innerHTML = `
                    <div class="alert alert-secondary alert-sm">
                        Chamados exibidos para <strong>${label}</strong>. Use o botão <strong>Aplicar</strong> para atualizar o status do chamado.
                    </div>
                `;
            } else {
                infoContainer.innerHTML = '';
            }
        }

        if (alertContainer) {
            alertContainer.innerHTML = '';
        }

        if (actionHeader) {
            actionHeader.textContent = ['n1', 'n2', 'n3'].includes(perfil) ? '' : 'Ação';
        }

        const chamados = Array.isArray(data.chamadosAbertos) ? data.chamadosAbertos : [];
        if (chamados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum chamado aberto encontrado</td></tr>';
            return;
        }

        chamados.forEach(chamado => {
            const tr = document.createElement('tr');
            const prioridadeLabelText = priorityLabel(chamado.prioridade);
            const statusLabel = String(chamado.status).replace(/_/g, ' ');
            const patrimonioValor = escapeHtml(chamado.patrimonio_maquina || chamado.patrimonio || 'Não informado');

            let actionOptions = `
                <option value="em_atendimento">Iniciar atendimento</option>
                <option value="aguardar">Aguardar processo</option>
                <option value="resolvido">Marcar como concluído</option>
            `;
            if (chamado.status === 'em_atendimento') {
                actionOptions = `
                    <option value="aguardar">Aguardar processo</option>
                    <option value="resolvido">Marcar como concluído</option>
                `;
            }

            if (['n1', 'n2', 'n3'].includes(perfil)) {
                tr.innerHTML = `
                    <td>${chamado.numero_chamado || chamado.id}</td>
                    <td>${escapeHtml(chamado.titulo)}</td>
                    <td>${escapeHtml(prioridadeLabelText)}</td>
                    <td>${escapeHtml(statusLabel)}</td>
                    <td>${patrimonioValor}</td>
                    <td>${formatDate(chamado.criado_em)}</td>
                    <td>
                        <div class="d-flex gap-2 align-items-center">
                            <select id="triage-${chamado.id}" class="form-select form-select-sm">
                                ${actionOptions}
                            </select>
                            <button data-chamado-id="${chamado.id}" class="btn btn-sm btn-primary triageApplyBtn" type="button">Aplicar</button>
                        </div>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${chamado.numero_chamado || chamado.id}</td>
                    <td>${escapeHtml(chamado.titulo)}</td>
                    <td>${escapeHtml(prioridadeLabelText)}</td>
                    <td>${escapeHtml(statusLabel)}</td>
                    <td>${patrimonioValor}</td>
                    <td>${formatDate(chamado.criado_em)}</td>
                    <td></td>
                `;
            }

            tbody.appendChild(tr);
        });

        if (['n1', 'n2', 'n3'].includes(perfil)) {
            tbody.removeEventListener('click', handleTriageApplyClick);
            tbody.addEventListener('click', handleTriageApplyClick);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderTermoTransferenciaAlert(container, message, type = 'info') {
    if (!container) return;
    if (!message) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

async function loadTermoTransferencia() {
    try {
        const resp = await authManager.fetch('/dashboard/termo-transferencia');
        if (!resp.ok) {
            const errorText = await resp.text().catch(() => '');
            throw new Error(`Falha ao carregar chamados para termo de transferência (${resp.status}) ${errorText}`);
        }

        const data = await resp.json();
        const chamados = Array.isArray(data.chamados) ? data.chamados : [];
        const tbody = document.getElementById('termoTransferenciaTable');
        const btnCriar = document.getElementById('btnCriarTermoTransferencia');
        const alertContainer = document.getElementById('termoTransferenciaAlert');

        if (!tbody) return;
        if (btnCriar) btnCriar.disabled = true;
        renderTermoTransferenciaAlert(alertContainer, '', 'info');

        if (chamados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum chamado encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        chamados.forEach(chamado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="radio" name="termoTransferenciaSelect" value="${chamado.id}" /></td>
                <td>${escapeHtml(chamado.numero_chamado || chamado.id)}</td>
                <td>${escapeHtml(chamado.titulo)}</td>
                <td>${escapeHtml(chamado.categoria || chamado.categoria_nome || '')}</td>
                <td>${escapeHtml(String(chamado.status).replace(/_/g, ' '))}</td>
                <td>${escapeHtml(chamado.patrimonio_maquina || chamado.patrimonio || 'Não informado')}</td>
                <td>${formatDate(chamado.criado_em)}</td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('input[name="termoTransferenciaSelect"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (btnCriar) btnCriar.disabled = false;
            });
        });

        if (btnCriar) {
            btnCriar.onclick = () => {
                const selected = document.querySelector('input[name="termoTransferenciaSelect"]:checked');
                if (!selected) {
                    renderTermoTransferenciaAlert(alertContainer, 'Selecione um chamado antes de criar o termo.', 'danger');
                    return;
                }

                const chamadoId = selected.value;
                const templateUrl = '/termo-transferencia.xlsx';
                window.location.href = `${templateUrl}?chamado=${encodeURIComponent(chamadoId)}`;
            };
        }
    } catch (err) {
        console.error(err);
        const alertContainer = document.getElementById('termoTransferenciaAlert');
        renderTermoTransferenciaAlert(alertContainer, 'Erro ao carregar chamados. Tente novamente.', 'danger');
    }
}

function handleTriageApplyClick(event) {
    const btn = event.target.closest('.triageApplyBtn');
    if (!btn) return;

    const chamadoId = btn.dataset.chamadoId;
    if (!chamadoId) return;

    const selectEl = document.getElementById(`triage-${chamadoId}`);
    if (!selectEl) return;

    applyTriageDecision(chamadoId, selectEl.value);
}

async function applyTriageDecision(chamadoId, action) {
    const statusMap = {
        em_atendimento: 'em_atendimento',
        aguardar: 'em_atendimento',
        resolvido: 'resolvido'
    };

    const messageMap = {
        em_atendimento: 'Chamado iniciado. Aguarde enquanto a triagem é processada.',
        aguardar: 'Chamado em análise. Por favor, aguarde a próxima atualização.',
        resolvido: 'Chamado marcado como concluído. Atualizando para resolvido.'
    };

    const status = statusMap[action];
    if (!status) return;

    const resp = await authManager.fetch(`/chamados/${chamadoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });

    const alertContainer = document.getElementById('chamadosAbertosAlert');
    if (!alertContainer) return;

    if (!resp.ok) {
        const errorData = await resp.json();
        showAlert(alertContainer, errorData.error || 'Erro ao atualizar chamado', 'danger');
        return;
    }

    showAlert(alertContainer, messageMap[action] || 'Chamado atualizado com sucesso', 'success');

    if (action === 'resolvido') {
        // Remover imediatamente da tabela de chamados abertos
        try {
            const btnEl = document.querySelector(`[data-chamado-id="${chamadoId}"]`);
            if (btnEl) {
                const tr = btnEl.closest('tr');
                if (tr) tr.remove();
            }

            // Se a tabela ficou vazia, exibir placeholder
            const tbody = document.getElementById('chamadosAbertosTable');
            if (tbody && tbody.querySelectorAll('tr').length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum chamado aberto encontrado</td></tr>';
            }
        } catch (err) {
            console.warn('Erro removendo linha localmente', err);
        }

        // Recarregar meus chamados para refletir o status e navegar para a aba
        // Tentar recarregar a lista completa
        await loadMeusChamados();

        // Mostrar a aba sem forçar novo reload (para não sobrescrever inserções manuais)
        await showSection('meus-chamados');

        // Se o chamado não apareceu via /dashboard/usuario, buscar o chamado atualizado e anexar manualmente
        try {
            const detalheResp = await authManager.fetch(`/chamados/${chamadoId}`);
            if (detalheResp.ok) {
                const chamadoAtual = await detalheResp.json();
                const tbodyMeus = document.getElementById('meusChamadosTable');
                if (tbodyMeus) {
                    // verificar se já existe
                    const exists = Array.from(tbodyMeus.querySelectorAll('tr')).some(r => r.innerText.includes(chamadoAtual.numero_chamado || chamadoAtual.id));
                    if (!exists) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${escapeHtml(chamadoAtual.numero_chamado || chamadoAtual.id)}</td>
                            <td>${escapeHtml(chamadoAtual.titulo)}</td>
                            <td>${escapeHtml(String(chamadoAtual.status).replace(/_/g, ' '))}</td>
                            <td>${escapeHtml(priorityLabel(chamadoAtual.prioridade))}</td>
                            <td>${formatDate(chamadoAtual.criado_em)}</td>
                            <td><button class="btn btn-sm btn-outline-secondary" type="button" disabled>--</button></td>
                        `;
                        tbodyMeus.insertBefore(tr, tbodyMeus.firstChild);
                    }
                }
            }
        } catch (err) {
            console.warn('Erro ao buscar/append chamado resolvido:', err);
        }

        // Atualizar contadores do dashboard
        try { await loadDashboardData(); } catch (e) { /* ignora */ }
        return;
    }

    try {
        await loadDashboardData();
    } catch (e) {
        console.warn('Erro ao atualizar dados do dashboard após mudança de status:', e);
    }

    await loadChamadosAbertos();
}

async function loadMeusChamados() {
    try {
        const resp = await authManager.fetch('/dashboard/usuario');
        if (!resp.ok) {
            throw new Error('Falha ao carregar meus chamados');
        }

        const data = await resp.json();
        const tbody = document.getElementById('meusChamadosTable');
        if (!tbody) return;

        const chamados = data.meusChamados || [];
        tbody.innerHTML = '';

        if (chamados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum chamado encontrado</td></tr>';
            return;
        }

        chamados.forEach(chamado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(chamado.numero_chamado || chamado.id)}</td>
                <td>${escapeHtml(chamado.titulo)}</td>
                <td>${escapeHtml(String(chamado.status).replace(/_/g, ' '))}</td>
                <td>${escapeHtml(priorityLabel(chamado.prioridade))}</td>
                <td>${escapeHtml(chamado.patrimonio_maquina || chamado.patrimonio || 'Não informado')}</td>
                <td>${formatDate(chamado.criado_em)}</td>
                <td><button class="btn btn-sm btn-outline-secondary" type="button" disabled>--</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadInventario() {
    try {
        const resp = await authManager.fetch('/dashboard/inventario');
        if (!resp.ok) {
            throw new Error('Falha ao carregar inventário');
        }

        const data = await resp.json();
        const tbody = document.getElementById('inventarioTable');
        tbody.innerHTML = '';

        if (!data.inventario || data.inventario.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Nenhum equipamento cadastrado</td></tr>';
            return;
        }

        data.inventario.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${escapeHtml(item.tipo)}</td>
                <td>${escapeHtml(item.modelo)}</td>
                <td>${escapeHtml(item.serie)}</td>
                <td>${escapeHtml(item.patrimonio || '')}</td>
                <td>${escapeHtml(item.localizacao)}</td>
                <td>${escapeHtml(item.responsavel)}</td>
                <td>${escapeHtml(item.cadastrado_por)}</td>
                <td>${escapeHtml(item.status)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadUsuarios() {
    try {
        const resp = await authManager.fetch('/dashboard/usuarios');
        if (!resp.ok) {
            throw new Error('Falha ao carregar usuários');
        }

        const data = await resp.json();
        const tbody = document.getElementById('usuariosTable');
        tbody.innerHTML = '';

        if (!data.usuarios || data.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum usuário encontrado</td></tr>';
            return;
        }

        data.usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${escapeHtml(user.nome)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.perfil)}</td>
                <td>${user.ativo ? 'Ativo' : 'Inativo'}</td>
                <td>${formatDate(user.criado_em)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadRelatorios() {
    try {
        const resp = await authManager.fetch('/dashboard/relatorios');
        if (!resp.ok) {
            throw new Error('Falha ao carregar relatórios');
        }

        const data = await resp.json();

        document.getElementById('relatorioChamadosTotais').textContent = data.totalChamados || 0;
        document.getElementById('relatorioUsuariosTotais').textContent = data.totalUsuarios || 0;
        document.getElementById('relatorioEquipamentosTotais').textContent = data.totalEquipamentos || 0;

        const statusBody = document.getElementById('relatorioStatusTable');
        statusBody.innerHTML = '';
        if (!data.statusSummary || data.statusSummary.length === 0) {
            statusBody.innerHTML = '<tr><td colspan="2" class="text-center">Nenhum dado disponível</td></tr>';
        } else {
            data.statusSummary.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHtml(row.status)}</td><td>${row.total}</td>`;
                statusBody.appendChild(tr);
            });
        }

        const categoryBody = document.getElementById('relatorioCategoriaTable');
        categoryBody.innerHTML = '';
        if (!data.categoriaSummary || data.categoriaSummary.length === 0) {
            categoryBody.innerHTML = '<tr><td colspan="2" class="text-center">Nenhum dado disponível</td></tr>';
        } else {
            data.categoriaSummary.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHtml(row.categoria)}</td><td>${row.total}</td>`;
                categoryBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

function setupNavigation() {
    // Links da sidebar
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    console.log('[diag] setupNavigation found sidebar navLinks:', navLinks.length);
    navLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') {
                return;
            }

            const targetId = href.substring(1);
            if (!targetId) {
                return;
            }

            const user = authManager.getUser();
            const perfil = user?.perfil || user?.role;

            if (['n1', 'n2', 'n3'].includes(perfil) && targetId === 'novo-chamado') {
                e.preventDefault();
                await showSection('chamados-abertos');
                return;
            }

            e.preventDefault();
            await showSection(targetId);
        });
    });

    const btnNovoChamado = document.getElementById('btnNovoChamado');
    if (btnNovoChamado) {
        btnNovoChamado.addEventListener('click', async function(e) {
            e.preventDefault();
            await showSection('novo-chamado');
        });
    }
}

async function showSection(sectionId, forceReload = false) {
    if (!sectionId) {
        return;
    }

    const user = authManager.getUser();
    const perfil = user?.perfil || user?.role;

    if (sectionId === 'inventario' && !['n1', 'n2', 'n3'].includes(perfil)) {
        await showSection('dashboard');
        return;
    }
    if (sectionId === 'termo-transferencia' && !['n1', 'n2', 'n3'].includes(perfil)) {
        await showSection('dashboard');
        return;
    }
    // Bloquear acesso direto à aba 'perfil' para níveis N1/N2/N3
    if (sectionId === 'perfil' && ['n1', 'n2', 'n3'].includes(perfil)) {
        await showSection('dashboard');
        return;
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });

    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');

    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    targetSection.style.display = 'block';
    await handleSectionLoad(sectionId, forceReload);
    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', async () => {
    const sectionId = window.location.hash.substring(1) || 'dashboard';
    await showSection(sectionId, true);
});

async function handleSectionLoad(sectionId, forceReload = false) {
    if (!forceReload && loadedSections.has(sectionId)) {
        return;
    }

    switch (sectionId) {
        case 'chamados-abertos':
            await loadChamadosAbertos();
            break;
        case 'meus-chamados':
            await loadMeusChamados();
            break;
        case 'inventario':
            await loadInventario();
            break;
        case 'termo-transferencia':
            await loadTermoTransferencia();
            break;
        case 'relatorios':
            await loadRelatorios();
            break;
        case 'usuarios':
            await loadUsuarios();
            break;
        default:
            break;
    }

    loadedSections.add(sectionId);
}

async function loadCategories() {
    try {
        const select = document.getElementById('categoria');
        if (!select) return;

        const resp = await authManager.fetch('/categorias');
        if (!resp.ok) {
            console.warn('Não foi possível carregar categorias');
            return;
        }

        const categories = await resp.json();
        if (!Array.isArray(categories)) return;

        select.innerHTML = '<option value="">Selecione...</option>';
        console.log('[diag] categorias carregadas', categories.map(cat => ({ nome: cat.nome, nivel_suporte: cat.nivel_suporte })));
        categories.forEach(cat => {
            const option = document.createElement('option');
            const nivelSuporte = String(cat.nivel_suporte || 'n2').toLowerCase();
            option.value = cat.id;
            option.dataset.nivel = nivelSuporte;
            option.textContent = `${cat.nome} (${getNivelLabel(nivelSuporte)})`;
            select.appendChild(option);
        });

        updateNivelSuporteFromCategory();
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
    }
}

function getNivelLabel(nivel) {
    const niv = String(nivel || 'n2').toLowerCase();
    return {
        n1: 'N1',
        n2: 'N2',
        n3: 'N3'
    }[niv] || 'N2';
}

function getPriorityFromNivel(nivel) {
    return {
        n1: 'baixa',
        n2: 'media',
        n3: 'alta'
    }[nivel] || 'media';
}

function updateNivelSuporteFromCategory() {
    const categoriaSelect = document.getElementById('categoria');
    const nivelInput = document.getElementById('nivelSuporte');
    const prioridadeInput = document.getElementById('prioridade');

    if (!categoriaSelect || !nivelInput || !prioridadeInput) return;

    const selectedOption = categoriaSelect.selectedOptions[0];
    const nivel = selectedOption?.dataset?.nivel || 'n2';
    nivelInput.value = getNivelLabel(nivel);
    prioridadeInput.value = getPriorityFromNivel(nivel);
}

function setupForms() {
    // Formulário de novo chamado
    const novoChamadoForm = document.getElementById('novoChamadoForm');
    if (novoChamadoForm) {
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', updateNivelSuporteFromCategory);
        }

        novoChamadoForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const patrimonioFromForm = formData.get('patrimonio_maquina') ? String(formData.get('patrimonio_maquina')).trim() : '';
            if (patrimonioFromForm) {
                formData.set('patrimonio_maquina', patrimonioFromForm);
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            }

            try {
                const resp = await authManager.fetch('/chamados', {
                    method: 'POST',
                    body: formData
                });

                if (!resp.ok) {
                    const errorData = await resp.json();
                    throw new Error(errorData.error || 'Erro ao criar chamado');
                }

                const ticket = await resp.json();
                const alertArea = document.getElementById('alertArea');
                if (alertArea) {
                    showAlert(alertArea, 'Chamado criado com sucesso! Número: ' + ticket.numero_chamado, 'success');
                }
                this.reset();
                await loadDashboardData();
                if (window.location.hash !== '#meus-chamados') {
                    location.hash = '#meus-chamados';
                }
            } catch (err) {
                const alertArea = document.getElementById('alertArea');
                if (alertArea) {
                    showAlert(alertArea, err.message || 'Erro ao criar chamado', 'danger');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    // Perfil - formulário de edição do patrimônio
    const perfilForm = document.getElementById('perfilForm');
    const currentUser = authManager.getUser() || {};
    const currentPerfil = currentUser.perfil || currentUser.role;
    if (perfilForm && !['n1', 'n2', 'n3'].includes(currentPerfil)) setupPerfilForm();
}

async function loadProfile() {
    try {
        if (!authManager.isAuthenticated()) return;
        const resp = await authManager.fetch('/auth/me');
        if (!resp.ok) return;
        const data = await resp.json();
        const usuario = data.usuario || data.user;
        if (!usuario) return;

        // Preencher campos na UI
        const nomeEl = document.getElementById('nomePerfil');
        const emailEl = document.getElementById('emailPerfil');
        const patrimonioEl = document.getElementById('patrimonioInput');
        if (nomeEl) nomeEl.value = usuario.nome || '';
        if (emailEl) emailEl.value = usuario.email || '';
        if (patrimonioEl) {
            patrimonioEl.value = usuario.patrimonio || '';
            setPerfilEditMode(!usuario.patrimonio);
        }

        // Atualizar localStorage user
        const current = authManager.getUser() || {};
        const merged = { ...current, ...usuario };
        localStorage.setItem('helpdesk_user', JSON.stringify(merged));
        // Sincronizar patrimônio para o formulário de novo chamado imediatamente
        try { syncPatrimonioToForms(usuario); } catch (e) { /* ignore if function not yet defined */ }
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

function setPerfilEditMode(isEditing) {
    const patrimonioEl = document.getElementById('patrimonioInput');
    const saveBtn = document.getElementById('savePerfil');
    const editBtn = document.getElementById('editPerfil');
    if (patrimonioEl) {
        patrimonioEl.readOnly = !isEditing;
        patrimonioEl.classList.toggle('bg-light', !isEditing);
    }
    if (saveBtn) saveBtn.style.display = isEditing ? 'inline-block' : 'none';
    if (editBtn) editBtn.style.display = isEditing ? 'none' : 'inline-block';
}

// Sincroniza o patrimônio do perfil para os formulários relevantes (ex: novo chamado)
function syncPatrimonioToForms(usuario) {
    try {
        const user = usuario || authManager.getUser() || {};
        const patrimonioVal = user.patrimonio || '';
        const patrimonioMaquinaEl = document.getElementById('patrimonioMaquina');
        const patrimonioInput = document.getElementById('patrimonioInput');

        // Preencher o campo do formulário de novo chamado apenas se estiver vazio
        if (patrimonioMaquinaEl && !patrimonioMaquinaEl.value && patrimonioVal) {
            patrimonioMaquinaEl.value = patrimonioVal;
        }

        // Garantir que o campo de perfil exiba o valor salvo
        if (patrimonioInput && patrimonioInput.value !== patrimonioVal) {
            patrimonioInput.value = patrimonioVal;
        }
    } catch (err) {
        console.warn('Erro ao sincronizar patrimônio entre formulários', err);
    }
}

function setupPerfilForm() {
    const perfilForm = document.getElementById('perfilForm');
    const alertArea = document.getElementById('perfilAlert');
    const editBtn = document.getElementById('editPerfil');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            setPerfilEditMode(true);
            const patrimonioEl = document.getElementById('patrimonioInput');
            if (patrimonioEl) patrimonioEl.focus();
        });
    }
    perfilForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const patrimonio = document.getElementById('patrimonioInput').value.trim();
        try {
            const resp = await authManager.fetch('/auth/me', {
                method: 'PATCH',
                body: JSON.stringify({ patrimonio }),
            });
            if (!resp.ok) {
                const err = await resp.json();
                showAlert(alertArea, err.error || 'Erro ao salvar patrimônio', 'danger');
                return;
            }
            const data = await resp.json();
            const usuario = data.usuario || data.user;
            // Atualizar localStorage
            const current = authManager.getUser() || {};
            const merged = { ...current, ...usuario };
            localStorage.setItem('helpdesk_user', JSON.stringify(merged));
            setPerfilEditMode(false);
            // Sincronizar patrimônio imediatamente para o formulário de novo chamado
            try { syncPatrimonioToForms(usuario); } catch (e) { /* ignore */ }
            showAlert(alertArea, 'Patrimônio salvo com sucesso', 'success');
        } catch (err) {
            console.error('Erro ao salvar perfil:', err);
            showAlert(alertArea, 'Erro ao salvar patrimônio', 'danger');
        }
    });

    const cancelBtn = document.getElementById('cancelPerfil');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { window.location.hash = '#dashboard'; });
}

function viewChamado(id) {
    alert('Função de visualização de chamado em desenvolvimento');
}

function getStatusBadge(status) {
    const statusMap = {
        'aberto': 'aberto',
        'em_atendimento': 'atendimento',
        'resolvido': 'resolvido',
        'fechado': 'fechado'
    };
    return statusMap[status] || status;
}

function getPriorityBadge(priority) {
    const priorityMap = {
        'baixa': 'baixa',
        'media': 'media',
        'alta': 'alta',
        'critica': 'critica'
    };
    return priorityMap[priority] || priority;
}

function priorityLabel(priority) {
    const map = {
        'baixa': 'N1',
        'media': 'N2',
        'alta': 'N3',
        'critica': 'N3'
    };
    if (!priority) return 'N2';
    return map[priority] || String(priority).toUpperCase();
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}
