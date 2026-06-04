import { createClient } from '@/lib/supabase/server';
import { ListeReservations } from '@/components/liste-reservations';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .order('date_arrivee', { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Réservations</h1>
        <Link
          href="/reservations/nouveau"
          className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          + Nouvelle
        </Link>
      </div>
      <ListeReservations reservations={reservations ?? []} />
    </div>
  );
}
