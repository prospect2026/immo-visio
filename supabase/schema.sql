-- =============================================================
-- IMMO-VISIO — Schéma de base de données Supabase
-- Gestion locative meublée — Lomé, Togo
-- =============================================================

-- Types énumérés
CREATE TYPE logement_type AS ENUM ('Appartement Premium', 'Appartement Standard', 'Studio');
CREATE TYPE sejour_type AS ENUM ('nuitée', 'semaine', '2 semaines', '3 semaines', 'mois complet');
CREATE TYPE reservation_statut AS ENUM ('confirmée', 'en cours', 'terminée', 'annulée');
CREATE TYPE depense_categorie AS ENUM (
  'loyer bailleresse', 'internet', 'ménage', 'gaz',
  'entretien clim', 'transport', 'imprévus', 'réparation', 'autre'
);

-- ===================== RESERVATIONS =====================
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logement logement_type NOT NULL,
  locataire_nom TEXT NOT NULL,
  type_sejour sejour_type NOT NULL,
  date_arrivee DATE NOT NULL,
  date_depart DATE NOT NULL,
  montant INTEGER NOT NULL,
  caution_montant INTEGER DEFAULT 0,
  caution_encaissee BOOLEAN DEFAULT FALSE,
  statut reservation_statut NOT NULL DEFAULT 'confirmée',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== DÉPENSES =====================
CREATE TABLE depenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie depense_categorie NOT NULL,
  montant INTEGER NOT NULL,
  date_depense DATE NOT NULL,
  description TEXT,
  justificatif_url TEXT,
  alerte_accord_requis BOOLEAN GENERATED ALWAYS AS (montant > 50000) STORED,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== ENCAISSEMENTS =====================
CREATE TABLE encaissements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  montant INTEGER NOT NULL,
  date_encaissement DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== BILANS MENSUELS =====================
CREATE TABLE bilans_mensuels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mois DATE NOT NULL UNIQUE,
  ca_total INTEGER NOT NULL DEFAULT 0,
  charges_total INTEGER NOT NULL DEFAULT 0,
  benefice_net INTEGER NOT NULL DEFAULT 0,
  remboursement_mis_de_cote INTEGER NOT NULL DEFAULT 0,
  remuneration_rhodes INTEGER NOT NULL DEFAULT 0,
  remuneration_bomboma INTEGER NOT NULL DEFAULT 0,
  solde_pot_commun INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== MESSAGES =====================
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auteur_id UUID REFERENCES auth.users(id) NOT NULL,
  contenu TEXT NOT NULL,
  lu_par_destinataire BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== INDEX =====================
CREATE INDEX idx_reservations_dates ON reservations(date_arrivee, date_depart);
CREATE INDEX idx_reservations_logement ON reservations(logement);
CREATE INDEX idx_reservations_statut ON reservations(statut);
CREATE INDEX idx_depenses_date ON depenses(date_depense);
CREATE INDEX idx_depenses_categorie ON depenses(categorie);
CREATE INDEX idx_encaissements_date ON encaissements(date_encaissement);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_lu ON messages(lu_par_destinataire);

-- ===================== TRIGGER updated_at =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================== ROW LEVEL SECURITY =====================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE encaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilans_mensuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les deux associés ont accès à tout (authentifiés)
CREATE POLICY "Accès authentifié" ON reservations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON depenses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON encaissements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON bilans_mensuels
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

-- ===================== STORAGE (justificatifs) =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificatifs', 'justificatifs', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Upload justificatifs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'justificatifs' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Lecture justificatifs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'justificatifs' AND auth.role() = 'authenticated'
  );
