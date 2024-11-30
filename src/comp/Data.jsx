const saveToLocalStorage = (state) => {
    localStorage.setItem("tasks", JSON.stringify(state));
  };
  
  const loadFromLocalStorage = () => {
    const data = localStorage.getItem("tasks");
    return data ? JSON.parse(data) : [];
  };
  
  const store = configureStore({
    reducer: {
      tasks: tasksReducer,
    },
    preloadedState: { tasks: loadFromLocalStorage() },
  });
  
  store.subscribe(() => saveToLocalStorage(store.getState()));
  