-- =============================================
-- FASE 2: Universos
-- Rodar no Supabase SQL Editor
-- =============================================

-- Tabela de universos
CREATE TABLE IF NOT EXISTS universos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  genero      TEXT,
  descricao   TEXT,
  capa_url    TEXT,
  status      TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'arquivado')),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE universos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios gerenciam seus universos"
  ON universos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar universo_id nas tabelas existentes (nullable para não quebrar dados)
ALTER TABLE threads     ADD COLUMN IF NOT EXISTS universo_id UUID REFERENCES universos(id) ON DELETE SET NULL;
ALTER TABLE personagens ADD COLUMN IF NOT EXISTS universo_id UUID REFERENCES universos(id) ON DELETE SET NULL;
ALTER TABLE lugares     ADD COLUMN IF NOT EXISTS universo_id UUID REFERENCES universos(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_threads_universo     ON threads(universo_id);
CREATE INDEX IF NOT EXISTS idx_personagens_universo ON personagens(universo_id);
CREATE INDEX IF NOT EXISTS idx_lugares_universo     ON lugares(universo_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS universos_updated_at ON universos;
CREATE TRIGGER universos_updated_at
  BEFORE UPDATE ON universos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
