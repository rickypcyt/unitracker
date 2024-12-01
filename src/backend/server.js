const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

// Permitir solicitudes de diferentes dominios (desde el frontend)
app.use(cors());

// Usar JSON para manejar datos
app.use(express.json());

// Crear una base de datos SQLite (si no existe) o abrirla
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa.');
  }
});

// Crear la tabla de tareas si no existe
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title TEXT, description TEXT, deadline TEXT)');
});

// Ruta para agregar tarea
app.post('/api/tasks', (req, res) => {
  const { title, description, deadline } = req.body;

  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline) VALUES (?, ?, ?)');
  stmt.run(title, description, deadline, function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al agregar la tarea' });
    } else {
      res.status(201).json({ id: this.lastID, title, description, deadline });
    }
  });
  stmt.finalize();
});

// Ruta para obtener todas las tareas
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error al obtener las tareas' });
    } else {
      res.json(rows);
    }
  });
});

// Configuración del puerto
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
