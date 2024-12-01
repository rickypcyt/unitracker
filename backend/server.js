const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// Create an Express application
const app = express();

// Enable CORS to allow requests from different domains
app.use(cors());

// Configure Express to handle JSON data
app.use(express.json());

// Create or connect to the SQLite database
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successful connection to the SQLite database.');
  }
});

// Create the necessary tables in the database if they do not exist
db.serialize(() => {
  // Create the tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0
    );
  `);

  // Create the tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Create the task_tags table to associate tasks with tags
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

// API endpoint to get all tags
app.get('/api/tags', (req, res) => {
  // Query to select all tags from the tags table
  db.all('SELECT * FROM tags', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching tags' });
    } else {
      res.json(rows); // Send all available tags
    }
  });
});

// API endpoint to add a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, deadline, completed, tags } = req.body;

  // Basic validation of input data
  if (!title || !deadline) {
    return res.status(400).json({ message: 'Title and deadline are required' });
  }

  // Prepare the statement to insert a new task into the tasks table
  const stmt = db.prepare('INSERT INTO tasks (title, description, deadline, completed) VALUES (?, ?, ?, ?)');
  stmt.run(title, description, deadline, completed || false, function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error adding the task' });
    }

    const taskId = this.lastID; // Get the ID of the newly inserted task

    // Associate tags with the task
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        // 1. Check if the tag already exists
        db.get('SELECT id FROM tags WHERE name = ?', [tag], (err, row) => {
          if (err) {
            console.error('Error getting the tag ID:', err);
            return;
          }

          let tagId;
          if (row) {
            // If the tag exists, use its ID
            tagId = row.id;
          } else {
            // If the tag does not exist, insert it and get its ID
            db.run('INSERT INTO tags (name) VALUES (?)', [tag], function (err) {
              if (err) {
                console.error('Error inserting the tag:', err);
                return;
              }
              tagId = this.lastID; // Get the ID of the inserted tag
            });
          }

          // 2. Associate the tag with the task in the task_tags table
          if (tagId) {
            db.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tagId], (err) => {
              if (err) {
                console.error('Error associating tag with task:', err);
              }
            });
          }
        });
      });
    }

    // Respond with the data of the newly created task
    res.status(201).json({
      id: taskId,
      title,
      description,
      deadline,
      completed: completed || false,
      tags,
    });
  });
  stmt.finalize(); // Finalize the prepared statement
});

// API endpoint to get all tasks with their associated tags
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
      return res.status(500).json({ message: 'Error fetching tasks with tags' });
    }
    res.json(rows); // Send tasks with their associated tags
  });
});

// API endpoint to delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id; // Get the ID of the task to delete

  // Delete the task from the tasks table
  db.run('DELETE FROM tasks WHERE id = ?', [taskId], function (err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting the task' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Task not found' });
    } else {
      res.status(204).send(); // Success with no content
    }
  });
});

// Configure the port and start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
