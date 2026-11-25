export const money = (n) => "$" + n.toLocaleString("en-US");

const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => toIso(new Date());

export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function monthSequence(start = today().slice(0, 7), count = 12) {
  const [year, month] = start.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  });
}

export function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function monthLabel(ym, long = false) {
  return new Date(ym + "-01T00:00:00").toLocaleDateString(
    "es-VE",
    long ? { month: "long", year: "numeric" } : { month: "short", year: "2-digit" }
  );
}

export const initials = (name) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
