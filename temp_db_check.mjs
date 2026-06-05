import { pool } from "./backend/src/config/database.js";
const query = async () => {
  try {
    const res = await pool.query("SELECT status, prioridade, COUNT(1) AS total FROM chamados GROUP BY status, prioridade ORDER BY status, prioridade");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};
query();
