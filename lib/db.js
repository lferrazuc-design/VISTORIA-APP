import { sql } from "@vercel/postgres";

// Cria a tabela na primeira execução, caso ainda não exista.
// (Rodar o schema.sql manualmente uma vez também funciona; isso aqui é
// só uma rede de segurança pra não travar se alguém esquecer.)
let ensured = false;
export async function ensureTable() {
  if (ensured) return;
  await sql`
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

export { sql };
