-- Adiciona sistema de pontos e conquistas ao perfil do usuário
ALTER TABLE profiles
ADD COLUMN pontos INTEGER DEFAULT 0,
ADD COLUMN conquistas JSONB DEFAULT '[]';
