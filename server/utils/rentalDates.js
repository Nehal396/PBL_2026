const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function getRentalDays(startDate, endDate) {
  const duration = (endDate.getTime() - startDate.getTime()) / DAY_MS;
  return Number.isInteger(duration) && duration > 0 ? duration : null;
}
