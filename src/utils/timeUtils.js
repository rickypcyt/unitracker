// src/utils/timeUtils.js
export function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getMonthYear(date) {
    const d = new Date(date);
    return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
}

