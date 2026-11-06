import React, { useState, useEffect } from 'react';
import { FuelingEntry, Vehicle } from '../types';
import { calculateFuelMetrics, formatNumber, getEfficiencyColor } from '../utils/calculations';
import { Trash2, Edit3, Search, Fuel, Check, X, ChevronDown, ChevronUp, BarChart2, Truck, Snowflake } from 'lucide-react';
import { PasswordConfirmModal } from './PasswordConfirmModal';

interface FuelingTableProps {
  entries: FuelingEntry[];
  vehicles: Vehicle[];
  onUpdateEntry: (updatedEntry: FuelingEntry) => void;
  onDeleteEntry: (id: string) => void;
  onGoToDashboard?: () => void;
  isGridOpen?: boolean;
  onToggleGridOpen?: (open: boolean) => void;
}

export const FuelingTable: React.FC<FuelingTableProps> = ({
  entries,
  vehicles,
  onUpdateEntry,
  onDeleteEntry,
  onGoToDashboard,
  isGridOpen,
  onToggleGridOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FuelingEntry | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [isTableVisible, setIsTableVisible] = useState(isGridOpen ?? false);

  useEffect(() => {
    if (isGridOpen !== undefined) {
      setIsTableVisible(isGridOpen);
    }
  }, [isGridOpen]);

  const handleToggleTable = () => {
    const next = !isTableVisible;
    setIsTableVisible(next);
    if (onToggleGridOpen) {
      onToggleGridOpen(next);
    }
  };

  // Password modal for edit and delete actions
  const [actionModal, setActionModal] = useState<{
    type: 'edit' | 'delete';
    entry: FuelingEntry;
    desc: string;
  } | null>(null);

  // Compute metrics (KM/L, L/Hora) for display
  const enrichedEntries = calculateFuelMetrics(entries);

  // Filter entries based on search input and sort by date descending (mais recente para o mais antigo)
  const filtered = enrichedEntries
    .filter((e) => {
      const term = searchTerm.toLowerCase();
      const formattedDate = e.date ? e.date.split('-').reverse().join('/') : '';
      return (
        (e.placa && e.placa.toLowerCase().includes(term)) ||
        (e.placaCarreta && e.placaCarreta.toLowerCase().includes(term)) ||
        (e.date && e.date.includes(term)) ||
        formattedDate.includes(term) ||
        (e.motorista && e.motorista.toLowerCase().includes(term)) ||
        (e.frentista && e.frentista.toLowerCase().includes(term)) ||
        (e.rota && e.rota.toLowerCase().includes(term)) ||
        (e.hora && e.hora.includes(term))
      );
    })
    .sort((a, b) => {
      const dateTimeA = `${a.date || ''}T${a.hora || '00:00'}`;
      const dateTimeB = `${b.date || ''}T${b.hora || '00:00'}`;
      if (dateTimeA !== dateTimeB) {
        return sortOrder === 'desc'
          ? dateTimeB.localeCompare(dateTimeA)
          : dateTimeA.localeCompare(dateTimeB);
      }
      return sortOrder === 'desc'
        ? (b.id || '').localeCompare(a.id || '')
        : (a.id || '').localeCompare(b.id || '');
    });

  const totalLitrosCavalo = filtered.reduce(
    (acc, curr) => acc + (curr.litrosCavalo !== undefined ? curr.litrosCavalo : (curr.litrosCarreta ? 0 : Number(curr.litrosDiesel) || 0)),
    0
  );

  const totalLitrosCarreta = filtered.reduce(
    (acc, curr) => acc + (Number(curr.litrosCarreta) || 0),
    0
  );

  const totalLitros = filtered.reduce((acc, curr) => acc + (Number(curr.litrosDiesel) || 0), 0);

  const validKmL = filtered.filter((e) => e.kmPorLitro && e.kmPorLitro > 0);
  const avgKmL = validKmL.length > 0
    ? validKmL.reduce((acc, curr) => acc + (curr.kmPorLitro || 0), 0) / validKmL.length
    : 0;

  const handleStartEdit = (entry: FuelingEntry) => {
    setEditingId(entry.id);
    setEditForm({ ...entry });
  };

  const handleSaveEdit = () => {
    if (editForm) {
      const c = Number(editForm.litrosCavalo) || 0;
      const k = Number(editForm.litrosCarreta) || 0;
      const computedTotal = (c > 0 || k > 0) ? (c + k) : editForm.litrosDiesel;

      onUpdateEntry({
        ...editForm,
        litrosCavalo: c,
        litrosCarreta: k,
        litrosDiesel: computedTotal,
      });
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div id="grade-lancamentos-section" className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Header Bar with Search, Access Button & Dashboard Button */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Fuel className="w-6 h-6 text-amber-500" />
          <h2 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
            Lançamentos de Abastecimento (Cavalo & Carreta TK)
          </h2>
          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-sm font-mono font-bold px-3 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
            {filtered.length} Registros
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Dedicated Toggle Button to Access/Hide Entries List */}
          <button
            onClick={handleToggleTable}
            className={`px-4 py-2 rounded-lg text-sm font-extrabold shadow transition-all flex items-center gap-2 border ${
              isTableVisible
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 cursor-pointer'
            }`}
            title={isTableVisible ? 'Ocultar Tabela de Abastecimentos' : 'Ver Tabela de Abastecimentos'}
          >
            {isTableVisible ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Ocultar Lista</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 stroke-[3]" />
                <span>Ver Lista de Lançamentos ({filtered.length})</span>
              </>
            )}
          </button>

          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-lg shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Ir para Dashboard de Indicadores e Gráficos"
            >
              <BarChart2 className="w-4 h-4 stroke-[2.5]" />
              <span>Ver Dashboard</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa, motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Excel-like Table or Collapsed Info */}
      {isTableVisible ? (
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-white font-extrabold uppercase text-xs sm:text-sm tracking-wider border-b border-slate-800">
              <th
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="py-3.5 px-2.5 border-r border-slate-800 text-center w-28 cursor-pointer hover:bg-slate-900 transition-colors select-none group"
                title="Clique para inverter ordenação por Data"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>DATA</span>
                  <span className="text-xs text-amber-400 font-mono">
                    {sortOrder === 'desc' ? '▼ Recente' : '▲ Antigo'}
                  </span>
                </div>
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-center w-28">
                <div className="flex items-center justify-center gap-1 text-blue-400">
                  <Truck className="w-3.5 h-3.5" />
                  PLACA CAVALO
                </div>
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-right w-28 bg-blue-950/40 text-blue-300">
                LITROS CAVALO
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-center w-28">
                <div className="flex items-center justify-center gap-1 text-cyan-400">
                  <Snowflake className="w-3.5 h-3.5" />
                  CARRETA TK
                </div>
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-right w-28 bg-cyan-950/40 text-cyan-300">
                LITROS TK
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-right w-32 bg-amber-950/40 text-amber-300">
                TOTAL DIESEL
              </th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-center w-20">HORA</th>
              <th className="py-3.5 px-2.5 border-r border-slate-800">FRENTISTA</th>
              <th className="py-3.5 px-2.5 border-r border-slate-800">MOTORISTA</th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-right w-28">HODÔMETRO</th>
              <th className="py-3.5 px-2.5 border-r border-slate-800 text-right w-28">HORÍMETRO</th>
              <th className="py-3.5 px-2.5 border-r border-slate-800">ROTA</th>
              <th className="py-3.5 px-2.5 text-center w-20">AÇÕES</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-slate-400 font-medium">
                  Nenhum registro de abastecimento encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isEditing = editingId === item.id;
                const cLitros = item.litrosCavalo !== undefined ? item.litrosCavalo : (item.litrosCarreta ? 0 : item.litrosDiesel);
                const tkLitros = item.litrosCarreta || 0;

                if (isEditing && editForm) {
                  const editC = Number(editForm.litrosCavalo) || 0;
                  const editTK = Number(editForm.litrosCarreta) || 0;
                  const editTotal = (editC > 0 || editTK > 0) ? (editC + editTK) : editForm.litrosDiesel;

                  return (
                    <tr key={item.id} className="bg-amber-500/10 dark:bg-amber-950/40">
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const dia = String(d.getDate()).padStart(2, '0');
                            const h = String(d.getHours()).padStart(2, '0');
                            const min = String(d.getMinutes()).padStart(2, '0');
                            setEditForm({ ...editForm, date: `${y}-${m}-${dia}`, hora: `${h}:${min}` });
                          }}
                          className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline block text-center mt-0.5 cursor-pointer"
                          title="Puxar data e hora do aparelho conectado"
                        >
                          🕒 Aparelho
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="text"
                          value={editForm.placa}
                          onChange={(e) => setEditForm({ ...editForm, placa: e.target.value.toUpperCase() })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono font-bold uppercase text-center"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.litrosCavalo !== undefined ? editForm.litrosCavalo : ''}
                          onChange={(e) => setEditForm({ ...editForm, litrosCavalo: parseFloat(e.target.value) || 0 })}
                          placeholder="Litros Cavalo"
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-blue-500 rounded text-xs font-mono font-bold text-blue-600 text-right"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="text"
                          value={editForm.placaCarreta || ''}
                          onChange={(e) => setEditForm({ ...editForm, placaCarreta: e.target.value.toUpperCase() })}
                          placeholder="Carreta TK"
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono font-bold uppercase text-center"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.litrosCarreta !== undefined ? editForm.litrosCarreta : ''}
                          onChange={(e) => setEditForm({ ...editForm, litrosCarreta: parseFloat(e.target.value) || 0 })}
                          placeholder="Litros TK"
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-cyan-500 rounded text-xs font-mono font-bold text-cyan-600 text-right"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800 font-mono font-extrabold text-right text-amber-600 dark:text-amber-400">
                        {editTotal.toFixed(1)} L
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="time"
                          value={editForm.hora}
                          onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono text-center"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="text"
                          value={editForm.frentista}
                          onChange={(e) => setEditForm({ ...editForm, frentista: e.target.value })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="text"
                          value={editForm.motorista}
                          onChange={(e) => setEditForm({ ...editForm, motorista: e.target.value })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="number"
                          value={editForm.hodometro}
                          onChange={(e) => setEditForm({ ...editForm, hodometro: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono text-right"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="number"
                          value={editForm.horimetro}
                          onChange={(e) => setEditForm({ ...editForm, horimetro: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs font-mono text-right"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-300 dark:border-slate-800">
                        <input
                          type="text"
                          value={editForm.rota}
                          onChange={(e) => setEditForm({ ...editForm, rota: e.target.value })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-500 rounded text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                            title="Salvar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-mono"
                  >
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.date ? item.date.split('-').reverse().join('/') : '--/--/----'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                        {item.placa || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-right font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
                      {cLitros > 0 ? `${formatNumber(cLitros, 1)} L` : '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-white">
                      {item.placaCarreta ? (
                        <span className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 rounded border border-cyan-200 dark:border-cyan-800">
                          {item.placaCarreta}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-right font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50/30 dark:bg-cyan-950/10">
                      {tkLitros > 0 ? `${formatNumber(tkLitros, 1)} L` : '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-right font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                      {formatNumber(item.litrosDiesel, 1)} L
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                      {item.hora || '--:--'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-700 dark:text-slate-300">
                      {item.frentista || '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-900 dark:text-slate-100 font-medium">
                      {item.motorista || '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-right text-slate-700 dark:text-slate-300">
                      {item.hodometro ? item.hodometro.toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 text-right text-slate-700 dark:text-slate-300">
                      {item.horimetro ? item.horimetro.toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-800 font-sans text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={item.rota}>
                      {item.rota || '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'delete', entry: item, desc: `Abastecimento Placa ${item.placa || item.placaCarreta} (${item.litrosDiesel}L)` })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Excluir Registro (Requer Senha)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Totals Footer */}
          <tfoot>
            <tr className="bg-slate-950 text-white font-extrabold uppercase text-xs">
              <td className="py-3 px-2 text-center border-r border-slate-800">
                TOTAL
              </td>
              <td className="py-3 px-2 text-center border-r border-slate-800 text-slate-400">
                {filtered.length} reg
              </td>
              <td className="py-3 px-2 text-right border-r border-slate-800 text-blue-400 font-mono text-xs">
                {formatNumber(totalLitrosCavalo, 1)} L
              </td>
              <td className="py-3 px-2 text-center border-r border-slate-800 text-slate-400">
                TK
              </td>
              <td className="py-3 px-2 text-right border-r border-slate-800 text-cyan-400 font-mono text-xs">
                {formatNumber(totalLitrosCarreta, 1)} L
              </td>
              <td className="py-3 px-2 text-right border-r border-slate-800 text-amber-400 font-mono text-sm">
                {formatNumber(totalLitros, 1)} L
              </td>
              <td colSpan={6} className="py-3 px-2 border-r border-slate-800 text-slate-400 normal-case font-normal text-[11px]">
                Totais separados: Cavalo ({formatNumber(totalLitrosCavalo, 1)}L) + Carreta TK ({formatNumber(totalLitrosCarreta, 1)}L)
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Mobile View: Cards for small devices (< md screens) */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              Nenhum registro de abastecimento encontrado.
            </div>
          ) : (
            filtered.map((item) => {
              const isEditing = editingId === item.id;
              const cLitros = item.litrosCavalo !== undefined ? item.litrosCavalo : (item.litrosCarreta ? 0 : item.litrosDiesel);
              const tkLitros = item.litrosCarreta || 0;

              if (isEditing && editForm) {
                const editC = Number(editForm.litrosCavalo) || 0;
                const editTK = Number(editForm.litrosCarreta) || 0;
                const editTotal = (editC > 0 || editTK > 0) ? (editC + editTK) : editForm.litrosDiesel;

                return (
                  <div key={`mob-edit-${item.id}`} className="p-4 bg-amber-50 dark:bg-amber-950/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/60 pb-2">
                      <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                        Editando Lançamento
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Salvar</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block">Data</label>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, '0');
                              const dia = String(d.getDate()).padStart(2, '0');
                              const h = String(d.getHours()).padStart(2, '0');
                              const min = String(d.getMinutes()).padStart(2, '0');
                              setEditForm({ ...editForm, date: `${y}-${m}-${dia}`, hora: `${h}:${min}` });
                            }}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            title="Puxar data e hora do aparelho conectado"
                          >
                            Puxar do Aparelho
                          </button>
                        </div>
                        <input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Hora</label>
                        <input
                          type="time"
                          value={editForm.hora || ''}
                          onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-blue-600 block mb-0.5">Placa Cavalo</label>
                        <input
                          type="text"
                          value={editForm.placa || ''}
                          onChange={(e) => setEditForm({ ...editForm, placa: e.target.value.toUpperCase() })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-xs font-mono font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-blue-600 block mb-0.5">Litros Cavalo</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.litrosCavalo !== undefined ? editForm.litrosCavalo : ''}
                          onChange={(e) => setEditForm({ ...editForm, litrosCavalo: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-cyan-600 block mb-0.5">Placa TK</label>
                        <input
                          type="text"
                          value={editForm.placaCarreta || ''}
                          onChange={(e) => setEditForm({ ...editForm, placaCarreta: e.target.value.toUpperCase() })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-cyan-400 rounded-lg text-xs font-mono font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-cyan-600 block mb-0.5">Litros TK</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.litrosCarreta !== undefined ? editForm.litrosCarreta : ''}
                          onChange={(e) => setEditForm({ ...editForm, litrosCarreta: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-cyan-400 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Total Diesel:</span>
                      <span className="font-mono font-black text-amber-600 text-sm">{editTotal.toFixed(1)} L</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Motorista</label>
                        <input
                          type="text"
                          value={editForm.motorista || ''}
                          onChange={(e) => setEditForm({ ...editForm, motorista: e.target.value })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Frentista</label>
                        <input
                          type="text"
                          value={editForm.frentista || ''}
                          onChange={(e) => setEditForm({ ...editForm, frentista: e.target.value })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Hodômetro (KM)</label>
                        <input
                          type="number"
                          value={editForm.hodometro || ''}
                          onChange={(e) => setEditForm({ ...editForm, hodometro: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Horímetro (Horas)</label>
                        <input
                          type="number"
                          value={editForm.horimetro || ''}
                          onChange={(e) => setEditForm({ ...editForm, horimetro: parseInt(e.target.value, 10) || 0 })}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Rota</label>
                      <input
                        type="text"
                        value={editForm.rota || ''}
                        onChange={(e) => setEditForm({ ...editForm, rota: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={`mob-${item.id}`} className="p-4 space-y-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {item.date ? item.date.split('-').reverse().join('/') : '--/--/----'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.hora || '--:--'}
                      </span>
                    </div>

                    {/* Action buttons (Direct edit without password!) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-amber-500/30"
                        title="Editar Registro"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'delete', entry: item, desc: `Abastecimento Placa ${item.placa || item.placaCarreta} (${item.litrosDiesel}L)` })}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Plates and Liters Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Cavalo */}
                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Cavalo
                        </span>
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          {item.placa || '-'}
                        </span>
                      </div>
                      <div className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                        {cLitros > 0 ? `${formatNumber(cLitros, 1)} L` : '-'}
                      </div>
                    </div>

                    {/* Carreta TK */}
                    <div className="p-2.5 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-900/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                          <Snowflake className="w-3 h-3" /> Carreta TK
                        </span>
                        <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
                          {item.placaCarreta || '-'}
                        </span>
                      </div>
                      <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                        {tkLitros > 0 ? `${formatNumber(tkLitros, 1)} L` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Total Diesel */}
                  <div className="flex items-center justify-between p-2.5 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/30">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                        Total Diesel
                      </span>
                      <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400">
                        {formatNumber(item.litrosDiesel, 1)} L
                      </span>
                    </div>
                  </div>

                  {/* Driver, Route, Attendant details */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Motorista:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{item.motorista || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Frentista:</span>
                      <span>{item.frentista || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hodômetro / Horímetro:</span>
                      <span className="font-mono">
                        {item.hodometro ? `${item.hodometro.toLocaleString('pt-BR')} KM` : '-'}
                        {item.horimetro ? ` • ${item.horimetro.toLocaleString('pt-BR')} h` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rota:</span>
                      <span className="truncate block" title={item.rota}>{item.rota || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Footer Totals */}
          <div className="p-4 bg-slate-950 text-white space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Total Geral ({filtered.length} reg):</span>
              <span className="font-mono font-black text-amber-400 text-base">{formatNumber(totalLitros, 1)} L</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Cavalo: <strong className="text-blue-400 font-mono">{formatNumber(totalLitrosCavalo, 1)}L</strong></span>
              <span>TK: <strong className="text-cyan-400 font-mono">{formatNumber(totalLitrosCarreta, 1)}L</strong></span>
              {avgKmL > 0 ? (
                <span>Média: <strong className="text-emerald-400 font-mono">{formatNumber(avgKmL, 2)} KM/L</strong></span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-950/60 text-center border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A tabela de lançamentos está oculta. Clique no botão <strong className="text-emerald-600 dark:text-emerald-400">"Ver Lista de Lançamentos"</strong> no cabeçalho acima para visualizar e editar os <strong className="font-mono">{filtered.length}</strong> registros.
          </p>
        </div>
      )}

      {/* Password Modal for Deletion and Editing */}
      {actionModal && (
        <PasswordConfirmModal
          isOpen={!!actionModal}
          actionType={actionModal.type}
          itemDescription={actionModal.desc}
          onConfirm={() => {
            if (actionModal.type === 'edit') {
              handleStartEdit(actionModal.entry);
            } else if (actionModal.type === 'delete') {
              onDeleteEntry(actionModal.entry.id);
            }
            setActionModal(null);
          }}
          onCancel={() => setActionModal(null)}
        />
      )}
    </div>
  );
};
