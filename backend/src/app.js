import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dbModule from './config/database.js';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

// Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const connectedUsers = new Map(); // userId -> socketCount

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_mudar_em_producao');
    socket.user = decoded;
  } catch (err) {
    // ignore: connection without auth
  }
  next();
});

io.on('connection', async (socket) => {
  const user = socket.user;
  if (user && user.id) {
    const prev = connectedUsers.get(user.id) || 0;
    connectedUsers.set(user.id, prev + 1);

    // atualizar last_active no banco
    try {
      await dbModule.pool.query('UPDATE usuarios SET last_active = NOW() WHERE id = $1', [user.id]);
    } catch (err) {
      console.error('Erro ao atualizar last_active:', err.message);
    }
  }

  // emitir contagem de usuários online (únicos)
  io.emit('onlineCount', { count: connectedUsers.size });

  socket.on('disconnect', () => {
    if (user && user.id) {
      const prev = connectedUsers.get(user.id) || 0;
      if (prev <= 1) connectedUsers.delete(user.id);
      else connectedUsers.set(user.id, prev - 1);
      io.emit('onlineCount', { count: connectedUsers.size });
    }
  });
});

// Middleware de Segurança (desabilita CSP padrão para permitir CDNs usados pelo frontend)
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Logging simples
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas de Teste
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Help Desk API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Rota dashboard - serve dashboard.html
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pages/dashboard.html'));
});

// Rota tecnico - serve pagina do técnico
app.get('/tecnico', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pages/tecnico.html'));
});

// Importar rotas
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import categoriasRoutes from './routes/categoriasRoutes.js';

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/chamados', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categorias', categoriasRoutes);

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro desconhecido'
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🎫 Sistema Help Desk Corporativo v3.0               ║
║   Servidor rodando em http://localhost:${PORT}           ║
║   Ambiente: ${process.env.NODE_ENV}                      ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
