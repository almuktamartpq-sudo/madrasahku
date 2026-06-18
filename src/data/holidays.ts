/**
 * Holiday management for Madrasah Muktamar
 * - Thursday (Kamis) is the weekly off day (operasional: Malam Sabtu - Malam Kamis)
 * - Islamic holidays with auto-notification to admin
 */

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isCustom: boolean;
}

// Thursday = off day (operasional: Sabtu night - Kamis night after Maghrib)
export const OFF_DAY = 4; // JS: 0=Sun, 4=Thu
export const OFF_DAY_NAME = "Kamis";

export function isOffDay(dateStr: string): boolean {
  return new Date(dateStr).getDay() === OFF_DAY;
}

// Islamic holidays 2026–2027 (approximate, based on Indonesian government calendar)
const FIXED_HOLIDAYS: Holiday[] = [
  // 2026
  { date: "2026-02-16", name: "Isra Mi'raj Nabi Muhammad SAW", isCustom: false },
  { date: "2026-03-20", name: "Hari Raya Nyepi (Bukan hari operasional)", isCustom: false },
  { date: "2026-03-21", name: "Idul Fitri 1447 H (Hari 1)", isCustom: false },
  { date: "2026-03-22", name: "Idul Fitri 1447 H (Hari 2)", isCustom: false },
  { date: "2026-05-27", name: "Idul Adha 1447 H", isCustom: false },
  { date: "2026-06-17", name: "Tahun Baru Islam 1448 H", isCustom: false },
  { date: "2026-09-05", name: "Maulid Nabi Muhammad SAW", isCustom: false },
  // 2027
  { date: "2027-02-06", name: "Isra Mi'raj Nabi Muhammad SAW", isCustom: false },
  { date: "2027-03-10", name: "Idul Fitri 1448 H (Hari 1)", isCustom: false },
  { date: "2027-03-11", name: "Idul Fitri 1448 H (Hari 2)", isCustom: false },
  { date: "2027-05-17", name: "Idul Adha 1448 H", isCustom: false },
  { date: "2027-06-06", name: "Tahun Baru Islam 1449 H", isCustom: false },
  { date: "2027-08-25", name: "Maulid Nabi Muhammad SAW", isCustom: false },
];

// Custom holidays stored in localStorage
function getCustomHolidays(): Holiday[] {
  try {
    const raw = localStorage.getItem("muktamar_holidays");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomHoliday(date: string, name: string): void {
  const customs = getCustomHolidays();
  if (!customs.some((h) => h.date === date)) {
    customs.push({ date, name, isCustom: true });
    localStorage.setItem("muktamar_holidays", JSON.stringify(customs));
  }
}

export function removeCustomHoliday(date: string): void {
  const customs = getCustomHolidays().filter((h) => h.date !== date);
  localStorage.setItem("muktamar_holidays", JSON.stringify(customs));
}

export function getAllHolidays(): Holiday[] {
  return [...FIXED_HOLIDAYS, ...getCustomHolidays()];
}

export function getHoliday(dateStr: string): Holiday | undefined {
  return getAllHolidays().find((h) => h.date === dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return !!getHoliday(dateStr);
}

export function isNonOperational(dateStr: string): boolean {
  return isOffDay(dateStr) || isHoliday(dateStr);
}

// Set of dates that have holidays (for calendar highlighting)
export function getHolidayDates(): Set<string> {
  return new Set(getAllHolidays().map((h) => h.date));
}

// Get upcoming holiday notification (if today is a holiday)
export function getTodayHolidayNotice(): string | null {
  const today = new Date().toISOString().split("T")[0];
  const holiday = getHoliday(today);
  if (holiday) return `Hari ini libur: ${holiday.name}`;
  if (isOffDay(today)) return `Hari ini (${OFF_DAY_NAME}) adalah hari libur madrasah`;
  return null;
}

// Check if there's an upcoming holiday within 3 days
export function getUpcomingHolidayNotice(): string | null {
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const future = new Date(now);
    future.setDate(future.getDate() + i);
    const dateStr = future.toISOString().split("T")[0];
    const holiday = getHoliday(dateStr);
    if (holiday) {
      const dayLabel = future.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
      return `${dayLabel}: ${holiday.name}`;
    }
  }
  return null;
}
