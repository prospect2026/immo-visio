'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Reservation, ReservationStatut } from '@/types/database';
import { formatFCFA, formatDate } from '@/lib/utils';

const listeStatuts: ReservationStatut[] = ['confirmée', 'en cours', 'terminée', 'annulée'];

export function DetailReservation({ reservation: initial }: { reservation: Reservation }) {
  const router = useRouter();
  const supabase = createClient();
  const [statut, setStatut] = useState(initial.statut);
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('reservations').update({ statut, notes: notes || null }).eq('id', initial.id);
    setSaving(false);
    router.refresh();
  }

  const badgeStatut: Record<string, string> = {
    'confirmée': 'bg-blue-100 text-blue-800',
    'en cours': 'bg-green-100 text-green-800',
    'terminée': 'bg-gray-100 text-gray-600',
    'annulée': 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-primary text-sm font-medium">
        ← Retour
      </button>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{initial.locataire_nom}</h1>
            <p className="text-muted">{initial.logement}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${badgeStatut[initial.statut]}`}>
            {initial.statut}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted">Arrivée</p>
            <p className="font-medium">{formatDate(initial.date_arrivee)}</p>
          </div>
          <div>
            <p className="text-muted">Départ</p>
            <p className="font-medium">{formatDate(initial.date_depart)}</p>
          </div>
          <div>
            <p className="text-muted">Type de séjour</p>
            <p className="font-medium">{initial.type_sejour}</p>
          </div>
          <div>
            <p className="text-muted">Montant</p>
            <p className="font-bold text-success">{formatFCFA(initial.montant)}</p>
          </div>
          <div>
            <p className="text-muted">Caution</p>
            <p className="font-medium">
              {initial.caution_montant > 0
                ? `${formatFCFA(initial.caution_montant)} — ${initial.caution_encaissee ? 'Encaissée' : 'Non encaissée'}`
                : 'Aucune'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <h2 className="font-semibold">Modifier</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as ReservationStatut)}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white"
          >
            {listeStatuts.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white resize-none"
            rows={3}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
