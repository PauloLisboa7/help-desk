import express from 'express';
import dbModule from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();

// GET /api/chamados - Listar chamados
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.numero_chamado, 
        c.titulo, 
        c.descricao, 
        c.status, 
        c.prioridade,
        c.categoria_id,
        cat.nome as categoria_nome,
        c.usuario_id,
        u.nome as usuario_nome,
        c.criado_em,
        c.data_resolucao
      FROM chamados c
      LEFT JOIN categorias cat ON c.categoria_id = cat.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.criado_em DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (erro) {
    console.error('Erro ao listar chamados:', erro);
    res.status(500).json({ error: 'Erro ao listar chamados' });
  }
});

// GET /api/chamados/:id - Detalhes do chamado
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.numero_chamado, 
        c.titulo, 
        c.descricao, 
        c.status, 
        c.prioridade,
        c.categoria_id,
        cat.nome as categoria_nome,
        c.usuario_id,
        u.nome as usuario_nome,
        c.criado_em,
        c.data_resolucao
      FROM chamados c
      LEFT JOIN categorias cat ON c.categoria_id = cat.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao buscar chamado:', erro);
    res.status(500).json({ error: 'Erro ao buscar chamado' });
  }
});

// POST /api/chamados - Criar chamado
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { titulo, descricao, categoria_id, prioridade } = req.body;

    if (!titulo || !categoria_id) {
      return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
    }

    const result = await pool.query(`
      INSERT INTO chamados (numero_chamado, titulo, descricao, categoria_id, prioridade, status, usuario_id, criado_em)
      VALUES (
        'CH-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
        $1,
        $2,
        $3,
        $4,
        'aberto',
        1,
        NOW()
      )
      RETURNING id, numero_chamado, titulo, status, prioridade, criado_em
    `, [titulo, descricao, categoria_id, prioridade || 'media']);

    res.status(201).json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao criar chamado:', erro);
    res.status(500).json({ error: 'Erro ao criar chamado' });
  }
});

// PATCH /api/chamados/:id - Atualizar chamado
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, prioridade, descricao } = req.body;

    let query = 'UPDATE chamados SET ';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += `status = $${paramCount}, `;
      params.push(status);
      paramCount++;
    }

    if (prioridade) {
      query += `prioridade = $${paramCount}, `;
      params.push(prioridade);
      paramCount++;
    }

    if (descricao) {
      query += `descricao = $${paramCount}, `;
      params.push(descricao);
      paramCount++;
    }

    query += `atualizado_em = NOW() WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao atualizar chamado:', erro);
    res.status(500).json({ error: 'Erro ao atualizar chamado' });
  }
});

// PATCH /api/chamados/:id/assign - Atribuir técnico ao chamado
router.patch('/:id/assign', authenticateToken, requireRole('administrador','tecnico'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tecnico_id } = req.body;

    if (!tecnico_id) {
      return res.status(400).json({ error: 'tecnico_id é obrigatório' });
    }

    const result = await pool.query(`UPDATE chamados SET tecnico_id = $1, status = 'em_atendimento', atualizado_em = NOW() WHERE id = $2 RETURNING *`, [tecnico_id, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Chamado não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atribuir técnico:', err);
    res.status(500).json({ error: 'Erro ao atribuir técnico' });
  }
});

export default router;
