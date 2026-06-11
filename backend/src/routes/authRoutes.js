import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dbModule from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_mudar_em_producao';

const smtpConfigured = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: smtpConfigured ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

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
      'SELECT id, nome, email, senha, perfil, patrimonio FROM usuarios WHERE email = $1 OR nome = $1',
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

// POST /api/auth/forgot-password - Solicitar reset de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await pool.query('SELECT id, nome, email FROM usuarios WHERE email = $1 OR nome = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'Se a conta existir, você receberá instruções para redefinir sua senha.' });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query('UPDATE usuarios SET reset_token = $1, reset_token_expires = $2, atualizado_em = NOW() WHERE id = $3', [token, expires, usuario.id]);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?email=${encodeURIComponent(usuario.email)}&token=${token}`;
    const message = `Acesse o link para redefinir sua senha: ${resetUrl}`;

    if (smtpConfigured) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@helpdesk.local',
          to: usuario.email,
          subject: 'Redefinição de senha Help Desk',
          text: message,
          html: `<p>Olá ${usuario.nome},</p><p>Para redefinir sua senha, acesse:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Esse link expira em 1 hora.</p>`
        });
      } catch (emailErr) {
        console.error('Erro ao enviar email de reset:', emailErr);
      }
    } else {
      console.log('🔐 Token de redefinição de senha (desenvolvimento):', token);
      console.log('🔗 Link de redefinição:', resetUrl);
    }

    const responsePayload = {
      message: 'Se a conta existir, você receberá instruções para redefinir sua senha.'
    };
    if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
      responsePayload.debugToken = token;
      responsePayload.debugLink = resetUrl;
    }

    res.json(responsePayload);
  } catch (erro) {
    console.error('Erro no forgot-password:', erro);
    res.status(500).json({ error: 'Erro ao processar solicitação de reset de senha' });
  }
});

// POST /api/auth/reset-password - Atualizar senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, senha } = req.body;
    if (!email || !token || !senha) {
      return res.status(400).json({ error: 'Email, token e nova senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT id, reset_token, reset_token_expires FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email ou token inválidos' });
    }

    const usuario = result.rows[0];
    if (!usuario.reset_token || usuario.reset_token !== token || !usuario.reset_token_expires || new Date(usuario.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    await pool.query(
      'UPDATE usuarios SET senha = $1, reset_token = NULL, reset_token_expires = NULL, atualizado_em = NOW() WHERE id = $2',
      [hashedPassword, usuario.id]
    );

    res.json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (erro) {
    console.error('Erro no reset-password:', erro);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

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

export default router;
