import { formatFCFA } from '@/lib/utils';

const CHARGES_FIXES = [
  { nom: 'Loyer bailleresse', montant: 300000 },
  { nom: 'Ménage + matériel', montant: 40000 },
  { nom: 'Internet fibre', montant: 30000 },
  { nom: 'Gaz', montant: 20000 },
  { nom: 'Imprévus', montant: 20000 },
  { nom: 'Entretien clim + frigos', montant: 12000 },
  { nom: 'Transport + gestion', montant: 10000 },
  { nom: 'Entretien & réparations', montant: 10000 },
  { nom: 'Épargne remboursement prêt', montant: 50000 },
];

const TOTAL = CHARGES_FIXES.reduce((s, c) => s + c.montant, 0);

export function ChargesFixes() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <h2 className="font-semibold mb-3">Charges fixes mensuelles</h2>
      <ul className="space-y-2">
        {CHARGES_FIXES.map((c) => (
          <li key={c.nom} className="flex justify-between items-center text-sm">
            <span className="text-muted flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {c.nom}
            </span>
            <span className="font-medium">{formatFCFA(c.montant)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
        <span className="font-bold">Total</span>
        <span className="font-bold text-primary text-lg">{formatFCFA(TOTAL)}</span>
      </div>
    </div>
  );
}
