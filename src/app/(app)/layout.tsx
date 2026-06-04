import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/connexion');

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('lu_par_destinataire', false)
    .neq('auteur_id', user.id);

  return (
    <AppShell messagesNonLus={count ?? 0}>
      {children}
    </AppShell>
  );
}
