import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbModule from '../config/database.js';

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
      'SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = $1',
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
        perfil: usuario.perfil
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
