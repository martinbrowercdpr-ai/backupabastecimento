import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DailySheet, Vehicle, Driver, Attendant, Route } from '../types';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Collection Names
const SHEETS_COL = 'sheets';
const VEHICLES_COL = 'vehicles';
const DRIVERS_COL = 'drivers';
const ATTENDANTS_COL = 'attendants';
const ROUTES_COL = 'routes';

// Real-time listeners
export function subscribeToSheets(onUpdate: (sheets: DailySheet[]) => void) {
  return onSnapshot(
    collection(db, SHEETS_COL),
    (snapshot) => {
      const sheets: DailySheet[] = [];
      snapshot.forEach((docSnap) => {
        sheets.push(docSnap.data() as DailySheet);
      });
      sheets.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(sheets);
    },
    (err) => {
      console.error('Error listening to sheets in Firestore:', err);
    }
  );
}

export function subscribeToVehicles(onUpdate: (vehicles: Vehicle[]) => void) {
  return onSnapshot(
    collection(db, VEHICLES_COL),
    (snapshot) => {
      const list: Vehicle[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Vehicle);
      });
      list.sort((a, b) => a.placa.localeCompare(b.placa));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to vehicles in Firestore:', err);
    }
  );
}

export function subscribeToDrivers(onUpdate: (drivers: Driver[]) => void) {
  return onSnapshot(
    collection(db, DRIVERS_COL),
    (snapshot) => {
      const list: Driver[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Driver;
        list.push({ ...data, id: data.id || docSnap.id });
      });
      list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to drivers in Firestore:', err);
    }
  );
}

export function subscribeToAttendants(onUpdate: (attendants: Attendant[]) => void) {
  return onSnapshot(
    collection(db, ATTENDANTS_COL),
    (snapshot) => {
      const list: Attendant[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Attendant);
      });
      list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to attendants in Firestore:', err);
    }
  );
}

export function subscribeToRoutes(onUpdate: (routes: Route[]) => void) {
  return onSnapshot(
    collection(db, ROUTES_COL),
    (snapshot) => {
      const list: Route[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Route);
      });
      list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to routes in Firestore:', err);
    }
  );
}

// Writers
export async function saveSheetToCloud(sheet: DailySheet) {
  if (!sheet || !sheet.id) return;
  await setDoc(doc(db, SHEETS_COL, sheet.id), sheet);
}

export async function deleteSheetFromCloud(sheetId: string) {
  if (!sheetId) return;
  await deleteDoc(doc(db, SHEETS_COL, sheetId));
}

export async function saveVehicleToCloud(vehicle: Vehicle) {
  if (!vehicle || !vehicle.placa) return;
  const docId = vehicle.placa.trim().toUpperCase();
  await setDoc(doc(db, VEHICLES_COL, docId), { ...vehicle, placa: docId });
}

export async function saveBatchVehiclesToCloud(vehicles: Vehicle[]) {
  if (!vehicles || vehicles.length === 0) return;
  const batch = writeBatch(db);
  vehicles.forEach((v) => {
    const docId = v.placa.trim().toUpperCase();
    batch.set(doc(db, VEHICLES_COL, docId), { ...v, placa: docId });
  });
  await batch.commit();
}

export async function deleteVehicleFromCloud(placa: string) {
  if (!placa) return;
  const docId = placa.trim().toUpperCase();
  await deleteDoc(doc(db, VEHICLES_COL, docId));
}

export async function saveDriverToCloud(driver: Driver) {
  if (!driver || !driver.id) return;
  await setDoc(doc(db, DRIVERS_COL, driver.id), driver);
}

export async function saveBatchDriversToCloud(drivers: Driver[]) {
  if (!drivers || drivers.length === 0) return;
  const batch = writeBatch(db);
  drivers.forEach((d) => {
    batch.set(doc(db, DRIVERS_COL, d.id), d);
  });
  await batch.commit();
}

export async function deleteDriverFromCloud(id: string) {
  if (!id) return;
  await deleteDoc(doc(db, DRIVERS_COL, id));
}

export async function saveAttendantToCloud(attendant: Attendant) {
  if (!attendant || !attendant.id) return;
  await setDoc(doc(db, ATTENDANTS_COL, attendant.id), attendant);
}

export async function saveBatchAttendantsToCloud(attendants: Attendant[]) {
  if (!attendants || attendants.length === 0) return;
  const batch = writeBatch(db);
  attendants.forEach((a) => {
    batch.set(doc(db, ATTENDANTS_COL, a.id), a);
  });
  await batch.commit();
}

export async function deleteAttendantFromCloud(id: string) {
  if (!id) return;
  await deleteDoc(doc(db, ATTENDANTS_COL, id));
}

export async function saveRouteToCloud(route: Route) {
  if (!route || !route.id) return;
  await setDoc(doc(db, ROUTES_COL, route.id), route);
}

export async function saveBatchRoutesToCloud(routes: Route[]) {
  if (!routes || routes.length === 0) return;
  const batch = writeBatch(db);
  routes.forEach((r) => {
    batch.set(doc(db, ROUTES_COL, r.id), r);
  });
  await batch.commit();
}

export async function deleteRouteFromCloud(id: string) {
  if (!id) return;
  await deleteDoc(doc(db, ROUTES_COL, id));
}

export async function clearAllCadastrosFromCloud(
  vehicles: Vehicle[],
  drivers: Driver[],
  attendants: Attendant[],
  routes: Route[]
) {
  const batch = writeBatch(db);
  vehicles.forEach((v) => {
    const docId = v.placa.trim().toUpperCase();
    batch.delete(doc(db, VEHICLES_COL, docId));
  });
  drivers.forEach((d) => {
    batch.delete(doc(db, DRIVERS_COL, d.id));
  });
  attendants.forEach((a) => {
    batch.delete(doc(db, ATTENDANTS_COL, a.id));
  });
  routes.forEach((r) => {
    batch.delete(doc(db, ROUTES_COL, r.id));
  });
  await batch.commit();
}
