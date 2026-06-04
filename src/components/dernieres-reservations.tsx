'use client';

import type { Reservation } from '@/types/database';
import { formatFCFA, formatDate } from '@/lib/utils';
import Link from 'next/link';

const badgeStatut: Record<string, string> = {
  'confirmée': 'bg-blue-100 text-blue-800',
  'en cours': 'bg-green-100 text-green-800',
  'terminée': 'bg-gray-100 text-gray-600',
  'annulée': 'bg-red-100 text-red-800',
};

export function DernieresReservations({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border text-center text-muted">
        Aucune réservation pour le moment
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="flex justify-between items-center p-5 pb-3">
        <h2 className="font-semibold">Dernières réservations</h2>
        <Link href="/reservations" className="text-sm text-primary font-medium">Voir tout</Link>
      </div>
      <div className="divide-y divide-border">
        {reservations.map((r) => (
          <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{r.locataire_nom}</p>
              <p className="text-xs text-muted">{r.logement} — {formatDate(r.date_arrivee)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm">{formatFCFA(r.montant)}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeStatut[r.statut] ?? ''}`}>
                {r.statut}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
