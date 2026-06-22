import { useState, useMemo } from "react";
import { toHijri, toGregorian } from "hijri-converter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rojab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulqo'dah", "Dzulhijjah",
];

export interface HijriMonth {
  hy: number;
  hm: number;
  label: string;
}

/** Convert Hijri month (hy, hm) to Gregorian date range [startDate, endDate] as YYYY-MM-DD strings */
export function hijriMonthToGregorianRange(hy: number, hm: number): { startDate: string; endDate: string; days: number } {
  // First day of Hijri month
  const first = toGregorian(hy, hm, 1);
  const startDate = `${first.gy}-${String(first.gm).padStart(2, "0")}-${String(first.gd).padStart(2, "0")}`;

  // Find last day: try day 30, if it rolls to next month, use 29
  let lastDay = 30;
  const test = toGregorian(hy, hm, 30);
  const backCheck = toHijri(test.gy, test.gm, test.gd);
  if (backCheck.hm !== hm) {
    lastDay = 29;
  }

  const last = toGregorian(hy, hm, lastDay);
  const endDate = `${last.gy}-${String(last.gm).padStart(2, "0")}-${String(last.gd).padStart(2, "0")}`;

  return { startDate, endDate, days: lastDay };
}

/** Get current Hijri month info */
export function getCurrentHijriMonth(): HijriMonth {
  const now = new Date();
  const h = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { hy: h.hy, hm: h.hm, label: `${HIJRI_MONTHS[h.hm - 1]} ${h.hy}` };
}

interface HijriMonthPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (hy: number, hm: number, startDate: string, endDate: string) => void;
}

export default function HijriMonthPicker({ open, onOpenChange, onSelect }: HijriMonthPickerProps) {
  const current = getCurrentHijriMonth();
  const [hy, setHy] = useState(current.hy);
  const [hm, setHm] = useState(current.hm);

  // Generate year options: current year ± 3
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = current.hy - 3; y <= current.hy + 1; y++) years.push(y);
    return years;
  }, [current.hy]);

  const handleConfirm = () => {
    const { startDate, endDate } = hijriMonthToGregorianRange(hy, hm);
    onSelect(hy, hm, startDate, endDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-emerald-200 bg-white/95">
        <DialogHeader>
          <DialogTitle className="text-emerald-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Pilih Bulan Hijriah
          </DialogTitle>
          <DialogDescription className="text-emerald-600">
            Laporan akan ditampilkan per bulan Hijriah
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Bulan</Label>
              <Select value={String(hm)} onValueChange={(v) => setHm(Number(v))}>
                <SelectTrigger className="h-10 rounded-xl border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {HIJRI_MONTHS.map((name, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Tahun</Label>
              <Select value={String(hy)} onValueChange={(v) => setHy(Number(v))}>
                <SelectTrigger className="h-10 rounded-xl border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y} H</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-emerald-500 text-center">
            {HIJRI_MONTHS[hm - 1]} {hy} H
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Batal
            </Button>
            <Button onClick={handleConfirm} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white">
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
