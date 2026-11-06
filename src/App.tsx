import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Table, X, BarChart2, ShieldCheck, Fuel, Eye, EyeOff } from 'lucide-react';
import { DailySheet, FuelingEntry, Vehicle, Driver, Attendant, Route } from './types';
import { INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_ATTENDANTS, INITIAL_ROUTES } from './data/initialData';
import { Header } from './components/Header';
import { TankHeaderCard } from './components/TankHeaderCard';
import { DailySheetForm } from './components/DailySheetForm';
import { FuelingTable } from './components/FuelingTable';
import { FleetAnalytics } from './components/FleetAnalytics';
import { VehicleManager } from './components/VehicleManager';
import { EmailModal } from './components/EmailModal';
import {
  subscribeToSheets,
  subscribeToVehicles,
  subscribeToDrivers,
  subscribeToAttendants,
  subscribeToRoutes,
  saveSheetToCloud,
  saveVehicleToCloud,
  saveBatchVehiclesToCloud,
  deleteVehicleFromCloud,
  saveDriverToCloud,
  saveBatchDriversToCloud,
  deleteDriverFromCloud,
  saveAttendantToCloud,
  saveBatchAttendantsToCloud,
  deleteAttendantFromCloud,
  saveRouteToCloud,
  saveBatchRoutesToCloud,
  deleteRouteFromCloud,
  clearAllCadastrosFromCloud,
} from './lib/firebase';

export default function App() {
  // Helper for today's date
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Persistence state with fallback to localStorage and Firestore real-time sync
  const [sheets, setSheets] = useState<DailySheet[]>(() => {
    const saved = localStorage.getItem('fleet_fuel_sheets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    const today = getTodayStr();
    return [{
      id: `sheet-${today}`,
      date: today,
      aberturaTanque: 10000,
      fechamentoTanque: 10000,
      recebimentoTanque: 0,
      status: 'aberto',
      entries: [],
    }];
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('fleet_vehicles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('fleet_drivers');
    let merged: Driver[] = [...INITIAL_DRIVERS];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = new Set(parsed.map((d: Driver) => (d.nome || '').trim().toUpperCase()));
          merged = [...parsed];
          INITIAL_DRIVERS.forEach((initDrv) => {
            if (!names.has(initDrv.nome.trim().toUpperCase())) {
              merged.push(initDrv);
              names.add(initDrv.nome.trim().toUpperCase());
            }
          });
        }
      } catch (e) { /* ignore */ }
    }
    merged.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    localStorage.setItem('fleet_drivers', JSON.stringify(merged));
    return merged;
  });

  const [attendants, setAttendants] = useState<Attendant[]>(() => {
    const saved = localStorage.getItem('fleet_attendants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [routes, setRoutes] = useState<Route[]>(() => {
    const saved = localStorage.getItem('fleet_routes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Connect Firestore Realtime Listeners
  useEffect(() => {
    const unsubSheets = subscribeToSheets((cloudSheets) => {
      setIsCloudConnected(true);
      if (cloudSheets.length > 0) {
        setSheets(cloudSheets);
        const today = getTodayStr();
        const sheetForToday = cloudSheets.find((s) => s.date === today);
        if (sheetForToday) {
          setCurrentSheetId(sheetForToday.id);
        } else {
          // If no today sheet, pick latest by date
          const sorted = [...cloudSheets].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          if (sorted[0]) setCurrentSheetId(sorted[0].id);
        }
      } else {
        // If cloud sheets collection is empty, publish current initial sheet to Firestore
        const today = getTodayStr();
        const initialSheet: DailySheet = {
          id: `sheet-${today}`,
          date: today,
          aberturaTanque: 10000,
          fechamentoTanque: 10000,
          recebimentoTanque: 0,
          status: 'aberto',
          entries: [],
        };
        saveSheetToCloud(initialSheet);
      }
    });

    const unsubVehicles = subscribeToVehicles((cloudVehicles) => {
      if (cloudVehicles.length > 0) {
        setVehicles(cloudVehicles);
      } else {
        // Se a nuvem estiver vazia, sincroniza dados locais ou dados iniciais padrão
        const saved = localStorage.getItem('fleet_vehicles');
        let initialList = INITIAL_VEHICLES;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
          } catch (e) { /* ignore */ }
        }
        if (initialList.length > 0) {
          saveBatchVehiclesToCloud(initialList);
        }
      }
    });

    const unsubDrivers = subscribeToDrivers((cloudDrivers) => {
      // Remove old mock driver IDs if they exist in Firestore
      const oldMockIds = ['drv-1', 'drv-2', 'drv-3', 'drv-4', 'drv-5'];
      oldMockIds.forEach((oldId) => {
        if (cloudDrivers.some((d) => d.id === oldId)) {
          deleteDriverFromCloud(oldId);
        }
      });

      // Check if any drivers from INITIAL_DRIVERS are missing in Firestore
      const existingNames = new Set(cloudDrivers.map((d) => (d.nome || '').trim().toUpperCase()));
      const missingDrivers = INITIAL_DRIVERS.filter(
        (initDrv) => !existingNames.has(initDrv.nome.trim().toUpperCase())
      );

      if (missingDrivers.length > 0) {
        saveBatchDriversToCloud(missingDrivers);
      }

      if (cloudDrivers.length > 0) {
        setDrivers(cloudDrivers);
      } else {
        saveBatchDriversToCloud(INITIAL_DRIVERS);
        setDrivers(INITIAL_DRIVERS);
      }
    });

    const unsubAttendants = subscribeToAttendants((cloudAttendants) => {
      if (cloudAttendants.length > 0) {
        setAttendants(cloudAttendants);
      } else {
        const saved = localStorage.getItem('fleet_attendants');
        let initialList = INITIAL_ATTENDANTS;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
          } catch (e) { /* ignore */ }
        }
        if (initialList.length > 0) {
          saveBatchAttendantsToCloud(initialList);
        }
      }
    });

    const unsubRoutes = subscribeToRoutes((cloudRoutes) => {
      if (cloudRoutes.length > 0) {
        setRoutes(cloudRoutes);
      } else {
        const saved = localStorage.getItem('fleet_routes');
        let initialList = INITIAL_ROUTES;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
          } catch (e) { /* ignore */ }
        }
        if (initialList.length > 0) {
          saveBatchRoutesToCloud(initialList);
        }
      }
    });

    return () => {
      unsubSheets();
      unsubVehicles();
      unsubDrivers();
      unsubAttendants();
      unsubRoutes();
    };
  }, []);

  const handleImportAllCadastros = (data: { vehicles?: Vehicle[]; drivers?: Driver[]; attendants?: Attendant[]; routes?: Route[] }) => {
    if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
      saveBatchVehiclesToCloud(data.vehicles);
    }
    if (Array.isArray(data.drivers) && data.drivers.length > 0) {
      saveBatchDriversToCloud(data.drivers);
    }
    if (Array.isArray(data.attendants) && data.attendants.length > 0) {
      saveBatchAttendantsToCloud(data.attendants);
    }
    if (Array.isArray(data.routes) && data.routes.length > 0) {
      saveBatchRoutesToCloud(data.routes);
    }
  };

  const handleResetCadastrosToDefaults = async () => {
    await clearAllCadastrosFromCloud(vehicles, drivers, attendants, routes);
    localStorage.removeItem('fleet_vehicles');
    localStorage.removeItem('fleet_drivers');
    localStorage.removeItem('fleet_attendants');
    localStorage.removeItem('fleet_routes');
    
    // Sincroniza dados iniciais padrão no banco em nuvem para acesso compartilhado
    if (INITIAL_VEHICLES.length > 0) saveBatchVehiclesToCloud(INITIAL_VEHICLES);
    if (INITIAL_DRIVERS.length > 0) saveBatchDriversToCloud(INITIAL_DRIVERS);
    if (INITIAL_ATTENDANTS.length > 0) saveBatchAttendantsToCloud(INITIAL_ATTENDANTS);
    if (INITIAL_ROUTES.length > 0) saveBatchRoutesToCloud(INITIAL_ROUTES);
  };

  const todayStr = getTodayStr();
  const [currentSheetId, setCurrentSheetId] = useState<string>(() => {
    const today = getTodayStr();
    return sheets.find((s) => s.date === today)?.id || sheets[0]?.id || `sheet-${today}`;
  });
  const [showNewModal, setShowNewModal] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isTankOpen, setIsTankOpen] = useState(false);
  const [isGraficosOpen, setIsGraficosOpen] = useState(false);
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleOpenGrade = () => {
    setShowTable(true);
    setTimeout(() => {
      const el = document.getElementById('grade-lancamentos-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleOpenTankLevel = () => {
    setIsTankOpen(true);
    setTimeout(() => {
      const el = document.getElementById('tank-level-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('fleet_fuel_sheets', JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('fleet_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('fleet_attendants', JSON.stringify(attendants));
  }, [attendants]);

  useEffect(() => {
    localStorage.setItem('fleet_routes', JSON.stringify(routes));
  }, [routes]);

  // Current sheet helper
  const currentSheet = sheets.find((s) => s.id === currentSheetId) || sheets[0];

  // All entries consolidated across all sheets
  const allEntries = useMemo(() => {
    const entryMap = new Map<string, FuelingEntry>();
    sheets.forEach((s) => {
      s.entries.forEach((e) => {
        entryMap.set(e.id, { ...e, sheetId: s.id, date: e.date || s.date });
      });
    });
    return Array.from(entryMap.values());
  }, [sheets]);

  // Update sheet
  const handleUpdateSheet = (updatedSheet: DailySheet) => {
    setSheets((prev) => prev.map((s) => (s.id === updatedSheet.id ? updatedSheet : s)));
    saveSheetToCloud(updatedSheet);
  };

  // Add new fueling entry (automatically maps to sheet matching entry's device date)
  const handleAddEntry = (entryData: Omit<FuelingEntry, 'id'>) => {
    const targetDate = entryData.date || getTodayStr();
    const newEntryId = `ent-${Date.now()}`;
    const targetSheet = sheets.find((s) => s.date === targetDate);

    if (targetSheet) {
      const newEntry: FuelingEntry = {
        ...entryData,
        date: targetDate,
        id: newEntryId,
        sheetId: targetSheet.id,
      };
      const updatedEntries = [newEntry, ...targetSheet.entries];
      const updatedSheet = {
        ...targetSheet,
        entries: updatedEntries,
      };
      handleUpdateSheet(updatedSheet);
      setCurrentSheetId(targetSheet.id);
    } else {
      const newEntry: FuelingEntry = {
        ...entryData,
        date: targetDate,
        id: newEntryId,
        sheetId: `sheet-${targetDate}`,
      };
      const newSheet: DailySheet = {
        id: `sheet-${targetDate}`,
        date: targetDate,
        aberturaTanque: currentSheet ? (currentSheet.fechamentoTanque || 10000) : 10000,
        fechamentoTanque: currentSheet ? (currentSheet.fechamentoTanque || 10000) : 10000,
        recebimentoTanque: 0,
        status: 'aberto',
        entries: [newEntry],
      };
      setSheets((prev) => [newSheet, ...prev]);
      saveSheetToCloud(newSheet);
      setCurrentSheetId(newSheet.id);
    }

    // Update vehicle's last odometer / horimeter if higher, or auto-register if manual plate is new
    if (entryData.placa) {
      const cleanPlaca = entryData.placa.toUpperCase().trim();
      const targetV = vehicles.find((v) => v.placa.toUpperCase() === cleanPlaca);
      if (targetV) {
        const updatedV = {
          ...targetV,
          ultimoHodometro: Math.max(targetV.ultimoHodometro || 0, entryData.hodometro || 0),
          ultimoHorimetro: Math.max(targetV.ultimoHorimetro || 0, entryData.horimetro || 0),
        };
        saveVehicleToCloud(updatedV);
      } else {
        saveVehicleToCloud({
          placa: cleanPlaca,
          tipo: 'cavalo',
          ultimoHodometro: entryData.hodometro || 0,
          ultimoHorimetro: 0,
          proprietario: 'Próprio',
        });
      }
    }
    if (entryData.placaCarreta) {
      const cleanCarreta = entryData.placaCarreta.toUpperCase().trim();
      const targetC = vehicles.find((v) => v.placa.toUpperCase() === cleanCarreta);
      if (targetC) {
        const updatedC = {
          ...targetC,
          ultimoHodometro: Math.max(targetC.ultimoHodometro || 0, entryData.hodometro || 0),
          ultimoHorimetro: Math.max(targetC.ultimoHorimetro || 0, entryData.horimetro || 0),
        };
        saveVehicleToCloud(updatedC);
      } else {
        saveVehicleToCloud({
          placa: cleanCarreta,
          tipo: 'carreta',
          ultimoHodometro: 0,
          ultimoHorimetro: entryData.horimetro || 0,
          proprietario: 'Próprio',
        });
      }
    }

    // Auto-cadastra a nova rota no banco em nuvem caso não esteja na lista
    if (entryData.rota) {
      const cleanRota = entryData.rota.trim().toUpperCase();
      const routeExists = routes.some(
        (r) => r.nome.trim().toUpperCase() === cleanRota ||
               (r.codigo && r.codigo.trim().toUpperCase() === cleanRota)
      );
      if (!routeExists && cleanRota.length > 0) {
        const newRouteObj: Route = {
          id: `route-${Date.now()}`,
          codigo: cleanRota.slice(0, 8),
          nome: cleanRota,
        };
        saveRouteToCloud(newRouteObj);
        setRoutes((prev) => [...prev, newRouteObj]);
      }
    }
  };

  // Update an existing entry
  const handleUpdateEntry = (updatedEntry: FuelingEntry) => {
    const targetSheet = sheets.find((s) => s.entries.some((e) => e.id === updatedEntry.id)) || currentSheet;
    const updatedEntries = targetSheet.entries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
    handleUpdateSheet({
      ...targetSheet,
      entries: updatedEntries,
    });
  };

  // Delete an entry
  const handleDeleteEntry = (id: string) => {
    const targetSheet = sheets.find((s) => s.entries.some((e) => e.id === id)) || currentSheet;
    const updatedEntries = targetSheet.entries.filter((e) => e.id !== id);
    handleUpdateSheet({
      ...targetSheet,
      entries: updatedEntries,
    });
  };

  // Handle imported Excel sheet
  const handleImportSheet = (parsed: Partial<DailySheet>) => {
    const sheetDate = parsed.date || new Date().toISOString().split('T')[0];
    const existing = sheets.find((s) => s.date === sheetDate);

    if (existing) {
      const updated = {
        ...existing,
        aberturaTanque: parsed.aberturaTanque || existing.aberturaTanque,
        fechamentoTanque: parsed.fechamentoTanque || existing.fechamentoTanque,
        entries: [...(parsed.entries || []), ...existing.entries],
      };
      handleUpdateSheet(updated);
      setCurrentSheetId(existing.id);
    } else {
      const newSheet: DailySheet = {
        id: `sheet-${sheetDate}`,
        date: sheetDate,
        aberturaTanque: parsed.aberturaTanque || 10000,
        fechamentoTanque: parsed.fechamentoTanque || 8000,
        entries: parsed.entries || [],
      };
      saveSheetToCloud(newSheet);
      setCurrentSheetId(newSheet.id);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} transition-colors duration-200`}>
      {/* Header Bar */}
      <Header
        currentSheet={currentSheet}
        allSheets={sheets}
        onOpenNewModal={() => setShowNewModal(true)}
        onOpenGrade={handleOpenGrade}
        onOpenTankLevel={handleOpenTankLevel}
        onOpenGraficos={() => setIsGraficosOpen(true)}
        onOpenCadastros={() => setIsCadastrosOpen(true)}
        onOpenEmailModal={() => setIsEmailOpen(true)}
        onSelectDateSheet={setCurrentSheetId}
        onImportSheet={handleImportSheet}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isCloudConnected={isCloudConnected}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* BOTAO NOVO LANÇAMENTO CENTRALIZADO (Único botão no corpo da página) */}
        <div className="flex justify-center items-center my-3 sm:my-6 text-center w-full px-1">
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base sm:text-lg md:text-xl tracking-wide uppercase rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all border-2 border-amber-200 flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
          >
            <div className="p-1 sm:p-1.5 bg-slate-950 text-amber-400 rounded-lg shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </div>
            <span className="truncate">+ NOVO LANÇAMENTO DE ABASTECIMENTO</span>
          </button>
        </div>

        {/* Quick entry form inline or modal toggle */}
        {showNewModal && (
          <div className="mb-6">
            <DailySheetForm
              onAddEntry={handleAddEntry}
              onAddVehicle={(v) => saveVehicleToCloud(v)}
              onAddRoute={(r) => {
                saveRouteToCloud(r);
                setRoutes((prev) => {
                  if (prev.some((item) => item.nome.trim().toUpperCase() === r.nome.trim().toUpperCase())) {
                    return prev;
                  }
                  return [...prev, r];
                });
              }}
              vehicles={vehicles}
              drivers={drivers}
              attendants={attendants}
              routes={routes}
              currentDate={currentSheet.date}
              onClose={() => setShowNewModal(false)}
              onGoToDashboard={() => setIsGraficosOpen(true)}
            />
          </div>
        )}

        {/* GRADE DE LANÇAMENTOS DE ABASTECIMENTO (ABERTA ABAIXO DO BOTÃO COM BOTÃO DE OCULTAR) */}
        <div id="grade-lancamentos-section" className="space-y-4 pt-1 sm:pt-2">
          <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 shadow-md gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
                <Table className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base md:text-lg uppercase text-slate-100 tracking-wide flex items-center gap-2 sm:gap-2.5">
                  <span>Grade de Lançamentos</span>
                  <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {allEntries.length}
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={() => setShowTable(!showTable)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold border border-slate-700 cursor-pointer shadow-sm ml-auto"
              title={showTable ? "Ocultar Tabela de Lançamentos" : "Mostrar Tabela de Lançamentos"}
            >
              {showTable ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>Ocultar</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Mostrar</span>
                </>
              )}
            </button>
          </div>

          {showTable && (
            <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 p-1 sm:p-4 shadow-xl">
              <FuelingTable
                entries={allEntries}
                vehicles={vehicles}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
                onGoToDashboard={() => setIsGraficosOpen(true)}
              />
            </div>
          )}
        </div>

        {/* MODAL NÍVEL DO TANQUE */}
        {isTankOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-slate-100 tracking-wide">
                      Medição e Lançamentos de Nível do Tanque
                    </h3>
                    <p className="text-xs text-slate-400">
                      Entrada de combustível, medições de abertura e fechamento
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsTankOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)]">
                <TankHeaderCard
                  sheet={currentSheet}
                  onUpdateSheet={handleUpdateSheet}
                  isOpen={true}
                  onToggleOpen={(open) => setIsTankOpen(open)}
                />
              </div>

            </div>
          </div>
        )}

        {/* MODAL GRADE DE LANÇAMENTOS */}
        {isGridOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-7xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-slate-100 tracking-wide">
                      Grade de Lançamentos de Abastecimento
                    </h3>
                    <p className="text-xs text-slate-400">
                      {currentSheet.entries.length} lançamentos registrados na ficha diária ({currentSheet.date})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGridOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar Grade</span>
                </button>
              </div>

              {/* Modal Body with Full FuelingTable */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)]">
                <FuelingTable
                  entries={currentSheet.entries}
                  vehicles={vehicles}
                  onUpdateEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                  onGoToDashboard={() => {
                    setIsGridOpen(false);
                    setIsGraficosOpen(true);
                  }}
                  isGridOpen={true}
                />
              </div>

            </div>
          </div>
        )}

        {/* MODAL GRÁFICOS & CONSUMO */}
        {isGraficosOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-7xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-slate-100 tracking-wide">
                      Gráficos & Consumo da Frota
                    </h3>
                    <p className="text-xs text-slate-400">
                      Análise de desempenho, médias Km/L, Horímetro/L e ranking de consumo
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGraficosOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar Gráficos</span>
                </button>
              </div>

              {/* Modal Body with FleetAnalytics */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)]">
                <FleetAnalytics
                  entries={currentSheet.entries}
                  vehicles={vehicles}
                  allSheets={sheets}
                />
              </div>

            </div>
          </div>
        )}

        {/* MODAL CADASTRO DA FROTA */}
        {isCadastrosOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-7xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-slate-100 tracking-wide">
                      Cadastro da Frota & Equipe
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gerenciamento de veículos, motoristas, frentistas e rotas de entrega
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCadastrosOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar Cadastro</span>
                </button>
              </div>

              {/* Modal Body with VehicleManager */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)]">
                <VehicleManager
                  vehicles={vehicles}
                  drivers={drivers}
                  attendants={attendants}
                  routes={routes}
                  onAddVehicle={(v) => saveVehicleToCloud(v)}
                  onAddBatchVehicles={(newVs) => saveBatchVehiclesToCloud(newVs)}
                  onAddDriver={(d) => saveDriverToCloud(d)}
                  onAddBatchDrivers={(newDs) => saveBatchDriversToCloud(newDs)}
                  onAddAttendant={(a) => saveAttendantToCloud(a)}
                  onAddBatchAttendants={(newAs) => saveBatchAttendantsToCloud(newAs)}
                  onAddRoute={(r) => saveRouteToCloud(r)}
                  onAddBatchRoutes={(newRs) => saveBatchRoutesToCloud(newRs)}
                  onDeleteVehicle={(placa) => deleteVehicleFromCloud(placa)}
                  onDeleteDriver={(id) => deleteDriverFromCloud(id)}
                  onDeleteAttendant={(id) => deleteAttendantFromCloud(id)}
                  onDeleteRoute={(id) => deleteRouteFromCloud(id)}
                  onImportAllCadastros={handleImportAllCadastros}
                  onResetCadastrosToDefaults={handleResetCadastrosToDefaults}
                />
              </div>

            </div>
          </div>
        )}

        {/* MODAL ENVIAR E-MAIL COM PLANILHA EXCEL */}
        {isEmailOpen && (
          <EmailModal
            sheet={currentSheet}
            onClose={() => setIsEmailOpen(false)}
          />
        )}

      </main>
    </div>
  );
}
