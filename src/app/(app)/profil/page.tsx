import { createClient } from '@/lib/supabase/server';
import { ProfilClient } from '@/components/profil-client';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const nom = user.email?.toLowerCase().includes('rhodes') || user.email?.toLowerCase().includes('denzel')
    ? 'RHODES'
    : 'BOMBOMA';

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Profil</h1>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {nom[0]}
          </div>
          <div>
            <p className="text-xl font-bold">{nom}</p>
            <p className="text-muted text-sm">{user.email}</p>
            <p className="text-xs text-muted mt-1">
              {nom === 'RHODES' ? 'Associé — Gestion à distance' : 'Associé — Gestion sur le terrain'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-3">
        <h2 className="font-semibold">Informations du complexe</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">Localisation</span>
            <span className="font-medium">Lomé, Togo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Logements</span>
            <span className="font-medium">3 unités</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Prêt en cours</span>
            <span className="font-medium">4 100 000 FCFA (12 mois)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Charges fixes / mois</span>
            <span className="font-medium">492 000 FCFA</span>
          </div>
        </div>
      </div>

      <ProfilClient />
    </div>
  );
}
