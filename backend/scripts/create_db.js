import pkg from 'pg';
const { Client } = pkg;

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Estronda31.',
    database: 'postgres'
  });

  try {
    await client.connect();

    const sql = `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk') THEN
    CREATE ROLE helpdesk WITH LOGIN PASSWORD 'helpdesk_password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'helpdesk_db') THEN
    PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE helpdesk_db OWNER helpdesk');
  END IF;
END
$$;`;

    // Some environments may not have dblink; fallback to manual checks
    // We'll attempt simpler statements sequentially
    // Create role if not exists
    await client.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'helpdesk') THEN CREATE ROLE helpdesk WITH LOGIN PASSWORD 'helpdesk_password'; END IF; END $$;");

    // Create database if not exists
    const dbExists = await client.query("SELECT 1 FROM pg_database WHERE datname = 'helpdesk_db';");
    if (dbExists.rows.length === 0) {
      await client.query("CREATE DATABASE helpdesk_db OWNER helpdesk;");
    }

    // Grant privileges
    await client.query("GRANT ALL PRIVILEGES ON DATABASE helpdesk_db TO helpdesk;");

    console.log('✅ Usuário e banco criados (ou já existentes).');
  } catch (err) {
    console.error('❌ Erro ao criar usuário/banco:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
