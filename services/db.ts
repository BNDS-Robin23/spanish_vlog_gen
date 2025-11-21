import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VlogEntry } from '../types';

interface VlogDB extends DBSchema {
  vlogs: {
    key: string;
    value: VlogEntry;
    indexes: { 'by-date': number };
  };
}

const DB_NAME = 'vlog-espanol-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VlogDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VlogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const vlogStore = db.createObjectStore('vlogs', { keyPath: 'id' });
        vlogStore.createIndex('by-date', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const saveVlog = async (entry: VlogEntry) => {
  const db = await initDB();
  return db.put('vlogs', entry);
};

export const getAllVlogs = async (): Promise<VlogEntry[]> => {
  const db = await initDB();
  return db.getAllFromIndex('vlogs', 'by-date');
};

export const getVlogById = async (id: string): Promise<VlogEntry | undefined> => {
  const db = await initDB();
  return db.get('vlogs', id);
};

export const deleteVlog = async (id: string) => {
  const db = await initDB();
  return db.delete('vlogs', id);
};