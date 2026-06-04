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
        <CalendrierSimple reservations={filtered} />
      )}
    </div>
  );
}

function CalendrierSimple({ reservations }: { reservations: Reservation[] }) {
  const now = new Date();
  const premierJour = new Date(now.getFullYear(), now.getMonth(), 1);
  const dernierJour = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nbJours = dernierJour.getDate();
  const jourDepart = premierJour.getDay() === 0 ? 6 : premierJour.getDay() - 1;

  const logementCouleur: Record<string, string> = {
    'Appartement Premium': 'bg-blue-500',
    'Appartement Standard': 'bg-green-500',
    'Studio': 'bg-yellow-500',
  };

  function resasDuJour(jour: number) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    return reservations.filter((r) => r.date_arrivee <= dateStr && r.date_depart > dateStr);
  }

  const joursNoms = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-3 text-center">
        {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
        {joursNoms.map((j) => <div key={j} className="py-1">{j}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: jourDepart }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: nbJours }).map((_, i) => {
          const jour = i + 1;
          const resas = resasDuJour(jour);
          const estAujourdhui = jour === now.getDate();
          return (
            <div
              key={jour}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${estAujourdhui ? 'ring-2 ring-primary' : ''}`}
            >
              <span className={estAujourdhui ? 'font-bold text-primary' : ''}>{jour}</span>
              {resas.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {resas.slice(0, 3).map((r, ri) => (
                    <div key={ri} className={`w-1.5 h-1.5 rounded-full ${logementCouleur[r.logement] ?? 'bg-gray-400'}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 justify-center text-xs text-muted">
        {Object.entries(logementCouleur).map(([nom, cls]) => (
          <div key={nom} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${cls}`} />
            <span>{nom.split(' ')[1] ?? nom}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
