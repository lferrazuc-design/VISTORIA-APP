-- Rode isso uma vez no painel do seu banco (Vercel Postgres / Neon / Supabase)
-- antes do primeiro uso do app. A API também tenta criar a tabela sozinha
-- na primeira chamada, mas rodar isso manualmente é mais confiável.

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

CREATE INDEX IF NOT EXISTS idx_visitas_codigo_fazenda ON visitas (codigo_fazenda);
CREATE INDEX IF NOT EXISTS idx_visitas_fornecedor ON visitas (fornecedor);
