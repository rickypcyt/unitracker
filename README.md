
# Uni Tracker 📚

Uni Tracker is an application for managing university tasks and activities. Initially developed with SQLite, it now uses **Supabase** as the backend and is built with **Vite.js** and **React**.

## **Features** ✨
- Create, edit, and delete tasks.
- Calendar view to organize activities.
- Data storage with Supabase.
- Automatic deployment with Vercel.

## **Technologies** 🛠️
- **Frontend:** Vite.js, React, Tailwind CSS
- **Backend:** Supabase (Database)
- **Deployment:** Vercel

## **Components** 🧩

### Stats.jsx
- Displays statistics using a bar chart.
- Shows today's hours, weekly data, and monthly totals.

### TaskList.jsx
- Manages and displays a list of tasks.
- Allows toggling task status, deleting tasks, and updating them.

### GoogleLoginButton.tsx
- Provides a button for Google login/logout.
- Uses `react-toastify` for notifications.

### Calendar.jsx
- Displays a calendar view of tasks.
- Allows navigation between weeks and viewing tasks on specific dates.

### TaskForm.jsx
- Provides a form to add new tasks.
- Handles form submission and task assignment suggestions.

### Pomodoro.jsx
- Implements a Pomodoro timer with work/break intervals.
- Provides notifications and sounds for session changes.

### StartSessionMenu.jsx
- A menu to start study sessions with tools like Pomodoro and noise generators.
- Manages user tasks and settings.

### NoiseGenerator.jsx
- Generates different noise types (e.g., brown noise, rain, ocean) to aid concentration.
- Uses `Tone.js` for sound generation.

### ProgressTracker.jsx
- Tracks and displays task completion progress.
- Shows productivity metrics and milestones.

### StudyTimer.jsx
- A timer to track study sessions.
- Handles start, pause, and reset functionalities.

## **Supabase Integration** 🔗

### Supabase Client Initialization
The `supabaseClient.js` file initializes the Supabase client using environment variables.

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Usage in Components
Various components and actions use the Supabase client to interact with the backend.

#### Examples of Table and Column Interactions

**Fetch Tasks:**
The `fetchTasks` action retrieves tasks from the `tasks` table filtered by user ID.
```javascript
import { supabase } from '../utils/supabaseClient';
import { fetchTasksSuccess, taskError } from './TaskSlice';

export const fetchTasks = () => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    dispatch(fetchTasksSuccess(data));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};
```

**Add a Task:**
The `addTask` action inserts a new task into the `tasks` table, associated with the user ID.
```javascript
export const addTask = (newTask) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      const localTask = { ...newTask, id: Date.now(), created_at: new Date().toISOString(), completed: false, activetask: false };
      localTasks.push(localTask);
      localStorage.setItem('localTasks', JSON.stringify(localTasks));
      return localTask;
    }

    const taskWithUser = { ...newTask, user_id: user.id };
    const { data, error } = await supabase.from('tasks').insert([taskWithUser]).select();
    if (error) throw error;
    dispatch(addTaskSuccess(data[0]));
    return data[0];
  } catch (error) {
    dispatch(taskError(error.message));
    throw error;
  }
};
```

**Update a Task:**
The `updateTask` action updates task details in the `tasks` table.
```javascript
export const updateTask = (id, updates) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    dispatch(updateTaskSuccess(data[0]));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};
```

**Delete a Task:**
The `deleteTask` action removes a task from the `tasks` table.
```javascript
export const deleteTask = (id) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    dispatch(deleteTaskSuccess(id));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};
```

**Authentication:**
The `useAuth` hook handles user authentication with Supabase.
```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session) {
        toast.dismiss();
        toast.success('🔑 You have successfully logged in!', { position: 'top-center', autoClose: 3000 });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error.message);
      toast.error('Error logging in with Google', { position: 'top-center' });
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Successfully logged out', { position: 'top-center' });
    } catch (error) {
      console.error('Error logging out:', error.message);
      toast.error('Error logging out', { position: 'top-center' });
    }
  };

  return { user, isLoggedIn, loginWithGoogle, logout };
};
```

## **Installation & Setup** 🚀

### Prerequisites
- Node.js
- Supabase Account

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/rickypcyt/vitejs-uni-tracker.git
   cd vitejs-uni-tracker
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables in a `.env` file:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

### Deployment
The app is configured for automatic deployment with Vercel.

---

## **Contributions** 🤝

Contributions are welcome. Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

---

## **License** 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
