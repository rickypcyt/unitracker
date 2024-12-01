# Task Management Application

This project is a task management application built using React, Redux, and Express with a SQLite database.

## High-Level Overview

### Components and Interactions

#### Frontend
- **Built with React**: Utilizes React for building the user interface.
- **Redux for State Management**: Manages global state using Redux.
- **Chakra UI for Styling**: Uses Chakra UI for styling and layout.

#### Backend
- **Built with Express**: Uses Express to create the server.
- **SQLite Database**: Utilizes SQLite as the database.

#### API
- **Backend Endpoints**: The backend exposes API endpoints to interact with the database.

### Frontend Components

- **Home**: The main component that renders other components like `TaskForm`, `TaskList`, `ProgressTracker`, and `Achievements`.
  - **TaskForm**: Allows users to add new tasks.
  - **TaskList**: Displays a list of tasks and allows users to mark tasks as completed or delete them.
  - **ProgressTracker**: Displays the number of completed tasks.
  - **Achievements**: Displays achievements based on the number of completed tasks.
  - **Calendar**: Displays tasks with deadlines on a calendar.

### Redux State Management

- **Store**: The central store managed by Redux, configured in `store.js`.
- **Actions**: Defined in `taskActions.js`, these actions are dispatched to update the state.
- **Reducers**: Defined in `taskReducer.js`, these reduce the state based on actions.
