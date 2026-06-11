import express from 'express';
import dbModule from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();

// GET /api/patrimonio-categorias - Listar categorias de patrimônio
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, descricao, ativo, criado_em FROM patrimonio_categorias ORDER BY nome');
    res.json(result.rows || []);
  } catch (err) {
    console.error('Erro ao listar categorias de patrimônio:', err);
    res.status(500).json({ error: 'Erro ao listar categorias de patrimônio' });
  }
});

// POST /api/patrimonio-categorias - Criar nova categoria de patrimônio
router.post('/', authenticateToken, requireRole('administrador', 'tecnico', 'n1', 'n2', 'n3'), async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const result = await pool.query(
      `INSERT INTO patrimonio_categorias (nome, descricao, ativo)
       VALUES ($1, $2, true)
       ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao
       RETURNING id, nome, descricao, ativo, criado_em`,
      [nome.trim(), descricao || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria de patrimônio:', err);
    res.status(500).json({ error: 'Erro ao criar categoria de patrimônio' });
  }
});

export default router;
