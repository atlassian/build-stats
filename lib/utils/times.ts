export function daysToMs(days) {
  return 1000 * 60 * 60 * 24 * days;
}

export function withinDays(a, b, days) {
  let aTime = +new Date(a);
  let bTime = +new Date(b);
  return aTime - bTime < daysToMs(days);
}

export function withinLastDays(dateStr, days) {
  let now = Date.now();
  let date = +new Date(dateStr);
  let daysInMs = daysToMs(days);
  return date > now - daysInMs;
}