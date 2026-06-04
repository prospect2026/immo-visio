import { createClient } from '@/lib/supabase/server';
import { formatFCFA, debutDuMois, finDuMois, joursDisponiblesMois, calculerNuitsOccupees } from '@/lib/utils';
import { PRET_TOTAL, REMUNERATION_ASSOCIE, PRET_MENSUEL } from '@/types/database';
import type { LogementType, DepenseCategorie } from '@/types/database';
import { CarteMetrique } from '@/components/carte-metrique';
import { DernieresReservations } from '@/components/dernieres-reservations';
import { GraphiquesWrapper } from '@/components/graphiques-wrapper';
import { ChargesFixes } from '@/components/charges-fixes';

export const dynamic = 'force-dynamic';

export default async function TableauDeBord() {
  const supabase = await createClient();
  const debut = debutDuMois();
  const fin = finDuMois();
  const joursDispo = joursDisponiblesMois();

  // Calculer les 6 derniers mois pour le graphique CA
  const maintenant = new Date();
  const moisPasses: { debut: string; fin: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const fDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    moisPasses.push({
      debut: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      fin: `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
    });
  }

  const [
    { data: encaissementsMois },
    { data: depensesMois },
    { data: reservationsMois },
    { data: tousBilans },
    { data: dernieresResas },
    { data: encaissements6mois },
    { data: depensesMoisCateg },
  ] = await Promise.all([
    supabase.from('encaissements').select('montant').gte('date_encaissement', debut).lte('date_encaissement', fin),
    supabase.from('depenses').select('montant').gte('date_depense', debut).lte('date_depense', fin),
    supabase.from('reservations').select('logement, date_arrivee, date_depart, statut')
      .or(`date_arrivee.lte.${fin},date_depart.gte.${debut}`)
      .neq('statut', 'annulée'),
    supabase.from('bilans_mensuels').select('remboursement_mis_de_cote, solde_pot_commun').order('mois', { ascending: false }),
    supabase.from('reservations').select('*').order('created_at', { ascending: false }).limit(5),
    // Encaissements des 6 derniers mois
    supabase.from('encaissements').select('montant, date_encaissement')
      .gte('date_encaissement', moisPasses[0].debut)
      .lte('date_encaissement', moisPasses[5].fin),
    // Dépenses du mois en cours avec catégorie
    supabase.from('depenses').select('montant, categorie').gte('date_depense', debut).lte('date_depense', fin),
  ]);

  const caMois = (encaissementsMois ?? []).reduce((s, e) => s + e.montant, 0);
  const chargesMois = (depensesMois ?? []).reduce((s, d) => s + d.montant, 0);
  const beneficeMois = caMois - chargesMois;

  // Amélioration 5 — Cumuls depuis le début
  const remboursementCumule = (tousBilans ?? []).reduce((s, b) => s + b.remboursement_mis_de_cote, 0);
  const potCommunCumule = (tousBilans ?? []).reduce((s, b) => s + b.solde_pot_commun, 0);
  const potCommunDernier = tousBilans && tousBilans.length > 0 ? tousBilans[0].solde_pot_commun : 0;
  const pctRemboursement = Math.min(100, Math.round((remboursementCumule / PRET_TOTAL) * 100));

  const logements: LogementType[] = ['Appartement Premium', 'Appartement Standard', 'Studio'];
  const occupationParLogement = logements.map((logement) => {
    const resas = (reservationsMois ?? []).filter((r) => r.logement === logement);
    const nuitsOccupees = resas.reduce((s, r) => {
      const arrClamp = r.date_arrivee < debut ? debut : r.date_arrivee;
      const depClamp = r.date_depart > fin ? fin : r.date_depart;
      return s + calculerNuitsOccupees(arrClamp, depClamp);
    }, 0);
    return { logement, nuits: Math.min(nuitsOccupees, joursDispo), total: joursDispo };
  });

  const nuitsGlobales = occupationParLogement.reduce((s, o) => s + o.nuits, 0);
  const totalGlobal = joursDispo * 3;
  const tauxGlobal = totalGlobal > 0 ? Math.round((nuitsGlobales / totalGlobal) * 100) : 0;

  // Amélioration 2 — Données graphique CA
  const donneesCA = moisPasses.map((m) => {
    const total = (encaissements6mois ?? [])
      .filter((e) => e.date_encaissement >= m.debut && e.date_encaissement <= m.fin)
      .reduce((s, e) => s + e.montant, 0);
    return { mois: m.label, montant: total };
  });

  // Amélioration 2 — Données graphique charges par catégorie
  const chargesParCategorie: Record<string, number> = {};
  (depensesMoisCateg ?? []).forEach((d) => {
    const cat = d.categorie as DepenseCategorie;
    chargesParCategorie[cat] = (chargesParCategorie[cat] ?? 0) + d.montant;
  });
  const donneesCharges = Object.entries(chargesParCategorie).map(([categorie, montant]) => ({
    categorie,
    montant,
  }));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>

      {/* Métriques du mois — incluant Amélioration 5 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CarteMetrique label="CA du mois" valeur={formatFCFA(caMois)} couleur="text-success" />
        <CarteMetrique label="Charges du mois" valeur={formatFCFA(chargesMois)} couleur="text-danger" />
        <CarteMetrique label="Bénéfice net" valeur={formatFCFA(beneficeMois)} couleur={beneficeMois >= 0 ? 'text-success' : 'text-danger'} />
        <CarteMetrique label="Remb. ce mois" valeur={formatFCFA(PRET_MENSUEL)} couleur="text-primary" />
        <CarteMetrique label="Rémun. / associé" valeur={formatFCFA(REMUNERATION_ASSOCIE)} couleur="text-foreground" />
        <CarteMetrique label="Pot commun (dernier)" valeur={formatFCFA(potCommunDernier)} couleur="text-primary" />
        <CarteMetrique label="Pot commun cumulé" valeur={formatFCFA(potCommunCumule)} couleur="text-success" />
        <CarteMetrique label="Remb. cumulé" valeur={formatFCFA(remboursementCumule)} couleur="text-primary" />
      </div>

      {/* Amélioration 5 — Barre de remboursement cumulé */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Remboursement du prêt</h2>
          <span className="text-sm font-bold text-primary">{pctRemboursement}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all flex items-center justify-end pr-2"
            style={{ width: `${Math.max(pctRemboursement, 8)}%` }}
          >
            {pctRemboursement >= 15 && (
              <span className="text-[10px] text-white font-bold">{formatFCFA(remboursementCumule)}</span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>{formatFCFA(remboursementCumule)} mis de côté</span>
          <span>Objectif {formatFCFA(PRET_TOTAL)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted">Reste à rembourser</span>
          <span className="font-semibold text-danger">{formatFCFA(Math.max(0, PRET_TOTAL - remboursementCumule))}</span>
        </div>
      </div>

      {/* Amélioration 2 — Graphiques CA + Charges */}
      <GraphiquesWrapper donneesCA={donneesCA} donneesCharges={donneesCharges} />

      {/* Taux d'occupation */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="font-semibold mb-4">Occupation du mois ({tauxGlobal}% global)</h2>
        <div className="space-y-3">
          {occupationParLogement.map((o) => {
            const pct = o.total > 0 ? Math.round((o.nuits / o.total) * 100) : 0;
            return (
              <div key={o.logement}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{o.logement}</span>
                  <span className="text-muted">{o.nuits}/{o.total} nuits — {pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-success h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Amélioration 6 — Charges fixes mensuelles */}
      <ChargesFixes />

      {/* Dernières réservations */}
      <DernieresReservations reservations={dernieresResas ?? []} />
    </div>
  );
}
