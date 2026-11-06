import React from 'react';
import { DailySheet } from '../types';
import { calculateSheetSummary, formatNumber } from '../utils/calculations';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { exportSheetToExcel } from '../utils/excel';

interface ExcelGridPrintViewProps {
  sheet: DailySheet;
  onBack?: () => void;
}

export const ExcelGridPrintView: React.FC<ExcelGridPrintViewProps> = ({ sheet, onBack }) => {
  const summary = calculateSheetSummary(sheet);

  const handlePrint = () => {
    window.print();
  };

  const totalLitrosCavalo = sheet.entries.reduce(
    (acc, curr) => acc + (curr.litrosCavalo !== undefined ? curr.litrosCavalo : (curr.litrosCarreta ? 0 : Number(curr.litrosDiesel) || 0)),
    0
  );

  const totalLitrosCarreta = sheet.entries.reduce(
    (acc, curr) => acc + (Number(curr.litrosCarreta) || 0),
    0
  );

  const sortedEntries = [...sheet.entries].sort((a, b) => {
    const dateTimeA = `${a.date || sheet.date}T${a.hora || '00:00'}`;
    const dateTimeB = `${b.date || sheet.date}T${b.hora || '00:00'}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  return (
    <div className="space-y-6">
      {/* Top Action Controls (hidden on print) */}
      <div className="print:hidden bg-slate-900 p-4 rounded-xl shadow border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Edição
            </button>
          )}
          <div>
            <h3 className="font-bold text-sm">Visualização da Tabela de Abastecimento (Cavalo & Carreta TK)</h3>
            <p className="text-xs text-slate-400">Layout formatado com separação de litros para impressão oficial em A4</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportSheetToExcel(sheet)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Baixar Arquivo Excel (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-2 shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Folha A4
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas mirroring the reference image */}
      <div id="printable-sheet" className="bg-white text-black p-6 rounded-none sm:rounded-lg shadow-2xl border-2 border-black max-w-5xl mx-auto font-sans leading-tight">
        
        {/* Top Header Block: ABERTURA | FECHAMENTO | LITROS ABASTECIDOS */}
        <div className="border-2 border-black">
          <div className="grid grid-cols-3 bg-black text-white text-center font-extrabold text-sm uppercase divide-x-2 divide-white tracking-widest py-1.5">
            <div>ABERTURA</div>
            <div>FECHAMENTO</div>
            <div>LITROS ABASTECIDOS</div>
          </div>

          <div className="grid grid-cols-3 border-t-2 border-black divide-x-2 divide-black text-sm font-bold bg-white">
            <div className="p-2">
              <span className="uppercase font-extrabold text-xs mr-2">TANQUE:</span>
              <span className="font-mono text-base">{formatNumber(sheet.aberturaTanque, 1)} L</span>
            </div>
            <div className="p-2">
              <span className="uppercase font-extrabold text-xs mr-2">TANQUE:</span>
              <span className="font-mono text-base">{formatNumber(sheet.fechamentoTanque, 1)} L</span>
            </div>
            <div className="p-2">
              <span className="uppercase font-extrabold text-xs mr-2">TANQUE:</span>
              <span className="font-mono text-base">{formatNumber(summary.totalLitrosAbastecidos, 1)} L</span>
            </div>
          </div>
        </div>

        {/* Date Row */}
        <div className="mt-3 border-2 border-black flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-black text-white font-extrabold text-xs uppercase px-4 py-1.5 border-r-2 border-black tracking-wider">
              DATA
            </div>
            <div className="px-4 py-1 font-mono font-bold text-sm">
              {sheet.date.split('-').reverse().join('/')}
            </div>
          </div>
          <div className="pr-4 text-xs font-mono font-bold">
            Total Cavalo: {formatNumber(totalLitrosCavalo, 1)}L | Total Carreta TK: {formatNumber(totalLitrosCarreta, 1)}L
          </div>
        </div>

        {/* Fueling Entries Grid */}
        <div className="mt-3 border-2 border-black">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] font-extrabold text-center tracking-wider border-b-2 border-black">
                <th className="py-2 px-1 border-r border-black w-20">DATA</th>
                <th className="py-2 px-1 border-r border-black w-20">PLACA CAVALO</th>
                <th className="py-2 px-1 border-r border-black w-20">LITROS CAVALO</th>
                <th className="py-2 px-1 border-r border-black w-20">PLACA TK</th>
                <th className="py-2 px-1 border-r border-black w-20">LITROS TK</th>
                <th className="py-2 px-1 border-r border-black w-20">TOTAL DIESEL</th>
                <th className="py-2 px-1 border-r border-black w-14">HORA</th>
                <th className="py-2 px-1 border-r border-black w-24">FRENTISTA</th>
                <th className="py-2 px-1 border-r border-black w-28">MOTORISTA</th>
                <th className="py-2 px-1 border-r border-black w-20">HODOMETRO</th>
                <th className="py-2 px-1 border-r border-black w-20">HORIMETRO</th>
                <th className="py-2 px-1">ROTA</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black font-mono">
              {sortedEntries.length === 0 ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="h-8">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                ))
              ) : (
                <>
                  {sortedEntries.map((item) => {
                    const cLitros = item.litrosCavalo !== undefined ? item.litrosCavalo : (item.litrosCarreta ? 0 : item.litrosDiesel);
                    const tkLitros = item.litrosCarreta || 0;

                    return (
                      <tr key={item.id} className="border-b border-black text-center text-[11px] uppercase">
                        <td className="py-1.5 px-1 border-r border-black font-bold text-[10px]">
                          {item.date ? item.date.split('-').reverse().join('/') : sheet.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black font-extrabold">{item.placa || '-'}</td>
                        <td className="py-1.5 px-1 border-r border-black text-right pr-1">
                          {cLitros > 0 ? formatNumber(cLitros, 1) : '-'}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black font-extrabold">{item.placaCarreta || '-'}</td>
                        <td className="py-1.5 px-1 border-r border-black text-right pr-1">
                          {tkLitros > 0 ? formatNumber(tkLitros, 1) : '-'}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black font-extrabold text-right pr-1">
                          {formatNumber(item.litrosDiesel, 1)}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black">{item.hora}</td>
                        <td className="py-1.5 px-1 border-r border-black font-sans text-left uppercase text-[10px] truncate max-w-[100px]">
                          {item.frentista}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black font-sans text-left uppercase text-[10px] truncate max-w-[120px]">
                          {item.motorista}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black text-right pr-1">
                          {item.hodometro ? item.hodometro.toLocaleString('pt-BR') : ''}
                        </td>
                        <td className="py-1.5 px-1 border-r border-black text-right pr-1">
                          {item.horimetro ? item.horimetro.toLocaleString('pt-BR') : ''}
                        </td>
                        <td className="py-1.5 px-1 font-sans text-left uppercase text-[10px] truncate max-w-[120px]">
                          {item.rota}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty rows to complete page formatting if entries are few */}
                  {sheet.entries.length < 6 &&
                    Array.from({ length: 6 - sheet.entries.length }).map((_, idx) => (
                      <tr key={`pad-${idx}`} className="h-7 border-b border-black">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td></td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-black text-white font-extrabold text-xs uppercase border-t-2 border-black">
                <td className="py-2 px-1 text-center border-r border-white">TOTAL</td>
                <td className="py-2 px-1 text-center border-r border-white">{sheet.entries.length} v.</td>
                <td className="py-2 px-1 text-right border-r border-white font-mono pr-1 text-[11px]">
                  {formatNumber(totalLitrosCavalo, 1)} L
                </td>
                <td className="py-2 px-1 text-center border-r border-white">TK</td>
                <td className="py-2 px-1 text-right border-r border-white font-mono pr-1 text-[11px]">
                  {formatNumber(totalLitrosCarreta, 1)} L
                </td>
                <td className="py-2 px-1 text-right border-r border-white font-mono pr-1 font-extrabold">
                  {formatNumber(summary.totalLitrosAbastecidos, 1)} L
                </td>
                <td colSpan={6} className="py-2 px-2 text-right text-[11px]">
                  Divergência Tanque: {summary.diferencaTanque > 0 ? '+' : ''}
                  {formatNumber(summary.diferencaTanque, 1)} L
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures Footer */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-xs border-t border-slate-400 font-sans uppercase font-semibold">
          <div>
            <div className="border-b border-black mb-1 w-3/4 mx-auto"></div>
            <span>Assinatura Frentista / Responsável Posto</span>
          </div>
          <div>
            <div className="border-b border-black mb-1 w-3/4 mx-auto"></div>
            <span>Visto Supervisor de Frota / Logística</span>
          </div>
        </div>

      </div>
    </div>
  );
};
