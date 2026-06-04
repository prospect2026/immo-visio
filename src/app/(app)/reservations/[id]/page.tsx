import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DetailReservation } from '@/components/detail-reservation';

export const dynamic = 'force-dynamic';

export default async function ReservationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (!reservation) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <DetailReservation reservation={reservation} />
    </div>
  );
}
