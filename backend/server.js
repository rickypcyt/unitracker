const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa.');
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      completed BOOLEAN DEFAULT 0
    );`,
    (err) => {
      if (err) {
        console.error('Error al crear/verificar la tabla tasks:', err.message);
      } else {
        console.log('Tabla "tasks" verificada/creada correctamente.');
      }
    }
  );
});

app.post('/api/tasks', (req, res) => {
  const { title, description, deadline, completed } = req.body;
  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline, completed) VALUES (?, ?, ?, ?)');
  stmt.run(title, description, deadline, completed || false, function (err) {
    if (err) {
      console.error('Error al agregar la tarea:', err.message);
      return res.status(500).json({ message: 'Error al agregar la tarea: ' + err.message });
    }
    res.status(201).json({ id: this.lastID, title, description, deadline, completed: completed || false });
  });
  stmt.finalize();
});

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      console.error('Error al obtener las tareas:', err.message);
      return res.status(500).json({ message: 'Error al obtener las tareas: ' + err.message });
    }
    res.json(rows);
  });
});

app.put('/api/tasks/:id/complete', (req, res) => {
  const taskId = req.params.id;
  console.log(`Received request to mark task ${taskId} as complete`);

  const query = 'UPDATE tasks SET completed = 1 WHERE id = ?';

  db.run(query, [taskId], function (err) {
    if (err) {
      console.error('Error al cambiar el estado de la tarea:', err.message);
      return res.status(500).json({ message: 'Error al cambiar el estado de la tarea: ' + err.message });
    } else if (this.changes === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ id: taskId, completed: true });
  });
});

app.put('/api/tasks/:id/incomplete', (req, res) => {
  const taskId = req.params.id;
  console.log(`Received request to mark task ${taskId} as incomplete`);

  const query = 'UPDATE tasks SET completed = 0 WHERE id = ?';

  db.run(query, [taskId], function (err) {
    if (err) {
      console.error('Error al cambiar el estado de la tarea:', err.message);
      return res.status(500).json({ message: 'Error al cambiar el estado de la tarea: ' + err.message });
    } else if (this.changes === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ id: taskId, completed: false });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  console.log('Task ID to delete:', taskId);

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) {
      console.error('Error al eliminar la tarea:', err.message);
      return res.status(500).json({ message: 'Error al eliminar la tarea: ' + err.message });
    } else if (this.changes === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Task Tracker API</h1>');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('Conexión a la base de datos cerrada.');
    }
    process.exit(0);
  });
});