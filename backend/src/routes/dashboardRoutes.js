import express from 'express';
import dbModule from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const pool = dbModule.pool;
const router = express.Router();

// GET /api/dashboard/stats - Estatísticas gerais do dashboard (não sensíveis)
router.get('/stats', async (req, res) => {
  try {
    // Chamados abertos
    const abertos = await pool.query(
      "SELECT COUNT(*) as total FROM chamados WHERE status = 'aberto'"
    );

    // Chamados em atendimento
    const emAtendimento = await pool.query(
      "SELECT COUNT(*) as total FROM chamados WHERE status = 'em_atendimento'"
    );

    // Chamados resolvidos
    const resolvidos = await pool.query(
      "SELECT COUNT(*) as total FROM chamados WHERE status = 'resolvido'"
    );

    // Chamados fechados
    const fechados = await pool.query(
      "SELECT COUNT(*) as total FROM chamados WHERE status = 'fechado'"
    );

    res.json({
      chamadosAbertos: parseInt(abertos.rows[0]?.total || 0),
      chamadosEmAtendimento: parseInt(emAtendimento.rows[0]?.total || 0),
      chamadosResolvidos: parseInt(resolvidos.rows[0]?.total || 0),
      chamadosFechados: parseInt(fechados.rows[0]?.total || 0),
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
    const meusChamados = await pool.query('SELECT id, numero_chamado, titulo, status, prioridade, criado_em FROM chamados WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50', [usuarioId]);

    res.json({ meusChamados: meusChamados.rows || [] });
  } catch (err) {
    console.error('Erro ao obter dados do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter dados do usuário' });
  }
});

export default router;
