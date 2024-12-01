const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

// Permitir solicitudes de diferentes dominios (desde el frontend)
app.use(cors({
  origin: 'http://localhost:5173' // Solo permite solicitudes desde localhost:3000
}));


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

// Crear la tabla de tareas si no existe (incluyendo el campo 'completed')
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      completed BOOLEAN NOT NULL DEFAULT 0
    )
  `);
});

// Ruta para agregar tarea
app.post('/api/tasks', (req, res) => {
  const { title, description, deadline, completed } = req.body;

  // Validación básica
  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }

  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline, completed) VALUES (?, ?, ?, ?)');
  stmt.run(title, description, deadline, completed || false, function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al agregar la tarea' });
    } else {
      res.status(201).json({ id: this.lastID, title, description, deadline, completed: completed || false });
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

// Ruta para marcar una tarea como completada o incompleta
app.put('/api/tasks/:id/toggle', (req, res) => {
  const taskId = req.params.id;
  const query = 'UPDATE tasks SET completed = NOT completed WHERE id = ?';

  db.run(query, [taskId], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al cambiar el estado de la tarea' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Task not found' });
    } else {
      res.status(200).json({ id: taskId, completed: this.changes > 0 });
    }
  });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al eliminar la tarea' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Task not found' });
    } else {
      res.status(204).send(); // No content
    }
  });
});

// Configuración del puerto
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Ruta para la raíz (opcional, solo para prueba)
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Task Tracker API</h1>');
});
