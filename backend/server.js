const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

// Permitir solicitudes desde diferentes dominios
app.use(cors());

// Configurar Express para manejar datos JSON
app.use(express.json());

// Crear o conectar la base de datos SQLite
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión a la base de datos SQLite exitosa.');
  }
});

// Crear la tabla "tasks" si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(tag_id) REFERENCES tags(id),
      PRIMARY KEY (task_id, tag_id)
    );
  `);
});

// Ruta para obtener todos los tags
app.get('/api/tags', (req, res) => {
  db.all('SELECT * FROM tags', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error al obtener los tags' });
    } else {
      res.json(rows); // Enviar todos los tags disponibles
    }
  });
});

// Ruta para agregar una tarea nueva
app.post('/api/tasks', (req, res) => {
  const { title, description, deadline, completed, tags } = req.body;

  // Validación básica de los datos de entrada
  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }

  // Insertar la nueva tarea en la base de datos
  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline, completed) VALUES (?, ?, ?, ?)');
  stmt.run(title, description, deadline, completed || false, function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error al agregar la tarea' });
    }

    const taskId = this.lastID;

    // Asociar los tags con la tarea
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        // 1. Comprobar si el tag ya existe
        db.get('SELECT id FROM tags WHERE name = ?', [tag], (err, row) => {
          if (err) {
            console.error('Error al obtener el ID del tag:', err);
            return;
          }

          let tagId;
          if (row) {
            // Si el tag ya existe, usamos su ID
            tagId = row.id;
          } else {
            // Si el tag no existe, lo insertamos y obtenemos su ID
            db.run('INSERT INTO tags (name) VALUES (?)', [tag], function (err) {
              if (err) {
                console.error('Error al insertar el tag:', err);
                return;
              }
              tagId = this.lastID; // Obtener el ID del tag insertado
            });
          }

          // 2. Asociar el tag con la tarea en la tabla `task_tags`
          if (tagId) {
            db.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tagId], (err) => {
              if (err) {
                console.error('Error al asociar tag con tarea:', err);
              }
            });
          }
        });
      });
    }

    // Responder con los datos de la tarea recién creada
    res.status(201).json({
      id: taskId,
      title,
      description,
      deadline,
      completed: completed || false,
      tags,
    });
  });
  stmt.finalize(); // Liberar el statement preparado
});




// Ruta para obtener todas las tareas con sus tags asociados
app.get('/api/tasks', (req, res) => {
  const query = `
    SELECT tasks.id, tasks.title, tasks.description, tasks.deadline, tasks.completed, GROUP_CONCAT(tags.name) AS tags
    FROM tasks
    LEFT JOIN task_tags ON tasks.id = task_tags.task_id
    LEFT JOIN tags ON task_tags.tag_id = tags.id
    GROUP BY tasks.id
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener las tareas con los tags' });
    }
    res.json(rows); // Enviar las tareas con sus tags asociados
  });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id; // Obtener el ID de la tarea

  // Eliminar la tarea
  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error al eliminar la tarea' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Task not found' });
    } else {
      res.status(204).send(); // Éxito sin contenido
    }
  });
});

// Configuración del puerto y arranque del servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
