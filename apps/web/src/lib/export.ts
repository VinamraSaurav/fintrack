import type { ExpenseResponse } from '@fintrack/shared';

interface ExportOptions {
  dateFrom?: string;
  dateTo?: string;
  userName?: string;
}

function flattenExpenses(expenses: ExpenseResponse[]) {
  const rows: Record<string, string | number>[] = [];
  for (const exp of expenses) {
    for (const item of exp.items) {
      const unitPrice = item.unitPrice ?? (item.quantity > 0 ? Math.round((item.amount / item.quantity) * 100) / 100 : 0);
      rows.push({
        Date: exp.expenseDate,
        Item: item.displayName,
        Category: item.categoryName ?? 'Uncategorized',
        Subcategory: item.subcategoryName ?? '-',
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
      headers.map((h) => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','),
    ),
  ];

  const dateStr = new Date().toISOString().split('T')[0];
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

  const dateStr = new Date().toISOString().split('T')[0];
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
  metaLines.push(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  if (options?.dateFrom || options?.dateTo) {
    const from = options.dateFrom ?? 'Start';
    const to = options.dateTo ?? 'Today';
    metaLines.push(`Period: ${from} to ${to}`);
  }
  metaLines.push(`Total items: ${rows.length}`);

  const totalAmount = rows.reduce((sum, r) => sum + (typeof r.Amount === 'number' ? r.Amount : 0), 0);
  metaLines.push(`Total amount: INR ${totalAmount.toLocaleString('en-IN')}`);

  doc.text(metaLines, pageWidth - 14, 12, { align: 'right' });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 27, pageWidth - 14, 27);

  // Table
  const headers = ['Date', 'Item', 'Category', 'Subcategory', 'Qty', 'Unit', 'Price/Unit', 'Amount (INR)'];
  const body = rows.map((r) => [
    r.Date,
    r.Item,
    r.Category,
    r.Subcategory,
    r.Quantity,
    r.Unit,
    typeof r['Price/Unit'] === 'number' ? r['Price/Unit'].toLocaleString('en-IN') : r['Price/Unit'],
    typeof r.Amount === 'number' ? r.Amount.toLocaleString('en-IN') : r.Amount,
  ]);

  // Add total row
  body.push([
    '', '', '', '', '', '', 'TOTAL',
    `INR ${totalAmount.toLocaleString('en-IN')}`,
  ]);

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
      0: { cellWidth: 22 },
      4: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      // Style the total row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [243, 244, 246];
        data.cell.styles.textColor = [17, 24, 39];
        data.cell.styles.fontSize = 8.5;
      }
    },
    didDrawPage: (data: any) => {
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      );
    },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`finverse-expenses-${dateStr}.pdf`);
}
