-- Adiciona campos para personalização do perfil do usuário
ALTER TABLE profiles
ADD COLUMN ocupacao TEXT,
ADD COLUMN rotina TEXT,
ADD COLUMN ambiente TEXT,
ADD COLUMN mentalidade TEXT,
ADD COLUMN informacoes_extras TEXT;
