export function formatTime(totalSeconds, roundUp = false) {
  const s = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);

  return (
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}` 
  );
}

export function getMonthYear(date, locale = "default") {
  const d = new Date(date);
  return `${d.toLocaleString(locale, { month: "long" })} ${d.getFullYear()}`;
}

export function formatPomodoroTime(totalSeconds, roundUp = false) {
  const s = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);

  if (hours > 0) {
    return (
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}` 
    );
  } else {
    return (
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`
    );
  }
}
