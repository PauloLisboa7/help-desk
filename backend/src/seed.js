import dbModule from './config/database.js';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';

const { pool, initializeDatabase } = dbModule;

export async function seedDatabase() {
  try {
    // Inicializar o banco (criar tabelas)
    await initializeDatabase();

    console.log('📥 Inserindo dados iniciais...');

    // Gerar hash de senha para "123456"
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Inserir usuários
    console.log('👤 Inserindo usuários...');
    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, perfil, departamento, telefone, ativo)
      VALUES 
        ($1, $2, $3, $4, $5, $6, true),
        ($7, $8, $9, $10, $11, $12, true),
        ($13, $14, $15, $16, $17, $18, true),
        ($19, $20, $21, $22, $23, $24, true),
        ($25, $26, $27, $28, $29, $30, true),
        ($31, $32, $33, $34, $35, $36, true)
      ON CONFLICT (email) DO NOTHING
    `, [
      'Administrador', 'admin@helpdesk.local', hashedPassword, 'administrador', 'TI', '1111-1111',
      'Usuário Comum', 'usuario@helpdesk.local', hashedPassword, 'usuario', 'Recursos Humanos', '2222-2222',
      'Técnico Suporte', 'tecnico@helpdesk.local', hashedPassword, 'tecnico', 'TI', '3333-3333',
      'Suporte N1', 'n1@helpdesk.local', hashedPassword, 'n1', 'Suporte', '4444-4444',
      'Suporte N2', 'n2@helpdesk.local', hashedPassword, 'n2', 'Suporte', '5555-5555',
      'Suporte N3', 'n3@helpdesk.local', hashedPassword, 'n3', 'Suporte', '6666-6666'
    ]);
    console.log('✅ Usuários inseridos');

    // Inserir categorias
    console.log('📂 Inserindo categorias...');
    await pool.query(`
      INSERT INTO categorias (nome, descricao, nivel_suporte, ativo)
      VALUES 
        ($1, $2, $3, true),
        ($4, $5, $6, true),
        ($7, $8, $9, true),
        ($10, $11, $12, true),
        ($13, $14, $15, true),
        ($16, $17, $18, true),
        ($19, $20, $21, true),
        ($22, $23, $24, true),
        ($25, $26, $27, true),
        ($28, $29, $30, true),
        ($31, $32, $33, true),
        ($34, $35, $36, true)
      ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao, nivel_suporte = EXCLUDED.nivel_suporte
    `, [
      'Computador', 'Problemas com computadores e desktops', 'n1',
      'Rede', 'Problemas de conectividade e rede', 'n2',
      'Impressora', 'Problemas com impressoras', 'n1',
      'Sistema', 'Problemas com sistemas e softwares corporativos', 'n2',
      'Infraestrutura', 'Problemas de infraestrutura e servidores', 'n3',
      'Acesso', 'Problemas de acesso e permissões', 'n2',
      'Email', 'Problemas com email corporativo', 'n2',
      'Senha', 'Reset de senha e acesso de usuário', 'n1',
      'Banco de Dados', 'Problemas com banco de dados e integridade de dados', 'n3',
      'Sistema Operacional', 'Configuração e suporte básico de SO', 'n1',
      'VPN', 'Problemas de acesso remoto e VPN', 'n3',
      'Outro', 'Outras demandas', 'n2'
    ]);
    console.log('✅ Categorias inseridas');

    // Recuperar IDs de usuários e categorias para dados relacionados
    const adminUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['admin@helpdesk.local']);
    const regularUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['usuario@helpdesk.local']);
    const tecnicoUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', ['tecnico@helpdesk.local']);

    const computadorCat = await pool.query('SELECT id FROM categorias WHERE nome = $1', ['Computador']);
    const redeCat = await pool.query('SELECT id FROM categorias WHERE nome = $1', ['Rede']);
    const impressoraCat = await pool.query('SELECT id FROM categorias WHERE nome = $1', ['Impressora']);
    const sistemaCat = await pool.query('SELECT id FROM categorias WHERE nome = $1', ['Sistema']);

    const adminId = adminUser.rows[0]?.id;
    const usuarioId = regularUser.rows[0]?.id;
    const tecnicoId = tecnicoUser.rows[0]?.id;
    const computadorId = computadorCat.rows[0]?.id;
    const redeId = redeCat.rows[0]?.id;
    const impressoraId = impressoraCat.rows[0]?.id;
    const sistemaId = sistemaCat.rows[0]?.id;

    if (adminId && usuarioId && tecnicoId) {
      console.log('📦 Inserindo equipamentos de inventário...');
      await pool.query(`
        INSERT INTO equipamentos (tipo, modelo, serie, patrimonio, localizacao, responsavel_id, cadastrado_por_id, status, data_aquisicao, valor)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
          ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
          ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30),
          ($31, $32, $33, $34, $35, $36, $37, $38, $39, $40),
          ($41, $42, $43, $44, $45, $46, $47, $48, $49, $50),
          ($51, $52, $53, $54, $55, $56, $57, $58, $59, $60),
          ($61, $62, $63, $64, $65, $66, $67, $68, $69, $70),
          ($71, $72, $73, $74, $75, $76, $77, $78, $79, $80)
        ON CONFLICT (serie) DO UPDATE SET
          patrimonio = EXCLUDED.patrimonio,
          localizacao = EXCLUDED.localizacao,
          responsavel_id = EXCLUDED.responsavel_id,
          cadastrado_por_id = EXCLUDED.cadastrado_por_id,
          status = EXCLUDED.status,
          data_aquisicao = EXCLUDED.data_aquisicao,
          valor = EXCLUDED.valor,
          atualizado_em = NOW()
      `, [
        'Notebook', 'Dell Latitude 7420', 'DL7420-001', 'PAT-7420-001', 'Departamento RH', usuarioId, adminId, 'ativo', '2023-02-10', '7500.00',
        'Desktop', 'HP ProDesk 600', 'HP600-002', 'PAT-600-002', 'Sala de Suporte', tecnicoId, tecnicoId, 'ativo', '2022-11-05', '4500.00',
        'Impressora', 'Brother HL-L2350DW', 'BR2350-003', 'PAT-2350-003', 'Recepção', adminId, adminId, 'manutencao', '2021-06-23', '1200.00',
        'Switch', 'Cisco SG250-26', 'CS250-004', 'PAT-250-004', 'Data Center', tecnicoId, tecnicoId, 'ativo', '2020-09-13', '18000.00',
        'Monitor', 'LG UltraWide 34WN80C', 'LG34-005', 'PAT-34-005', 'Sala de Reuniões', usuarioId, usuarioId, 'ativo', '2022-01-17', '3200.00',
        'Teclado', 'Logitech MX Keys', 'LGK-006', 'PAT-006', 'Área Financeira', adminId, adminId, 'ativo', '2021-08-10', '900.00',
        'Servidor', 'Dell PowerEdge R740', 'DL740-007', 'PAT-740-007', 'Data Center', tecnicoId, tecnicoId, 'manutencao', '2019-11-12', '45000.00',
        'Roteador', 'MikroTik CRS305-1G-4S+', 'MT305-008', 'PAT-305-008', 'Sala de Rede', tecnicoId, tecnicoId, 'ativo', '2020-07-22', '1500.00'
      ]);
      console.log('✅ Equipamentos inseridos');

      console.log('🎫 Inserindo chamados de exemplo...');
      await pool.query(`
        INSERT INTO chamados (numero_chamado, titulo, descricao, usuario_id, tecnico_id, categoria_id, prioridade, status, criado_em, atualizado_em)
        VALUES
          ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9),
          ($10, $11, $12, $13, NULL, $14, $15, $16, $17, $18),
          ($19, $20, $21, $22, $23, $24, $25, $26, $27, $28),
          ($29, $30, $31, $32, $33, $34, $35, $36, $37, $38),
          ($39, $40, $41, $42, NULL, $43, $44, $45, $46, $47)
        ON CONFLICT (numero_chamado) DO NOTHING
      `, [
        'HD-1001', 'Computador não liga', 'O computador do RH não está iniciando.', usuarioId, computadorId, 'alta', 'aberto', '2025-05-20 09:10:00', '2025-05-20 09:10:00',
        'HD-1002', 'Impressora sem papel', 'A impressora da recepção fica sem papel frequentemente.', usuarioId, impressoraId, 'media', 'aberto', '2025-05-19 14:22:00', '2025-05-19 14:22:00',
        'HD-1003', 'Rede intermitente', 'A conexão Wi-Fi cai a cada 10 minutos.', usuarioId, tecnicoId, redeId, 'alta', 'em_atendimento', '2025-05-18 11:05:00', '2025-05-18 11:05:00',
        'HD-1004', 'Erro ao abrir sistema financeiro', 'O sistema retorna erro de login.', usuarioId, tecnicoId, sistemaId, 'alta', 'resolvido', '2025-05-17 08:40:00', '2025-05-19 16:10:00',
        'HD-1005', 'Solicitação de novo mouse', 'Solicitação de mouse ergonômico para o colaborador.', adminId, computadorId, 'baixa', 'aberto', '2025-05-20 10:15:00', '2025-05-20 10:15:00'
      ]);
      console.log('✅ Chamados inseridos');
    }

    // Verificar dados inseridos
    const users = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    const cats = await pool.query('SELECT COUNT(*) as total FROM categorias');
    
    console.log(`\n✅ Banco de dados carregado com sucesso!`);
    console.log(`   📊 Usuários: ${users.rows[0].total}`);
    console.log(`   📂 Categorias: ${cats.rows[0].total}`);
    console.log(`\n🔐 Credenciais de teste:`);
    console.log(`   👨‍💼 Admin: admin@helpdesk.local / 123456`);
    console.log(`   👤 Usuário: usuario@helpdesk.local / 123456`);
    console.log(`   👨‍🔧 Técnico: tecnico@helpdesk.local / 123456`);
    console.log(`   👨‍💻 Suporte N1: n1@helpdesk.local / 123456`);
    console.log(`   👩‍💻 Suporte N2: n2@helpdesk.local / 123456`);
    console.log(`   🧑‍💻 Suporte N3: n3@helpdesk.local / 123456`);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error.message);
    throw error;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  seedDatabase().catch(() => process.exit(1));
}
