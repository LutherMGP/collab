// @/services/sqliteService.ts

import * as SQLite from 'expo-sqlite';

// Variabel til at holde databaseforbindelsen
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialiserer SQLite-databasen.
 * Opretter tabellen, hvis den ikke allerede findes.
 */
export const initializeSQLite = async (): Promise<void> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
  }
  await db.execAsync([
    {
      sql: 'CREATE TABLE IF NOT EXISTS project_counts (status TEXT PRIMARY KEY, count INTEGER);',
      args: [],
    },
  ]);
  console.log('SQLite-tabel initialiseret.');
};

/**
 * Opdaterer antallet af projekter for en given status i databasen.
 * @param status Status-strengen, der skal opdateres.
 * @param count Antallet af projekter for denne status.
 */
export const updateProjectCount = async (status: string, count: number): Promise<void> => {
  if (!db) {
    console.error('Database ikke initialiseret.');
    return;
  }
  await db.execAsync([
    {
      sql: 'INSERT OR REPLACE INTO project_counts (status, count) VALUES (?, ?);',
      args: [status, count],
    },
  ]);
  console.log(`Opdaterede count for status: ${status} til ${count}.`);
};

/**
 * Henter antallet af projekter for en bestemt status.
 * @param status Status-strengen, der skal hentes.
 * @returns En Promise, der løser til antallet af projekter for den givne status.
 */
export const getProjectCount = async (status: string): Promise<number> => {
  if (!db) {
    console.error('Database ikke initialiseret.');
    return 0;
  }
  const result = await db.execAsync([
    {
      sql: 'SELECT count FROM project_counts WHERE status = ?;',
      args: [status],
    },
  ]);
  const rows = result[0].rows;
  if (rows.length > 0) {
    return rows.item(0).count;
  } else {
    return 0; // Returnerer 0, hvis status ikke findes
  }
};