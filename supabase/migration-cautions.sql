-- =============================================================
-- MIGRATION — Ajout colonnes suivi des cautions
-- À exécuter dans le SQL Editor de Supabase
-- =============================================================

-- Ajout de la colonne caution_restituee (boolean, défaut false)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS caution_restituee BOOLEAN DEFAULT FALSE;

-- Ajout de la colonne date_restitution (date, nullable)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS date_restitution DATE;
