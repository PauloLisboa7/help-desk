import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbModule from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_mudar_em_producao';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const result = await pool.query(
      'SELECT id, nome, email, senha, perfil, patrimonio FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const usuario = result.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Retornar token e dados do usuário
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        patrimonio: usuario.patrimonio || null
      }
    });

  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, usuario: decoded });
  } catch (erro) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;

// GET /api/auth/me - retornar dados do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const result = await pool.query('SELECT id, nome, email, perfil, departamento, telefone, patrimonio FROM usuarios WHERE id = $1', [usuarioId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ usuario: result.rows[0] });
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
});

// PATCH /api/auth/me - atualizar dados do usuário autenticado (patrimônio)
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { patrimonio } = req.body;
    await pool.query('UPDATE usuarios SET patrimonio = $1, atualizado_em = NOW() WHERE id = $2', [patrimonio || null, usuarioId]);
    const updated = await pool.query('SELECT id, nome, email, perfil, departamento, telefone, patrimonio FROM usuarios WHERE id = $1', [usuarioId]);
    res.json({ usuario: updated.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});
