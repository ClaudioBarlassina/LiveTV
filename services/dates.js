export function matchTime(dateStr) {
  if (!dateStr) return '—';
  return dateStr.slice(11, 16);
}

export function matchDate(dateStr, opts = {}) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  const date = new Date(+y, +m - 1, +d);
  const { weekday, day, month, year } = opts;
  const fmt = {};
  if (weekday) fmt.weekday = weekday;
  if (day) fmt.day = 'numeric';
  if (month) fmt.month = month;
  if (year) fmt.year = 'numeric';
  return date.toLocaleDateString('es-AR', Object.keys(fmt).length ? fmt : undefined);
}
