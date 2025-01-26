import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db = null;

export const initializeDB = async () => {
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });

  // Crea/abre la base de datos en el almacenamiento persistente (OPFS)
  db = new sqlite3.oo1.OpfsDb('/tasks.db');
  
  // Crear tabla si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      completed BOOLEAN DEFAULT 0
    );
  `);

  return db;
};

export const getDB = () => db;