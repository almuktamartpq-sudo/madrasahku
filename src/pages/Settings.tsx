import { useState, useEffect } from "react";
import { Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

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

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

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
