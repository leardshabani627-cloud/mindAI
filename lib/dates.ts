/** Local calendar date as YYYY-MM-DD (not UTC), so "today" matches the user's day. */
export function localDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
