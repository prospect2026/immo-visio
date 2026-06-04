export function formatFCFA(montant: number): string {
  return montant.toLocaleString('fr-FR') + ' FCFA';
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function debutDuMois(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function finDuMois(): string {
  const d = new Date();
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return formatDateISO(fin);
}

export function joursDisponiblesMois(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function calculerDateDepart(arrivee: string, typeSejour: string): string {
  const d = new Date(arrivee);
  switch (typeSejour) {
    case 'nuitée': d.setDate(d.getDate() + 1); break;
    case 'semaine': d.setDate(d.getDate() + 7); break;
    case '2 semaines': d.setDate(d.getDate() + 14); break;
    case '3 semaines': d.setDate(d.getDate() + 21); break;
    case 'mois complet': d.setMonth(d.getMonth() + 1); break;
  }
  return formatDateISO(d);
}

export function calculerNuitsOccupees(arrivee: string, depart: string): number {
  const a = new Date(arrivee);
  const b = new Date(depart);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
