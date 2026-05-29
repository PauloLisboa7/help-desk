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
  const { email, password } = req.body;

  // Usuário padrão para testes
  if (email === 'admin@helpdesk.local' && password === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBoZWxwZGVzay5sb2NhbCIsInJvbGUiOiJhZG1pbmlzdHJhZG9yIn0.test',
      user: {
        id: 1,
        email: 'admin@helpdesk.local',
        nome: 'Administrador',
        role: 'administrador',
        departamento: 'TI',
      },
    });
  } else if (email === 'usuario@helpdesk.local' && password === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ1c3VhcmlvQGhlbHBkZXNrLmxvY2FsIiwicm9sZSI6InVzdWFyaW8ifQ.test',
      user: {
        id: 2,
        email: 'usuario@helpdesk.local',
        nome: 'Usuário Teste',
        role: 'usuario',
        departamento: 'Administrativo',
      },
    });
  } else if (email === 'tecnico@helpdesk.local' && password === '123456') {
    res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0ZWNuaWNvQGhlbHBkZXNrLmxvY2FsIiwicm9sZSI6InRlY25pY28ifQ.test',
      user: {
        id: 3,
        email: 'tecnico@helpdesk.local',
        nome: 'Técnico Teste',
        role: 'tecnico',
        departamento: 'TI',
      },
    });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
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
