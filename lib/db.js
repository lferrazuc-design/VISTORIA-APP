import { createClient } from "@vercel/postgres";

// Usamos createClient() em vez do `sql` padrão porque a connection string
// direta do Supabase (db.<projeto>.supabase.co:5432) não é reconhecida
// como "pooled" pela biblioteca @vercel/postgres — createClient() aceita
// conexões diretas normalmente. Cada chamada abre e fecha sua própria
// conexão (padrão recomendado em ambiente serverless).

export async function withClient(fn) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

let ensured = false;
export async function ensureTable(client) {
  if (ensured) return;
  await client.sql`
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
  `;
  ensured = true;
}
