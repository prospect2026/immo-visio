'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatFCFA } from '@/lib/utils';

// Couleurs par catégorie de dépense
const COULEURS_CATEGORIES: Record<string, string> = {
  'loyer bailleresse': '#1A3A5C',
  'internet': '#2a5a8c',
  'ménage': '#1D9E75',
  'gaz': '#e67e22',
  'entretien clim': '#3498db',
  'transport': '#9b59b6',
  'imprévus': '#e74c3c',
  'réparation': '#f39c12',
  'autre': '#95a5a6',
};

interface DonneeCA {
  mois: string;
  montant: number;
}

interface DonneeCharge {
  categorie: string;
  montant: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTooltip(value: any) {
  return formatFCFA(Number(value) || 0);
}

export function GraphiqueCA({ donnees }: { donnees: DonneeCA[] }) {
  if (donnees.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border text-center text-muted py-8">
        Pas encore de données pour le graphique CA
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h2 className="font-semibold mb-4">CA mensuel — 6 derniers mois</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={donnees} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              labelStyle={{ fontWeight: 'bold' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            />
            <Bar dataKey="montant" name="CA" fill="#1A3A5C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GraphiqueCharges({ donnees }: { donnees: DonneeCharge[] }) {
  const donneesNonZero = donnees.filter((d) => d.montant > 0);

  if (donneesNonZero.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border text-center text-muted py-8">
        Aucune charge enregistrée ce mois
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h2 className="font-semibold mb-4">Répartition des charges — mois en cours</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donneesNonZero}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="montant"
              nameKey="categorie"
            >
              {donneesNonZero.map((entry) => (
                <Cell key={entry.categorie} fill={COULEURS_CATEGORIES[entry.categorie] ?? '#95a5a6'} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value: string) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
