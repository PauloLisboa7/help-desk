import express from 'express';
import dbModule from '../config/database.js';

const pool = dbModule.pool;
const router = express.Router();

// GET /api/categorias - Listar categorias
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, descricao, nivel_suporte FROM categorias ORDER BY nome');
    res.json(result.rows);
  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

export default router;
