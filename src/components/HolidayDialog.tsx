import { useState, useEffect } from "react";
import { getLocalDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Palmtree, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  type Holiday,
  getCustomHolidayList,
  addCustomHolidayRange,
  removeCustomHoliday,
  removeCustomHolidayByName,
} from "@/data/holidays";

function clearAllCustomHolidays(): void {
  localStorage.removeItem("muktamar_holidays");
}

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HolidayDialog({ open, onOpenChange }: HolidayDialogProps) {
  const today = getLocalDate();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [keterangan, setKeterangan] = useState("");
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([]);

  const loadHolidays = () => {
    setCustomHolidays(getCustomHolidayList());
  };

  useEffect(() => {
    if (open) loadHolidays();
  }, [open]);

  // Group custom holidays by name for display
  const grouped = customHolidays.reduce<Record<string, { name: string; dates: string[] }>>((acc, h) => {
    if (!acc[h.name]) acc[h.name] = { name: h.name, dates: [] };
    acc[h.name].dates.push(h.date);
    return acc;
  }, {});
  const groupedList = Object.values(grouped).map((g) => ({
    ...g,
    dates: g.dates.sort(),
  }));

  const handleAdd = () => {
    if (!keterangan.trim()) {
      toast.error("Keterangan wajib diisi");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("Tanggal 'sampai' harus >= tanggal 'dari'");
      return;
    }
    const count = addCustomHolidayRange(dateFrom, dateTo, keterangan.trim());
    if (count > 0) {
      toast.success(`${count} hari libur ditambahkan: ${keterangan}`);
      setKeterangan("");
      setDateFrom(today);
      setDateTo(today);
      loadHolidays();
    } else {
      toast.info("Tanggal tersebut sudah ditandai libur");
    }
  };

  const handleDeleteDate = (date: string) => {
    removeCustomHoliday(date);
    toast.success(`Libur ${date} dihapus`);
    loadHolidays();
  };

  const handleDeleteGroup = (name: string) => {
    removeCustomHolidayByName(name);
    toast.success(`Libur "${name}" dihapus`);
    loadHolidays();
  };

  const handleClearAll = () => {
    clearAllCustomHolidays();
    toast.success("Semua libur custom dihapus");
    loadHolidays();
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-emerald-200 bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-800">
            <Palmtree className="h-5 w-5 text-amber-600" />
            Kelola Hari Libur
          </DialogTitle>
          <DialogDescription className="text-emerald-600">
            Tandai tanggal libur khusus (misal hari besar, acara lembaga)
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Dari Tanggal</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-xl border-emerald-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Sampai Tanggal</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-xl border-emerald-200" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-600">Keterangan</Label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Libur Idul Fitri / Acara Lembaga"
              className="h-10 rounded-xl border-emerald-200"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Tambah Libur
          </Button>
        </div>

        {/* List */}
        {groupedList.length > 0 && (
          <div className="pt-4 border-t border-emerald-100 space-y-3">
            <p className="text-sm font-medium text-emerald-800">Libur Custom ({customHolidays.length} hari)</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Hapus Semua
            </Button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {groupedList.map((group) => (
                <div key={group.name} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-emerald-800">{group.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.name)}
                      className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.dates.map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-white border-emerald-200 text-emerald-600 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        onClick={() => handleDeleteDate(d)}
                        title="Klik untuk hapus tanggal ini"
                      >
                        {formatDate(d)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">Klik badge tanggal untuk hapus satu per satu, atau ikon tong sampah untuk hapus seluruh grup.</p>
          </div>
        )}

        {groupedList.length === 0 && (
          <div className="pt-4 border-t border-emerald-100 text-center py-4">
            <p className="text-sm text-slate-400">Belum ada libur custom</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
