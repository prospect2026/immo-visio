'use client';

import { useState } from 'react';
import type { Reservation, LogementType, ReservationStatut } from '@/types/database';
import { formatFCFA, formatDate } from '@/lib/utils';
import Link from 'next/link';

const badgeStatut: Record<string, string> = {
  'confirmée': 'bg-blue-100 text-blue-800',
  'en cours': 'bg-green-100 text-green-800',
  'terminée': 'bg-gray-100 text-gray-600',
  'annulée': 'bg-red-100 text-red-800',
};

const logements: (LogementType | 'Tous')[] = ['Tous', 'Appartement Premium', 'Appartement Standard', 'Studio'];
const statuts: (ReservationStatut | 'Tous')[] = ['Tous', 'confirmée', 'en cours', 'terminée', 'annulée'];

export function ListeReservations({ reservations }: { reservations: Reservation[] }) {
  const [filtreLogement, setFiltreLogement] = useState<string>('Tous');
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [filtreMois, setFiltreMois] = useState<string>('');
  const [vue, setVue] = useState<'liste' | 'calendrier'>('liste');

  const filtered = reservations.filter((r) => {
    if (filtreLogement !== 'Tous' && r.logement !== filtreLogement) return false;
    if (filtreStatut !== 'Tous' && r.statut !== filtreStatut) return false;
    if (filtreMois && !r.date_arrivee.startsWith(filtreMois)) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filtreLogement}
          onChange={(e) => setFiltreLogement(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {logements.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="month"
          value={filtreMois}
          onChange={(e) => setFiltreMois(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
        />
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setVue('liste')}
            className={`px-3 py-2 rounded-lg text-sm ${vue === 'liste' ? 'bg-primary text-white' : 'bg-white border border-border'}`}
          >Liste</button>
          <button
            onClick={() => setVue('calendrier')}
            className={`px-3 py-2 rounded-lg text-sm ${vue === 'calendrier' ? 'bg-primary text-white' : 'bg-white border border-border'}`}
          >Calendrier</button>
        </div>
      </div>

      {vue === 'liste' ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted py-8">Aucune réservation trouvée</p>
          ) : (
            filtered.map((r) => (
              <Link key={r.id} href={`/reservations/${r.id}`} className="block">
                <div className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.locataire_nom}</p>
                      <p className="text-sm text-muted">{r.logement}</p>
                      <p className="text-xs text-muted mt-1">
                        {formatDate(r.date_arrivee)} → {formatDate(r.date_depart)} — {r.type_sejour}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatFCFA(r.montant)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStatut[r.statut]}`}>
                        {r.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <CalendrierDisponibilites reservations={reservations} />
      )}
    </div>
  );
}

/* ============================================================
   Calendrier visuel des disponibilités — Vue Gantt
   Logements en lignes, jours du mois en colonnes.
   Navigation entre mois avec flèches précédent/suivant.
   ============================================================ */

const LOGEMENTS_LIGNES: LogementType[] = ['Appartement Premium', 'Appartement Standard', 'Studio'];

const COULEUR_FOND: Record<LogementType, string> = {
  'Appartement Premium': 'bg-blue-500',
  'Appartement Standard': 'bg-green-500',
  'Studio': 'bg-orange-400',
};
const COULEUR_HOVER: Record<LogementType, string> = {
  'Appartement Premium': 'bg-blue-600',
  'Appartement Standard': 'bg-green-600',
  'Studio': 'bg-orange-500',
};
const LABEL_COURT: Record<LogementType, string> = {
  'Appartement Premium': 'Premium',
  'Appartement Standard': 'Standard',
  'Studio': 'Studio',
};

function CalendrierDisponibilites({ reservations }: { reservations: Reservation[] }) {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [moisIdx, setMoisIdx] = useState(now.getMonth()); // 0-indexed

  const nbJours = new Date(annee, moisIdx + 1, 0).getDate();
  const aujourdhui = now.getDate();
  const estMoisActuel = annee === now.getFullYear() && moisIdx === now.getMonth();

  function moisPrecedent() {
    if (moisIdx === 0) { setAnnee(annee - 1); setMoisIdx(11); }
    else setMoisIdx(moisIdx - 1);
  }
  function moisSuivant() {
    if (moisIdx === 11) { setAnnee(annee + 1); setMoisIdx(0); }
    else setMoisIdx(moisIdx + 1);
  }

  // Vérifie si un logement est occupé un jour donné
  function estOccupe(logement: LogementType, jour: number): Reservation | undefined {
    const dateStr = `${annee}-${String(moisIdx + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    return reservations.find(
      (r) => r.logement === logement && r.statut !== 'annulée' && r.date_arrivee <= dateStr && r.date_depart > dateStr
    );
  }

  const nomMois = new Date(annee, moisIdx).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* En-tête navigation mois */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={moisPrecedent} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Mois précédent">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-semibold text-primary capitalize">{nomMois}</h3>
        <button onClick={moisSuivant} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Mois suivant">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-semibold text-muted border-b border-border w-28">
                Logement
              </th>
              {Array.from({ length: nbJours }).map((_, i) => {
                const jour = i + 1;
                const estAuj = estMoisActuel && jour === aujourdhui;
                return (
                  <th
                    key={jour}
                    className={`px-0 py-2 text-center text-[10px] font-medium border-b border-border w-8 ${
                      estAuj ? 'bg-primary text-white rounded-t' : 'text-muted'
                    }`}
                  >
                    {jour}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {LOGEMENTS_LIGNES.map((logement) => (
              <tr key={logement} className="border-b border-border last:border-b-0">
                <td className="sticky left-0 z-10 bg-card px-3 py-2.5 text-xs font-medium whitespace-nowrap">
                  {LABEL_COURT[logement]}
                </td>
                {Array.from({ length: nbJours }).map((_, i) => {
                  const jour = i + 1;
                  const resa = estOccupe(logement, jour);
                  const estAuj = estMoisActuel && jour === aujourdhui;
                  return (
                    <td
                      key={jour}
                      className={`px-0 py-2.5 text-center ${estAuj ? 'bg-primary/5' : ''}`}
                      title={resa ? `${resa.locataire_nom} — ${formatDate(resa.date_arrivee)} → ${formatDate(resa.date_depart)}` : 'Libre'}
                    >
                      {resa ? (
                        <div className={`mx-auto w-6 h-6 rounded ${COULEUR_FOND[logement]} hover:${COULEUR_HOVER[logement]} transition-colors`} />
                      ) : (
                        <div className="mx-auto w-6 h-6 rounded bg-gray-100" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-border justify-center">
        {LOGEMENTS_LIGNES.map((logement) => (
          <div key={logement} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${COULEUR_FOND[logement]}`} />
            <span className="text-xs text-muted">{logement} — Occupé</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
          <span className="text-xs text-muted">Libre</span>
        </div>
      </div>
    </div>
  );
}
