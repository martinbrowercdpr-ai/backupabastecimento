import React, { useState, useEffect } from 'react';
import { FuelingEntry, Vehicle, Driver, Attendant, Route } from '../types';
import { Plus, Fuel, Clock, Truck, User, Gauge, MapPin, X, BarChart2, Calendar, Snowflake, Calculator, Check, List, Smartphone, RefreshCw } from 'lucide-react';

interface DailySheetFormProps {
  onAddEntry: (entry: Omit<FuelingEntry, 'id'>) => void;
  onAddVehicle?: (vehicle: Vehicle) => void;
  onAddRoute?: (route: Route) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  attendants: Attendant[];
  routes: Route[];
  currentDate: string;
  onClose?: () => void;
  onGoToDashboard?: () => void;
}

const getDeviceDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDeviceTime = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDeviceTimeWithSeconds = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const DailySheetForm: React.FC<DailySheetFormProps> = ({
  onAddEntry,
  onAddVehicle,
  onAddRoute,
  vehicles,
  drivers,
  attendants,
  routes,
  currentDate,
  onClose,
  onGoToDashboard,
}) => {
  const [dataAbastecimento, setDataAbastecimento] = useState<string>(getDeviceDate());
  const [hora, setHora] = useState<string>(getDeviceTime());
  const [autoDateTime, setAutoDateTime] = useState<boolean>(true);
  const [liveSeconds, setLiveSeconds] = useState<string>(getDeviceTimeWithSeconds());
  
  // Placa e Litros Cavalo
  const [placa, setPlaca] = useState<string>('');
  const [litrosCavalo, setLitrosCavalo] = useState<string>('');
  const [isManualCavalo, setIsManualCavalo] = useState<boolean>(false);
  const [cavaloSavedFeedback, setCavaloSavedFeedback] = useState<string | null>(null);

  // Placa e Litros Carreta TK
  const [placaCarreta, setPlacaCarreta] = useState<string>('');
  const [litrosCarreta, setLitrosCarreta] = useState<string>('');
  const [isManualCarreta, setIsManualCarreta] = useState<boolean>(false);
  const [carretaSavedFeedback, setCarretaSavedFeedback] = useState<string | null>(null);

  // Rota manual / inclusão
  const [isManualRota, setIsManualRota] = useState<boolean>(false);
  const [rotaSavedFeedback, setRotaSavedFeedback] = useState<string | null>(null);

  const [frentista, setFrentista] = useState<string>(attendants[0]?.nome || '');
  const [motorista, setMotorista] = useState<string>('');
  const [hodometro, setHodometro] = useState<string>('');
  const [horimetro, setHorimetro] = useState<string>('');
  const [rota, setRota] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  const [selectedVehicleCavalo, setSelectedVehicleCavalo] = useState<Vehicle | null>(null);
  const [selectedVehicleCarreta, setSelectedVehicleCarreta] = useState<Vehicle | null>(null);

  // Automatically refresh date and time continuously from user's connected device
  useEffect(() => {
    setDataAbastecimento(getDeviceDate());
    setHora(getDeviceTime());
    setLiveSeconds(getDeviceTimeWithSeconds());

    const interval = setInterval(() => {
      const nowTimeWithSec = getDeviceTimeWithSeconds();
      setLiveSeconds(nowTimeWithSec);
      if (autoDateTime) {
        setDataAbastecimento(getDeviceDate());
        setHora(getDeviceTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoDateTime]);

  const handleRefreshNow = () => {
    setDataAbastecimento(getDeviceDate());
    setHora(getDeviceTime());
    setLiveSeconds(getDeviceTimeWithSeconds());
    setAutoDateTime(true);
  };

  // Auto-fill vehicle details on Cavalo selection
  const handlePlacaCavaloChange = (val: string) => {
    const cleanPlate = val.toUpperCase().trim();
    setPlaca(cleanPlate);

    const found = vehicles.find((v) => v.placa.replace(/[^A-Z0-9]/g, '') === cleanPlate.replace(/[^A-Z0-9]/g, ''));
    if (found) {
      setSelectedVehicleCavalo(found);
      if (!hodometro && found.ultimoHodometro) {
        setHodometro(String(found.ultimoHodometro + 150));
      }
    } else {
      setSelectedVehicleCavalo(null);
    }
  };

  // Auto-fill vehicle details on Carreta TK selection
  const handlePlacaCarretaChange = (val: string) => {
    const cleanPlate = val.toUpperCase().trim();
    setPlacaCarreta(cleanPlate);

    const found = vehicles.find((v) => v.placa.replace(/[^A-Z0-9]/g, '') === cleanPlate.replace(/[^A-Z0-9]/g, ''));
    if (found) {
      setSelectedVehicleCarreta(found);
      if (!horimetro && found.ultimoHorimetro) {
        setHorimetro(String(found.ultimoHorimetro + 8));
      }
    } else {
      setSelectedVehicleCarreta(null);
    }
  };

  // Register Manual Cavalo (Caminhão) Plate immediately into Fleet
  const handleQuickRegisterCavalo = () => {
    const clean = placa.toUpperCase().trim();
    if (!clean || clean.length < 3) {
      alert('Digite uma placa válida para o Caminhão (Cavalo).');
      return;
    }
    if (onAddVehicle) {
      onAddVehicle({
        placa: clean,
        tipo: 'cavalo',
        ultimoHodometro: parseInt(hodometro, 10) || 0,
        ultimoHorimetro: 0,
        proprietario: 'Próprio',
      });
    }
    setPlaca(clean);
    setIsManualCavalo(false);
    setCavaloSavedFeedback(`✓ Placa ${clean} cadastrada em Caminhão!`);
    setTimeout(() => setCavaloSavedFeedback(null), 4000);
  };

  // Register Manual Carreta TK Plate immediately into Fleet
  const handleQuickRegisterCarreta = () => {
    const clean = placaCarreta.toUpperCase().trim();
    if (!clean || clean.length < 3) {
      alert('Digite uma placa válida para o TK (Carreta).');
      return;
    }
    if (onAddVehicle) {
      onAddVehicle({
        placa: clean,
        tipo: 'carreta',
        ultimoHodometro: 0,
        ultimoHorimetro: parseInt(horimetro, 10) || 0,
        proprietario: 'Próprio',
      });
    }
    setPlacaCarreta(clean);
    setIsManualCarreta(false);
    setCarretaSavedFeedback(`✓ Placa ${clean} cadastrada em TK!`);
    setTimeout(() => setCarretaSavedFeedback(null), 4000);
  };

  // Register Manual Route immediately into Fleet and Firestore
  const handleQuickRegisterRoute = () => {
    const clean = rota.trim();
    if (!clean || clean.length < 2) {
      alert('Digite o nome da rota para cadastrar.');
      return;
    }
    const cleanUpper = clean.toUpperCase();
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      codigo: cleanUpper.slice(0, 8),
      nome: cleanUpper,
    };
    if (onAddRoute) {
      onAddRoute(newRoute);
    }
    setRota(cleanUpper);
    setIsManualRota(false);
    setRotaSavedFeedback(`✓ Rota "${cleanUpper}" cadastrada e salva com sucesso!`);
    setTimeout(() => setRotaSavedFeedback(null), 4000);
  };

  // Compute sum of liters
  const numCavalo = parseFloat(litrosCavalo) || 0;
  const numCarreta = parseFloat(litrosCarreta) || 0;
  const totalLitrosCalculados = numCavalo + numCarreta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!placa && !placaCarreta) {
      alert('Informe ao menos uma Placa (Cavalo ou Carreta TK).');
      return;
    }

    if (numCavalo > 0 && !placa) {
      alert('Selecione a Placa do Cavalo para informar Litros no Cavalo.');
      return;
    }

    if (numCarreta > 0 && !placaCarreta) {
      alert('Selecione a Placa da Carreta TK para informar Litros na Carreta.');
      return;
    }

    if (totalLitrosCalculados <= 0) {
      alert('Informe a quantidade de litros (no Cavalo ou na Carreta TK).');
      return;
    }

    // Capture the exact real-time timestamp from the connected device at the moment of launch
    const finalDate = autoDateTime ? getDeviceDate() : (dataAbastecimento || getDeviceDate());
    const finalHora = autoDateTime ? getDeviceTime() : (hora || getDeviceTime());

    // Se o usuário digitou uma rota que não está na lista, cadastra e salva automaticamente
    if (rota && rota.trim().length > 0) {
      const cleanUpper = rota.trim().toUpperCase();
      const routeExists = routes.some(
        (r) => r.nome.trim().toUpperCase() === cleanUpper ||
               (r.codigo && r.codigo.trim().toUpperCase() === cleanUpper)
      );
      if (!routeExists && onAddRoute) {
        onAddRoute({
          id: `route-${Date.now()}`,
          codigo: cleanUpper.slice(0, 8),
          nome: cleanUpper,
        });
      }
    }

    onAddEntry({
      date: finalDate,
      hora: finalHora,
      placa: placa ? placa.toUpperCase() : '',
      litrosCavalo: numCavalo,
      placaCarreta: placaCarreta ? placaCarreta.toUpperCase() : '',
      litrosCarreta: numCarreta,
      litrosDiesel: totalLitrosCalculados,
      frentista,
      motorista,
      hodometro: parseInt(hodometro, 10) || 0,
      horimetro: parseInt(horimetro, 10) || 0,
      rota: rota ? rota.trim().toUpperCase() : '',
      observacao,
    });

    // Reset form
    setPlaca('');
    setLitrosCavalo('');
    setPlacaCarreta('');
    setLitrosCarreta('');
    setHodometro('');
    setHorimetro('');
    setRota('');
    setIsManualRota(false);
    setObservacao('');
    setSelectedVehicleCavalo(null);
    setSelectedVehicleCarreta(null);
    setDataAbastecimento(getDeviceDate());
    setHora(getDeviceTime());
    setAutoDateTime(true);

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 transition-all">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Novo Abastecimento de Veículo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Separação de Litros para Placa Cavalo e Placa Carreta Thermo King (TK)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de Horário do Aparelho (Visível em Celulares e Computadores) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">{liveSeconds}</span>
          </div>

          <button
            type="button"
            onClick={handleRefreshNow}
            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
            title="Atualizar data e hora instantaneamente com o relógio do aparelho conectado"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Puxar do Aparelho</span>
            <span className="sm:hidden">Agora</span>
          </button>

          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm"
              title="Abrir Dashboard de Gráficos e Consumo"
            >
              <BarChart2 className="w-4 h-4 text-amber-500" />
              <span>Ver Dashboard</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Data e Hora Automáticas Puxadas do Aparelho Conectado */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoDateTime ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-40'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoDateTime ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Data e Hora do Aparelho Conectado
              </span>
            </div>

            <div className="flex items-center gap-2">
              {autoDateTime ? (
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ao Vivo: {liveSeconds}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoDateTime(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Alterar Manual
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRefreshNow}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Voltar para Automático do Aparelho</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  DATA DO LANÇAMENTO *
                </label>
                {autoDateTime && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                    ✓ Puxada do Aparelho
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={dataAbastecimento}
                onChange={(e) => {
                  setDataAbastecimento(e.target.value);
                  setAutoDateTime(false);
                }}
                className={`w-full bg-white dark:bg-slate-900 border ${
                  autoDateTime
                    ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                } rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  HORA DO LANÇAMENTO *
                </label>
                {autoDateTime && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                    ✓ Ao Vivo ({liveSeconds})
                  </span>
                )}
              </div>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => {
                  setHora(e.target.value);
                  setAutoDateTime(false);
                }}
                className={`w-full bg-white dark:bg-slate-900 border ${
                  autoDateTime
                    ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                } rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
          </div>
        </div>

        {/* Row 2: SEPARAÇÃO - CAVALO E CARRETA TK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: CAVALO */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800/60 pb-2">
              <span className="text-xs font-extrabold uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                1. ABASTECIMENTO CAVALO (CAMINHÃO)
              </span>
              {numCavalo > 0 && (
                <span className="text-xs font-mono font-extrabold px-2 py-0.5 bg-blue-600 text-white rounded">
                  {numCavalo.toFixed(1)} L
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    PLACA CAVALO (CAMINHÃO)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualCavalo(!isManualCavalo)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isManualCavalo ? 'Selecionar da Lista' : '+ Digitar Manual'}
                  </button>
                </div>

                {isManualCavalo ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={placa}
                        onChange={(e) => handlePlacaCavaloChange(e.target.value)}
                        placeholder="Ex: ABC1D23"
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-lg px-3 py-2 text-sm font-mono font-black text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-normal focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickRegisterCavalo}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Cadastrar esta placa imediatamente na frota"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salvar</span>
                      </button>
                    </div>
                    {cavaloSavedFeedback && (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {cavaloSavedFeedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <select
                      value={placa}
                      onChange={(e) => handlePlacaCavaloChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase cursor-pointer"
                    >
                      <option value="">-- Selecione o Cavalo --</option>
                      {vehicles
                        .filter((v) => v.tipo !== 'carreta')
                        .map((v) => (
                          <option key={`cav-${v.placa}`} value={v.placa}>
                            {v.placa} {v.modelo ? `(${v.modelo})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  LITROS CAVALO
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={litrosCavalo}
                    onChange={(e) => setLitrosCavalo(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: CARRETA THERMO KING (TK) */}
          <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border-2 border-cyan-200 dark:border-cyan-800/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-200 dark:border-cyan-800/60 pb-2">
              <span className="text-xs font-extrabold uppercase text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 text-cyan-500" />
                2. ABASTECIMENTO CARRETA TK (REFRIGERADOR)
              </span>
              {numCarreta > 0 && (
                <span className="text-xs font-mono font-extrabold px-2 py-0.5 bg-cyan-600 text-white rounded">
                  {numCarreta.toFixed(1)} L
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    PLACA CARRETA TK
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualCarreta(!isManualCarreta)}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isManualCarreta ? 'Selecionar da Lista' : '+ Digitar Manual'}
                  </button>
                </div>

                {isManualCarreta ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={placaCarreta}
                        onChange={(e) => handlePlacaCarretaChange(e.target.value)}
                        placeholder="Ex: XYZ9A87"
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-cyan-500 rounded-lg px-3 py-2 text-sm font-mono font-black text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-normal focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickRegisterCarreta}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-lg shadow transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Cadastrar esta placa TK imediatamente na frota"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salvar</span>
                      </button>
                    </div>
                    {carretaSavedFeedback && (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {carretaSavedFeedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <select
                      value={placaCarreta}
                      onChange={(e) => handlePlacaCarretaChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 uppercase cursor-pointer"
                    >
                      <option value="">-- Selecione a Carreta TK --</option>
                      {vehicles
                        .filter((v) => v.tipo === 'carreta')
                        .map((v) => (
                          <option key={`car-${v.placa}`} value={v.placa}>
                            {v.placa} {v.modelo ? `(${v.modelo})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  LITROS CARRETA TK
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={litrosCarreta}
                    onChange={(e) => setLitrosCarreta(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-extrabold text-cyan-600 dark:text-cyan-400 focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">L</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Totalizer Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-300">
                Soma Total do Lançamento:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Cavalo ({numCavalo.toFixed(1)}L) + Carreta TK ({numCarreta.toFixed(1)}L)
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-lg font-black text-amber-600 dark:text-amber-400">
            {totalLitrosCalculados.toFixed(1)} <span className="text-xs">LITROS</span>
          </div>
        </div>

        {/* Row 3: Frentista, Motorista, Rota */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              FRENTISTA
            </label>
            <select
              value={frentista}
              onChange={(e) => setFrentista(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">-- Selecione o Frentista --</option>
              {attendants.map((a, idx) => (
                <option key={`opt-att-${a.id}-${idx}`} value={a.nome}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-500" />
              MOTORISTA
            </label>
            <select
              value={motorista}
              onChange={(e) => setMotorista(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">-- Selecione o Motorista --</option>
              {[...drivers].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((d, idx) => (
                <option key={`opt-drv-${d.id}-${idx}`} value={d.nome}>
                  {d.nome} {d.matricula ? `(${d.matricula})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                ROTA
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextState = !isManualRota;
                  setIsManualRota(nextState);
                  if (nextState) setRota('');
                }}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isManualRota ? 'Selecionar da Lista' : '+ Digitar Nova Rota'}
              </button>
            </div>

            {isManualRota ? (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={rota}
                    onChange={(e) => setRota(e.target.value.toUpperCase())}
                    placeholder="Digite a Rota (ex: ROTA 15 - CD/SP)"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-500/60 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickRegisterRoute}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-lg whitespace-nowrap shadow-sm flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    title="Salvar e cadastrar nova rota no sistema"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Salvar</span>
                  </button>
                </div>
                {rotaSavedFeedback && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {rotaSavedFeedback}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  A rota digitada será salva automaticamente na lista da frota para os próximos lançamentos.
                </p>
              </div>
            ) : (
              <div>
                <select
                  value={rota}
                  onChange={(e) => {
                    if (e.target.value === '__NOVA_ROTA__') {
                      setIsManualRota(true);
                      setRota('');
                    } else {
                      setRota(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Selecione a Rota --</option>
                  <option value="__NOVA_ROTA__" className="text-rose-600 dark:text-rose-400 font-bold">
                    + Digitar e Salvar Nova Rota...
                  </option>
                  {routes.map((r, idx) => (
                    <option key={`opt-route-${r.id}-${idx}`} value={r.nome}>
                      {r.nome} {r.codigo ? `[${r.codigo}]` : ''}
                    </option>
                  ))}
                </select>
                {rotaSavedFeedback && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {rotaSavedFeedback}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Hodômetro & Horímetro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-500" />
              HODÔMETRO (KM CAVALO)
            </label>
            <input
              type="number"
              value={hodometro}
              onChange={(e) => setHodometro(e.target.value)}
              placeholder="KM do painel do Cavalo"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            {selectedVehicleCavalo && selectedVehicleCavalo.ultimoHodometro > 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Último KM Cavalo: {selectedVehicleCavalo.ultimoHodometro.toLocaleString('pt-BR')} KM
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              HORÍMETRO (HORAS REFRIGERADOR CARRETA TK)
            </label>
            <input
              type="number"
              value={horimetro}
              onChange={(e) => setHorimetro(e.target.value)}
              placeholder="Horas do painel Thermo King"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            {selectedVehicleCarreta && selectedVehicleCarreta.ultimoHorimetro > 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Últimas Horas TK: {selectedVehicleCarreta.ultimoHorimetro.toLocaleString('pt-BR')} h
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Lançar Abastecimento ({totalLitrosCalculados.toFixed(1)} L)
          </button>
        </div>
      </form>
    </div>
  );
};
