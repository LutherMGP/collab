// @/services/sqliteService.ts

import * as SQLite from 'expo-sqlite';

// Åbn eller opret SQLite-databasen
const db = SQLite.openDatabase('app.db');

/**
 * Initialiser SQLite-databasen.
 * Opret tabellen, hvis den ikke allerede findes.
 */
export const initializeSQLite = (): void => {
  db.transaction((tx) => {
    tx.executeSql(
      "CREATE TABLE IF NOT EXISTS project_counts (status TEXT PRIMARY KEY, count INTEGER);",
      [],
      () => {
        console.log("SQLite-tabel initialiseret.");
      },
      (_, error) => {
        console.error("Fejl ved initialisering af SQLite-tabel:", error);
        return false;
      }
    );
  });
};

/**
 * Opdater en status i databasen.
 * @param status Status-strengen, der skal opdateres.
 * @param count Antallet af projekter for denne status.
 */
export const updateProjectCount = (status: string, count: number): void => {
  db.transaction((tx) => {
    tx.executeSql(
      "INSERT OR REPLACE INTO project_counts (status, count) VALUES (?, ?);",
      [status, count],
      () => {
        console.log(`Opdaterede count for status: ${status} til ${count}.`);
      },
      (_, error) => {
        console.error("Fejl ved opdatering af projektantal:", error);
        return false;
      }
    );
  });
};

/**
 * Hent antal projekter for en bestemt status.
 * @param status Status-strengen, der skal hentes.
 * @returns Antallet af projekter for den givne status.
 */
export const getProjectCount = (status: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT count FROM project_counts WHERE status = ?;",
        [status],
        (_, { rows }: { rows: any }) => {
          if (rows.length > 0) {
            resolve(rows._array[0].count);
          } else {
            resolve(0); // Returner 0, hvis status ikke findes
          }
        },
        (_, error) => {
          console.error("Fejl ved hentning af projektantal:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};