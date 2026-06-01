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

    // Configurar navegação
    setupNavigation();

    // Configurar formulários
    setupForms();
    setupRealtime();
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

        // Renderizar painel específico por perfil
        const user = authManager.getUser();
        if (!user) return;

        if (user.perfil === 'administrador') {
            const resp = await authManager.fetch('/dashboard/admin');
            if (resp.ok) {
                const data = await resp.json();
                renderAdminPanel(data);
                // Também preencher a tabela geral de chamados recentes com os mesmos dados
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
        } else if (user.perfil === 'tecnico') {
            const resp = await authManager.fetch('/dashboard/tecnico');
            if (resp.ok) {
                const data = await resp.json();
                renderTecnicoPanel(data);
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
        } else {
            const resp = await authManager.fetch('/dashboard/usuario');
            if (resp.ok) {
                const data = await resp.json();
                renderUsuarioPanel(data);
                const chamados = (data.meusChamados || []).map(c => ({
                    id: c.id,
                    numero: c.numero_chamado || c.id,
                    titulo: c.titulo,
                    prioridade: c.prioridade || 'media',
                    status: c.status,
                    data: c.criado_em
                }));
                updateChamadosTable(chamados);
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
    tbody.innerHTML = '';
    (data.meusChamados || []).forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.numero_chamado || c.id}</td>
            <td>${escapeHtml(c.titulo)}</td>
            <td>${String(c.status).replace(/_/g,' ')}</td>
            <td>${formatDate(c.criado_em)}</td>
        `;
        tbody.appendChild(tr);
    });
    // Também preencher a seção Meus Chamados (tabela principal)
    const mainTbody = document.getElementById('meusChamadosTable');
    if (mainTbody) {
        mainTbody.innerHTML = '';
        (data.meusChamados || []).forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.numero_chamado || c.id}</td>
                <td>${escapeHtml(c.titulo)}</td>
                <td>${String(c.status).replace(/_/g,' ')}</td>
                <td>${c.prioridade || 'media'}</td>
                <td>${formatDate(c.criado_em)}</td>
                <td><button class="btn btn-sm btn-primary">Ver</button></td>
            `;
            mainTbody.appendChild(tr);
        });
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
        spanPrior.textContent = chamado.prioridade;
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

async function handleSectionLoad(sectionId) {
    if (loadedSections.has(sectionId)) {
        return;
    }

    switch (sectionId) {
        case 'chamados-abertos':
            await loadChamadosAbertos();
            break;
        case 'inventario':
            await loadInventario();
            break;
        case 'relatorios':
            await loadRelatorios();
            break;
        case 'usuarios':
            await loadUsuarios();
            break;
        default:
            return;
    }

    loadedSections.add(sectionId);
}

async function loadChamadosAbertos() {
    try {
        const resp = await authManager.fetch('/dashboard/chamados-abertos');
        if (!resp.ok) {
            throw new Error('Falha ao carregar chamados abertos');
        }

        const data = await resp.json();
        const tbody = document.getElementById('chamadosAbertosTable');
        tbody.innerHTML = '';

        if (!data.chamadosAbertos || data.chamadosAbertos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum chamado aberto encontrado</td></tr>';
            return;
        }

        data.chamadosAbertos.forEach(chamado => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${chamado.numero_chamado || chamado.id}</td>
                <td>${escapeHtml(chamado.titulo)}</td>
                <td>${escapeHtml(chamado.prioridade || 'média')}</td>
                <td>${String(chamado.status).replace(/_/g, ' ')}</td>
                <td>${formatDate(chamado.criado_em)}</td>
                <td><button class="btn btn-sm btn-primary" type="button">Ver</button></td>
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum equipamento cadastrado</td></tr>';
            return;
        }

        data.inventario.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${escapeHtml(item.tipo)}</td>
                <td>${escapeHtml(item.modelo)}</td>
                <td>${escapeHtml(item.serie)}</td>
                <td>${escapeHtml(item.localizacao)}</td>
                <td>${escapeHtml(item.responsavel)}</td>
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
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            // Ocultar todas as sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.style.display = 'none');
            
            // Mostrar section correspondente
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                await handleSectionLoad(targetId);
                window.scrollTo(0, 0);
            }
        });
    });
}

async function handleSectionLoad(sectionId) {
    if (loadedSections.has(sectionId)) {
        return;
    }

    switch (sectionId) {
        case 'chamados-abertos':
            await loadChamadosAbertos();
            break;
        case 'inventario':
            await loadInventario();
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

function setupForms() {
    // Formulário de novo chamado
    const novoChamadoForm = document.getElementById('novoChamadoForm');
    if (novoChamadoForm) {
        novoChamadoForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const dados = {
                titulo: formData.get('titulo'),
                descricao: formData.get('descricao'),
                categoria: formData.get('categoria'),
                prioridade: formData.get('prioridade')
            };

            console.log('Enviando novo chamado:', dados);

            // Aqui você faria a requisição para criar o chamado
            alert('Chamado criado com sucesso!');
            this.reset();
        });
    }
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

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}
