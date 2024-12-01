const express = require('express'); // Framework para crear servidores web
const sqlite3 = require('sqlite3').verbose(); // Biblioteca para manejar bases de datos SQLite
const cors = require('cors'); // Middleware para manejar CORS (permitir solicitudes de otros dominios)

const app = express(); // Inicializa la aplicación de Express

// Permitir solicitudes de diferentes dominios (desde el frontend)
app.use(cors());

// Configurar Express para manejar datos en formato JSON
app.use(express.json());

// Crear o conectar la base de datos SQLite
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa.');
  }
});

// Crear la tabla "tasks" si no existe, asegurándonos de incluir la columna "completed"
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único para cada tarea
      title TEXT NOT NULL, -- Título de la tarea (obligatorio)
      description TEXT, -- Descripción de la tarea (opcional)
      deadline TEXT NOT NULL, -- Fecha límite de la tarea (obligatorio)
      completed BOOLEAN DEFAULT 0 -- Estado de completado, predeterminado en falso
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

// Ruta para agregar una tarea nueva
app.post('/api/tasks', (req, res) => {
  const { title, description, deadline, completed } = req.body;

  // Validación básica de los datos de entrada
  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }

  // Insertar la nueva tarea en la base de datos
  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline, completed) VALUES (?, ?, ?, ?)');
  stmt.run(title, description, deadline, completed || false, function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al agregar la tarea' });
    } else {
      // Respuesta con los datos de la tarea recién creada
      res.status(201).json({ id: this.lastID, title, description, deadline, completed: completed || false });
    }
  });
  stmt.finalize(); // Liberar el statement preparado
});

// Ruta para obtener todas las tareas
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error al obtener las tareas' });
    } else {
      res.json(rows); // Enviar todas las tareas al cliente
    }
  });
});

// Ruta para marcar la tarea como completada
app.put('/api/tasks/:id/complete', (req, res) => {
  const taskId = req.params.id;
  console.log(`Received request to mark task ${taskId} as complete`);

  const query = 'UPDATE tasks SET completed = 1 WHERE id = ?';

  db.run(query, [taskId], function (err) {
    if (err) {
      console.error('Error al cambiar el estado de la tarea:', err);
      res.status(500).json({ message: 'Error al cambiar el estado de la tarea' });
    } else if (this.changes === 0) {
      console.log('No task found with that ID');
      res.status(404).json({ message: 'Task not found' });
    } else {
      console.log(`Task ${taskId} marked as completed`);
      res.status(200).json({ id: taskId, completed: true });
    }
  });
});

// Ruta para marcar la tarea como incompleta
app.put('/api/tasks/:id/incomplete', (req, res) => {
  const taskId = req.params.id;
  console.log(`Received request to mark task ${taskId} as incomplete`);

  // Consulta para actualizar el estado de la tarea a incompleta (completed = 0)
  const query = 'UPDATE tasks SET completed = 0 WHERE id = ?';

  db.run(query, [taskId], function (err) {
    if (err) {
      console.error('Error al cambiar el estado de la tarea:', err);
      res.status(500).json({ message: 'Error al cambiar el estado de la tarea' });
    } else if (this.changes === 0) {
      console.log('No task found with that ID');
      res.status(404).json({ message: 'Task not found' });
    } else {
      console.log(`Task ${taskId} marked as incomplete`);
      // Add this line to send a JSON response with the task ID and completed status
      res.status(200).json({ id: taskId, completed: false });
    }
  });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id; // Obtener el ID de la tarea de los parámetros de la URL

  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al eliminar la tarea' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Task not found' }); // Tarea no encontrada
    } else {
      res.status(204).send(); // Éxito sin contenido
    }
  });
});

// Ruta de prueba para la raíz (opcional)
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Task Tracker API</h1>');
});

// Configuración del puerto y arranque del servidor
const PORT = 5000; // Puerto donde se ejecutará el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
