import express from 'express';
import dbModule from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();

// GET /api/dashboard/stats - Estatísticas gerais do dashboard (por perfil)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const perfil = req.user.perfil;
    let countsQuery;
    let params = [];

    if (perfil === 'administrador') {
      countsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'aberto') as abertos,
          COUNT(*) FILTER (WHERE status = 'em_atendimento') as em_atendimento,
          COUNT(*) FILTER (WHERE status = 'resolvido') as resolvidos,
          COUNT(*) FILTER (WHERE status = 'fechado') as fechados
        FROM chamados`;
    } else if (perfil === 'tecnico') {
      countsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'aberto') as abertos,
          COUNT(*) FILTER (WHERE status = 'em_atendimento') as em_atendimento,
          COUNT(*) FILTER (WHERE status = 'resolvido') as resolvidos,
          COUNT(*) FILTER (WHERE status = 'fechado') as fechados
        FROM chamados
        WHERE tecnico_id = $1`;
      params = [req.user.id];
    } else if (['n1', 'n2', 'n3'].includes(perfil)) {
      const allowedPriorities = perfil === 'n1' ? ['baixa'] : perfil === 'n2' ? ['media'] : ['alta', 'critica'];
      countsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'aberto') as abertos,
          COUNT(*) FILTER (WHERE status = 'em_atendimento') as em_atendimento,
          COUNT(*) FILTER (WHERE status = 'resolvido') as resolvidos,
          COUNT(*) FILTER (WHERE status = 'fechado') as fechados
        FROM chamados
        WHERE prioridade = ANY($1)`;
      params = [allowedPriorities];
    } else {
      countsQuery = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'aberto') as abertos,
          COUNT(*) FILTER (WHERE status = 'em_atendimento') as em_atendimento,
          COUNT(*) FILTER (WHERE status = 'resolvido') as resolvidos,
          COUNT(*) FILTER (WHERE status = 'fechado') as fechados
        FROM chamados
        WHERE usuario_id = $1`;
      params = [req.user.id];
    }

    const counts = await pool.query(countsQuery, params);
    const row = counts.rows[0] || {};

    res.json({
      chamadosAbertos: parseInt(row.abertos || 0),
      chamadosEmAtendimento: parseInt(row.em_atendimento || 0),
      chamadosResolvidos: parseInt(row.resolvidos || 0),
      chamadosFechados: parseInt(row.fechados || 0),
      tempoMedioResolucao: 0
    });
  } catch (erro) {
    console.error('Erro ao obter stats:', erro);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// GET /api/dashboard/admin - Dados de administrador (protegido)
router.get('/admin', authenticateToken, requireRole('administrador'), async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const onlineUsers = await pool.query("SELECT COUNT(*) as total FROM usuarios WHERE ativo = true");
    const totalChamados = await pool.query('SELECT COUNT(*) as total FROM chamados');

    const recentChamados = await pool.query(
      `SELECT c.id, c.numero_chamado, c.titulo, c.status, c.criado_em, u.nome as usuario_nome
       FROM chamados c
       JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.criado_em DESC
       LIMIT 10`
    );

    res.json({
      totalUsers: parseInt(totalUsers.rows[0]?.total || 0),
      onlineUsers: parseInt(onlineUsers.rows[0]?.total || 0),
      totalChamados: parseInt(totalChamados.rows[0]?.total || 0),
      recentChamados: recentChamados.rows || []
    });
  } catch (err) {
    console.error('Erro ao obter dados admin:', err);
    res.status(500).json({ error: 'Erro ao obter dados do administrador' });
  }
});

// GET /api/dashboard/tecnico - Dados do técnico (protegido)
router.get('/tecnico', authenticateToken, requireRole('tecnico'), async (req, res) => {
  try {
    const tecnicoId = req.user.id;

    const assigned = await pool.query('SELECT * FROM chamados WHERE tecnico_id = $1 ORDER BY criado_em DESC LIMIT 50', [tecnicoId]);
    const counts = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'aberto') as abertos,
         COUNT(*) FILTER (WHERE status = 'em_atendimento') as em_atendimento,
         COUNT(*) FILTER (WHERE status = 'resolvido') as resolvidos
       FROM chamados WHERE tecnico_id = $1`,
      [tecnicoId]
    );

    res.json({ assigned: assigned.rows || [], stats: counts.rows[0] || {} });
  } catch (err) {
    console.error('Erro ao obter dados tecnico:', err);
    res.status(500).json({ error: 'Erro ao obter dados do técnico' });
  }
});

// GET /api/dashboard/usuario - Dados do usuário autenticado (protegido)
router.get('/usuario', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const perfil = req.user.perfil;
    let query;
    let params;

    if (perfil === 'tecnico' || ['n1', 'n2', 'n3'].includes(perfil)) {
      query = 'SELECT id, numero_chamado, titulo, status, prioridade, patrimonio_maquina, criado_em FROM chamados WHERE tecnico_id = $1 ORDER BY criado_em DESC LIMIT 50';
      params = [usuarioId];
    } else {
      query = 'SELECT id, numero_chamado, titulo, status, prioridade, patrimonio_maquina, criado_em FROM chamados WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50';
      params = [usuarioId];
    }

    const meusChamados = await pool.query(query, params);
    res.json({ meusChamados: meusChamados.rows || [] });
  } catch (err) {
    console.error('Erro ao obter dados do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
});

// GET /api/dashboard/chamados-abertos - Lista de chamados abertos
router.get('/chamados-abertos', authenticateToken, async (req, res) => {
  try {
    const perfil = req.user.perfil;
    const userId = req.user.id;
    let query;
    let params = [];

    if (perfil === 'administrador') {
      query = 'SELECT id, numero_chamado, titulo, prioridade, status, criado_em FROM chamados WHERE status = $1 ORDER BY criado_em DESC LIMIT 100';
      params = ['aberto'];
    } else if (perfil === 'tecnico') {
      query = `SELECT id, numero_chamado, titulo, prioridade, status, criado_em
               FROM chamados
               WHERE status = $1 AND (tecnico_id = $2 OR tecnico_id IS NULL)
               ORDER BY criado_em DESC
               LIMIT 100`;
      params = ['aberto', userId];
    } else if (['n1', 'n2', 'n3'].includes(perfil)) {
      query = `SELECT id, numero_chamado, titulo, prioridade, status, patrimonio_maquina, criado_em
               FROM chamados
               WHERE status = $1 AND prioridade = ANY($2)
               ORDER BY criado_em DESC
               LIMIT 100`;
      const allowedPriorities = perfil === 'n1' ? ['baixa'] : perfil === 'n2' ? ['media'] : ['alta', 'critica'];
      params = ['aberto', allowedPriorities];
    } else {
      query = 'SELECT id, numero_chamado, titulo, prioridade, status, criado_em FROM chamados WHERE status = $1 AND usuario_id = $2 ORDER BY criado_em DESC LIMIT 100';
      params = ['aberto', userId];
    }

    const chamadosAbertos = await pool.query(query, params);
    res.json({ chamadosAbertos: chamadosAbertos.rows || [] });
  } catch (err) {
    console.error('Erro ao obter chamados abertos:', err);
    res.status(500).json({ error: 'Erro ao obter chamados abertos' });
  }
});

router.get('/nivel', authenticateToken, async (req, res) => {
  try {
    const perfil = req.user.perfil;
    if (!['n1', 'n2', 'n3'].includes(perfil)) {
      return res.status(403).json({ error: 'Acesso restrito a suporte N1/N2/N3' });
    }

    const allowedPriorities = perfil === 'n1' ? ['baixa'] : perfil === 'n2' ? ['media'] : ['alta', 'critica'];
    const result = await pool.query(
      `SELECT c.id, c.numero_chamado, c.titulo, c.prioridade, c.status, c.criado_em, c.patrimonio_maquina,
              EXISTS (SELECT 1 FROM anexos a WHERE a.chamado_id = c.id) AS has_attachment
       FROM chamados c
       WHERE c.prioridade = ANY($1)
         AND c.status NOT IN ('resolvido', 'fechado')
         AND (c.tecnico_id IS NULL OR c.tecnico_id = $2)
       ORDER BY c.criado_em DESC
       LIMIT 100`,
      [allowedPriorities, req.user.id]
    );

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'aberto') AS abertos,
        COUNT(*) FILTER (WHERE status = 'em_atendimento') AS em_atendimento,
        COUNT(*) FILTER (WHERE status = 'resolvido') AS resolvidos,
        COUNT(*) FILTER (WHERE status = 'fechado') AS fechados
       FROM chamados
       WHERE prioridade = ANY($1)`,
      [allowedPriorities]
    );

    res.json({ chamadosAbertos: result.rows || [], stats: statsResult.rows[0] || {} });
  } catch (err) {
    console.error('Erro ao obter chamados de nível:', err);
    res.status(500).json({ error: 'Erro ao obter chamados de nível' });
  }
});

router.get('/termo-transferencia', authenticateToken, async (req, res) => {
  try {
    const perfil = req.user.perfil;
    if (!['n1', 'n2', 'n3'].includes(perfil)) {
      return res.status(403).json({ error: 'Acesso restrito a suporte N1/N2/N3' });
    }

    const allowedPriorities = perfil === 'n1' ? ['baixa'] : perfil === 'n2' ? ['media'] : ['alta', 'critica'];
    const result = await pool.query(
      `SELECT c.id, c.numero_chamado, c.titulo, c.prioridade, c.status, c.criado_em, c.patrimonio_maquina,
              cat.nome as categoria
       FROM chamados c
       LEFT JOIN categorias cat ON c.categoria_id = cat.id
       WHERE c.prioridade = ANY($1)
         AND (c.tecnico_id IS NULL OR c.tecnico_id = $2)
       ORDER BY c.criado_em DESC
       LIMIT 200`,
      [allowedPriorities, req.user.id]
    );

    res.json({ chamados: result.rows || [] });
  } catch (err) {
    console.error('Erro ao obter chamados para termo de transferência:', err);
    res.status(500).json({ error: 'Erro ao obter chamados para termo de transferência' });
  }
});

// GET /api/dashboard/inventario - Inventário de equipamentos
router.get('/inventario', authenticateToken, async (req, res) => {
  try {
    const perfil = req.user.perfil;
    const userId = req.user.id;
    let query;
    let params = [];

    query = `SELECT e.id, e.tipo, e.modelo, e.serie, COALESCE(e.patrimonio, e.serie) as patrimonio, e.localizacao, e.status, e.data_aquisicao, e.valor,
                      COALESCE(u.nome, 'Sem responsável') as responsavel,
                      COALESCE(cp.nome, 'Sem cadastro') AS cadastrado_por
               FROM equipamentos e
               LEFT JOIN usuarios u ON e.responsavel_id = u.id
               LEFT JOIN usuarios cp ON e.cadastrado_por_id = cp.id
               ORDER BY e.tipo, e.modelo`; 

    const inventario = await pool.query(query, params);
    res.json({ inventario: inventario.rows || [] });
  } catch (err) {
    console.error('Erro ao obter inventário:', err);
    res.status(500).json({ error: 'Erro ao obter inventário' });
  }
});

// GET /api/dashboard/usuarios - Lista de usuários (administrador)
router.get('/usuarios', authenticateToken, requireRole('administrador'), async (req, res) => {
  try {
    const usuarios = await pool.query(
      'SELECT id, nome, email, perfil, departamento, telefone, ativo, criado_em FROM usuarios ORDER BY nome'
    );

    res.json({ usuarios: usuarios.rows || [] });
  } catch (err) {
    console.error('Erro ao obter usuários:', err);
    res.status(500).json({ error: 'Erro ao obter usuários' });
  }
});

// GET /api/dashboard/relatorios - Relatórios administrativos
router.get('/relatorios', authenticateToken, requireRole('administrador'), async (req, res) => {
  try {
    const totalChamados = await pool.query('SELECT COUNT(*) as total FROM chamados');
    const totalUsuarios = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const totalEquipamentos = await pool.query('SELECT COUNT(*) as total FROM equipamentos');

    const statusSummary = await pool.query(
      'SELECT status, COUNT(*) as total FROM chamados GROUP BY status ORDER BY total DESC'
    );

    const categoriaSummary = await pool.query(
      `SELECT cat.nome as categoria, COUNT(*) as total
       FROM chamados c
       JOIN categorias cat ON c.categoria_id = cat.id
       GROUP BY cat.nome
       ORDER BY total DESC`
    );

    const tecnicoSummary = await pool.query(
      `SELECT u.nome as tecnico, COUNT(*) as total
       FROM chamados c
       JOIN usuarios u ON c.tecnico_id = u.id
       WHERE c.tecnico_id IS NOT NULL
       GROUP BY u.nome
       ORDER BY total DESC
       LIMIT 10`
    );

    res.json({
      totalChamados: parseInt(totalChamados.rows[0]?.total || 0),
      totalUsuarios: parseInt(totalUsuarios.rows[0]?.total || 0),
      totalEquipamentos: parseInt(totalEquipamentos.rows[0]?.total || 0),
      statusSummary: statusSummary.rows || [],
      categoriaSummary: categoriaSummary.rows || [],
      tecnicoSummary: tecnicoSummary.rows || []
    });
  } catch (err) {
    console.error('Erro ao obter relatórios:', err);
    res.status(500).json({ error: 'Erro ao obter relatórios' });
  }
});

export default router;
