import { DailySheet, FuelingEntry, Vehicle } from '../types';

/**
 * Calculates historical KM/L and L/Hour for fueling entries.
 * Orders entries by date/time or odometer and compares with previous entry of the same vehicle.
 */
export function calculateFuelMetrics(allEntries: FuelingEntry[]): FuelingEntry[] {
  // Group entries by vehicle plate
  const vehicleGroups: { [placa: string]: FuelingEntry[] } = {};

  allEntries.forEach((entry) => {
    const key = (entry.placa || entry.placaCarreta || 'S/ PLACA').trim().toUpperCase();
    if (!vehicleGroups[key]) {
      vehicleGroups[key] = [];
    }
    vehicleGroups[key].push({ ...entry });
  });

  const enrichedEntries: FuelingEntry[] = [];

  Object.keys(vehicleGroups).forEach((placa) => {
    // Sort chronologically by date then time or odometer
    const entries = vehicleGroups[placa].sort((a, b) => {
      const dateTimeA = `${a.date}T${a.hora || '00:00'}`;
      const dateTimeB = `${b.date}T${b.hora || '00:00'}`;
      if (dateTimeA !== dateTimeB) {
        return dateTimeA.localeCompare(dateTimeB);
      }
      return a.hodometro - b.hodometro;
    });

    for (let i = 0; i < entries.length; i++) {
      const current = entries[i];
      if (i > 0) {
        const previous = entries[i - 1];
        const kmRodados = current.hodometro - previous.hodometro;
        const horimetroDiff = current.horimetro - previous.horimetro;

        if (kmRodados > 0 && current.litrosDiesel > 0) {
          current.kmRodados = kmRodados;
          current.kmPorLitro = Number((kmRodados / current.litrosDiesel).toFixed(2));
        }

        if (horimetroDiff > 0 && current.litrosDiesel > 0) {
          current.litrosPorHora = Number((current.litrosDiesel / horimetroDiff).toFixed(2));
        }
      }
      enrichedEntries.push(current);
    }
  });

  return enrichedEntries;
}

/**
 * Calculates daily sheet summaries including tank balance
 */
export function calculateSheetSummary(sheet: DailySheet) {
  const totalLitrosAbastecidos = sheet.entries.reduce(
    (acc, item) => acc + (Number(item.litrosDiesel) || 0),
    0
  );

  const recebimentos = Number(sheet.recebimentoTanque) || 0;
  const abertura = Number(sheet.aberturaTanque) || 0;
  const fechamentoReal = Number(sheet.fechamentoTanque) || 0;

  // Total available fuel = Start + Received
  const totalTanqueDisponivel = abertura + recebimentos;
  // Expected end = Start + Received - Pumped
  const fechamentoTeorico = totalTanqueDisponivel - totalLitrosAbastecidos;
  const diferencaTanque = fechamentoReal - fechamentoTeorico;

  return {
    totalLitrosAbastecidos: Number(totalLitrosAbastecidos.toFixed(2)),
    totalTanqueDisponivel: Number(totalTanqueDisponivel.toFixed(2)),
    fechamentoTeorico: Number(fechamentoTeorico.toFixed(2)),
    diferencaTanque: Number(diferencaTanque.toFixed(2)),
    isPerda: diferencaTanque < -0.01,
    isSobra: diferencaTanque > 0.01,
    quantidadeVeiculos: sheet.entries.length,
  };
}

/**
 * Formats currency / numbers for Portuguese Brazilian standards
 */
export function formatNumber(val: number | undefined, decimals = 2): string {
  if (val === undefined || isNaN(val)) return '0,00';
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPlate(plate: string): string {
  if (!plate) return '';
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function getEfficiencyColor(kmL: number | undefined, target = 2.5): string {
  if (!kmL || kmL === 0) return 'text-slate-400 dark:text-slate-500';
  if (kmL >= target) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (kmL >= target * 0.8) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-rose-600 dark:text-rose-400 font-bold';
}
