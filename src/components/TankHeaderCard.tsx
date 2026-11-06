import React, { useState, useEffect } from 'react';
import { DailySheet } from '../types';
import { calculateSheetSummary, formatNumber } from '../utils/calculations';
import { Fuel, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, HelpCircle, ChevronDown, ChevronUp, SlidersHorizontal, Check, Plus, Save } from 'lucide-react';

interface TankHeaderCardProps {
  sheet: DailySheet;
  onUpdateSheet: (updatedSheet: DailySheet) => void;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const TankHeaderCard: React.FC<TankHeaderCardProps> = ({
  sheet,
  onUpdateSheet,
  defaultOpen = false,
  isOpen: externalIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Local inputs state
  const [aberturaInput, setAberturaInput] = useState<string>(sheet.aberturaTanque ? String(sheet.aberturaTanque) : '');
  const [fechamentoInput, setFechamentoInput] = useState<string>(sheet.fechamentoTanque ? String(sheet.fechamentoTanque) : '');
  const [recebimentoInput, setRecebimentoInput] = useState<string>(sheet.recebimentoTanque ? String(sheet.recebimentoTanque) : '');

  const [confirmFeedback, setConfirmFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  useEffect(() => {
    setAberturaInput(sheet.aberturaTanque ? String(sheet.aberturaTanque) : '');
    setFechamentoInput(sheet.fechamentoTanque ? String(sheet.fechamentoTanque) : '');
    setRecebimentoInput(sheet.recebimentoTanque ? String(sheet.recebimentoTanque) : '');
  }, [sheet.aberturaTanque, sheet.fechamentoTanque, sheet.recebimentoTanque]);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = (nextState: boolean) => {
    setInternalIsOpen(nextState);
    if (onToggleOpen) {
      onToggleOpen(nextState);
    }
  };

  const summary = calculateSheetSummary(sheet);

  const showFeedback = (msg: string) => {
    setConfirmFeedback(msg);
    setTimeout(() => {
      setConfirmFeedback(null);
    }, 3500);
  };

  const handleConfirmRecebimento = () => {
    const val = parseFloat(recebimentoInput) || 0;
    const currentAbertura = parseFloat(aberturaInput) || sheet.aberturaTanque || 0;
    const totalDisponivel = currentAbertura + val;

    onUpdateSheet({
      ...sheet,
      aberturaTanque: currentAbertura,
      recebimentoTanque: val,
    });
    showFeedback(`Entrada de +${formatNumber(val, 1)} L confirmada! Total no Tanque: ${formatNumber(totalDisponivel, 1)} L`);
  };

  const handleAddRecebimentoToAbertura = () => {
    const val = parseFloat(recebimentoInput) || 0;
    if (val <= 0) return;
    const currentAbertura = parseFloat(aberturaInput) || sheet.aberturaTanque || 0;
    const newAbertura = currentAbertura + val;

    setAberturaInput(String(newAbertura));
    setRecebimentoInput('0');

    onUpdateSheet({
      ...sheet,
      aberturaTanque: newAbertura,
      recebimentoTanque: 0,
    });
    showFeedback(`+${formatNumber(val, 1)} L somados diretamente à Abertura do Tanque! Novo Nível Inicial: ${formatNumber(newAbertura, 1)} L`);
  };

  const handleConfirmAbertura = () => {
    const val = parseFloat(aberturaInput) || 0;
    onUpdateSheet({ ...sheet, aberturaTanque: val });
    showFeedback(`Abertura do Tanque (${formatNumber(val, 1)} L) confirmada!`);
  };

  const handleConfirmFechamento = () => {
    const val = parseFloat(fechamentoInput) || 0;
    onUpdateSheet({ ...sheet, fechamentoTanque: val });
    showFeedback(`Fechamento do Tanque (${formatNumber(val, 1)} L) confirmado!`);
  };

  const handleConfirmAllLevels = () => {
    const ab = parseFloat(aberturaInput) || 0;
    const fe = parseFloat(fechamentoInput) || 0;
    const rec = parseFloat(recebimentoInput) || 0;

    onUpdateSheet({
      ...sheet,
      aberturaTanque: ab,
      fechamentoTanque: fe,
      recebimentoTanque: rec,
    });
    showFeedback('Todos os níveis e entradas do tanque foram confirmados!');
  };

  // Collapsed View (Linha básica com litros)
  if (!isOpen) {
    return (
      <div id="tank-level-section" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-md text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Fuel className="w-4 h-4 shrink-0" />
            <span>Nível do Tanque:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              Abertura: <strong className="text-emerald-400">{formatNumber(sheet.aberturaTanque || 0, 1)} L</strong>
            </span>
            {sheet.recebimentoTanque ? (
              <span className="bg-slate-950 px-2.5 py-1 rounded border border-amber-500/30 text-amber-300">
                + Entrada: <strong className="text-amber-400">+{formatNumber(sheet.recebimentoTanque, 1)} L</strong>
              </span>
            ) : null}
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300">
              Total Tanque: <strong className="text-emerald-400 font-extrabold">{formatNumber(summary.totalTanqueDisponivel, 1)} L</strong>
            </span>
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              Fechamento: <strong className="text-blue-400">{formatNumber(sheet.fechamentoTanque || 0, 1)} L</strong>
            </span>
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              Saídas: <strong className="text-amber-400">{formatNumber(summary.totalLitrosAbastecidos, 1)} L</strong>
            </span>
            <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              Balanço: <strong className={summary.diferencaTanque === 0 ? 'text-emerald-400' : summary.isPerda ? 'text-rose-400' : 'text-blue-400'}>
                {summary.diferencaTanque === 0 ? '100% OK' : `${summary.isPerda ? '-' : '+'}${formatNumber(summary.diferencaTanque, 1)} L`}
              </strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => handleToggle(true)}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow transition-all flex items-center gap-1.5 border border-amber-300 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Editar Níveis</span>
          <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    );
  }

  return (
    <div id="tank-level-section" className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 overflow-hidden transition-all">
      {/* Botão e Cabeçalho Acima */}
      <div className="bg-black border-b border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">
              Nível Inicial e Final do Tanque
            </h3>
            <p className="text-[11px] text-slate-400">
              Controle de Volumes e Conciliação de Estoque do Posto Interno
            </p>
          </div>
        </div>

        {/* Botão superior de alternar/recolher */}
        <button
          onClick={() => handleToggle(false)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
          title="Recolher Tabela de Níveis"
        >
          <span>Ocultar Detalhes do Tanque</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Titulos de Coluna */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/90 text-center font-bold tracking-wider text-xs uppercase py-2 px-4 text-slate-300 border-b border-slate-800">
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          ABERTURA (NÍVEL INICIAL)
        </div>
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          FECHAMENTO (NÍVEL FINAL)
        </div>
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          LITROS ABASTECIDOS (SAÍDAS BOMBA)
        </div>
      </div>

      {/* Feedback banner if confirmed */}
      {confirmFeedback && (
        <div className="bg-emerald-500 text-slate-950 font-extrabold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 animate-fadeIn shadow-md">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>{confirmFeedback}</span>
        </div>
      )}

      {/* Main 3-Column Tank Metrics Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-2.5 md:p-3.5 bg-slate-900/90">
        
        {/* ABERTURA DO TANQUE */}
        <div className="p-2.5 md:p-3 flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nível Inicial do Tanque</span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">Medição Régua</span>
            </div>
            <div className="mt-1">
              <label className="text-[11px] text-slate-400 block mb-1 font-mono">TANQUE (LITROS):</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    value={aberturaInput}
                    onChange={(e) => setAberturaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmAbertura();
                      }
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-bold">L</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAbertura}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 border border-slate-700 cursor-pointer shrink-0"
                  title="Confirmar Abertura"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Optional fuel delivery receipt into tank (+ Entradas / Caminhão Cisa) */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-1.5">
            <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1">
              <Plus className="w-3 h-3 text-amber-400" />
              + Entradas / Caminhão Cisa:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={recebimentoInput}
                  onChange={(e) => setRecebimentoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmRecebimento();
                    }
                  }}
                  placeholder="0 L"
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-right text-amber-400 font-mono text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">L</span>
              </div>
              <button
                type="button"
                onClick={handleConfirmRecebimento}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shadow border border-amber-300 cursor-pointer shrink-0"
                title="Confirmar Entrada de Litros e somar ao Total do Tanque"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Confirmar</span>
              </button>
            </div>

            {/* Total do Tanque Summary Card */}
            <div className="mt-1 p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
                  TOTAL DO TANQUE (DISPONÍVEL)
                </span>
                <span className="text-[9px] text-slate-400">
                  Abertura ({formatNumber(sheet.aberturaTanque || 0, 1)} L) + Entrada ({formatNumber(sheet.recebimentoTanque || 0, 1)} L)
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-black text-emerald-400">
                  {formatNumber(summary.totalTanqueDisponivel, 1)} L
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FECHAMENTO DO TANQUE */}
        <div className="p-2.5 md:p-3 flex flex-col justify-between">
          <div>
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nível Final do Tanque</span>
              <span className="text-blue-400 font-mono text-[10px] bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/50">Medição Final</span>
            </div>
            <div className="mt-1">
              <label className="text-[11px] text-slate-400 block mb-1 font-mono">TANQUE (LITROS):</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    value={fechamentoInput}
                    onChange={(e) => setFechamentoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmFechamento();
                      }
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-base font-mono font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-slate-500 font-bold">L</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmFechamento}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 border border-slate-700 cursor-pointer shrink-0"
                  title="Confirmar Fechamento"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Fechamento Teórico:</span>
            <span className="font-mono font-semibold text-slate-300">
              {formatNumber(summary.fechamentoTeorico, 1)} L
            </span>
          </div>
        </div>

        {/* LITROS ABASTECIDOS (SOMA VEÍCULOS) & CONCILIAÇÃO */}
        <div className="p-2.5 md:p-3 flex flex-col justify-between bg-slate-950/50">
          <div>
            <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Saídas para Veículos</span>
              <span className="text-amber-400 font-mono text-[10px] bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/50">
                {summary.quantidadeVeiculos} Abastecimentos
              </span>
            </div>
            <div className="mt-1">
              <label className="text-[11px] text-slate-400 block mb-1 font-mono">TANQUE (LITROS):</label>
              <div className="bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span className="text-xl font-mono font-bold text-amber-400">
                    {formatNumber(summary.totalLitrosAbastecidos, 1)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold">LITROS</span>
              </div>
            </div>
          </div>

          {/* Divergence alert badge */}
          <div className="mt-2.5 pt-2 border-t border-slate-800">
            {summary.diferencaTanque === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/60 p-2 rounded border border-emerald-900/50">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Estoque 100% concilado. Sem divergências.</span>
              </div>
            ) : summary.isPerda ? (
              <div className="flex items-center justify-between text-rose-400 text-xs bg-rose-950/60 p-2 rounded border border-rose-900/50">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Divergência / Perda Tanque:</span>
                </div>
                <span className="font-mono font-bold text-rose-300">
                  {formatNumber(summary.diferencaTanque, 1)} L
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-blue-400 text-xs bg-blue-950/60 p-2 rounded border border-blue-900/50">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Sobra no Tanque:</span>
                </div>
                <span className="font-mono font-bold text-blue-300">
                  +{formatNumber(summary.diferencaTanque, 1)} L
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Date bar matching the spreadsheet prompt image: DATA: [ ________ ] */}
      <div className="bg-black border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="bg-white text-black font-extrabold px-3 py-1 rounded text-xs tracking-wider uppercase">
            DATA
          </span>
          <input
            type="date"
            value={sheet.date}
            onChange={(e) => onUpdateSheet({ ...sheet, date: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1 font-mono text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs">
          <button
            type="button"
            onClick={handleConfirmAllLevels}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all border border-emerald-300 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Níveis e Entradas do Tanque</span>
          </button>

          <div className="flex items-center gap-2">
            <span>Status do Turno:</span>
            <select
              value={sheet.status || 'aberto'}
              onChange={(e) => onUpdateSheet({ ...sheet, status: e.target.value as any })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-amber-400"
            >
              <option value="aberto">Em Lançamento (Aberto)</option>
              <option value="fechado">Turno Concluído (Fechado)</option>
              <option value="auditado">Auditado & Aprovado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
