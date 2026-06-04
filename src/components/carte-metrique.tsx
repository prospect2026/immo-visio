export function CarteMetrique({
  label,
  valeur,
  couleur = 'text-foreground',
}: {
  label: string;
  valeur: string;
  couleur?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-lg font-bold ${couleur}`}>{valeur}</p>
    </div>
  );
}
