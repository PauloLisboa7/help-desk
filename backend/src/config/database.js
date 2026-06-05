import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'helpdesk',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'helpdesk_db'
};

export const pool = new Pool(dbConfig);

// Treat pool errors as fatal
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão:', err);
  process.exit(-1);
});

export async function initializeDatabase() {
  try {
    // Test connection
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    
    // Executar migrations
    await executeMigrations();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    process.exit(1);
  }
}

async function executeMigrations() {
  const migrations = [
    // Tabela de Usuários
    `CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      perfil VARCHAR(50) DEFAULT 'comum',
      departamento VARCHAR(100),
      telefone VARCHAR(20),
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para usuários
    `CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);`,
    `CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);`,

    // Tabela de Categorias de Chamados
    `CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT,
      nivel_suporte VARCHAR(10) DEFAULT 'n2',
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para categorias
    `CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias(nome);`,
    // Adicionar apoio ao nível de suporte nas categorias para roteamento automático
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS nivel_suporte VARCHAR(10) DEFAULT 'n2';`,
    // Adicionar coluna de patrimônio ao usuário para armazenamento do número de patrimônio
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS patrimonio VARCHAR(100);`,

    // Tabela de Chamados
    `CREATE TABLE IF NOT EXISTS chamados (
      id SERIAL PRIMARY KEY,
      numero_chamado VARCHAR(20) UNIQUE NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT NOT NULL,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      tecnico_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
      categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
      prioridade VARCHAR(20) DEFAULT 'media',
      status VARCHAR(50) DEFAULT 'aberto',
      sla_horas INT,
      data_vencimento TIMESTAMP,
      data_resolucao TIMESTAMP,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para chamados
    `CREATE INDEX IF NOT EXISTS idx_chamados_numero ON chamados(numero_chamado);`,
    `CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);`,
    `CREATE INDEX IF NOT EXISTS idx_chamados_prioridade ON chamados(prioridade);`,
    `CREATE INDEX IF NOT EXISTS idx_chamados_usuario ON chamados(usuario_id);`,
    `CREATE INDEX IF NOT EXISTS idx_chamados_tecnico ON chamados(tecnico_id);`,
    `CREATE INDEX IF NOT EXISTS idx_chamados_vencimento ON chamados(data_vencimento);`,

    // Adicionar coluna ao chamado para armazenar número de patrimônio da máquina que gerou o chamado
    `ALTER TABLE chamados ADD COLUMN IF NOT EXISTS patrimonio_maquina VARCHAR(100);`,

    // Tabela de Atualizações de Chamados
    `CREATE TABLE IF NOT EXISTS atualizacoes_chamados (
      id SERIAL PRIMARY KEY,
      chamado_id INT NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      tipo VARCHAR(50) DEFAULT 'comentario',
      descricao TEXT,
      dados_anteriores JSONB,
      dados_novos JSONB,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para atualizacoes_chamados
    `CREATE INDEX IF NOT EXISTS idx_atualizacoes_chamado ON atualizacoes_chamados(chamado_id);`,
    `CREATE INDEX IF NOT EXISTS idx_atualizacoes_usuario ON atualizacoes_chamados(usuario_id);`,

    // Tabela de Anexos
    `CREATE TABLE IF NOT EXISTS anexos (
      id SERIAL PRIMARY KEY,
      chamado_id INT NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
      nome_arquivo VARCHAR(255) NOT NULL,
      caminho_arquivo VARCHAR(255) NOT NULL,
      tipo_mime VARCHAR(50),
      tamanho INT,
      enviado_por INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para anexos
    `CREATE INDEX IF NOT EXISTS idx_anexos_chamado ON anexos(chamado_id);`,

    // Tabela de Equipamentos (Inventário)
    `CREATE TABLE IF NOT EXISTS equipamentos (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      modelo VARCHAR(100) NOT NULL,
      serie VARCHAR(100) UNIQUE,
      patrimonio VARCHAR(100),
      localizacao VARCHAR(100),
      responsavel_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
      cadastrado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'ativo',
      data_aquisicao DATE,
      valor DECIMAL(10, 2),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para equipamentos
    `CREATE INDEX IF NOT EXISTS idx_equipamentos_tipo ON equipamentos(tipo);`,
    `CREATE INDEX IF NOT EXISTS idx_equipamentos_serie ON equipamentos(serie);`,
    `CREATE INDEX IF NOT EXISTS idx_equipamentos_status ON equipamentos(status);`,
    `ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS patrimonio VARCHAR(100);`,
    `ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS cadastrado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL;`,

    // Tabela de Logs de Auditoria
    `CREATE TABLE IF NOT EXISTS logs_auditoria (
      id SERIAL PRIMARY KEY,
      usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
      acao VARCHAR(100) NOT NULL,
      tabela VARCHAR(50),
      registro_id INT,
      dados_anteriores JSONB,
      dados_novos JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Índices para logs_auditoria
    `CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);`,
    `CREATE INDEX IF NOT EXISTS idx_logs_criado ON logs_auditoria(criado_em);`
  ];

  console.log('Executando migrações de schema...');
  for (const migration of migrations) {
    try {
      await pool.query(migration);
      console.log('✅ Migration executada com sucesso');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('❌ Erro na migration:', error.message);
      }
    }
  }
  // Migration para coluna last_active em usuarios (se ainda não existir)
  try {
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;`);
    console.log('✅ Coluna last_active verificada/gerada em usuarios');
  } catch (err) {
    console.error('❌ Erro ao adicionar last_active:', err.message);
  }
  console.log('Migrações concluídas com sucesso!');
}

export default { pool, initializeDatabase };
