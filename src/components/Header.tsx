import React, { useRef, useState, useEffect } from 'react';
import { Fuel, FileSpreadsheet, Download, Upload, Plus, Printer, BarChart2, ShieldCheck, Sun, Moon, Calendar, Table, Mail, Smartphone, Clock } from 'lucide-react';
import { exportSheetToExcel, parseExcelFile } from '../utils/excel';
import { DailySheet } from '../types';

interface HeaderProps {
  currentSheet: DailySheet;
  allSheets: DailySheet[];
  onOpenNewModal: () => void;
  onOpenGrade?: () => void;
  onOpenTankLevel?: () => void;
  onOpenGraficos?: () => void;
  onOpenCadastros?: () => void;
  onOpenEmailModal?: () => void;
  onSelectDateSheet: (sheetId: string) => void;
  onAddNewSheet?: (dateStr: string) => void;
  onImportSheet: (imported: Partial<DailySheet>) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentSheet,
  allSheets,
  onOpenNewModal,
  onOpenGrade,
  onOpenTankLevel,
  onOpenGraficos,
  onOpenCadastros,
  onOpenEmailModal,
  onSelectDateSheet,
  onAddNewSheet,
  onImportSheet,
  darkMode,
  setDarkMode,
  isCloudConnected = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deviceClock, setDeviceClock] = useState<{ date: string; time: string }>(() => {
    const d = new Date();
    return {
      date: d.toLocaleDateString('pt-BR'),
      time: d.toLocaleTimeString('pt-BR'),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setDeviceClock({
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR'),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      onImportSheet(parsed);
      alert(`Planilha importada com sucesso! ${parsed.entries?.length || 0} lançamentos encontrados.`);
    } catch (err) {
      alert('Erro ao ler a planilha. Verifique o formato do arquivo.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        
        {/* Top Navbar Row: Logo, Title, Badges & Theme Toggle */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shadow-amber-500/20 shrink-0">
              <Fuel className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white leading-tight">
                  Controle de Abastecimento
                </h1>
                <span className="hidden sm:inline-block bg-amber-500/20 text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  Frota
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                  isCloudConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="hidden xs:inline">{isCloudConnected ? 'Online' : 'Conectando...'}</span>
                </span>

                {/* Relógio do Aparelho Conectado */}
                <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm font-mono">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{deviceClock.date}</span>
                  <span className="text-slate-400">•</span>
                  <span>{deviceClock.time}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Monitoramento de consumo, medidor de tanque e conciliação de diesel
              </p>
            </div>
          </div>

          {/* Right Top Bar: Device Clock on Mobile & Dark/Light Mode toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Relógio compacto em telas menores */}
            <div className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-emerald-400 border border-emerald-500/30 font-mono">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{deviceClock.time}</span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              title="Alternar Modo Claro / Escuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar: Totalmente visível na página com wrap responsivo sem cortes laterais */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          
          {/* Hidden Excel File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Grupo 1: Ações Principais de Operação */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Novo Lançamento */}
            <button
              onClick={onOpenNewModal}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Registrar Novo Lançamento de Abastecimento"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Lançamento</span>
            </button>

            {/* Nível do Tanque */}
            {onOpenTankLevel && (
              <button
                onClick={onOpenTankLevel}
                className="px-2.5 sm:px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-extrabold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 border border-amber-500/40 cursor-pointer transition-all shadow-sm whitespace-nowrap active:scale-95"
                title="Lançamento e Medição do Nível do Tanque"
              >
                <Fuel className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Nível Tanque</span>
              </button>
            )}

            {/* Grade de Lançamentos */}
            {onOpenGrade && (
              <button
                onClick={onOpenGrade}
                className="px-2.5 sm:px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-extrabold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 border border-emerald-500/40 cursor-pointer transition-all shadow-sm whitespace-nowrap active:scale-95"
                title="Abrir Grade de Lançamentos de Abastecimento"
              >
                <Table className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span>Grade ({currentSheet.entries.length})</span>
              </button>
            )}

            {/* Gráficos & Consumo */}
            {onOpenGraficos && (
              <button
                onClick={onOpenGraficos}
                className="px-2.5 sm:px-3 py-2 bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-300 font-extrabold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 border border-indigo-500/40 cursor-pointer transition-all whitespace-nowrap active:scale-95"
                title="Visualizar Gráficos e Média de Consumo"
              >
                <BarChart2 className="w-4 h-4 text-indigo-400 stroke-[2.5]" />
                <span>Gráficos</span>
              </button>
            )}

            {/* Cadastro da Frota */}
            {onOpenCadastros && (
              <button
                onClick={onOpenCadastros}
                className="px-2.5 sm:px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 border border-amber-500/30 cursor-pointer transition-all whitespace-nowrap active:scale-95"
                title="Gerenciar Veículos e Equipe da Frota"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Frota</span>
              </button>
            )}
          </div>

          {/* Grupo 2: Exportação, Importação e Folha Diária */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Seletor de Data / Folha Diária (se houver mais de uma data cadastrada) */}
            {allSheets && allSheets.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 shrink-0 text-xs font-mono font-bold text-amber-300 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  value={currentSheet.id}
                  onChange={(e) => onSelectDateSheet(e.target.value)}
                  className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer pr-1"
                  title="Selecionar Data da Folha de Abastecimento"
                >
                  {allSheets.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.date ? s.date.split('-').reverse().join('/') : s.id} ({s.entries.length} lanç.)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Excel */}
            <button
              onClick={() => exportSheetToExcel(currentSheet)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors border border-emerald-500/30 cursor-pointer whitespace-nowrap active:scale-95"
              title="Exportar planilha formatada (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            {/* Import Excel */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer whitespace-nowrap active:scale-95"
              title="Importar planilha Excel"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Importar</span>
            </button>

            {/* Send Email Modal Button */}
            {onOpenEmailModal && (
              <button
                onClick={onOpenEmailModal}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors border border-sky-500/30 cursor-pointer whitespace-nowrap active:scale-95"
                title="Enviar planilha Excel por e-mail (Martin Brower)"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>E-mail</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
