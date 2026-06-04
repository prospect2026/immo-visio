import { createClient } from '@/lib/supabase/server';
import { MessagerieClient } from '@/components/messagerie-client';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  await supabase
    .from('messages')
    .update({ lu_par_destinataire: true })
    .neq('auteur_id', user.id)
    .eq('lu_par_destinataire', false);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col">
      <MessagerieClient
        messages={messages ?? []}
        userId={user.id}
        userEmail={user.email ?? ''}
      />
    </div>
  );
}
