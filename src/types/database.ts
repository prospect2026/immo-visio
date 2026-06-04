export type LogementType = 'Appartement Premium' | 'Appartement Standard' | 'Studio';
export type SejourType = 'nuitée' | 'semaine' | '2 semaines' | '3 semaines' | 'mois complet';
export type ReservationStatut = 'confirmée' | 'en cours' | 'terminée' | 'annulée';
export type DepenseCategorie =
  | 'loyer bailleresse' | 'internet' | 'ménage' | 'gaz'
  | 'entretien clim' | 'transport' | 'imprévus' | 'réparation' | 'autre';

export interface Reservation {
  id: string;
  logement: LogementType;
  locataire_nom: string;
  type_sejour: SejourType;
  date_arrivee: string;
  date_depart: string;
  montant: number;
  caution_montant: number;
  caution_encaissee: boolean;
  statut: ReservationStatut;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Depense {
  id: string;
  categorie: DepenseCategorie;
  montant: number;
  date_depense: string;
  description: string | null;
  justificatif_url: string | null;
  alerte_accord_requis: boolean;
  created_by: string;
  created_at: string;
}

export interface Encaissement {
  id: string;
  reservation_id: string | null;
  description: string;
  montant: number;
  date_encaissement: string;
  created_by: string;
  created_at: string;
}

export interface BilanMensuel {
  id: string;
  mois: string;
  ca_total: number;
  charges_total: number;
  benefice_net: number;
  remboursement_mis_de_cote: number;
  remuneration_rhodes: number;
  remuneration_bomboma: number;
  solde_pot_commun: number;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  auteur_id: string;
  contenu: string;
  lu_par_destinataire: boolean;
  created_at: string;
}

export const TARIFS: Record<LogementType, { nuit: number; mois: number }> = {
  'Appartement Premium': { nuit: 50000, mois: 680000 },
  'Appartement Standard': { nuit: 30000, mois: 430000 },
  'Studio': { nuit: 15000, mois: 200000 },
};

export const CHARGES_FIXES_MENSUELLES = 492000;
export const REMUNERATION_ASSOCIE = 100000;
export const PRET_TOTAL = 4100000;
export const PRET_MENSUEL = 342000;
export const PRET_DUREE_MOIS = 12;
