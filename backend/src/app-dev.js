import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// MIDDLEWARE DE SEGURANÇA
// ============================================
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// SERVIR FRONTEND ESTÁTICO
// ============================================
app.use(express.static(path.join(__dirname, '../../frontend')));

// ============================================
// ROTAS DE API (MOCK DATA PARA TESTES)
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Help Desk API está funcionando! (Modo desenvolvimento - dados em memória)',
  });
});

// Login Mock
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;

  // Usuário padrão para testes
  if (email === 'admin@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBoZWxwZGVzay5sb2NhbCIsInBlcmZpbCI6ImFkbWluaXN0cmFkb3IiIn0.test',
      usuario: {
        id: 1,
        email: 'admin@helpdesk.local',
        nome: 'Administrador',
        perfil: 'administrador',
        departamento: 'TI',
      },
    });
  } else if (email === 'usuario@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ1c3VhcmlvQGhlbHBkZXNrLmxvY2FsIiwicGVyZmlsIjoidXN1YXJpbyJ9.test',
      usuario: {
        id: 2,
        email: 'usuario@helpdesk.local',
        nome: 'Usuário Teste',
        perfil: 'usuario',
        departamento: 'Administrativo',
      },
    });
  } else if (email === 'n1@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Niwicm9sZSI6Im4xIn0.test',
      usuario: {
        id: 6,
        email: 'n1@helpdesk.local',
        nome: 'Suporte N1',
        perfil: 'n1',
        departamento: 'Suporte',
      },
    });
  } else if (email === 'n2@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6Im4yIn0.test',
      usuario: {
        id: 7,
        email: 'n2@helpdesk.local',
        nome: 'Suporte N2',
        perfil: 'n2',
        departamento: 'Suporte',
      },
    });
  } else if (email === 'n3@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6Im4zIn0.test',
      usuario: {
        id: 8,
        email: 'n3@helpdesk.local',
        nome: 'Suporte N3',
        perfil: 'n3',
        departamento: 'Suporte',
      },
    });
  } else if (email === 'tecnico@helpdesk.local' && senha === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0ZWNuaWNvQGhlbHBkZXNrLmxvY2FsIiwicGVyZmlsIjoidGVjbmljbyJ9.test',
      usuario: {
        id: 3,
        email: 'tecnico@helpdesk.local',
        nome: 'Técnico Teste',
        perfil: 'tecnico',
        departamento: 'TI',
      },
    });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

// Forgot Password Mock
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  // Simulando envio de email para usuários conhecidos
  const mockUsers = [
    'admin@helpdesk.local',
    'usuario@helpdesk.local',
    'n1@helpdesk.local',
    'n2@helpdesk.local',
    'n3@helpdesk.local',
    'tecnico@helpdesk.local'
  ];

  if (mockUsers.includes(email)) {
    const mockToken = Math.random().toString(36).substring(2, 15);
    const resetUrl = `http://localhost:3000/reset-password.html?email=${encodeURIComponent(email)}&token=${mockToken}`;
    
    console.log(`🔐 [DEV] Token de redefinição para ${email}:`, mockToken);
    console.log(`🔗 [DEV] Link de redefinição:`, resetUrl);

    res.json({
      message: 'Se a conta existir, você receberá instruções para redefinir sua senha.',
      debugToken: mockToken,
      debugLink: resetUrl
    });
  } else {
    // Por segurança, retorna a mesma mensagem independentemente
    res.json({
      message: 'Se a conta existir, você receberá instruções para redefinir sua senha.'
    });
  }
});

// Reset Password Mock
app.post('/api/auth/reset-password', (req, res) => {
  const { email, token, senha } = req.body;

  if (!email || !token || !senha) {
    return res.status(400).json({ error: 'Email, token e nova senha são obrigatórios' });
  }

  // Em desenvolvimento, aceita qualquer combinação válida
  const mockUsers = [
    'admin@helpdesk.local',
    'usuario@helpdesk.local',
    'n1@helpdesk.local',
    'n2@helpdesk.local',
    'n3@helpdesk.local',
    'tecnico@helpdesk.local'
  ];

  if (!mockUsers.includes(email)) {
    return res.status(400).json({ error: 'Email ou token inválidos' });
  }

  if (!token || token.length < 5) {
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }

  res.json({
    message: 'Senha redefinida com sucesso. Faça login com a nova senha.'
  });
});

// Chatbot Mock
app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Mensagem é obrigatória' });
  }

  res.json({
    message: `Olá! Esta é uma resposta de teste para: "${String(message).trim()}". Em produção, o chatbot usará o Google Cloud AI.`
  });
});

// Dashboard Stats Mock
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    chamadosAbertos: 12,
    chamadosEmAtendimento: 5,
    chamadosResolvidos: 48,
    usuariosAtivos: 23,
  });
});

function getMockUserFromToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  switch (token) {
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBoZWxwZGVzay5sb2NhbCIsInBlcmZpbCI6ImFkbWluaXN0cmFkb3IiIn0.test':
      return { id: 1, perfil: 'administrador' };
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ1c3VhcmlvQGhlbHBkZXNrLmxvY2FsIiwicGVyZmlsIjoidXN1YXJpbyJ9.test':
      return { id: 2, perfil: 'usuario' };
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Niwicm9sZSI6Im4xIn0.test':
      return { id: 6, perfil: 'n1' };
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6Im4yIn0.test':
      return { id: 7, perfil: 'n2' };
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6Im4zIn0.test':
      return { id: 8, perfil: 'n3' };
    case 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0ZWNuaWNvQGhlbHBkZXNrLmxvY2FsIiwicGVyZmlsIjoidGVjbmljbyJ9.test':
      return { id: 3, perfil: 'tecnico' };
    default:
      return null;
  }
}

app.get('/api/dashboard/nivel', (req, res) => {
  const user = getMockUserFromToken(req.headers.authorization);
  if (!user || !['n1', 'n2', 'n3'].includes(user.perfil)) {
    return res.status(403).json({ success: false, error: 'Acesso restrito a suporte N1/N2/N3' });
  }
  const allChamados = [
    { id: 1, numero_chamado: 'CHM-001', titulo: 'Problema com impressora', categoria: 'Impressora', prioridade: 'baixa', status: 'aberto', patrimonio_maquina: 'PAT-1001', tecnico_id: 6, criado_em: new Date() },
    { id: 2, numero_chamado: 'CHM-002', titulo: 'Sem acesso ao email', categoria: 'Email', prioridade: 'media', status: 'em_atendimento', patrimonio_maquina: 'PAT-1002', tecnico_id: 7, criado_em: new Date() },
    { id: 3, numero_chamado: 'CHM-003', titulo: 'Erro na aplicação', categoria: 'Sistema', prioridade: 'critica', status: 'aberto', patrimonio_maquina: 'PAT-1003', tecnico_id: 3, criado_em: new Date() },
    { id: 4, numero_chamado: 'CHM-004', titulo: 'Rede lenta', categoria: 'Rede', prioridade: 'baixa', status: 'resolvido', patrimonio_maquina: 'PAT-1004', tecnico_id: null, criado_em: new Date() },
    { id: 5, numero_chamado: 'CHM-005', titulo: 'Falha no login do sistema', categoria: 'Acesso', prioridade: 'alta', status: 'aberto', patrimonio_maquina: 'PAT-1005', tecnico_id: null, criado_em: new Date() }
  ];
  const allowedPriorities = user.perfil === 'n1' ? ['baixa'] : user.perfil === 'n2' ? ['media'] : ['alta', 'critica'];
  const chamadosAbertos = allChamados.filter(chamado => allowedPriorities.includes(chamado.prioridade) && (!chamado.tecnico_id || chamado.tecnico_id === user.id));
  res.json({ success: true, chamadosAbertos });
});

app.get('/api/dashboard/termo-transferencia', (req, res) => {
  const user = getMockUserFromToken(req.headers.authorization);
  if (!user || !['n1', 'n2', 'n3'].includes(user.perfil)) {
    return res.status(403).json({ success: false, error: 'Acesso restrito a suporte N1/N2/N3' });
  }

  const allChamados = [
    { id: 1, numero_chamado: 'CHM-001', titulo: 'Problema com impressora', categoria: 'Impressora', prioridade: 'baixa', status: 'aberto', patrimonio_maquina: 'PAT-1001', tecnico_id: 6, criado_em: new Date() },
    { id: 2, numero_chamado: 'CHM-002', titulo: 'Sem acesso ao email', categoria: 'Email', prioridade: 'media', status: 'em_atendimento', patrimonio_maquina: 'PAT-1002', tecnico_id: 7, criado_em: new Date() },
    { id: 3, numero_chamado: 'CHM-003', titulo: 'Erro na aplicação', categoria: 'Sistema', prioridade: 'critica', status: 'aberto', patrimonio_maquina: 'PAT-1003', tecnico_id: 3, criado_em: new Date() },
    { id: 4, numero_chamado: 'CHM-004', titulo: 'Rede lenta', categoria: 'Rede', prioridade: 'baixa', status: 'resolvido', patrimonio_maquina: 'PAT-1004', tecnico_id: null, criado_em: new Date() },
    { id: 5, numero_chamado: 'CHM-005', titulo: 'Falha no login do sistema', categoria: 'Acesso', prioridade: 'alta', status: 'aberto', patrimonio_maquina: 'PAT-1005', tecnico_id: null, criado_em: new Date() }
  ];
  const allowedPriorities = user.perfil === 'n1' ? ['baixa'] : user.perfil === 'n2' ? ['media'] : ['alta', 'critica'];
  const chamados = allChamados.filter(chamado => allowedPriorities.includes(chamado.prioridade) && (!chamado.tecnico_id || chamado.tecnico_id === user.id));
  res.json({ chamados });
});

// Chamados Mock
app.get('/api/chamados', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        numero_chamado: 'CHM-001',
        titulo: 'Problema com impressora',
        usuario_nome: 'João Silva',
        categoria_nome: 'Impressora',
        prioridade: 'media',
        status: 'aberto',
        criado_em: new Date(),
      },
      {
        id: 2,
        numero_chamado: 'CHM-002',
        titulo: 'Sem acesso ao email',
        usuario_nome: 'Maria Santos',
        categoria_nome: 'Email',
        prioridade: 'alta',
        status: 'em_atendimento',
        criado_em: new Date(),
      },
      {
        id: 3,
        numero_chamado: 'CHM-003',
        titulo: 'Erro na aplicação',
        usuario_nome: 'Pedro Costa',
        categoria_nome: 'Sistema',
        prioridade: 'critica',
        status: 'aberto',
        criado_em: new Date(),
      },
    ],
  });
});

// Categorias Mock
app.get('/api/categorias', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nome: 'Computador', icone: 'fas fa-desktop' },
      { id: 2, nome: 'Rede', icone: 'fas fa-wifi' },
      { id: 3, nome: 'Impressora', icone: 'fas fa-print' },
      { id: 4, nome: 'Sistema', icone: 'fas fa-cogs' },
      { id: 5, nome: 'Email', icone: 'fas fa-envelope' },
      { id: 6, nome: 'Acesso', icone: 'fas fa-lock' },
    ],
  });
});

// Criar Chamado Mock
app.post('/api/chamados', (req, res) => {
  const { titulo, descricao, categoria_id, prioridade } = req.body;

  res.json({
    success: true,
    message: 'Chamado criado com sucesso (modo demo)',
    data: {
      id: Math.floor(Math.random() * 1000),
      numero_chamado: `CHM-${String(Math.floor(Math.random() * 9999)).padStart(3, '0')}`,
      titulo,
      descricao,
      categoria_id,
      prioridade,
      status: 'aberto',
      criado_em: new Date(),
    },
  });
});

app.get('/termo-transferencia.xlsx', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Termo_Transferencia_Editable.xlsx'));
});

// ============================================
// ROTA PADRÃO (SPA)
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         Help Desk Corporativo v3.0                         ║
║              🚀 Servidor Iniciado                          ║
╠════════════════════════════════════════════════════════════╣
║ 📌 Endereço: http://localhost:${PORT}                        
║ 📊 Modo: ${process.env.NODE_ENV === 'development' ? '🔧 Desenvolvimento' : '⚙️ Produção'}
║ 📚 Dados: 📝 Mock (Memória)                                ║
║                                                            ║
║ 🧪 Credenciais de Teste:                                  ║
║   📧 admin@helpdesk.local / 123456 (Admin)               ║
║   📧 usuario@helpdesk.local / 123456 (Usuário)           ║
║   📧 tecnico@helpdesk.local / 123456 (Técnico)           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
