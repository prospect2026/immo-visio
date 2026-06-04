'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TARIFS, type LogementType, type SejourType, type ReservationStatut } from '@/types/database';
import { calculerDateDepart, formatDateISO } from '@/lib/utils';

const logements: LogementType[] = ['Appartement Premium', 'Appartement Standard', 'Studio'];
const typesSejour: SejourType[] = ['nuitée', 'semaine', '2 semaines', '3 semaines', 'mois complet'];
const listeStatuts: ReservationStatut[] = ['confirmée', 'en cours', 'terminée', 'annulée'];

function calculerMontant(logement: LogementType, type: SejourType): number {
  const tarif = TARIFS[logement];
  switch (type) {
    case 'nuitée': return tarif.nuit;
    case 'semaine': return tarif.nuit * 7;
    case '2 semaines': return tarif.nuit * 14;
    case '3 semaines': return tarif.nuit * 21;
    case 'mois complet': return tarif.mois;
  }
}

export default function NouvelleReservation() {
  const router = useRouter();
  const supabase = createClient();

  const [logement, setLogement] = useState<LogementType>('Appartement Premium');
  const [locataire, setLocataire] = useState('');
  const [typeSejour, setTypeSejour] = useState<SejourType>('nuitée');
  const [dateArrivee, setDateArrivee] = useState(formatDateISO(new Date()));
  const [montant, setMontant] = useState(TARIFS['Appartement Premium'].nuit);
  const [cautionMontant, setCautionMontant] = useState(0);
  const [cautionEncaissee, setCautionEncaissee] = useState(false);
  const [statut, setStatut] = useState<ReservationStatut>('confirmée');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const dateDepart = calculerDateDepart(dateArrivee, typeSejour);

  function handleLogementChange(val: LogementType) {
    setLogement(val);
    setMontant(calculerMontant(val, typeSejour));
  }

  function handleTypeSejourChange(val: SejourType) {
    setTypeSejour(val);
    setMontant(calculerMontant(logement, val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErreur('Non authentifié'); setLoading(false); return; }

    const { error } = await supabase.from('reservations').insert({
      logement,
      locataire_nom: locataire,
      type_sejour: typeSejour,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      montant,
      caution_montant: cautionMontant,
      caution_encaissee: cautionEncaissee,
      statut,
      notes: notes || null,
      created_by: user.id,
    });

    if (error) {
      setErreur('Erreur lors de la création');
      setLoading(false);
      return;
    }

    router.push('/reservations');
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Nouvelle réservation</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Logement</label>
          <select
            value={logement}
            onChange={(e) => handleLogementChange(e.target.value as LogementType)}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white"
          >
            {logements.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nom du locataire</label>
          <input
            type="text"
            value={locataire}
            onChange={(e) => setLocataire(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white"
            placeholder="Nom complet"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type de séjour</label>
          <select
            value={typeSejour}
            onChange={(e) => handleTypeSejourChange(e.target.value as SejourType)}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white"
          >
            {typesSejour.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Date d'arrivée</label>
            <input
              type="date"
              value={dateArrivee}
              onChange={(e) => setDateArrivee(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de départ</label>
            <input
              type="date"
              value={dateDepart}
              className="w-full border border-border rounded-xl px-4 py-3 bg-gray-100 text-muted"
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Montant encaissé (FCFA)</label>
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
            className="w-full border border-border rounded-xl px-4 py-3 bg-white"
            min={0}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Caution (FCFA)</label>
            <input
              type="number"
              value={cautionMontant}
              onChange={(e) => setCautionMontant(Number(e.target.value))}
              className="w-full border border-border rounded-xl px-4 py-3 bg-white"
              min={0}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cautionEncaissee}
                onChange={(e) => setCautionEncaissee(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm">Caution encaissée</span>
            </label>
          </div>
        </div>

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
            placeholder="Notes libres..."
          />
        </div>

        {erreur && <p className="text-danger text-sm">{erreur}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
