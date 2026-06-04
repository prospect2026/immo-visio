'use client';

import dynamic from 'next/dynamic';

// Recharts n'est pas compatible SSR — import dynamique obligatoire
const GraphiqueCA = dynamic(
  () => import('./graphiques-dashboard').then((mod) => mod.GraphiqueCA),
  { ssr: false, loading: () => <div className="bg-card rounded-2xl p-5 shadow-sm border border-border h-72 animate-pulse" /> }
);

const GraphiqueCharges = dynamic(
  () => import('./graphiques-dashboard').then((mod) => mod.GraphiqueCharges),
  { ssr: false, loading: () => <div className="bg-card rounded-2xl p-5 shadow-sm border border-border h-72 animate-pulse" /> }
);

interface Props {
  donneesCA: { mois: string; montant: number }[];
  donneesCharges: { categorie: string; montant: number }[];
}

export function GraphiquesWrapper({ donneesCA, donneesCharges }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GraphiqueCA donnees={donneesCA} />
      <GraphiqueCharges donnees={donneesCharges} />
    </div>
  );
}
