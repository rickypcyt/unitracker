// src/utils/timeUtils.js

export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);

  return (
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}.` +
    `${centiseconds.toString().padStart(2, "0")}`
  );
}


export function getMonthYear(date) {
  const d = new Date(date);
  return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
}

// Formato Pomodoro: HH:MM.CC (horas:minutos.centésimas)
export function formatPomodoroTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);

  if (hours > 0) {
    return (
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}.` +
      `${centiseconds.toString().padStart(2, "0")}`
    );
  } else {
    return (
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}.` +
      `${centiseconds.toString().padStart(2, "0")}`
    );
  }
}
