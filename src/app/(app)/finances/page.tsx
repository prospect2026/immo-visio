import { createClient } from '@/lib/supabase/server';
import { FinancesClient } from '@/components/finances-client';

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const supabase = await createClient();

  const [
    { data: depenses },
    { data: encaissements },
    { data: bilans },
    { data: reservations },
  ] = await Promise.all([
    supabase.from('depenses').select('*').order('date_depense', { ascending: false }),
    supabase.from('encaissements').select('*').order('date_encaissement', { ascending: false }),
    supabase.from('bilans_mensuels').select('*').order('mois', { ascending: false }),
    supabase.from('reservations').select('id, locataire_nom, logement').order('date_arrivee', { ascending: false }),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <FinancesClient
        depenses={depenses ?? []}
        encaissements={encaissements ?? []}
        bilans={bilans ?? []}
        reservations={reservations ?? []}
      />
    </div>
  );
}
