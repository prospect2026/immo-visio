'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Depense, Encaissement, BilanMensuel, DepenseCategorie } from '@/types/database';
import { formatFCFA, formatDate, formatDateISO } from '@/lib/utils';
import { PRET_MENSUEL, REMUNERATION_ASSOCIE } from '@/types/database';
import { BoutonExportPDF } from './export-bilan-pdf';

const categories: DepenseCategorie[] = [
  'loyer bailleresse', 'internet', 'ménage', 'gaz',
  'entretien clim', 'transport', 'imprévus', 'réparation', 'autre',
];

type Onglet = 'depenses' | 'encaissements' | 'bilans' | 'cautions';

interface CautionRow {
  id: string;
  locataire_nom: string;
  logement: string;
  caution_montant: number;
  caution_encaissee: boolean;
  caution_restituee: boolean;
  date_restitution: string | null;
  date_arrivee: string;
}

export function FinancesClient({
  depenses,
  encaissements,
  bilans,
  reservations,
  reservationsCautions,
}: {
  depenses: Depense[];
  encaissements: Encaissement[];
  bilans: BilanMensuel[];
  reservations: { id: string; locataire_nom: string; logement: string }[];
  reservationsCautions: CautionRow[];
}) {
  const [onglet, setOnglet] = useState<Onglet>('depenses');
  const [showFormDepense, setShowFormDepense] = useState(false);
  const [showFormEncaissement, setShowFormEncaissement] = useState(false);
  const [showFormBilan, setShowFormBilan] = useState(false);

  const onglets: { id: Onglet; label: string }[] = [
    { id: 'depenses', label: 'Dépenses' },
    { id: 'encaissements', label: 'Encaissements' },
    { id: 'bilans', label: 'Bilans' },
    { id: 'cautions', label: 'Cautions' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Finances</h1>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              onglet === o.id ? 'bg-white text-primary shadow-sm' : 'text-muted'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'depenses' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowFormDepense(!showFormDepense)}
            className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            + Nouvelle dépense
          </button>
          {showFormDepense && <FormulaireDepense onDone={() => setShowFormDepense(false)} />}
          <ListeDepenses depenses={depenses} />
        </div>
      )}

      {onglet === 'encaissements' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowFormEncaissement(!showFormEncaissement)}
            className="bg-success text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Nouvel encaissement
          </button>
          {showFormEncaissement && (
            <FormulaireEncaissement reservations={reservations} onDone={() => setShowFormEncaissement(false)} />
          )}
          <ListeEncaissements encaissements={encaissements} />
        </div>
      )}

      {onglet === 'bilans' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowFormBilan(!showFormBilan)}
            className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            + Générer bilan mensuel
          </button>
          {showFormBilan && <FormulaireBilan onDone={() => setShowFormBilan(false)} />}
          <ListeBilans bilans={bilans} />
        </div>
      )}

      {onglet === 'cautions' && (
        <ListeCautions cautions={reservationsCautions} />
      )}
    </div>
  );
}

/* ============================================================
   Formulaire dépense
   ============================================================ */
function FormulaireDepense({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [categorie, setCategorie] = useState<DepenseCategorie>('ménage');
  const [montant, setMontant] = useState(0);
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const alerteRequise = montant > 50000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('depenses').insert({
      categorie,
      montant,
      date_depense: date,
      description: description || null,
      created_by: user.id,
    });

    setLoading(false);
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border space-y-3">
      {alerteRequise && (
        <div className="bg-red-50 border border-danger text-danger rounded-xl p-3 text-sm font-medium">
          Cette dépense dépasse 50 000 FCFA — elle nécessite l'accord de RHODES
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as DepenseCategorie)}
            className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
          <input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))}
            className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" min={0} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" placeholder="Détail de la dépense" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Annuler</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Formulaire encaissement
   ============================================================ */
function FormulaireEncaissement({
  reservations,
  onDone,
}: {
  reservations: { id: string; locataire_nom: string; logement: string }[];
  onDone: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [reservationId, setReservationId] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState(0);
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('encaissements').insert({
      reservation_id: reservationId || null,
      description,
      montant,
      date_encaissement: date,
      created_by: user.id,
    });

    setLoading(false);
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Réservation liée (optionnel)</label>
        <select value={reservationId} onChange={(e) => setReservationId(e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
          <option value="">Aucune</option>
          {reservations.map((r) => (
            <option key={r.id} value={r.id}>{r.locataire_nom} — {r.logement}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" placeholder="Paiement location..." required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
          <input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))}
            className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" min={0} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" required />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Annuler</button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 bg-success text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   Formulaire bilan
   ============================================================ */
function FormulaireBilan({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const now = new Date();
  const [mois, setMois] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    ca: number; charges: number; benefice: number;
  } | null>(null);

  async function calculerPreview() {
    const debut = `${mois}-01`;
    const finDate = new Date(Number(mois.split('-')[0]), Number(mois.split('-')[1]), 0);
    const fin = formatDateISO(finDate);

    const [{ data: enc }, { data: dep }] = await Promise.all([
      supabase.from('encaissements').select('montant').gte('date_encaissement', debut).lte('date_encaissement', fin),
      supabase.from('depenses').select('montant').gte('date_depense', debut).lte('date_depense', fin),
    ]);

    const ca = (enc ?? []).reduce((s, e) => s + e.montant, 0);
    const charges = (dep ?? []).reduce((s, d) => s + d.montant, 0);
    setPreview({ ca, charges, benefice: ca - charges });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const beneficeApresRemb = preview.benefice - PRET_MENSUEL;
    const remunerations = REMUNERATION_ASSOCIE * 2;
    const potCommun = beneficeApresRemb - remunerations;

    const { data: dernierBilan } = await supabase
      .from('bilans_mensuels')
      .select('solde_pot_commun')
      .order('mois', { ascending: false })
      .limit(1)
      .single();

    const potCumule = (dernierBilan?.solde_pot_commun ?? 0) + potCommun;

    await supabase.from('bilans_mensuels').upsert({
      mois: `${mois}-01`,
      ca_total: preview.ca,
      charges_total: preview.charges,
      benefice_net: preview.benefice,
      remboursement_mis_de_cote: PRET_MENSUEL,
      remuneration_rhodes: REMUNERATION_ASSOCIE,
      remuneration_bomboma: REMUNERATION_ASSOCIE,
      solde_pot_commun: potCumule,
      created_by: user.id,
    }, { onConflict: 'mois' });

    setLoading(false);
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Mois</label>
        <input type="month" value={mois} onChange={(e) => { setMois(e.target.value); setPreview(null); }}
          className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm" required />
      </div>

      {!preview ? (
        <button type="button" onClick={calculerPreview}
          className="w-full py-2.5 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
          Calculer le bilan
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-muted">CA</p>
              <p className="font-bold text-success text-sm">{formatFCFA(preview.ca)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-muted">Charges</p>
              <p className="font-bold text-danger text-sm">{formatFCFA(preview.charges)}</p>
            </div>
            <div className={`rounded-xl p-3 ${preview.benefice >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-muted">Bénéfice</p>
              <p className={`font-bold text-sm ${preview.benefice >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatFCFA(preview.benefice)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted space-y-1">
            <p>Remboursement prêt : {formatFCFA(PRET_MENSUEL)}</p>
            <p>Rémunération x 2 : {formatFCFA(REMUNERATION_ASSOCIE * 2)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onDone} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Annuler</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Valider le bilan'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

/* ============================================================
   Liste des dépenses
   ============================================================ */
function ListeDepenses({ depenses }: { depenses: Depense[] }) {
  if (depenses.length === 0) return <p className="text-center text-muted py-6">Aucune dépense</p>;
  return (
    <div className="space-y-2">
      {depenses.map((d) => (
        <div key={d.id} className="bg-card rounded-xl p-4 border border-border">
          {d.alerte_accord_requis && (
            <div className="bg-red-50 border border-danger text-danger rounded-lg px-3 py-1.5 text-xs font-medium mb-2">
              Accord RHODES requis
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{d.description || d.categorie}</p>
              <p className="text-xs text-muted">{d.categorie} — {formatDate(d.date_depense)}</p>
            </div>
            <p className="font-bold text-danger shrink-0">{formatFCFA(d.montant)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Liste des encaissements
   ============================================================ */
function ListeEncaissements({ encaissements }: { encaissements: Encaissement[] }) {
  if (encaissements.length === 0) return <p className="text-center text-muted py-6">Aucun encaissement</p>;
  return (
    <div className="space-y-2">
      {encaissements.map((e) => (
        <div key={e.id} className="bg-card rounded-xl p-4 border border-border flex justify-between items-start">
          <div>
            <p className="font-medium">{e.description}</p>
            <p className="text-xs text-muted">{formatDate(e.date_encaissement)}</p>
          </div>
          <p className="font-bold text-success shrink-0">{formatFCFA(e.montant)}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Liste des bilans — avec bouton Export PDF (Amélioration 3)
   ============================================================ */
function ListeBilans({ bilans }: { bilans: BilanMensuel[] }) {
  if (bilans.length === 0) return <p className="text-center text-muted py-6">Aucun bilan généré</p>;
  return (
    <div className="space-y-3">
      {bilans.map((b) => (
        <div key={b.id} className="bg-card rounded-2xl p-5 border border-border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              {new Date(b.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <BoutonExportPDF bilan={b} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted">CA total :</span> <span className="font-medium">{formatFCFA(b.ca_total)}</span></div>
            <div><span className="text-muted">Charges :</span> <span className="font-medium">{formatFCFA(b.charges_total)}</span></div>
            <div><span className="text-muted">Bénéfice :</span> <span className={`font-bold ${b.benefice_net >= 0 ? 'text-success' : 'text-danger'}`}>{formatFCFA(b.benefice_net)}</span></div>
            <div><span className="text-muted">Remb. prêt :</span> <span className="font-medium">{formatFCFA(b.remboursement_mis_de_cote)}</span></div>
            <div><span className="text-muted">Rémun. RHODES :</span> <span className="font-medium">{formatFCFA(b.remuneration_rhodes)}</span></div>
            <div><span className="text-muted">Rémun. BOMBOMA :</span> <span className="font-medium">{formatFCFA(b.remuneration_bomboma)}</span></div>
          </div>
          <div className="pt-2 border-t border-border">
            <span className="text-muted text-sm">Pot commun cumulé :</span>{' '}
            <span className="font-bold text-primary">{formatFCFA(b.solde_pot_commun)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Onglet Cautions (Amélioration 4)
   ============================================================ */
interface CautionRow {
  id: string;
  locataire_nom: string;
  logement: string;
  caution_montant: number;
  caution_encaissee: boolean;
  caution_restituee: boolean;
  date_restitution: string | null;
  date_arrivee: string;
}

function ListeCautions({ cautions }: { cautions: CautionRow[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const totalDetenues = cautions
    .filter((c) => !c.caution_restituee)
    .reduce((s, c) => s + c.caution_montant, 0);

  const totalRestituees = cautions
    .filter((c) => c.caution_restituee)
    .reduce((s, c) => s + c.caution_montant, 0);

  async function marquerRestituee(id: string) {
    setLoading(id);
    await supabase.from('reservations').update({
      caution_restituee: true,
      date_restitution: formatDateISO(new Date()),
    }).eq('id', id);
    setLoading(null);
    router.refresh();
  }

  if (cautions.length === 0) {
    return <p className="text-center text-muted py-6">Aucune caution encaissée</p>;
  }

  return (
    <div className="space-y-3">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
          <p className="text-xs text-muted mb-1">Cautions détenues</p>
          <p className="text-lg font-bold text-warning">{formatFCFA(totalDetenues)}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <p className="text-xs text-muted mb-1">Cautions restituées</p>
          <p className="text-lg font-bold text-success">{formatFCFA(totalRestituees)}</p>
        </div>
      </div>

      {/* Liste */}
      {cautions.map((c) => (
        <div key={c.id} className="bg-card rounded-xl p-4 border border-border">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{c.locataire_nom}</p>
              <p className="text-xs text-muted">{c.logement} — Arrivée {formatDate(c.date_arrivee)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{formatFCFA(c.caution_montant)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                c.caution_restituee ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {c.caution_restituee ? 'Restituée' : 'Détenue'}
              </span>
            </div>
          </div>

          {c.caution_restituee && c.date_restitution && (
            <p className="text-xs text-muted mt-2">Restituée le {formatDate(c.date_restitution)}</p>
          )}

          {!c.caution_restituee && (
            <button
              onClick={() => marquerRestituee(c.id)}
              disabled={loading === c.id}
              className="mt-3 w-full py-2 border border-success text-success rounded-xl text-xs font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {loading === c.id ? 'Mise à jour...' : 'Marquer comme restituée'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
