-- =============================================
-- Contexto de Cena + Guarda-roupa
-- Rodar no Supabase SQL Editor
-- =============================================

-- Cards de contexto inseridos na timeline da thread
CREATE TABLE IF NOT EXISTS contextos_cena (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id    UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  localizacao  TEXT,
  criado_por   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contextos_cena ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios autenticados gerenciam contextos_cena"
  ON contextos_cena FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Roupas por personagem dentro de um contexto de cena
CREATE TABLE IF NOT EXISTS roupas_contexto (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contexto_id   UUID REFERENCES contextos_cena(id) ON DELETE CASCADE NOT NULL,
  personagem_id UUID REFERENCES personagens(id) ON DELETE CASCADE NOT NULL,
  roupa_url     TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roupas_contexto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios autenticados gerenciam roupas_contexto"
  ON roupas_contexto FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Guarda-roupa do personagem (populado via threads ou manualmente)
CREATE TABLE IF NOT EXISTS guarda_roupa (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personagem_id UUID REFERENCES personagens(id) ON DELETE CASCADE NOT NULL,
  roupa_url     TEXT NOT NULL,
  contexto_id   UUID REFERENCES contextos_cena(id) ON DELETE SET NULL,
  criado_por    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guarda_roupa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios autenticados gerenciam guarda_roupa"
  ON guarda_roupa FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
