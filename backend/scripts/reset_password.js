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
    console.log('Conectado como superuser postgres...');

    // Resetar senha do usuário helpdesk
    await client.query("ALTER USER helpdesk WITH PASSWORD 'helpdesk_password';");
    console.log('✅ Senha do usuário helpdesk resetada para: helpdesk_password');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao resetar senha:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
