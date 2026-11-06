import { DailySheet, Vehicle, Driver, Attendant, Route } from '../types';

export const INITIAL_VEHICLES: Vehicle[] = [
  // Cavalos
  { placa: 'ABC-1D23', tipo: 'cavalo', ultimoHodometro: 125000, ultimoHorimetro: 4200, proprietario: 'Próprio' },
  { placa: 'DEF-4E56', tipo: 'cavalo', ultimoHodometro: 98000, ultimoHorimetro: 3100, proprietario: 'Próprio' },
  { placa: 'GHI-7F89', tipo: 'cavalo', ultimoHodometro: 142000, ultimoHorimetro: 5050, proprietario: 'Próprio' },
  { placa: 'JKL-0G12', tipo: 'cavalo', ultimoHodometro: 85000, ultimoHorimetro: 2800, proprietario: 'Próprio' },
  { placa: 'MNO-3H45', tipo: 'cavalo', ultimoHodometro: 110000, ultimoHorimetro: 3900, proprietario: 'Próprio' },
  // Carretas EQF (Thermo King)
  { placa: 'EQF-9A88', tipo: 'carreta', ultimoHodometro: 0, ultimoHorimetro: 1850, proprietario: 'Próprio' },
  { placa: 'EQF-8B77', tipo: 'carreta', ultimoHodometro: 0, ultimoHorimetro: 2100, proprietario: 'Próprio' },
  { placa: 'EQF-7C66', tipo: 'carreta', ultimoHodometro: 0, ultimoHorimetro: 1450, proprietario: 'Próprio' },
  { placa: 'EQF-6D55', tipo: 'carreta', ultimoHodometro: 0, ultimoHorimetro: 3200, proprietario: 'Próprio' },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'drv-01', nome: 'ACYR DO NASCIMENTO', matricula: '' },
  { id: 'drv-02', nome: 'ADEMIR CAMERA', matricula: '' },
  { id: 'drv-03', nome: 'ADRIANO CORREA CONCEIÇÃO', matricula: '' },
  { id: 'drv-04', nome: 'AGNALDO LORENZONI', matricula: '' },
  { id: 'drv-05', nome: 'ALEXANDRE SIQUEIRA', matricula: '' },
  { id: 'drv-06', nome: 'ANTONIO CARLOS LUIZ', matricula: '' },
  { id: 'drv-07', nome: 'CARLOS ALBERTO SQUIERI', matricula: '' },
  { id: 'drv-08', nome: 'CARLOS EDUARDO DAS DORES DE SOUZA', matricula: '' },
  { id: 'drv-09', nome: 'CARLOS ROBERTO LAPCHINSKI', matricula: '' },
  { id: 'drv-10', nome: 'CASSIANO CAMARGO FERREIRA', matricula: '' },
  { id: 'drv-11', nome: 'CELSO RODRIGUES MAZURKIEVICZ', matricula: '' },
  { id: 'drv-12', nome: 'CLAUDIO FRANCISCO DOS SANTOS', matricula: '' },
  { id: 'drv-13', nome: 'CLAUDIO OLIVEIRA DA SILVA CRUZ', matricula: '' },
  { id: 'drv-14', nome: 'CLEVERSON AIRES SILVEIRA', matricula: '' },
  { id: 'drv-15', nome: 'DANIEL MARTINS', matricula: '' },
  { id: 'drv-16', nome: 'DIEGO GONCALVES DOS PASSOS', matricula: '' },
  { id: 'drv-17', nome: 'EDENILSON FEITOSA', matricula: '' },
  { id: 'drv-18', nome: 'EDUARDO JOSE BESBATI', matricula: '' },
  { id: 'drv-19', nome: 'ELTON ERLEY SCHILKE', matricula: '' },
  { id: 'drv-20', nome: 'ELVES BOZA', matricula: '' },
  { id: 'drv-21', nome: 'ENIO KAPLUM', matricula: '' },
  { id: 'drv-22', nome: 'EVERSON GONÇALVES BOEIRA', matricula: '' },
  { id: 'drv-23', nome: 'EVERTON DE OLIVEIRA', matricula: '' },
  { id: 'drv-24', nome: 'FABIO LOPES DE SOUZA', matricula: '' },
  { id: 'drv-25', nome: 'FERNANDO APARECIDO DE OLIVEIRA FREITAS', matricula: '' },
  { id: 'drv-26', nome: 'GILBERTO CONCEIÇAO DA SILVA', matricula: '' },
  { id: 'drv-27', nome: 'ISRAEL FERREIRA DE SOUZA', matricula: '' },
  { id: 'drv-28', nome: 'JOSE EDUARDO CEDILLO GONZALEZ', matricula: '' },
  { id: 'drv-29', nome: 'JOSE LUCIANO BONFIM', matricula: '' },
  { id: 'drv-30', nome: 'LEANDRO DE OLIVEIRA BRANCO', matricula: '' },
  { id: 'drv-31', nome: 'LUCAS OWSIANY DO NASCIMENTO', matricula: '' },
  { id: 'drv-32', nome: 'LUCIANO ROBERTO CARVALHO', matricula: '' },
  { id: 'drv-33', nome: 'LUIZ FERNANDO OPALENSKI', matricula: '' },
  { id: 'drv-34', nome: 'MARCELO JOSE DOS REIS', matricula: '' },
  { id: 'drv-35', nome: 'MARCOS GRASSI DE MIRANDA', matricula: '' },
  { id: 'drv-36', nome: 'NILTON LUNELLI', matricula: '' },
  { id: 'drv-37', nome: 'OSMAR HENEQUIM', matricula: '' },
  { id: 'drv-38', nome: 'PEDRO VIERA MIRANDA FILHO', matricula: '' },
  { id: 'drv-39', nome: 'RODRIGO DE ANDRADE SILVA', matricula: '' },
  { id: 'drv-40', nome: 'ROGERIO RIBEIRO DA SILVA', matricula: '' },
  { id: 'drv-41', nome: 'ROMILDO DOS SANTOS BUDNIK', matricula: '' },
  { id: 'drv-42', nome: 'RONDINELI DANILO ARAUJO DO NASCIMENTO', matricula: '' },
  { id: 'drv-43', nome: 'VALDEMAR JOSE DA SILVA', matricula: '' },
  { id: 'drv-44', nome: 'VALTER SILVINO DYBAX', matricula: '' },
  { id: 'drv-45', nome: 'WILLIAN GUEDES DE ANDRADE', matricula: '' },
  { id: 'drv-46', nome: 'JHEMISON PEREIRA ABREU', matricula: '' },
  { id: 'drv-47', nome: 'JOAO PAULO BARBOSA MARTINS', matricula: '' },
  { id: 'drv-48', nome: 'ALEXSANDRO DUTRA SILVA', matricula: '' },
  { id: 'drv-49', nome: 'JOCELITO ASSUMPÇÃO WILLE', matricula: '' },
  { id: 'drv-50', nome: 'EDUARDO HENRIQUE CORREIA', matricula: '' },
  { id: 'drv-51', nome: 'JOÃO PAULO BIALLY', matricula: '' },
  { id: 'drv-52', nome: 'EDIMAR APARECIDO CONSULIN', matricula: '' },
  { id: 'drv-53', nome: 'JOEL SANTOS PRESTES', matricula: '' },
  { id: 'drv-54', nome: 'FABIANO BERNARDO DA SILVA', matricula: '' },
  { id: 'drv-55', nome: 'DEYVERSON RANDERSON MAGNO DA SILVA', matricula: '' },
  { id: 'drv-56', nome: 'ANDERSON JOSE DE ANDRADE', matricula: '' },
  { id: 'drv-57', nome: 'MARCIO DO VALE', matricula: '' },
  { id: 'drv-58', nome: 'ZAQUEU PINTO BARBOSA', matricula: '' },
];

export const INITIAL_ATTENDANTS: Attendant[] = [
  { id: 'att-1', nome: 'Marcos Frentista', turno: 'Manhã' },
  { id: 'att-2', nome: 'Roberto Frentista', turno: 'Tarde' },
  { id: 'att-3', nome: 'Luiz Frentista', turno: 'Noite' },
];

export const INITIAL_ROUTES: Route[] = [
  { id: 'rot-1', codigo: 'ROT-01', nome: 'Rota SP - Capital / CD', distanciaMediaKm: 120 },
  { id: 'rot-2', codigo: 'ROT-02', nome: 'Rota Campinas - Interior', distanciaMediaKm: 280 },
  { id: 'rot-3', codigo: 'ROT-03', nome: 'Rota Baixada Santista', distanciaMediaKm: 190 },
  { id: 'rot-4', codigo: 'ROT-04', nome: 'Rota Vale do Paraíba', distanciaMediaKm: 310 },
];

export const INITIAL_SHEETS: DailySheet[] = [];


