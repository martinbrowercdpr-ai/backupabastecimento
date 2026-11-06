import React, { useState, useRef } from 'react';
import { Vehicle, Driver, Attendant, Route } from '../types';
import { Truck, Users, UserCheck, MapPin, Plus, Trash2, Upload, FileText, ListPlus, CheckCircle2, ShieldAlert, Lock, Download, Save, RefreshCw, Snowflake, Search, ArrowUpDown } from 'lucide-react';
import { PasswordConfirmModal } from './PasswordConfirmModal';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  attendants: Attendant[];
  routes: Route[];
  onAddVehicle: (v: Vehicle) => void;
  onAddBatchVehicles?: (vs: Vehicle[]) => void;
  onAddDriver: (d: Driver) => void;
  onAddBatchDrivers?: (ds: Driver[]) => void;
  onAddAttendant: (a: Attendant) => void;
  onAddBatchAttendants?: (as: Attendant[]) => void;
  onAddRoute: (r: Route) => void;
  onAddBatchRoutes?: (rs: Route[]) => void;
  onDeleteVehicle: (placa: string) => void;
  onDeleteDriver?: (id: string) => void;
  onDeleteAttendant?: (id: string) => void;
  onDeleteRoute?: (id: string) => void;
  onImportAllCadastros?: (data: { vehicles?: Vehicle[]; drivers?: Driver[]; attendants?: Attendant[]; routes?: Route[] }) => void;
  onResetCadastrosToDefaults?: () => void;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({
  vehicles,
  drivers,
  attendants,
  routes,
  onAddVehicle,
  onAddBatchVehicles,
  onAddDriver,
  onAddBatchDrivers,
  onAddAttendant,
  onAddBatchAttendants,
  onAddRoute,
  onAddBatchRoutes,
  onDeleteVehicle,
  onDeleteDriver,
  onDeleteAttendant,
  onDeleteRoute,
  onImportAllCadastros,
  onResetCadastrosToDefaults,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'veiculos' | 'motoristas' | 'frentistas' | 'rotas'>('veiculos');
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Password-protected state for deletion and batch actions
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'veiculo' | 'motorista' | 'frentista' | 'rota';
    id: string;
    desc: string;
  } | null>(null);

  const [batchConfirmTarget, setBatchConfirmTarget] = useState<{
    desc: string;
    actionType?: 'batch' | 'reset';
    action: () => void;
  } | null>(null);

  // VEÍCULOS STATES
  const [registerModeVehicle, setRegisterModeVehicle] = useState<'batch' | 'single'>('batch');
  const [newPlaca, setNewPlaca] = useState('');
  const [newTipo, setNewTipo] = useState<'cavalo' | 'carreta'>('cavalo');
  const [newHodometro, setNewHodometro] = useState('0');
  const [newHorimetro, setNewHorimetro] = useState('0');
  const [batchTextVehicle, setBatchTextVehicle] = useState('');
  const [batchTipoVehicle, setBatchTipoVehicle] = useState<'cavalo' | 'carreta'>('cavalo');
  const [batchFeedbackVehicle, setBatchFeedbackVehicle] = useState<string | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<'todos' | 'cavalo' | 'carreta'>('todos');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // MOTORISTAS STATES
  const [registerModeDriver, setRegisterModeDriver] = useState<'batch' | 'single'>('batch');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverMatricula, setNewDriverMatricula] = useState('');
  const [batchTextDriver, setBatchTextDriver] = useState('');
  const [batchFeedbackDriver, setBatchFeedbackDriver] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState('');

  // FRENTISTAS STATES
  const [registerModeAttendant, setRegisterModeAttendant] = useState<'batch' | 'single'>('batch');
  const [newAttendantName, setNewAttendantName] = useState('');
  const [newAttendantTurno, setNewAttendantTurno] = useState<Attendant['turno']>('Manhã');
  const [batchTextAttendant, setBatchTextAttendant] = useState('');
  const [batchFeedbackAttendant, setBatchFeedbackAttendant] = useState<string | null>(null);

  // ROTAS STATES
  const [registerModeRoute, setRegisterModeRoute] = useState<'batch' | 'single'>('batch');
  const [newRouteCode, setNewRouteCode] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [batchTextRoute, setBatchTextRoute] = useState('');
  const [batchFeedbackRoute, setBatchFeedbackRoute] = useState<string | null>(null);

  // -------------------------------------------------------------
  // VEÍCULOS PARSER & HANDLERS
  // -------------------------------------------------------------
  const parsePlacasFromText = (text: string) => {
    const rawTokens = text.split(/[\n,;\t\s]+/);
    const existingSet = new Set(vehicles.map((v) => v.placa.toUpperCase()));
    const validPlacas: string[] = [];
    const seenInBatch = new Set<string>();

    for (const token of rawTokens) {
      const clean = token.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (clean.length >= 3 && !existingSet.has(clean) && !seenInBatch.has(clean)) {
        seenInBatch.add(clean);
        validPlacas.push(clean);
      }
    }
    return validPlacas;
  };

  const handleBatchCreateVehicles = (e: React.FormEvent) => {
    e.preventDefault();
    const placasToAdd = parsePlacasFromText(batchTextVehicle);

    if (placasToAdd.length === 0) {
      setBatchFeedbackVehicle('Nenhuma nova placa válida encontrada ou todas já constam na frota.');
      setTimeout(() => setBatchFeedbackVehicle(null), 4000);
      return;
    }

    const newVehiclesList: Vehicle[] = placasToAdd.map((placa) => ({
      placa,
      tipo: batchTipoVehicle,
      ultimoHodometro: 0,
      ultimoHorimetro: 0,
      proprietario: 'Próprio',
    }));

    setBatchConfirmTarget({
      desc: `${newVehiclesList.length} placa(s) em lote`,
      action: () => {
        if (onAddBatchVehicles) {
          onAddBatchVehicles(newVehiclesList);
        } else {
          newVehiclesList.forEach(onAddVehicle);
        }
        setBatchFeedbackVehicle(`✓ ${newVehiclesList.length} placa(s) cadastrada(s) com sucesso!`);
        setBatchTextVehicle('');
        setTimeout(() => setBatchFeedbackVehicle(null), 5000);
      },
    });
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaca) return;

    onAddVehicle({
      placa: newPlaca.toUpperCase().trim(),
      tipo: newTipo,
      ultimoHodometro: parseInt(newHodometro, 10) || 0,
      ultimoHorimetro: parseInt(newHorimetro, 10) || 0,
      proprietario: 'Próprio',
    });

    setNewPlaca('');
    setNewHodometro('0');
    setNewHorimetro('0');
  };

  const handleToggleVehicleTipo = (v: Vehicle) => {
    const nextTipo: 'cavalo' | 'carreta' = v.tipo === 'carreta' ? 'cavalo' : 'carreta';
    onAddVehicle({
      ...v,
      tipo: nextTipo,
    });
  };

  // -------------------------------------------------------------
  // MOTORISTAS PARSER & HANDLERS
  // -------------------------------------------------------------
  const parseDriversFromText = (text: string) => {
    const lines = text.split(/[\n;]+/);
    const existingSet = new Set(drivers.map((d) => d.nome.toLowerCase().trim()));
    const validDrivers: Driver[] = [];
    const seenInBatch = new Set<string>();

    lines.forEach((line, idx) => {
      const raw = line.trim();
      if (!raw) return;

      let nome = raw;
      let matricula = '';

      if (raw.includes('-')) {
        const parts = raw.split('-');
        nome = parts[0].trim();
        matricula = parts[1].trim();
      } else if (raw.includes(',')) {
        const parts = raw.split(',');
        nome = parts[0].trim();
        matricula = parts[1].trim();
      } else if (raw.includes('\t')) {
        const parts = raw.split('\t');
        nome = parts[0].trim();
        matricula = parts[1].trim();
      }

      const cleanKey = nome.toLowerCase();
      if (nome.length >= 2 && !existingSet.has(cleanKey) && !seenInBatch.has(cleanKey)) {
        seenInBatch.add(cleanKey);
        validDrivers.push({
          id: `drv-${Date.now()}-${idx}`,
          nome,
          matricula: matricula || `MOT-${Math.floor(Math.random() * 899 + 100)}`,
        });
      }
    });

    return validDrivers;
  };

  const handleBatchCreateDrivers = (e: React.FormEvent) => {
    e.preventDefault();
    const driversToAdd = parseDriversFromText(batchTextDriver);

    if (driversToAdd.length === 0) {
      setBatchFeedbackDriver('Nenhum novo motorista encontrado ou já estão cadastrados.');
      setTimeout(() => setBatchFeedbackDriver(null), 4000);
      return;
    }

    setBatchConfirmTarget({
      desc: `${driversToAdd.length} motorista(s) em lote`,
      action: () => {
        if (onAddBatchDrivers) {
          onAddBatchDrivers(driversToAdd);
        } else {
          driversToAdd.forEach(onAddDriver);
        }
        setBatchFeedbackDriver(`✓ ${driversToAdd.length} motorista(s) cadastrado(s) com sucesso!`);
        setBatchTextDriver('');
        setTimeout(() => setBatchFeedbackDriver(null), 5000);
      },
    });
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName) return;

    onAddDriver({
      id: `drv-${Date.now()}`,
      nome: newDriverName.trim(),
      matricula: newDriverMatricula.trim() || `MOT-${Math.floor(Math.random() * 899 + 100)}`,
    });

    setNewDriverName('');
    setNewDriverMatricula('');
  };

  // -------------------------------------------------------------
  // FRENTISTAS PARSER & HANDLERS
  // -------------------------------------------------------------
  const parseAttendantsFromText = (text: string) => {
    const lines = text.split(/[\n;,]+/);
    const existingSet = new Set(attendants.map((a) => a.nome.toLowerCase().trim()));
    const validAttendants: Attendant[] = [];
    const seenInBatch = new Set<string>();

    lines.forEach((line, idx) => {
      const raw = line.trim();
      if (!raw) return;

      const cleanKey = raw.toLowerCase();
      if (raw.length >= 2 && !existingSet.has(cleanKey) && !seenInBatch.has(cleanKey)) {
        seenInBatch.add(cleanKey);
        validAttendants.push({
          id: `att-${Date.now()}-${idx}`,
          nome: raw,
          turno: 'Geral',
        });
      }
    });

    return validAttendants;
  };

  const handleBatchCreateAttendants = (e: React.FormEvent) => {
    e.preventDefault();
    const attendantsToAdd = parseAttendantsFromText(batchTextAttendant);

    if (attendantsToAdd.length === 0) {
      setBatchFeedbackAttendant('Nenhum novo frentista encontrado ou já estão cadastrados.');
      setTimeout(() => setBatchFeedbackAttendant(null), 4000);
      return;
    }

    setBatchConfirmTarget({
      desc: `${attendantsToAdd.length} frentista(s) em lote`,
      action: () => {
        if (onAddBatchAttendants) {
          onAddBatchAttendants(attendantsToAdd);
        } else {
          attendantsToAdd.forEach(onAddAttendant);
        }
        setBatchFeedbackAttendant(`✓ ${attendantsToAdd.length} frentista(s) cadastrado(s) com sucesso!`);
        setBatchTextAttendant('');
        setTimeout(() => setBatchFeedbackAttendant(null), 5000);
      },
    });
  };

  const handleCreateAttendant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendantName) return;

    onAddAttendant({
      id: `att-${Date.now()}`,
      nome: newAttendantName.trim(),
      turno: newAttendantTurno,
    });

    setNewAttendantName('');
  };

  // -------------------------------------------------------------
  // ROTAS PARSER & HANDLERS
  // -------------------------------------------------------------
  const parseRoutesFromText = (text: string) => {
    const lines = text.split(/[\n;]+/);
    const existingSet = new Set(routes.map((r) => r.nome.toLowerCase().trim()));
    const validRoutes: Route[] = [];
    const seenInBatch = new Set<string>();

    lines.forEach((line, idx) => {
      const raw = line.trim();
      if (!raw) return;

      let nome = raw;
      let codigo = '';

      if (raw.includes('-')) {
        const parts = raw.split('-');
        if (parts[0].trim().length <= 10 && parts[1]) {
          codigo = parts[0].trim();
          nome = parts[1].trim();
        } else {
          nome = parts[0].trim();
        }
      }

      const cleanKey = nome.toLowerCase();
      if (nome.length >= 2 && !existingSet.has(cleanKey) && !seenInBatch.has(cleanKey)) {
        seenInBatch.add(cleanKey);
        validRoutes.push({
          id: `rot-${Date.now()}-${idx}`,
          codigo: codigo || `ROT-${Math.floor(Math.random() * 89 + 10)}`,
          nome,
        });
      }
    });

    return validRoutes;
  };

  const handleBatchCreateRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    const routesToAdd = parseRoutesFromText(batchTextRoute);

    if (routesToAdd.length === 0) {
      setBatchFeedbackRoute('Nenhuma nova rota encontrada ou já estão cadastradas.');
      setTimeout(() => setBatchFeedbackRoute(null), 4000);
      return;
    }

    setBatchConfirmTarget({
      desc: `${routesToAdd.length} rota(s) em lote`,
      action: () => {
        if (onAddBatchRoutes) {
          onAddBatchRoutes(routesToAdd);
        } else {
          routesToAdd.forEach(onAddRoute);
        }
        setBatchFeedbackRoute(`✓ ${routesToAdd.length} rota(s) cadastrada(s) com sucesso!`);
        setBatchTextRoute('');
        setTimeout(() => setBatchFeedbackRoute(null), 5000);
      },
    });
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;

    onAddRoute({
      id: `rot-${Date.now()}`,
      codigo: newRouteCode.trim() || `ROT-${Math.floor(Math.random() * 89 + 10)}`,
      nome: newRouteName.trim(),
    });

    setNewRouteCode('');
    setNewRouteName('');
  };

  // Generic File Reader Helper
  const handleFileUploadHelper = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setter((prev) => (prev ? prev + '\n' + text : text));
      }
    };
    reader.readAsText(file);
  };

  // Export / Backup all Cadastros to JSON
  const handleExportAllCadastros = () => {
    const backupData = {
      app: 'Controle de Abastecimento - Martin Brower',
      exportedAt: new Date().toISOString(),
      vehicles,
      drivers,
      attendants,
      routes,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadastros_frota_martin_brower_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import / Restore all Cadastros from JSON
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        setBatchConfirmTarget({
          desc: 'importação de backup de cadastros em lote (JSON)',
          action: () => {
            if (onImportAllCadastros) {
              onImportAllCadastros(parsed);
            } else {
              if (Array.isArray(parsed.vehicles) && onAddBatchVehicles) onAddBatchVehicles(parsed.vehicles);
              if (Array.isArray(parsed.drivers) && onAddBatchDrivers) onAddBatchDrivers(parsed.drivers);
              if (Array.isArray(parsed.attendants) && onAddBatchAttendants) onAddBatchAttendants(parsed.attendants);
              if (Array.isArray(parsed.routes) && onAddBatchRoutes) onAddBatchRoutes(parsed.routes);
            }
            alert('✓ Cadastros importados e atualizados com sucesso!');
          },
        });
      } catch (err) {
        alert('Erro ao ler arquivo JSON de cadastros. Certifique-se de que é um arquivo válido.');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Top Backup & Restore Bar */}
      <div className="bg-slate-950 p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Save className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-100 uppercase tracking-wide">
              Sincronização & Backup de Cadastros
            </span>
            <span className="hidden sm:inline text-slate-400 ml-2">
              (Os cadastros são mantidos automaticamente no navegador e no link da publicação)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden JSON file input */}
          <input
            type="file"
            ref={jsonInputRef}
            accept=".json"
            onChange={handleImportJsonFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportAllCadastros}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-colors cursor-pointer"
            title="Exportar backup completo de todos os cadastros em JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded-lg font-bold flex items-center gap-1.5 border border-sky-500/30 transition-colors cursor-pointer"
            title="Importar/Restaurar cadastros a partir de um arquivo JSON"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Importar Backup (JSON)</span>
          </button>

          {onResetCadastrosToDefaults && (
            <button
              type="button"
              onClick={() => {
                setBatchConfirmTarget({
                  desc: 'todos os cadastros de veículos, motoristas, frentistas e rotas',
                  actionType: 'reset',
                  action: () => onResetCadastrosToDefaults(),
                });
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg font-bold flex items-center gap-1.5 border border-rose-500/20 transition-colors cursor-pointer"
              title="Limpar todos os cadastros com senha"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Limpar Todos</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('veiculos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'veiculos'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          Veículos / Placas ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveSubTab('motoristas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'motoristas'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Motoristas ({drivers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('frentistas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'frentistas'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Frentistas / Posto ({attendants.length})
        </button>

        <button
          onClick={() => setActiveSubTab('rotas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'rotas'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Rotas e Linhas ({routes.length})
        </button>
      </div>

      <div className="p-6">
        
        {/* ==================== VEÍCULOS SUBTAB ==================== */}
        {activeSubTab === 'veiculos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" /> Cadastrar Placas na Frota
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cole uma lista de placas para cadastrar todas de uma só vez (copia e cola).
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegisterModeVehicle('batch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeVehicle === 'batch'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" /> Copia e Cola (Lote)
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterModeVehicle('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeVehicle === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Placa Única
                </button>
              </div>
            </div>

            {registerModeVehicle === 'batch' && (
              <form onSubmit={handleBatchCreateVehicles} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Cole a lista de Placas (uma por linha ou separadas por vírgula/espaço)
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 cursor-pointer transition-colors self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5 text-amber-500" /> Arquivo .TXT / .CSV
                    <input type="file" accept=".txt,.csv" onChange={(e) => handleFileUploadHelper(e, setBatchTextVehicle)} className="hidden" />
                  </label>
                </div>

                {/* Batch Tipo Selector */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Cadastrar estas placas como:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setBatchTipoVehicle('cavalo')}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        batchTipoVehicle === 'cavalo'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Truck className="w-4 h-4" /> 🚛 Placas Cavalo (Caminhão)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchTipoVehicle('carreta')}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        batchTipoVehicle === 'carreta'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Snowflake className="w-4 h-4" /> ❄️ Placas Carreta EQF (Thermo King)
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={batchTextVehicle}
                  onChange={(e) => setBatchTextVehicle(e.target.value)}
                  placeholder="Cole a lista de placas (uma por linha)... Ex: ABC-1D23, EQF-9A88"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {batchTextVehicle.trim().length > 0 && (
                  <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      {parsePlacasFromText(batchTextVehicle).length} nova(s) placa(s) pronta(s) para cadastrar.
                    </span>
                  </div>
                )}

                {batchFeedbackVehicle && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    batchFeedbackVehicle.includes('✓')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {batchFeedbackVehicle}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {batchTextVehicle && (
                    <button type="button" onClick={() => setBatchTextVehicle('')} className="px-4 py-2 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
                      Limpar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={parsePlacasFromText(batchTextVehicle).length === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded text-xs flex items-center gap-2 shadow"
                  >
                    <ListPlus className="w-4 h-4" /> Cadastrar Todas as Placas em Lote ({parsePlacasFromText(batchTextVehicle).length})
                  </button>
                </div>
              </form>
            )}

            {registerModeVehicle === 'single' && (
              <form onSubmit={handleCreateVehicle} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-500" /> Cadastrar Placa Única
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">PLACA *</label>
                    <input
                      type="text"
                      required
                      placeholder="ABC-1D23"
                      value={newPlaca}
                      onChange={(e) => setNewPlaca(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">TIPO DE VEÍCULO *</label>
                    <select
                      value={newTipo}
                      onChange={(e) => setNewTipo(e.target.value as 'cavalo' | 'carreta')}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="cavalo">🚛 Placa Cavalo (Caminhão)</option>
                      <option value="carreta">❄️ Placa Carreta EQF (Thermo King)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">HODÔMETRO INICIAL (KM)</label>
                    <input
                      type="number"
                      value={newHodometro}
                      onChange={(e) => setNewHodometro(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">HORÍMETRO INICIAL (HORAS)</label>
                    <input
                      type="number"
                      value={newHorimetro}
                      onChange={(e) => setNewHorimetro(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-2.5 rounded text-xs flex items-center justify-center gap-1 shadow">
                      <Plus className="w-4 h-4" /> Cadastrar Placa
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Filter controls & search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setVehicleFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    vehicleFilter === 'todos'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Todos os Veículos</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20 font-mono">
                    {vehicles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleFilter('cavalo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    vehicleFilter === 'cavalo'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Placas Cavalo</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-950/40 text-blue-100 font-mono">
                    {vehicles.filter((v) => v.tipo !== 'carreta').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleFilter('carreta')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    vehicleFilter === 'carreta'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Placas Carreta EQF</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-950/40 text-cyan-100 font-mono">
                    {vehicles.filter((v) => v.tipo === 'carreta').length}
                  </span>
                </button>
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar placa..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-white font-extrabold uppercase text-[11px]">
                    <th className="p-3">PLACA</th>
                    <th className="p-3">TIPO / TIPO DE VEÍCULO</th>
                    <th className="p-3 text-right">ÚLTIMO HODÔMETRO</th>
                    <th className="p-3 text-right">ÚLTIMO HORÍMETRO</th>
                    <th className="p-3 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {vehicles
                    .filter((v) => {
                      const matchesFilter =
                        vehicleFilter === 'todos' ||
                        (vehicleFilter === 'carreta' && v.tipo === 'carreta') ||
                        (vehicleFilter === 'cavalo' && v.tipo !== 'carreta');
                      const matchesSearch =
                        !vehicleSearch || v.placa.toLowerCase().includes(vehicleSearch.toLowerCase());
                      return matchesFilter && matchesSearch;
                    })
                    .map((v) => (
                      <tr key={v.placa} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {v.tipo === 'carreta' ? (
                            <Snowflake className="w-4 h-4 text-cyan-500 shrink-0" />
                          ) : (
                            <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <span>{v.placa}</span>
                        </td>
                        <td className="p-3 font-sans">
                          <button
                            type="button"
                            onClick={() => handleToggleVehicleTipo(v)}
                            title="Clique para alternar entre Cavalo e Carreta EQF"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border transition-all cursor-pointer ${
                              v.tipo === 'carreta'
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-100'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            {v.tipo === 'carreta' ? (
                              <>
                                <Snowflake className="w-3 h-3 text-cyan-500" />
                                <span>CARRETA EQF (TK)</span>
                              </>
                            ) : (
                              <>
                                <Truck className="w-3 h-3 text-blue-500" />
                                <span>CAVALO (CAMINHÃO)</span>
                              </>
                            )}
                            <ArrowUpDown className="w-3 h-3 text-slate-400 ml-0.5" />
                          </button>
                        </td>
                        <td className="p-3 text-right">{v.ultimoHodometro.toLocaleString('pt-BR')} KM</td>
                        <td className="p-3 text-right">{v.ultimoHorimetro.toLocaleString('pt-BR')} h</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setDeleteTarget({ type: 'veiculo', id: v.placa, desc: `Placa ${v.placa}` })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Excluir Placa (Requer Senha)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {vehicles.filter((v) => {
                    const matchesFilter =
                      vehicleFilter === 'todos' ||
                      (vehicleFilter === 'carreta' && v.tipo === 'carreta') ||
                      (vehicleFilter === 'cavalo' && v.tipo !== 'carreta');
                    const matchesSearch =
                      !vehicleSearch || v.placa.toLowerCase().includes(vehicleSearch.toLowerCase());
                    return matchesFilter && matchesSearch;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans text-xs">
                        Nenhuma placa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== MOTORISTAS SUBTAB ==================== */}
        {activeSubTab === 'motoristas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" /> Cadastrar Motoristas
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cadastre motoristas em lote (copia e cola) ou individualmente.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegisterModeDriver('batch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeDriver === 'batch'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" /> Copia e Cola (Lote)
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterModeDriver('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeDriver === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Motorista Único
                </button>
              </div>
            </div>

            {registerModeDriver === 'batch' && (
              <form onSubmit={handleBatchCreateDrivers} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Cole a lista de Motoristas (um por linha ou Nome - Matrícula)
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 cursor-pointer transition-colors self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5 text-amber-500" /> Arquivo .TXT / .CSV
                    <input type="file" accept=".txt,.csv" onChange={(e) => handleFileUploadHelper(e, setBatchTextDriver)} className="hidden" />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={batchTextDriver}
                  onChange={(e) => setBatchTextDriver(e.target.value)}
                  placeholder="Cole a lista de motoristas (um por linha ou Nome - Matrícula)..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {batchTextDriver.trim().length > 0 && (
                  <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      {parseDriversFromText(batchTextDriver).length} novo(s) motorista(s) pronto(s) para cadastrar.
                    </span>
                  </div>
                )}

                {batchFeedbackDriver && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    batchFeedbackDriver.includes('✓')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {batchFeedbackDriver}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {batchTextDriver && (
                    <button type="button" onClick={() => setBatchTextDriver('')} className="px-4 py-2 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
                      Limpar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={parseDriversFromText(batchTextDriver).length === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded text-xs flex items-center gap-2 shadow"
                  >
                    <ListPlus className="w-4 h-4" /> Cadastrar Todos os Motoristas em Lote ({parseDriversFromText(batchTextDriver).length})
                  </button>
                </div>
              </form>
            )}

            {registerModeDriver === 'single' && (
              <form onSubmit={handleCreateDriver} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">NOME DO MOTORISTA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs"
                  />
                </div>
                <div className="w-48">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">MATRÍCULA</label>
                  <input
                    type="text"
                    placeholder="Matrícula"
                    value={newDriverMatricula}
                    onChange={(e) => setNewDriverMatricula(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Cadastrar
                </button>
              </form>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar motorista..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {drivers.filter((d) => !driverSearch || d.nome.toLowerCase().includes(driverSearch.toLowerCase())).length} de {drivers.length} motoristas cadastrados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[...drivers]
                .filter((d) => !driverSearch || d.nome.toLowerCase().includes(driverSearch.toLowerCase()))
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((d, idx) => (
                <div key={`drv-${d.id}-${idx}`} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{d.nome}</h5>
                    {d.matricula ? (
                      <p className="text-[11px] text-slate-400 font-mono">{d.matricula}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'motorista', id: d.id, desc: `Motorista ${d.nome}` })}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                    title="Excluir Motorista (Requer Senha)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== FRENTISTAS SUBTAB ==================== */}
        {activeSubTab === 'frentistas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-500" /> Cadastrar Frentistas / Operadores do Posto
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cadastre frentistas em lote (copia e cola) ou individualmente.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegisterModeAttendant('batch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeAttendant === 'batch'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" /> Copia e Cola (Lote)
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterModeAttendant('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeAttendant === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Frentista Único
                </button>
              </div>
            </div>

            {registerModeAttendant === 'batch' && (
              <form onSubmit={handleBatchCreateAttendants} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Cole a lista de Frentistas (um por linha ou separados por vírgula)
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 cursor-pointer transition-colors self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5 text-amber-500" /> Arquivo .TXT / .CSV
                    <input type="file" accept=".txt,.csv" onChange={(e) => handleFileUploadHelper(e, setBatchTextAttendant)} className="hidden" />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={batchTextAttendant}
                  onChange={(e) => setBatchTextAttendant(e.target.value)}
                  placeholder="Cole a lista de frentistas (um por linha)..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {batchTextAttendant.trim().length > 0 && (
                  <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      {parseAttendantsFromText(batchTextAttendant).length} novo(s) frentista(s) pronto(s) para cadastrar.
                    </span>
                  </div>
                )}

                {batchFeedbackAttendant && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    batchFeedbackAttendant.includes('✓')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {batchFeedbackAttendant}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {batchTextAttendant && (
                    <button type="button" onClick={() => setBatchTextAttendant('')} className="px-4 py-2 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
                      Limpar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={parseAttendantsFromText(batchTextAttendant).length === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded text-xs flex items-center gap-2 shadow"
                  >
                    <ListPlus className="w-4 h-4" /> Cadastrar Todos os Frentistas em Lote ({parseAttendantsFromText(batchTextAttendant).length})
                  </button>
                </div>
              </form>
            )}

            {registerModeAttendant === 'single' && (
              <form onSubmit={handleCreateAttendant} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">NOME DO FRENTISTA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do frentista"
                    value={newAttendantName}
                    onChange={(e) => setNewAttendantName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs"
                  />
                </div>
                <div className="w-48">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">TURNO</label>
                  <select
                    value={newAttendantTurno}
                    onChange={(e) => setNewAttendantTurno(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Cadastrar
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {attendants.map((a, idx) => (
                <div key={`att-${a.id}-${idx}`} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{a.nome}</h5>
                    <span className="text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      Turno: {a.turno}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'frentista', id: a.id, desc: `Frentista ${a.nome}` })}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                    title="Excluir Frentista (Requer Senha)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ROTAS SUBTAB ==================== */}
        {activeSubTab === 'rotas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" /> Cadastrar Rotas e Linhas
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cadastre rotas em lote (copia e cola) ou individualmente.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegisterModeRoute('batch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeRoute === 'batch'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" /> Copia e Cola (Lote)
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterModeRoute('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    registerModeRoute === 'single'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Rota Única
                </button>
              </div>
            </div>

            {registerModeRoute === 'batch' && (
              <form onSubmit={handleBatchCreateRoutes} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Cole a lista de Rotas (uma por linha ou Código - Nome)
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 cursor-pointer transition-colors self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5 text-amber-500" /> Arquivo .TXT / .CSV
                    <input type="file" accept=".txt,.csv" onChange={(e) => handleFileUploadHelper(e, setBatchTextRoute)} className="hidden" />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={batchTextRoute}
                  onChange={(e) => setBatchTextRoute(e.target.value)}
                  placeholder="Cole a lista de rotas (uma por linha ou Código - Nome)..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {batchTextRoute.trim().length > 0 && (
                  <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                      {parseRoutesFromText(batchTextRoute).length} nova(s) rota(s) pronta(s) para cadastrar.
                    </span>
                  </div>
                )}

                {batchFeedbackRoute && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${
                    batchFeedbackRoute.includes('✓')
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {batchFeedbackRoute}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {batchTextRoute && (
                    <button type="button" onClick={() => setBatchTextRoute('')} className="px-4 py-2 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
                      Limpar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={parseRoutesFromText(batchTextRoute).length === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded text-xs flex items-center gap-2 shadow"
                  >
                    <ListPlus className="w-4 h-4" /> Cadastrar Todas as Rotas em Lote ({parseRoutesFromText(batchTextRoute).length})
                  </button>
                </div>
              </form>
            )}

            {registerModeRoute === 'single' && (
              <form onSubmit={handleCreateRoute} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 items-end">
                <div className="w-40">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">CÓDIGO ROTA</label>
                  <input
                    type="text"
                    placeholder="Código"
                    value={newRouteCode}
                    onChange={(e) => setNewRouteCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-mono uppercase"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">NOME DA ROTA / LINHA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome da Rota"
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Cadastrar
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routes.map((r, idx) => (
                <div key={`rt-${r.id}-${idx}`} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      {r.codigo}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{r.nome}</h5>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'rota', id: r.id, desc: `Rota ${r.nome}` })}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                    title="Excluir Rota (Requer Senha)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password Confirmation Modal for Cadastros Deletion */}
      {deleteTarget && (
        <PasswordConfirmModal
          isOpen={!!deleteTarget}
          itemDescription={deleteTarget.desc}
          onConfirm={() => {
            if (deleteTarget.type === 'veiculo') {
              onDeleteVehicle(deleteTarget.id);
            } else if (deleteTarget.type === 'motorista') {
              onDeleteDriver?.(deleteTarget.id);
            } else if (deleteTarget.type === 'frentista') {
              onDeleteAttendant?.(deleteTarget.id);
            } else if (deleteTarget.type === 'rota') {
              onDeleteRoute?.(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Password Confirmation Modal for Batch Creations, Imports & Reset */}
      {batchConfirmTarget && (
        <PasswordConfirmModal
          isOpen={!!batchConfirmTarget}
          actionType={batchConfirmTarget.actionType || 'batch'}
          itemDescription={batchConfirmTarget.desc}
          expectedPassword="2025"
          onConfirm={() => {
            batchConfirmTarget.action();
            setBatchConfirmTarget(null);
          }}
          onCancel={() => setBatchConfirmTarget(null)}
        />
      )}
    </div>
  );
};
