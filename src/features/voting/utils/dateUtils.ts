export const now = () => Date.now();

export const fmtRemain = (ms: number) => {
  if (ms <= 0) return "00:00:00";

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");

  if (d > 0) {
    return `${d}d ${h}:${m}:${ss}`;
  }
  return `${h}:${m}:${ss}`;
};

export const parseAPIDate = (dateString: string): number => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}, using current time`);
    return Date.now();
  }

  return date.getTime();
};
