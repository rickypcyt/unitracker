import express, { json } from 'express';
import {supabase} from '../src/utils/supabaseClient'; // Asegúrate de ajustar esta ruta a donde esté tu cliente Supabase
import cors from 'cors';

const app = express();
app.use(cors());
app.use(json());

// Endpoint para agregar una tarea
app.post('/api/tasks', async (req, res) => {
  const { title, description, deadline, completed } = req.body;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description,
          deadline,
          completed: completed || false,
        },
      ]);

    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({ id: data[0].id, title, description, deadline, completed: completed || false });
  } catch (err) {
    console.error('Error al agregar la tarea:', err.message);
    res.status(500).json({ message: 'Error al agregar la tarea: ' + err.message });
  }
});

// Endpoint para obtener todas las tareas
app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (err) {
    console.error('Error al obtener las tareas:', err.message);
    res.status(500).json({ message: 'Error al obtener las tareas: ' + err.message });
  }
});

// Endpoint para marcar una tarea como completada
app.put('/api/tasks/:id/complete', async (req, res) => {
  const taskId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId);

    if (error) {
      throw new Error(error.message);
    }

    if (data.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ id: taskId, completed: true });
  } catch (err) {
    console.error('Error al cambiar el estado de la tarea:', err.message);
    res.status(500).json({ message: 'Error al cambiar el estado de la tarea: ' + err.message });
  }
});

// Endpoint para marcar una tarea como incompleta
app.put('/api/tasks/:id/incomplete', async (req, res) => {
  const taskId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: false })
      .eq('id', taskId);

    if (error) {
      throw new Error(error.message);
    }

    if (data.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ id: taskId, completed: false });
  } catch (err) {
    console.error('Error al cambiar el estado de la tarea:', err.message);
    res.status(500).json({ message: 'Error al cambiar el estado de la tarea: ' + err.message });
  }
});

// Endpoint para eliminar una tarea
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error al eliminar la tarea:', err.message);
    res.status(500).json({ message: 'Error al eliminar la tarea: ' + err.message });
  }
});

// Ruta de callback de OAuth
app.get('/home', async (req, res) => {
  const code = req.query.code;
  const next = req.query.next ?? '/'; // Ruta a la que redirigir después de iniciar sesión

  if (code) {
    try {
      // Intercambia el código por una sesión
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error("Error al intercambiar el código:", error);
      res.status(500).send("Error al iniciar sesión.");
      return;
    }
  }

  // Redirige al usuario después del login
  res.redirect(303, `/${next.slice(1)}`);
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Task Tracker API</h1>');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
