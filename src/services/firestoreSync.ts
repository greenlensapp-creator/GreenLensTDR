import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ScanHistoryItem } from '../types';
import { getScanHistory } from './storageService';
import { formatScanDate, getTimestampMillis } from './dateUtils';

/**
 * Sincroniza un nuevo escaneo tanto localmente como en Firestore si el usuario está autenticado.
 * Utiliza serverTimestamp() o la fecha exacta ISO real.
 */
export async function syncAddScan(scan: ScanHistoryItem): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.uid) return;

  try {
    const scanRef = doc(db, 'users', user.uid, 'scans', scan.id);
    const cleanScan = JSON.parse(JSON.stringify(scan));
    await setDoc(scanRef, {
      ...cleanScan,
      ownerUid: user.uid,
      createdAt: scan.timestamp || new Date().toISOString(),
      serverCreatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('No se pudo sincronizar el escaneo con Firestore:', error);
  }
}

/**
 * Sincroniza la eliminación de un escaneo en Firestore.
 * Solo puede eliminar documentos dentro del sub-árbol users/{currentUser.uid}/scans/{scanId}.
 */
export async function syncDeleteScan(scanId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.uid) return;

  try {
    const scanRef = doc(db, 'users', user.uid, 'scans', scanId);
    await deleteDoc(scanRef);
  } catch (error) {
    console.warn('Error eliminando escaneo de Firestore:', error);
  }
}

/**
 * Elimina REALMENTE todos los registros de historial pertenecientes ÚNICAMENTE
 * al usuario autenticado actual en Firestore.
 */
export async function syncClearAllUserScans(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.uid) return;

  try {
    const scansCol = collection(db, 'users', user.uid, 'scans');
    const snapshot = await getDocs(scansCol);

    if (snapshot.empty) {
      return;
    }

    // Firestore batch permite hasta 500 operaciones por batch
    const docs = snapshot.docs;
    const chunkSize = 400;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + chunkSize);
      chunk.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error eliminando historial completo en Firestore:', error);
    throw error;
  }
}

/**
 * Sincroniza el estado de favorito en Firestore
 */
export async function syncToggleFavorite(scanId: string, isFavorite: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.uid) return;

  try {
    const scanRef = doc(db, 'users', user.uid, 'scans', scanId);
    await setDoc(scanRef, { isFavorite }, { merge: true });
  } catch (error) {
    console.warn('Error actualizando favorito en Firestore:', error);
  }
}

/**
 * Carga todos los escaneos del usuario desde Firestore,
 * preserva los timestamps reales almacenados sin inventar fechas actuales,
 * y los ordena de más reciente a más antiguo basándose en el timestamp real.
 */
export async function fetchUserScans(): Promise<ScanHistoryItem[]> {
  const user = auth.currentUser;
  if (!user || !user.uid) return getScanHistory();

  try {
    const scansCol = collection(db, 'users', user.uid, 'scans');
    const snapshot = await getDocs(scansCol);

    if (snapshot.empty) {
      return [];
    }

    const scans: ScanHistoryItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawTimestamp = data.createdAt || data.timestamp || null;

      const item: ScanHistoryItem = {
        id: docSnap.id,
        name: data.name || 'Planta',
        scientificName: data.scientificName || 'Especie botánica',
        confidence: typeof data.confidence === 'number' ? data.confidence : 80,
        timestamp: rawTimestamp || '',
        formattedDate: formatScanDate(rawTimestamp),
        image: data.image || '',
        category: data.category || 'Botánica',
        isFavorite: Boolean(data.isFavorite),
        allPredictions: data.allPredictions,
        details: data.details
      };
      scans.push(item);
    });

    // Ordenar de más reciente a más antiguo por timestamp real
    return scans.sort((a, b) => {
      const timeA = getTimestampMillis(a.timestamp);
      const timeB = getTimestampMillis(b.timestamp);
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error obteniendo escaneos de Firestore:', error);
    return getScanHistory();
  }
}
