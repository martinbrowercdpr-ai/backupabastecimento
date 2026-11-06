import React, { useState, useMemo } from 'react';
import { FuelingEntry, Vehicle, DailySheet } from '../types';
import { calculateFuelMetrics, formatNumber } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, Truck, Fuel, Award, Calendar, CalendarDays, Filter } from 'lucide-react';

interface FleetAnalyticsProps {
  entries: FuelingEntry[];
  vehicles: Vehicle[];
  allSheets?: DailySheet[];
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7'];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = [
  { idx: 1, dia: 'Segunda', full: 'Segunda-feira', short: 'Seg' },
  { idx: 2, dia: 'Terça', full: 'Terça-feira', short: 'Ter' },
  { idx: 3, dia: 'Quarta', full: 'Quarta-feira', short: 'Qua' },
  { idx: 4, dia: 'Quinta', full: 'Quinta-feira', short: 'Qui' },
  { idx: 5, dia: 'Sexta', full: 'Sexta-feira', short: 'Sex' },
  { idx: 6, dia: 'Sábado', full: 'Sábado', short: 'Sáb' },
  { idx: 0, dia: 'Domingo', full: 'Domingo', short: 'Dom' },
];

export const FleetAnalytics: React.FC<FleetAnalyticsProps> = ({ entries, vehicles, allSheets }) => {
  // Combine entries from all sheets if provided, otherwise use current sheet entries
  const allEntries = useMemo(() => {
    if (allSheets && allSheets.length > 0) {
      const entryMap = new Map<string, FuelingEntry>();
      allSheets.forEach((s) => {
        s.entries.forEach((e) => {
          entryMap.set(e.id, { ...e, sheetId: s.id, date: e.date || s.date });
        });
      });
      entries.forEach((e) => {
        entryMap.set(e.id, e);
      });
      return Array.from(entryMap.values());
    }
    return entries;
  }, [entries, allSheets]);

  // Extract all distinct months (YYYY-MM) available
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.substring(0, 7));
      }
    });
    const arr = Array.from(set).sort().reverse();
    if (arr.length === 0) {
      const now = new Date();
      const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      arr.push(curMonth);
    }
    return arr;
  }, [allEntries]);

  // Selected month state
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '');
  // View mode: 'month' (Formato Mês - Por Dia) | 'weekday' (Por Dia da Semana) | 'vehicle' (Por Veículo)
  const [viewMode, setViewMode] = useState<'month' | 'weekday' | 'vehicle'>('month');

  // Filter entries for the selected month or all
  const filteredEntries = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') {
      return allEntries;
    }
    return allEntries.filter((e) => e.date && e.date.startsWith(selectedMonth));
  }, [allEntries, selectedMonth]);

  const enriched = useMemo(() => calculateFuelMetrics(filteredEntries), [filteredEntries]);

  // Group liters by vehicle plate, route, attendant, and day of week
  const vehicleLitersMap: { [placa: string]: number } = {};
  const routeLitersMap: { [rota: string]: number } = {};
  const attendantLitersMap: { [frentista: string]: number } = {};

  // Group by specific calendar day (YYYY-MM-DD) for the Formato Mês view
  const daysInMonthMap: {
    [dateKey: string]: {
      date: string;
      diaNumero: string;
      diaSemana: string;
      diaSemanaCurta: string;
      dataFormatada: string;
      litros: number;
      litrosCavalo: number;
      litrosCarreta: number;
      qtd: number;
    };
  } = {};

  // Map for days of the week (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const weekdayMap: { [dayIndex: number]: { litros: number; abastecimentos: number } } = {
    1: { litros: 0, abastecimentos: 0 },
    2: { litros: 0, abastecimentos: 0 },
    3: { litros: 0, abastecimentos: 0 },
    4: { litros: 0, abastecimentos: 0 },
    5: { litros: 0, abastecimentos: 0 },
    6: { litros: 0, abastecimentos: 0 },
    0: { litros: 0, abastecimentos: 0 },
  };

  enriched.forEach((e) => {
    const p = (e.placa || e.placaCarreta || 'S/ PLACA').toUpperCase();
    const lTot = Number(e.litrosDiesel) || 0;
    const lCav = Number(e.litrosCavalo) || 0;
    const lCar = Number(e.litrosCarreta) || 0;

    vehicleLitersMap[p] = (vehicleLitersMap[p] || 0) + lTot;

    const r = e.rota || 'Não Especificada';
    routeLitersMap[r] = (routeLitersMap[r] || 0) + lTot;

    const f = e.frentista || 'Geral';
    attendantLitersMap[f] = (attendantLitersMap[f] || 0) + lTot;

    if (e.date) {
      const parts = e.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);

        if (!isNaN(d.getTime())) {
          const dayIdx = d.getDay();
          if (weekdayMap[dayIdx]) {
            weekdayMap[dayIdx].litros += lTot;
            weekdayMap[dayIdx].abastecimentos += 1;
          }

          const dateKey = e.date;
          const weekdayInfo = WEEKDAY_NAMES.find((w) => w.idx === dayIdx) || WEEKDAY_NAMES[0];
          if (!daysInMonthMap[dateKey]) {
            daysInMonthMap[dateKey] = {
              date: dateKey,
              diaNumero: String(day).padStart(2, '0'),
              diaSemana: weekdayInfo.full,
              diaSemanaCurta: weekdayInfo.short,
              dataFormatada: `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`,
              litros: 0,
              litrosCavalo: 0,
              litrosCarreta: 0,
              qtd: 0,
            };
          }
          daysInMonthMap[dateKey].litros += lTot;
          daysInMonthMap[dateKey].litrosCavalo += lCav;
          daysInMonthMap[dateKey].litrosCarreta += lCar;
          daysInMonthMap[dateKey].qtd += 1;
        }
      }
    }
  });

  // Data for Formato Mês (sorted chronologically by day)
  const monthDailyChartData = Object.keys(daysInMonthMap)
    .sort()
    .map((dateKey) => {
      const item = daysInMonthMap[dateKey];
      return {
        date: item.date,
        diaDisplay: `Dia ${item.diaNumero}`,
        diaNumero: item.diaNumero,
        diaSemana: item.diaSemana,
        diaSemanaCurta: item.diaSemanaCurta,
        dataFormatada: item.dataFormatada,
        litros: Number(item.litros.toFixed(1)),
        litrosCavalo: Number(item.litrosCavalo.toFixed(1)),
        litrosCarreta: Number(item.litrosCarreta.toFixed(1)),
        qtd: item.qtd,
      };
    });

  // Data for Day of Week chart
  const weekdayChartData = WEEKDAY_NAMES.map((d) => ({
    dia: d.dia,
    diaCompleto: d.full,
    litros: Number(weekdayMap[d.idx].litros.toFixed(1)),
    qtd: weekdayMap[d.idx].abastecimentos,
  }));

  const vehicleChartData = Object.keys(vehicleLitersMap).map((placa) => {
    const vehicleEntries = enriched.filter((e) => e.placa === placa && e.kmPorLitro);
    const avgKmL =
      vehicleEntries.length > 0
        ? vehicleEntries.reduce((acc, curr) => acc + (curr.kmPorLitro || 0), 0) / vehicleEntries.length
        : 0;

    return {
      placa,
      litros: Number(vehicleLitersMap[placa].toFixed(1)),
      kmL: Number(avgKmL.toFixed(2)),
      metaKmL: 2.5,
    };
  });

  const routeChartData = Object.keys(routeLitersMap).map((rota) => ({
    name: rota.length > 20 ? `${rota.substring(0, 18)}...` : rota,
    fullName: rota,
    value: Number(routeLitersMap[rota].toFixed(1)),
  }));

  // Find lowest efficiency alert
  const lowEfficiency = vehicleChartData.filter((d) => d.kmL > 0 && d.kmL < d.metaKmL * 0.85);

  const getMonthLabel = (mKey: string) => {
    if (mKey === 'all') return 'Todos os Meses (Geral)';
    const parts = mKey.split('-');
    if (parts.length === 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10) - 1;
      return `${MONTH_NAMES[m] || 'Mês'} / ${y}`;
    }
    return mKey;
  };

  const totalLitrosMes = Object.values(vehicleLitersMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Top Filter & Month Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Dashboard de Consumo & Abastecimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getMonthLabel(selectedMonth)} • {filteredEntries.length} lançamentos analisados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Mês:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold font-mono text-amber-600 dark:text-amber-400 focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {getMonthLabel(m)}
                </option>
              ))}
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Todos os Meses
              </option>
            </select>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Formato Mês (Por Dia)</span>
            </button>
            <button
              onClick={() => setViewMode('weekday')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'weekday'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dia da Semana</span>
            </button>
            <button
              onClick={() => setViewMode('vehicle')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'vehicle'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Por Placa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Litros Abastecidos
            </p>
            <h4 className="text-2xl font-mono font-extrabold text-amber-500 mt-1">
              {formatNumber(totalLitrosMes, 1)} L
            </h4>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Fuel className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Veículos Atendidos
            </p>
            <h4 className="text-2xl font-mono font-extrabold text-blue-500 mt-1">
              {Object.keys(vehicleLitersMap).length} Frota
            </h4>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Média Geral de Consumo
            </p>
            <h4 className="text-2xl font-mono font-extrabold text-emerald-500 mt-1">
              {formatNumber(
                vehicleChartData.filter((d) => d.kmL > 0).reduce((a, b) => a + b.kmL, 0) /
                  (vehicleChartData.filter((d) => d.kmL > 0).length || 1),
                2
              )}{' '}
              KM/L
            </h4>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Alertas de Baixo Rendimento
            </p>
            <h4 className="text-2xl font-mono font-extrabold text-rose-500 mt-1">
              {lowEfficiency.length} Veículo(s)
            </h4>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* PRIMARY CHART SECTION: Depends on ViewMode */}
      {viewMode === 'month' && (
        <div className="space-y-6">
          {/* Main Bar Chart: Formato Mês - Litros por Dia do Mês */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Formato Mês: Litros Lançados por Dia
                  </h3>
                  <p className="text-xs text-slate-400">
                    O dia de cada lançamento é exibido abaixo do volume de litros lançados
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
                {getMonthLabel(selectedMonth)}
              </span>
            </div>

            {monthDailyChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Calendar className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhum abastecimento registrado neste mês selecionado.</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthDailyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="diaDisplay"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, _name: string, item: any) => [
                        `${formatNumber(value, 1)} L (${item?.payload?.qtd || 0} abastecimentos)`,
                        'Litros Lançados',
                      ]}
                      labelFormatter={(label, items) => {
                        const payload = items?.[0]?.payload;
                        if (payload) {
                          return `Dia: ${payload.diaNumero} • ${payload.diaSemana} (${payload.dataFormatada})`;
                        }
                        return label;
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="litros" name="Litros Lançados (Total Diesel)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* PAINEL FORMATO MÊS: Cards com Litros Lançados no topo e o DIA ABAIXO DOS LITROS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Detalhamento Diário do Mês (Litros e Dias Lançados)
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {monthDailyChartData.length} dias com lançamentos
              </span>
            </div>

            {monthDailyChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum lançamento no período selecionado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {monthDailyChartData.map((d) => (
                  <div
                    key={d.date}
                    className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all flex flex-col items-center justify-between shadow-sm"
                  >
                    {/* LITROS LANÇADOS (NO TOPO) */}
                    <div className="text-center w-full">
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                        Litros Lançados
                      </span>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-500 my-1">
                        {formatNumber(d.litros, 1)} L
                      </div>
                    </div>

                    {/* O DIA ABAIXO DOS LITROS LANÇADOS */}
                    <div className="w-full pt-2 mt-1.5 border-t border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide block">
                        Dia {d.diaNumero} • {d.diaSemanaCurta}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
                        {d.dataFormatada}
                      </span>
                    </div>

                    {/* DETALHES COMPLEMENTARES */}
                    <div className="w-full mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>{d.qtd} lanc.</span>
                      <span className="text-blue-500 font-bold">{d.litrosCavalo > 0 ? `${formatNumber(d.litrosCavalo, 0)}L C` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEKDAY VIEW */}
      {viewMode === 'weekday' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Litros de Diesel Abastecidos por Dia da Semana
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Segunda a Domingo</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dia" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, _name: string, item: any) => [
                    `${formatNumber(value, 1)} L (${item?.payload?.qtd || 0} abastecimento(s))`,
                    'Volume Total',
                  ]}
                  labelFormatter={(label, items) => {
                    const full = items?.[0]?.payload?.diaCompleto || label;
                    return `Dia: ${full}`;
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="litros" name="Volume Diesel (L)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VEHICLE VIEW */}
      {viewMode === 'vehicle' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Litros de Diesel Abastecidos por Placa do Veículo
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{vehicleChartData.length} Placas</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${formatNumber(value, 1)} L`, 'Total Abastecido']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="litros" name="Litros Abastecidos (L)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo por Rota */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            Distribuição de Litros por Rota
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={routeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {routeChartData.map((item, index) => (
                    <Cell key={`cell-route-${item.fullName}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${formatNumber(val, 1)} L`, 'Litros Abastecidos']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {routeChartData.map((item, idx) => (
              <div key={`legend-route-${item.fullName}-${idx}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 truncate">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.fullName}: <strong className="text-slate-900 dark:text-white font-mono">{formatNumber(item.value, 1)}L</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Média de KM/L vs Meta */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow border border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Rendimento Real (KM/L) vs. Meta da Frota
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="kmL" name="KM/L Medido" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="metaKmL" name="Meta da Frota" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

