import { useState, useEffect } from "react";
import { Settings, ToggleLeft, ToggleRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HIJRI_MONTHS, getCurrentHijriMonth } from "@/components/HijriMonthPicker";

const MENU_ITEMS = [
  { key: "students", label: "Santri" },
  { key: "attendance", label: "Absensi Santri" },
  { key: "teacher-attendance", label: "Absensi Guru & Munawib" },
  { key: "grades", label: "Nilai" },
  { key: "payments", label: "Pembayaran" },
  { key: "kelas", label: "Kelas" },
  { key: "mapel", label: "Mapel" },
  { key: "guru", label: "Guru" },
  { key: "munawib", label: "Munawib" },
  { key: "pelanggaran", label: "Pelanggaran" },
  { key: "orangtua", label: "Orang Tua" },
  { key: "profile", label: "Pengguna" },
];

export function getCrudEnabled(menuKey: string): boolean {
  try {
    const raw = localStorage.getItem("muktamar_crud_toggles");
    const toggles = raw ? JSON.parse(raw) : {};
    return toggles[menuKey] !== false; // default true
  } catch {
    return true;
  }
}

export interface SemesterRange {
  from: number;     // Hijri month 1-12
  to: number;       // Hijri month 1-12
  yearFrom: number; // Hijri year for 'from' month
  yearTo: number;   // Hijri year for 'to' month
}

/** Normalize semester range: ensure yearFrom/yearTo exist (handles old format with single `year` field) */
function normalizeSemesterRange(range: any, currentYear: number): SemesterRange {
  const from = range.from ?? 10;
  const to = range.to ?? 3;
  const yearFrom = range.yearFrom ?? range.year ?? (from > to ? currentYear - 1 : currentYear);
  const yearTo = range.yearTo ?? range.year ?? currentYear;
  return { from, to, yearFrom, yearTo };
}

export function getSemesterRange(semester: string): SemesterRange {
  const currentYear = getCurrentHijriMonth().hy;
  try {
    const raw = localStorage.getItem("muktamar_semester_ranges");
    const ranges = raw ? JSON.parse(raw) : null;
    if (ranges && ranges[semester]) {
      return normalizeSemesterRange(ranges[semester], currentYear);
    }
  } catch {}
  // Default: Semester 1 = Syawal(prev year)-Rabi'ul Awal(current year), Semester 2 = Rabi'ul Akhir-Sya'ban(current year)
  return semester === "1"
    ? { from: 10, to: 3, yearFrom: currentYear - 1, yearTo: currentYear }
    : { from: 4, to: 8, yearFrom: currentYear, yearTo: currentYear };
}

export function getSemesterYear(semester: string): number {
  return getSemesterRange(semester).yearTo;
}

export interface SemesterMonthEntry {
  month: number; // Hijri month 1-12
  year: number;  // Hijri year
}

/** Returns ordered list of {month, year} pairs for a semester, handling cross-year spans */
export function getSemesterMonthEntries(semester: string): SemesterMonthEntry[] {
  const range = getSemesterRange(semester);
  const entries: SemesterMonthEntry[] = [];
  if (range.from <= range.to) {
    // Same year: e.g. month 4 to month 8 in yearX
    for (let m = range.from; m <= range.to; m++) {
      entries.push({ month: m, year: range.yearFrom });
    }
  } else {
    // Cross-year: e.g. month 10 yearX to month 3 yearX+1
    for (let m = range.from; m <= 12; m++) {
      entries.push({ month: m, year: range.yearFrom });
    }
    for (let m = 1; m <= range.to; m++) {
      entries.push({ month: m, year: range.yearTo });
    }
  }
  return entries;
}

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [semesterRanges, setSemesterRanges] = useState<Record<string, SemesterRange>>({
    "1": getSemesterRange("1"),
    "2": getSemesterRange("2"),
  });

  const currentHijriYear = getCurrentHijriMonth().hy;
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentHijriYear - 3 + i);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("muktamar_crud_toggles");
      setToggles(raw ? JSON.parse(raw) : {});
    } catch {
      setToggles({});
    }
  }, []);

  const handleToggle = (key: string) => {
    const updated = { ...toggles, [key]: !isEnabled(key) };
    setToggles(updated);
    localStorage.setItem("muktamar_crud_toggles", JSON.stringify(updated));
    toast.success(`${MENU_ITEMS.find((m) => m.key === key)?.label}: ${updated[key] ? "CRUD diaktifkan" : "CRUD dinonaktifkan"}`);
  };

  const isEnabled = (key: string) => toggles[key] !== false;

  const handleEnableAll = () => {
    const all: Record<string, boolean> = {};
    MENU_ITEMS.forEach((m) => (all[m.key] = true));
    setToggles(all);
    localStorage.setItem("muktamar_crud_toggles", JSON.stringify(all));
    toast.success("Semua CRUD diaktifkan");
  };

  const handleDisableAll = () => {
    const all: Record<string, boolean> = {};
    MENU_ITEMS.forEach((m) => (all[m.key] = false));
    setToggles(all);
    localStorage.setItem("muktamar_crud_toggles", JSON.stringify(all));
    toast.success("Semua CRUD dinonaktifkan");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6 max-w-lg">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-emerald-700" />
          <h1 className="text-3xl font-bold gradient-text">Pengaturan</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-emerald-800 text-sm">Pengaturan Semester</h2>
            </div>
            <p className="text-xs text-emerald-600 mt-0.5">Atur rentang bulan Hijriah per semester untuk download PDF</p>
          </div>
          <div className="px-5 py-4 space-y-4">

            {["1", "2"].map((sem) => (
              <div key={sem} className="space-y-2">
                <Label className="text-xs text-emerald-600 font-semibold">Semester {sem}</Label>
                <div className="space-y-2">
                  {/* Dari */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-emerald-500">Dari Bulan</Label>
                      <Select
                        value={String(semesterRanges[sem]?.from ?? (sem === "1" ? 10 : 4))}
                        onValueChange={(v) => {
                          const def = sem === "1" ? { from: 10, to: 3, yearFrom: currentHijriYear - 1, yearTo: currentHijriYear } : { from: 4, to: 8, yearFrom: currentHijriYear, yearTo: currentHijriYear };
                          const updated = { ...semesterRanges, [sem]: { ...(semesterRanges[sem] ?? def), from: Number(v) } };
                          setSemesterRanges(updated);
                          localStorage.setItem("muktamar_semester_ranges", JSON.stringify(updated));
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-emerald-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {HIJRI_MONTHS.map((name, idx) => (
                            <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-emerald-500">Tahun H</Label>
                      <Select
                        value={String(semesterRanges[sem]?.yearFrom ?? (sem === "1" ? currentHijriYear - 1 : currentHijriYear))}
                        onValueChange={(v) => {
                          const def = sem === "1" ? { from: 10, to: 3, yearFrom: currentHijriYear - 1, yearTo: currentHijriYear } : { from: 4, to: 8, yearFrom: currentHijriYear, yearTo: currentHijriYear };
                          const updated = { ...semesterRanges, [sem]: { ...(semesterRanges[sem] ?? def), yearFrom: Number(v) } };
                          setSemesterRanges(updated);
                          localStorage.setItem("muktamar_semester_ranges", JSON.stringify(updated));
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-emerald-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y} H</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Sampai */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-emerald-500">Sampai Bulan</Label>
                      <Select
                        value={String(semesterRanges[sem]?.to ?? (sem === "1" ? 3 : 8))}
                        onValueChange={(v) => {
                          const def = sem === "1" ? { from: 10, to: 3, yearFrom: currentHijriYear - 1, yearTo: currentHijriYear } : { from: 4, to: 8, yearFrom: currentHijriYear, yearTo: currentHijriYear };
                          const updated = { ...semesterRanges, [sem]: { ...(semesterRanges[sem] ?? def), to: Number(v) } };
                          setSemesterRanges(updated);
                          localStorage.setItem("muktamar_semester_ranges", JSON.stringify(updated));
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-emerald-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {HIJRI_MONTHS.map((name, idx) => (
                            <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-emerald-500">Tahun H</Label>
                      <Select
                        value={String(semesterRanges[sem]?.yearTo ?? (sem === "1" ? currentHijriYear : currentHijriYear))}
                        onValueChange={(v) => {
                          const def = sem === "1" ? { from: 10, to: 3, yearFrom: currentHijriYear - 1, yearTo: currentHijriYear } : { from: 4, to: 8, yearFrom: currentHijriYear, yearTo: currentHijriYear };
                          const updated = { ...semesterRanges, [sem]: { ...(semesterRanges[sem] ?? def), yearTo: Number(v) } };
                          setSemesterRanges(updated);
                          localStorage.setItem("muktamar_semester_ranges", JSON.stringify(updated));
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-emerald-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y} H</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400">
                  {HIJRI_MONTHS[(semesterRanges[sem]?.from ?? (sem === "1" ? 10 : 4)) - 1]} {semesterRanges[sem]?.yearFrom ?? (sem === "1" ? currentHijriYear - 1 : currentHijriYear)} — {HIJRI_MONTHS[(semesterRanges[sem]?.to ?? (sem === "1" ? 3 : 8)) - 1]} {semesterRanges[sem]?.yearTo ?? currentHijriYear} H
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50/50">
            <h2 className="font-semibold text-emerald-800 text-sm">Tombol CRUD per Menu</h2>
            <p className="text-xs text-emerald-600 mt-0.5">Aktifkan/nonaktifkan tombol tambah, edit, hapus di setiap halaman</p>
          </div>

          <div className="divide-y divide-emerald-50">
            {MENU_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/30 transition-colors">
                <span className="text-sm font-medium text-emerald-800">{item.label}</span>
                <button
                  onClick={() => handleToggle(item.key)}
                  className="transition-colors"
                >
                  {isEnabled(item.key) ? (
                    <ToggleRight className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-400" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-emerald-100 bg-emerald-50/30 flex gap-3">
            <button
              onClick={handleEnableAll}
              className="flex-1 h-9 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Aktifkan Semua
            </button>
            <button
              onClick={handleDisableAll}
              className="flex-1 h-9 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Nonaktifkan Semua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
