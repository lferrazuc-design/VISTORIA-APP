import { Pool } from "pg";

let pool;
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

let ensured = false;
export async function ensureTable() {
  if (ensured) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitas (
      id TEXT PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      data_visita TEXT,
      codigo_fazenda TEXT NOT NULL,
      nome_fazenda TEXT NOT NULL,
      talhao TEXT,
      tecnico TEXT NOT NULL,
      fornecedor TEXT NOT NULL,
      itens JSONB NOT NULL,
      notas JSONB NOT NULL,
      scores JSONB NOT NULL,
      nota_final INTEGER NOT NULL,
      obs_gerais TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  ensured = true;
}
