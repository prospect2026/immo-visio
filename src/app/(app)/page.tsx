import { createClient } from '@/lib/supabase/server';
import { formatFCFA, debutDuMois, finDuMois, joursDisponiblesMois, calculerNuitsOccupees } from '@/lib/utils';
import { PRET_TOTAL, REMUNERATION_ASSOCIE, CHARGES_FIXES_MENSUELLES, PRET_MENSUEL } from '@/types/database';
import type { LogementType } from '@/types/database';
import { CarteMetrique } from '@/components/carte-metrique';
import { DernieresReservations } from '@/components/dernieres-reservations';

export const dynamic = 'force-dynamic';

export default async function TableauDeBord() {
  const supabase = await createClient();
  const debut = debutDuMois();
  const fin = finDuMois();
  const joursDispo = joursDisponiblesMois();

  const [
    { data: encaissementsMois },
    { data: depensesMois },
    { data: reservationsMois },
    { data: tousEncaissements },
    { data: toutesDepenses },
    { data: tousBilans },
    { data: dernieresResas },
  ] = await Promise.all([
    supabase.from('encaissements').select('montant').gte('date_encaissement', debut).lte('date_encaissement', fin),
    supabase.from('depenses').select('montant').gte('date_depense', debut).lte('date_depense', fin),
    supabase.from('reservations').select('logement, date_arrivee, date_depart, statut')
      .or(`date_arrivee.lte.${fin},date_depart.gte.${debut}`)
      .neq('statut', 'annulée'),
    supabase.from('encaissements').select('montant'),
    supabase.from('depenses').select('montant'),
    supabase.from('bilans_mensuels').select('remboursement_mis_de_cote, solde_pot_commun').order('mois', { ascending: false }),
    supabase.from('reservations').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const caMois = (encaissementsMois ?? []).reduce((s, e) => s + e.montant, 0);
  const chargesMois = (depensesMois ?? []).reduce((s, d) => s + d.montant, 0);
  const beneficeMois = caMois - chargesMois;

  const remboursementCumule = (tousBilans ?? []).reduce((s, b) => s + b.remboursement_mis_de_cote, 0);
  const potCommun = tousBilans && tousBilans.length > 0 ? tousBilans[0].solde_pot_commun : 0;
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>

      {/* Métriques du mois */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <CarteMetrique label="CA du mois" valeur={formatFCFA(caMois)} couleur="text-success" />
        <CarteMetrique label="Charges du mois" valeur={formatFCFA(chargesMois)} couleur="text-danger" />
        <CarteMetrique label="Bénéfice net" valeur={formatFCFA(beneficeMois)} couleur={beneficeMois >= 0 ? 'text-success' : 'text-danger'} />
        <CarteMetrique label="Remb. ce mois" valeur={formatFCFA(PRET_MENSUEL)} couleur="text-primary" />
        <CarteMetrique label="Rémun. / associé" valeur={formatFCFA(REMUNERATION_ASSOCIE)} couleur="text-foreground" />
        <CarteMetrique label="Pot commun" valeur={formatFCFA(potCommun)} couleur="text-primary" />
      </div>

      {/* Barre de remboursement */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Remboursement du prêt</h2>
          <span className="text-sm text-muted">{pctRemboursement}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${pctRemboursement}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>{formatFCFA(remboursementCumule)} mis de côté</span>
          <span>Reste {formatFCFA(PRET_TOTAL - remboursementCumule)}</span>
        </div>
      </div>

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

      {/* Dernières réservations */}
      <DernieresReservations reservations={dernieresResas ?? []} />
    </div>
  );
}
