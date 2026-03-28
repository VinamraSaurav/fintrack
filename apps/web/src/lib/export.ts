import type { ExpenseResponse } from '@fintrack/shared';
import { getTodayDateValue } from '@/lib/utils';

interface ExportOptions {
  dateFrom?: string;
  dateTo?: string;
  userName?: string;
}

const PDF_ITEM_FONT_SIZE = 7.5;
const PDF_ITEM_LINE_HEIGHT = 3.4;
const PDF_ITEM_NOTE_FONT_SIZE = 6.1;
const PDF_ITEM_NOTE_LINE_HEIGHT = 2.8;
const PDF_ITEM_COLUMN_WIDTH = 90;
const PDF_ITEM_TEXT_WIDTH = PDF_ITEM_COLUMN_WIDTH - 4;

function truncatePdfText(doc: any, text: string, maxWidth: number) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (doc.getTextWidth(trimmed) <= maxWidth) return trimmed;

  let candidate = trimmed;
  while (candidate.length > 0 && doc.getTextWidth(`${candidate}...`) > maxWidth) {
    candidate = candidate.slice(0, -1).trimEnd();
  }

  return candidate ? `${candidate}...` : '...';
}

function getWrappedPdfLines(doc: any, text: string, maxWidth: number) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  return doc
    .splitTextToSize(trimmed, maxWidth)
    .map((line: string) => line.trim())
    .filter(Boolean);
}

function getClampedPdfLines(doc: any, text: string, maxWidth: number, maxLines: number) {
  const splitLines = getWrappedPdfLines(doc, text, maxWidth);

  if (splitLines.length <= maxLines) {
    return splitLines;
  }

  return [
    ...splitLines.slice(0, Math.max(0, maxLines - 1)),
    truncatePdfText(doc, splitLines.slice(Math.max(0, maxLines - 1)).join(' '), maxWidth),
  ];
}

function getClampedPdfNoteLines(doc: any, note: string, maxWidth: number) {
  return getClampedPdfLines(doc, note, maxWidth, 2);
}

function flattenExpenses(expenses: ExpenseResponse[]) {
  const rows: Record<string, string | number>[] = [];
  for (const exp of expenses) {
    for (const item of exp.items) {
      const unitPrice =
        item.unitPrice ??
        (item.quantity > 0 ? Math.round((item.amount / item.quantity) * 100) / 100 : 0);
      rows.push({
        Date: exp.expenseDate,
        Item: item.displayName,
        'Item Note': item.note ?? '',
        Category: item.categoryName ?? 'Uncategorized',
        Subcategory: item.subcategoryName ?? '-',
        Payment: item.paymentMode ?? '-',
        Quantity: item.quantity,
        Unit: item.unit ?? '-',
        'Price/Unit': unitPrice,
        Amount: item.amount,
      });
    }
  }
  return rows;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(expenses: ExpenseResponse[], options?: ExportOptions) {
  const rows = flattenExpenses(expenses);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '');
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(','),
    ),
  ];

  const dateStr = getTodayDateValue();
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `finverse-expenses-${dateStr}.csv`);
}

export async function exportXLSX(expenses: ExpenseResponse[], options?: ExportOptions) {
  const XLSX = await import('xlsx');
  const rows = flattenExpenses(expenses);
  if (rows.length === 0) return;

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

  const colWidths = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const dateStr = getTodayDateValue();
  XLSX.writeFile(wb, `finverse-expenses-${dateStr}.xlsx`);
}

export async function exportPDF(expenses: ExpenseResponse[], options?: ExportOptions) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const rows = flattenExpenses(expenses);
  if (rows.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(99, 102, 241); // primary color
  doc.text('FinVerse', 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('Expense Report', 14, 22);

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);

  const metaLines: string[] = [];
  metaLines.push(
    `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  );
  if (options?.dateFrom || options?.dateTo) {
    const from = options.dateFrom ?? 'Start';
    const to = options.dateTo ?? 'Today';
    metaLines.push(`Period: ${from} to ${to}`);
  }
  metaLines.push(`Total items: ${rows.length}`);

  const totalAmount = rows.reduce(
    (sum, r) => sum + (typeof r.Amount === 'number' ? r.Amount : 0),
    0,
  );
  metaLines.push(`Total amount: INR ${totalAmount.toLocaleString('en-IN')}`);

  doc.text(metaLines, pageWidth - 14, 12, { align: 'right' });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 27, pageWidth - 14, 27);

  // Table
  const headers = [
    'Date',
    'Item',
    'Category',
    'Subcategory',
    'Payment',
    'Qty',
    'Unit',
    'Price/Unit',
    'Amount (INR)',
  ];
  const pdfRows = rows.map((r) => ({
    date: String(r.Date),
    item: String(r.Item),
    itemNote: String(r['Item Note'] ?? ''),
    category: String(r.Category),
    subcategory: String(r.Subcategory),
    payment: String(r.Payment),
    quantity: String(r.Quantity),
    unit: String(r.Unit),
    pricePerUnit:
      typeof r['Price/Unit'] === 'number' ? r['Price/Unit'].toLocaleString('en-IN') : r['Price/Unit'],
    amount: typeof r.Amount === 'number' ? r.Amount.toLocaleString('en-IN') : r.Amount,
  }));
  const itemLinesByRow = new Map<number, string[]>();
  const noteLinesByRow = new Map<number, string[]>();
  const body = pdfRows.map((r) => [
    r.date,
    r.item,
    r.category,
    r.subcategory,
    r.payment,
    r.quantity,
    r.unit,
    r.pricePerUnit,
    r.amount,
  ]);

  // Add total row
  body.push(['', '', '', '', '', '', '', 'TOTAL', `INR ${totalAmount.toLocaleString('en-IN')}`]);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 30,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: PDF_ITEM_COLUMN_WIDTH },
      2: { cellWidth: 21 },
      3: { cellWidth: 23 },
      4: { cellWidth: 16 },
      5: { cellWidth: 10, halign: 'right' },
      6: { cellWidth: 12 },
      7: { cellWidth: 18, halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 1 && data.row.index < pdfRows.length) {
        const row = pdfRows[data.row.index];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF_ITEM_FONT_SIZE);
        const itemLines = getClampedPdfLines(doc, row.item, PDF_ITEM_TEXT_WIDTH, 2);
        doc.setFontSize(PDF_ITEM_NOTE_FONT_SIZE);
        const noteLines = row.itemNote
          ? getClampedPdfNoteLines(doc, row.itemNote, PDF_ITEM_TEXT_WIDTH)
          : [];

        itemLinesByRow.set(data.row.index, itemLines);
        noteLinesByRow.set(data.row.index, noteLines);
        data.cell.text = itemLines;
        data.cell.styles.valign = 'top';
        data.cell.styles.minCellHeight =
          4 +
          itemLines.length * PDF_ITEM_LINE_HEIGHT +
          (noteLines.length > 0 ? 1.4 + noteLines.length * PDF_ITEM_NOTE_LINE_HEIGHT : 0);
        doc.setFontSize(PDF_ITEM_FONT_SIZE);
      }

      // Style the total row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [243, 244, 246];
        data.cell.styles.textColor = [17, 24, 39];
        data.cell.styles.fontSize = 8.5;
      }
    },
    didDrawCell: (data: any) => {
      if (
        data.section !== 'body' ||
        data.column.index !== 1 ||
        data.row.index >= pdfRows.length ||
        data.row.index === body.length - 1
      ) {
        return;
      }

      const noteLines = noteLinesByRow.get(data.row.index);
      const itemLines = itemLinesByRow.get(data.row.index) ?? [];
      if (!noteLines || noteLines.length === 0) {
        return;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_ITEM_NOTE_FONT_SIZE);
      doc.setTextColor(156, 163, 175);
      doc.text(
        noteLines,
        data.cell.x + 2,
        data.cell.y + 3.2 + itemLines.length * PDF_ITEM_LINE_HEIGHT,
        {
          baseline: 'top',
          maxWidth: data.cell.width - 4,
        },
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF_ITEM_FONT_SIZE);
      doc.setTextColor(31, 41, 55);
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${data.pageNumber}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, {
        align: 'center',
      });
    },
  });

  const dateStr = getTodayDateValue();
  doc.save(`finverse-expenses-${dateStr}.pdf`);
}
