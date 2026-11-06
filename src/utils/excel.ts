import * as XLSX from 'xlsx';
import { DailySheet, FuelingEntry } from '../types';
import { calculateSheetSummary, formatNumber } from './calculations';

/**
 * Exports a DailySheet to an Excel file formatted with separated Cavalo and Carreta TK columns
 */
export function exportSheetToExcel(sheet: DailySheet) {
  const summary = calculateSheetSummary(sheet);

  const totalLitrosCavalo = sheet.entries.reduce(
    (acc, curr) => acc + (curr.litrosCavalo !== undefined ? curr.litrosCavalo : (curr.litrosCarreta ? 0 : Number(curr.litrosDiesel) || 0)),
    0
  );

  const totalLitrosCarreta = sheet.entries.reduce(
    (acc, curr) => acc + (Number(curr.litrosCarreta) || 0),
    0
  );

  // Build rows matching the Excel structure
  const data: (string | number)[][] = [
    ['ABERTURA', '', 'FECHAMENTO', '', 'LITROS ABASTECIDOS', ''],
    [`TANQUE: ${formatNumber(sheet.aberturaTanque, 1)} L`, '', `TANQUE: ${formatNumber(sheet.fechamentoTanque, 1)} L`, '', `TANQUE: ${formatNumber(summary.totalLitrosAbastecidos, 1)} L`, ''],
    ['', '', '', '', '', ''],
    ['DATA:', sheet.date, '', '', '', '', '', ''],
    [
      'DATA',
      'PLACA CAVALO',
      'LITROS CAVALO',
      'PLACA CARRETA TK',
      'LITROS CARRETA TK',
      'TOTAL DIESEL (L)',
      'HORA',
      'FRENTISTA',
      'MOTORISTA',
      'HODOMETRO',
      'HORIMETRO',
      'ROTA',
    ],
  ];

  sheet.entries.forEach((item) => {
    const cLitros = item.litrosCavalo !== undefined ? item.litrosCavalo : (item.litrosCarreta ? 0 : item.litrosDiesel);
    const tkLitros = item.litrosCarreta || 0;

    data.push([
      item.date || sheet.date,
      item.placa.toUpperCase(),
      cLitros,
      (item.placaCarreta || '').toUpperCase(),
      tkLitros,
      item.litrosDiesel || (cLitros + tkLitros),
      item.hora || '',
      item.frentista || '',
      item.motorista || '',
      item.hodometro || 0,
      item.horimetro || 0,
      item.rota || '',
    ]);
  });

  // Total summary row
  data.push([
    'TOTAL',
    `${sheet.entries.length} Veículos`,
    totalLitrosCavalo,
    'CARRETA TK',
    totalLitrosCarreta,
    summary.totalLitrosAbastecidos,
    '',
    '',
    '',
    '',
    '',
    `Diferença Tanque: ${summary.diferencaTanque > 0 ? '+' : ''}${formatNumber(summary.diferencaTanque, 1)} L`,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Merge cells for ABERTURA, FECHAMENTO, LITROS ABASTECIDOS header
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // ABERTURA
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // FECHAMENTO
    { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // LITROS ABASTECIDOS
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
    { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } },
  ];

  // Set column widths
  worksheet['!cols'] = [
    { wch: 14 }, // DATA
    { wch: 16 }, // PLACA CAVALO
    { wch: 16 }, // LITROS CAVALO
    { wch: 18 }, // PLACA CARRETA TK
    { wch: 18 }, // LITROS CARRETA TK
    { wch: 18 }, // TOTAL DIESEL
    { wch: 10 }, // HORA
    { wch: 22 }, // FRENTISTA
    { wch: 24 }, // MOTORISTA
    { wch: 14 }, // HODOMETRO
    { wch: 14 }, // HORIMETRO
    { wch: 30 }, // ROTA
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Abastecimento_${sheet.date}`);

  XLSX.writeFile(workbook, `Controle_Abastecimento_${sheet.date}.xlsx`);
}

/**
 * Parses an uploaded Excel file to extract DailySheet and FuelingEntries
 */
export async function parseExcelFile(file: File): Promise<Partial<DailySheet>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let aberturaTanque = 0;
        let fechamentoTanque = 0;
        let date = new Date().toISOString().split('T')[0];
        const entries: FuelingEntry[] = [];

        // Traverse rows to locate headers and data
        let tableHeaderRowIndex = -1;

        for (let r = 0; r < rawData.length; r++) {
          const row = rawData[r] || [];
          const rowStr = row.map((cell) => String(cell || '').toUpperCase()).join(' ');

          if (rowStr.includes('ABERTURA') || rowStr.includes('TANQUE:')) {
            row.forEach((cell, colIdx) => {
              const str = String(cell);
              if (str.toUpperCase().includes('TANQUE:')) {
                const match = str.match(/[\d.,]+/);
                if (match) {
                  const val = parseFloat(match[0].replace(',', '.'));
                  if (colIdx < 2 && !aberturaTanque) aberturaTanque = val;
                  else if (colIdx >= 2 && colIdx < 4 && !fechamentoTanque) fechamentoTanque = val;
                }
              }
            });
          }

          if (rowStr.includes('DATA')) {
            const dateCell = row.find((cell) => cell && String(cell).match(/[\d/.-]+/));
            if (dateCell) {
              const cleaned = String(dateCell).trim();
              if (cleaned.includes('/')) {
                const parts = cleaned.split('/');
                if (parts.length === 3) {
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  let year = parts[2];
                  if (year.length === 2) year = `20${year}`;
                  date = `${year}-${month}-${day}`;
                }
              } else if (cleaned.includes('-') && cleaned.length === 10) {
                date = cleaned;
              }
            }
          }

          if (rowStr.includes('PLACA') && rowStr.includes('LITROS')) {
            tableHeaderRowIndex = r;
          }
        }

        // If no table header detected, assume standard headers at row 4
        const startIndex = tableHeaderRowIndex !== -1 ? tableHeaderRowIndex + 1 : 5;

        for (let i = startIndex; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[0] || String(row[0]).trim().toUpperCase() === 'TOTAL') continue;

          const placa = String(row[0] || '').trim().toUpperCase();
          if (!placa || placa.length < 3) continue;

          // Checking if extended columns exist
          let litrosCavalo = parseFloat(String(row[1] || '0').replace(',', '.')) || 0;
          let placaCarreta = String(row[2] || '').trim().toUpperCase();
          let litrosCarreta = parseFloat(String(row[3] || '0').replace(',', '.')) || 0;
          let litrosDiesel = parseFloat(String(row[4] || '0').replace(',', '.')) || (litrosCavalo + litrosCarreta);

          // Fallback for simple legacy format: row[0]=placa, row[1]=hora, row[2]=litros
          if (isNaN(litrosCavalo) || litrosCavalo === 0) {
            litrosDiesel = parseFloat(String(row[2] || '0').replace(',', '.')) || 0;
            litrosCavalo = litrosDiesel;
            placaCarreta = '';
            litrosCarreta = 0;
          }

          const hora = String(row[6] || row[1] || '08:00').trim();
          const frentista = String(row[7] || row[3] || '').trim();
          const motorista = String(row[8] || row[4] || '').trim();
          const hodometro = parseInt(String(row[9] || row[5] || '0').replace(/\D/g, ''), 10) || 0;
          const horimetro = parseInt(String(row[10] || row[6] || '0').replace(/\D/g, ''), 10) || 0;
          const rota = String(row[11] || row[7] || '').trim();

          entries.push({
            id: `imp-${Date.now()}-${i}`,
            date,
            hora,
            placa,
            litrosCavalo,
            placaCarreta,
            litrosCarreta,
            litrosDiesel: litrosDiesel || (litrosCavalo + litrosCarreta),
            frentista,
            motorista,
            hodometro,
            horimetro,
            rota,
          });
        }

        resolve({
          date,
          aberturaTanque,
          fechamentoTanque,
          entries,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsBinaryString(file);
  });
}
