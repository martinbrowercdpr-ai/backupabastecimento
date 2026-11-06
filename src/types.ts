export interface FuelingEntry {
  id: string;
  sheetId?: string;
  date: string; // YYYY-MM-DD
  hora: string; // HH:mm
  placa: string; // Placa Cavalo
  litrosCavalo?: number; // Litros abastecidos no Cavalo
  placaCarreta?: string; // Placa Carreta TK (Thermo King)
  litrosCarreta?: number; // Litros abastecidos na Carreta TK
  litrosDiesel: number; // Total Litros Diesel
  frentista: string;
  motorista: string;
  hodometro: number; // KM (Cavalo)
  horimetro: number; // Hours (Carreta TK / Thermo King)
  rota: string;
  // Calculated fields
  kmRodados?: number;
  kmPorLitro?: number;
  litrosPorHora?: number;
  observacao?: string;
}

export interface DailySheet {
  id: string;
  date: string; // YYYY-MM-DD
  aberturaTanque: number; // Liters at start
  fechamentoTanque: number; // Liters at end
  recebimentoTanque?: number; // Incoming fuel delivery into post tank (optional)
  entries: FuelingEntry[];
  observacoes?: string;
  status?: 'aberto' | 'fechado' | 'auditado';
}

export interface Vehicle {
  placa: string;
  tipo?: 'cavalo' | 'carreta'; // 'cavalo' (Caminhão/Trator) or 'carreta' (Carreta/Thermo King EQF)
  ultimoHodometro: number;
  ultimoHorimetro: number;
  proprietario?: string;
}

export interface Driver {
  id: string;
  nome: string;
  matricula: string;
}

export interface Attendant {
  id: string;
  nome: string;
  turno: 'Manhã' | 'Tarde' | 'Noite' | 'Geral';
}

export interface Route {
  id: string;
  codigo: string;
  nome: string;
  distanciaMediaKm?: number;
}

export interface FleetStats {
  totalLitros: number;
  totalAbastecimentos: number;
  mediaKmL: number;
  veiculoMaisConsumidor: string;
  diferencaTanque: number; // Abertura - Fechamento - TotalSaidas
  eficienciaTanquePct: number;
}
