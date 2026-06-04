'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfilClient() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/connexion');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full py-3 border border-danger text-danger rounded-xl font-semibold hover:bg-red-50 transition-colors"
    >
      Se déconnecter
    </button>
  );
}
