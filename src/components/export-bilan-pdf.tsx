'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import type { BilanMensuel } from '@/types/database';
import { formatFCFA } from '@/lib/utils';

// jsPDF + autoTable sont importés dynamiquement pour éviter les erreurs SSR
async function genererPDF(bilan: BilanMensuel, encaissements: EncRow[], depenses: DepRow[]) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  const moisLabel = new Date(bilan.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // === En-tête ===
  doc.setFillColor(26, 58, 92); // #1A3A5C
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Resi', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bilan mensuel — ${moisLabel}`, 14, 28);

  let y = 45;

  // === Encaissements par logement ===
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Encaissements', 14, y);
  y += 3;

  if (encaissements.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Description', 'Logement', 'Montant']],
      body: encaissements.map((e) => [e.description, e.logement ?? '—', formatFCFA(e.montant)]),
      theme: 'striped',
      headStyles: { fillColor: [26, 58, 92], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun encaissement ce mois.', 14, y);
    y += 10;
  }

  // === Dépenses par catégorie ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Dépenses par catégorie', 14, y);
  y += 3;

  if (depenses.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Catégorie', 'Description', 'Montant']],
      body: depenses.map((d) => [d.categorie, d.description ?? '—', formatFCFA(d.montant)]),
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune dépense ce mois.', 14, y);
    y += 10;
  }

  // === Résumé financier ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé financier', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    body: [
      ['Chiffre d\'affaires total', formatFCFA(bilan.ca_total)],
      ['Charges totales', formatFCFA(bilan.charges_total)],
      ['Bénéfice net', formatFCFA(bilan.benefice_net)],
      ['Remboursement prêt mis de côté', formatFCFA(bilan.remboursement_mis_de_cote)],
      ['Rémunération RHODES', formatFCFA(bilan.remuneration_rhodes)],
      ['Rémunération BOMBOMA', formatFCFA(bilan.remuneration_bomboma)],
      ['Solde pot commun cumulé', formatFCFA(bilan.solde_pot_commun)],
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // === Zone de signature ===
  if (y > 240) { doc.addPage(); y = 30; }
  doc.setDrawColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Signature RHODES', 14, y);
  doc.line(14, y + 3, 90, y + 3);
  doc.text('Date : ____/____/________', 14, y + 12);

  doc.text('Signature BOMBOMA', 120, y);
  doc.line(120, y + 3, 196, y + 3);
  doc.text('Date : ____/____/________', 120, y + 12);

  // === Pied de page ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Resi — Gestion locative Lomé — Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`bilan-${moisLabel.replace(/\s/g, '-')}.pdf`);
}

interface EncRow { description: string; logement: string | null; montant: number }
interface DepRow { categorie: string; description: string | null; montant: number }

export function BoutonExportPDF({ bilan }: { bilan: BilanMensuel }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleExport() {
    setLoading(true);

    const debut = bilan.mois;
    const d = new Date(bilan.mois);
    const finDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const fin = `${finDate.getFullYear()}-${String(finDate.getMonth() + 1).padStart(2, '0')}-${String(finDate.getDate()).padStart(2, '0')}`;

    const [{ data: enc }, { data: dep }] = await Promise.all([
      supabase
        .from('encaissements')
        .select('description, montant, reservation_id')
        .gte('date_encaissement', debut)
        .lte('date_encaissement', fin)
        .order('date_encaissement'),
      supabase
        .from('depenses')
        .select('categorie, description, montant')
        .gte('date_depense', debut)
        .lte('date_depense', fin)
        .order('date_depense'),
    ]);

    // Chercher les noms de logement liés aux encaissements
    const resaIds = (enc ?? []).map((e) => e.reservation_id).filter(Boolean) as string[];
    let resaMap: Record<string, string> = {};
    if (resaIds.length > 0) {
      const { data: resas } = await supabase
        .from('reservations')
        .select('id, logement')
        .in('id', resaIds);
      resaMap = Object.fromEntries((resas ?? []).map((r) => [r.id, r.logement]));
    }

    const encaissements: EncRow[] = (enc ?? []).map((e) => ({
      description: e.description,
      logement: e.reservation_id ? resaMap[e.reservation_id] ?? null : null,
      montant: e.montant,
    }));

    const depenses: DepRow[] = (dep ?? []).map((d2) => ({
      categorie: d2.categorie,
      description: d2.description,
      montant: d2.montant,
    }));

    await genererPDF(bilan, encaissements, depenses);
    setLoading(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-light transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? 'Génération...' : 'Exporter en PDF'}
    </button>
  );
}
