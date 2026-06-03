import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbModule from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename(req, file, cb) {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

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
        c.patrimonio_maquina,
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
        c.patrimonio_maquina,
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

    const attachments = await pool.query(`
      SELECT id, nome_arquivo, caminho_arquivo, tipo_mime, tamanho, enviado_por, criado_em
      FROM anexos
      WHERE chamado_id = $1
      ORDER BY criado_em ASC
    `, [id]);

    const chamado = result.rows[0];
    chamado.attachments = attachments.rows || [];
    res.json(chamado);
  } catch (erro) {
    console.error('Erro ao buscar chamado:', erro);
    res.status(500).json({ error: 'Erro ao buscar chamado' });
  }
});

// POST /api/chamados - Criar chamado
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('anexo')(req, res, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message || 'Erro no upload de arquivo' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { titulo, descricao, categoria_id, prioridade, patrimonio_maquina } = req.body;

    if (!titulo || !categoria_id) {
      return res.status(400).json({ error: 'Título e categoria são obrigatórios' });
    }

    let categoriaId = categoria_id;
    let categoriaNivel = 'n2';

    if (isNaN(Number(categoria_id))) {
      const categoriaResult = await pool.query('SELECT id, nivel_suporte FROM categorias WHERE nome = $1', [categoria_id]);
      if (categoriaResult.rows.length === 0) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
      categoriaId = categoriaResult.rows[0].id;
      categoriaNivel = categoriaResult.rows[0].nivel_suporte || 'n2';
    } else {
      const categoriaResult = await pool.query('SELECT nivel_suporte FROM categorias WHERE id = $1', [categoriaId]);
      if (categoriaResult.rows.length === 0) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
      categoriaNivel = categoriaResult.rows[0].nivel_suporte || 'n2';
    }

    const usuarioId = req.user.id;
    const nivelParaPrioridade = {
      n1: 'baixa',
      n2: 'media',
      n3: 'alta'
    };
    const priorityValue = nivelParaPrioridade[categoriaNivel] || 'media';

    const result = await pool.query(`
      INSERT INTO chamados (numero_chamado, titulo, descricao, categoria_id, prioridade, status, usuario_id, patrimonio_maquina, criado_em)
      VALUES (
        'CH-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
        $1,
        $2,
        $3,
        $4,
        'aberto',
        $5,
        $6,
        NOW()
      )
      RETURNING id, numero_chamado, titulo, status, prioridade, patrimonio_maquina, criado_em
    `, [titulo, descricao, categoriaId, priorityValue, usuarioId, patrimonio_maquina || null]);

    const ticket = result.rows[0];

    if (req.file) {
      const uploadUrl = `/uploads/${req.file.filename}`;
      const attachmentResult = await pool.query(`
        INSERT INTO anexos (chamado_id, nome_arquivo, caminho_arquivo, tipo_mime, tamanho, enviado_por)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nome_arquivo, caminho_arquivo, tipo_mime, tamanho, enviado_por, criado_em
      `, [ticket.id, req.file.originalname, uploadUrl, req.file.mimetype, req.file.size, usuarioId]);
      ticket.attachments = [attachmentResult.rows[0]];
    }

    res.status(201).json(ticket);
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

    // Se o usuário for técnico (inclui n1/n2/n3), garantir que tecnico_id seja definido
    const perfil = req.user.perfil;
    let assignTecnico = false;
    const isTecnicoProfile = ['tecnico','n1','n2','n3'].includes(perfil);
    if (isTecnicoProfile) {
      // verificar se o chamado já tem tecnico
      const chk = await pool.query('SELECT tecnico_id FROM chamados WHERE id = $1', [id]);
      if (chk.rows.length > 0) {
        // atribui se não tiver tecnico ou se ação for marcar como resolvido (garante visibilidade do técnico que aplicou)
        if (!chk.rows[0].tecnico_id || status === 'resolvido') {
          assignTecnico = true;
        }
      }
    }

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

    if (assignTecnico) {
      query += `tecnico_id = $${paramCount}, `;
      params.push(req.user.id);
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
