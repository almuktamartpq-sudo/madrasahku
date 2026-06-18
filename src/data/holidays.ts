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

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Thursday = off day (operasional: Sabtu night - Kamis night after Maghrib)
export const OFF_DAY = 4; // JS: 0=Sun, 4=Thu
export const OFF_DAY_NAME = "Kamis";

export function isOffDay(dateStr: string): boolean {
  return new Date(dateStr).getDay() === OFF_DAY;
}

// No hardcoded holidays — all holidays managed manually by admin via HolidayDialog
const FIXED_HOLIDAYS: Holiday[] = [];

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

// Add holidays for a date range (from - to inclusive)
export function addCustomHolidayRange(from: string, to: string, name: string): number {
  const customs = getCustomHolidays();
  let count = 0;
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    const dateStr = toLocalDateStr(current);
    if (!customs.some((h) => h.date === dateStr)) {
      customs.push({ date: dateStr, name, isCustom: true });
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  if (count > 0) {
    localStorage.setItem("muktamar_holidays", JSON.stringify(customs));
  }
  return count;
}

export function removeCustomHoliday(date: string): void {
  const customs = getCustomHolidays().filter((h) => h.date !== date);
  localStorage.setItem("muktamar_holidays", JSON.stringify(customs));
}

// Remove all custom holidays matching a name
export function removeCustomHolidayByName(name: string): void {
  const customs = getCustomHolidays().filter((h) => h.name !== name);
  localStorage.setItem("muktamar_holidays", JSON.stringify(customs));
}

export function getAllHolidays(): Holiday[] {
  return [...FIXED_HOLIDAYS, ...getCustomHolidays()];
}

// Get only custom holidays (for management dialog)
export function getCustomHolidayList(): Holiday[] {
  return getCustomHolidays();
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
  const today = toLocalDateStr(new Date());
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
    const dateStr = toLocalDateStr(future);
    const holiday = getHoliday(dateStr);
    if (holiday) {
      const dayLabel = future.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
      return `${dayLabel}: ${holiday.name}`;
    }
  }
  return null;
}
