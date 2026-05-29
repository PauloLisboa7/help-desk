import dbModule from './config/database.js';
import bcrypt from 'bcryptjs';

const { pool, initializeDatabase } = dbModule;

async function seedDatabase() {
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
        ($13, $14, $15, $16, $17, $18, true)
      ON CONFLICT (email) DO NOTHING
    `, [
      'Administrador', 'admin@helpdesk.local', hashedPassword, 'administrador', 'TI', '1111-1111',
      'Usuário Comum', 'usuario@helpdesk.local', hashedPassword, 'usuario', 'Recursos Humanos', '2222-2222',
      'Técnico Suporte', 'tecnico@helpdesk.local', hashedPassword, 'tecnico', 'TI', '3333-3333'
    ]);
    console.log('✅ Usuários inseridos');

    // Inserir categorias
    console.log('📂 Inserindo categorias...');
    await pool.query(`
      INSERT INTO categorias (nome, descricao, ativo)
      VALUES 
        ($1, $2, true),
        ($3, $4, true),
        ($5, $6, true),
        ($7, $8, true),
        ($9, $10, true),
        ($11, $12, true),
        ($13, $14, true),
        ($15, $16, true)
      ON CONFLICT (nome) DO NOTHING
    `, [
      'Computador', 'Problemas com computadores e desktops',
      'Rede', 'Problemas de conectividade e rede',
      'Impressora', 'Problemas com impressoras',
      'Sistema', 'Problemas com sistemas e softwares corporativos',
      'Infraestrutura', 'Problemas de infraestrutura e servidores',
      'Acesso', 'Problemas de acesso e permissões',
      'Email', 'Problemas com email corporativo',
      'Outro', 'Outras demandas'
    ]);
    console.log('✅ Categorias inseridas');

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

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
