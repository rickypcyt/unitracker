// utils/taskStorage.js
export const getLocalTasks = () => JSON.parse(localStorage.getItem("localTasks") || "[]");
export const setLocalTasks = (tasks) => localStorage.setItem("localTasks", JSON.stringify(tasks));
