-- =============================================
-- Adiciona ON DELETE CASCADE nas FKs que
-- apontam para personagens, para permitir
-- exclusão de personagens sem erros.
-- Rodar no Supabase SQL Editor.
-- =============================================

-- relacoes_personagens
ALTER TABLE relacoes_personagens
  DROP CONSTRAINT IF EXISTS relacoes_personagens_personagem_a_fkey,
  DROP CONSTRAINT IF EXISTS relacoes_personagens_personagem_b_fkey;

ALTER TABLE relacoes_personagens
  ADD CONSTRAINT relacoes_personagens_personagem_a_fkey
    FOREIGN KEY (personagem_a) REFERENCES personagens(id) ON DELETE CASCADE,
  ADD CONSTRAINT relacoes_personagens_personagem_b_fkey
    FOREIGN KEY (personagem_b) REFERENCES personagens(id) ON DELETE CASCADE;

-- posts_sociais
ALTER TABLE posts_sociais
  DROP CONSTRAINT IF EXISTS posts_sociais_personagem_id_fkey;

ALTER TABLE posts_sociais
  ADD CONSTRAINT posts_sociais_personagem_id_fkey
    FOREIGN KEY (personagem_id) REFERENCES personagens(id) ON DELETE CASCADE;

-- curtidas_sociais
ALTER TABLE curtidas_sociais
  DROP CONSTRAINT IF EXISTS curtidas_sociais_personagem_id_fkey;

ALTER TABLE curtidas_sociais
  ADD CONSTRAINT curtidas_sociais_personagem_id_fkey
    FOREIGN KEY (personagem_id) REFERENCES personagens(id) ON DELETE CASCADE;

-- comentarios_sociais
ALTER TABLE comentarios_sociais
  DROP CONSTRAINT IF EXISTS comentarios_sociais_personagem_id_fkey;

ALTER TABLE comentarios_sociais
  ADD CONSTRAINT comentarios_sociais_personagem_id_fkey
    FOREIGN KEY (personagem_id) REFERENCES personagens(id) ON DELETE CASCADE;
