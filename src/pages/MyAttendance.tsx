import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/data/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn, getLocalDate } from "@/lib/utils";
import {
  isOffDay,
  isHoliday,
  getHoliday,
  getTodayHolidayNotice,
  getUpcomingHolidayNotice,
  OFF_DAY_NAME,
} from "@/data/holidays";

// Guru/Munawib hanya bisa ajukan Izin atau Sakit (Hadir & Alpha diurus admin)
const selfStatusOptions = [
  { value: "izin", label: "Izin", color: "bg-amber-100 text-amber-800" },
  { value: "sakit", label: "Sakit", color: "bg-emerald-100 text-emerald-800" },
];

export default function MyAttendance() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const today = getLocalDate();
  const [selectedStatus, setSelectedStatus] = useState("izin");
  const [keterangan, setKeterangan] = useState("");
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [isGuru, setIsGuru] = useState(false);
  const [userName, setUserName] = useState("");

  // Calendar popup state
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const calRef = useRef<HTMLDivElement>(null);

  // Munawib schedule
  const [munawibSchedule, setMunawibSchedule] = useState<{ profile_id: string; day_of_week: number }[]>([]);

  useEffect(() => {
    loadMyData();
    if (user?.role === "munawib") loadMySchedule();
    // Holiday notification
    const todayNotice = getTodayHolidayNotice();
    if (todayNotice) toast.info(todayNotice, { duration: 5000 });
    const upcoming = getUpcomingHolidayNotice();
    if (upcoming && !todayNotice) toast.info(`Libur mendatang: ${upcoming}`, { duration: 4000 });
  }, [user]);

  const loadMyData = async () => {
    if (!user) return;
    setUserName(user.name || "");

    if (user.role === "guru") {
      setIsGuru(true);
      setEntityId(user.id);
      const data = await api.fetchTeacherAttendance();
      setMyRecords(data.filter((a: any) => a.profile_id === user.id));
    } else if (user.role === "munawib") {
      setIsGuru(false);
      setEntityId(user.id);
      const data = await api.fetchMunawibAttendance();
      setMyRecords(data.filter((a: any) => a.profile_id === user.id));
    }
  };

  const loadMySchedule = async () => {
    try {
      const { data } = await supabase
        .from("munawib_schedule")
        .select("profile_id, day_of_week");
      setMunawibSchedule(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // For munawib: set of their scheduled days
  const myScheduledDays = useMemo(() => {
    if (!user || isGuru) return null;
    return new Set(
      munawibSchedule
        .filter((s) => s.profile_id === user.id)
        .map((s) => s.day_of_week)
    );
  }, [munawibSchedule, user, isGuru]);

  // Dates with attendance for calendar highlighting
  const datesWithAttendance = useMemo(() => {
    return new Set(myRecords.map((r: { date: string }) => r.date));
  }, [myRecords]);

  const calendarGrid = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: string; day: number; blank: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: "", day: 0, blank: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, day: d, blank: false });
    }
    return cells;
  }, [calMonth]);

  const calMonthLabel = new Date(calMonth.year, calMonth.month, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  const handleSave = async () => {
    if (!entityId) {
      toast.error("Data Anda tidak ditemukan. Hubungi admin.");
      return;
    }
    if (!keterangan.trim()) {
      toast.error("Keterangan wajib diisi!");
      return;
    }

    try {
      // Check duplicate
      const existing = myRecords.find((r) => r.date === selectedDate);
      if (existing) {
        toast.error("Anda sudah mengajukan absensi untuk tanggal ini.");
        return;
      }

      if (isGuru) {
        await api.createTeacherAttendance({
          profile_id: entityId,
          date: selectedDate,
          status: selectedStatus,
          keterangan: keterangan,
        });
      } else {
        const { supabase } = await import("@/lib/supabase");
        const { error } = await supabase.from("munawib_attendance").insert({
          profile_id: entityId,
          date: selectedDate,
          status: selectedStatus,
          keterangan: keterangan,
        });
        if (error) throw error;
      }
      toast.success("Pengajuan absensi berhasil disimpan");
      setKeterangan("");
      loadMyData();
    } catch (err: any) {
      toast.error("Gagal menyimpan", { description: err.message });
    }
  };

  // Filter: only show record for selected date
  const todayRecord = myRecords.find((r) => r.date === selectedDate);

  // Stats (total semua waktu)
  const stats = {
    hadir: myRecords.filter((a) => a.status === "hadir").length,
    izin: myRecords.filter((a) => a.status === "izin").length,
    sakit: myRecords.filter((a) => a.status === "sakit").length,
    alpha: myRecords.filter((a) => a.status === "alpha").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Absensiku</h1>

        {/* Holiday/Off-day banner */}
        {(isOffDay(selectedDate) || isHoliday(selectedDate)) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              {isHoliday(selectedDate)
                ? `Libur: ${getHoliday(selectedDate)?.name}`
                : `${OFF_DAY_NAME} — Hari libur madrasah`}
            </span>
          </div>
        )}

        {/* Name Display */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                isGuru ? "bg-gradient-to-br from-emerald-500 to-amber-500" : "bg-gradient-to-br from-amber-500 to-yellow-500"
              }`}>
                {userName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-lg text-emerald-900">{userName}</p>
                <p className="text-sm text-emerald-600">{isGuru ? "Guru" : "Munawib"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Pengajuan Izin/Sakit */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4 text-emerald-900">Pengajuan Izin / Sakit</h3>

            {/* Calendar always visible */}
            <div className="space-y-1 relative mb-4" ref={calRef}>
              <Label className="text-emerald-900">Tanggal</Label>
              <button
                onClick={() => setCalOpen(!calOpen)}
                className="flex items-center gap-2 h-10 px-3 w-full max-w-xs rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors text-sm"
              >
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>{new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
              </button>

              {calOpen && (
                <div className="absolute left-0 top-full mt-1 z-[9999] w-72 rounded-2xl border border-emerald-200 bg-white shadow-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
                      className="h-8 w-8 rounded-lg hover:bg-emerald-100 flex items-center justify-center text-emerald-600"
                    >
                      ‹
                    </button>
                    <p className="text-sm font-semibold text-emerald-900">{calMonthLabel}</p>
                    <button
                      onClick={() => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
                      className="h-8 w-8 rounded-lg hover:bg-emerald-100 flex items-center justify-center text-emerald-600"
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {["M","S","S","R","K","J","S"].map((d, i) => (
                      <div key={i} className="text-[10px] font-medium text-emerald-600 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarGrid.map((cell, i) => {
                      if (cell.blank) return <div key={i} />;
                      const isSelected = cell.date === selectedDate;
                      const hasAtt = datesWithAttendance.has(cell.date);
                      const isFuture = cell.date > today;
                      const isThursday = new Date(cell.date).getDay() === 4;
                      const holiday = getHoliday(cell.date);
                      const isNonOp = isThursday || !!holiday;
                      const isNotScheduled = !isGuru && myScheduledDays !== null && !myScheduledDays.has(
                        new Date(cell.date).getDay() === 0 ? 7 : new Date(cell.date).getDay()
                      );
                      const isDisabled = isFuture || isNonOp || isNotScheduled;
                      return (
                        <button
                          key={i}
                          disabled={isDisabled}
                          onClick={() => { setSelectedDate(cell.date); setCalOpen(false); }}
                          className={cn(
                            "h-8 w-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center mx-auto",
                            isDisabled
                              ? "text-emerald-200 cursor-not-allowed"
                              : isNonOp
                              ? "bg-red-100 text-red-500 cursor-not-allowed font-medium"
                              : isSelected
                              ? "bg-emerald-700 text-white"
                              : hasAtt
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "text-emerald-600 hover:bg-emerald-100"
                          )}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {todayRecord ? (
              <div className="text-center py-4 space-y-2">
                <Badge className={selfStatusOptions.find((o) => o.value === todayRecord.status)?.color || "bg-emerald-100 text-emerald-800"}>
                  Status: {todayRecord.status}
                </Badge>
                {todayRecord.keterangan && (
                  <p className="text-sm text-emerald-600">Ket: {todayRecord.keterangan}</p>
                )}
                <p className="text-xs text-emerald-500">Untuk perubahan, hubungi admin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-emerald-900">Status</Label>
                  <div className="flex gap-2">
                    {selfStatusOptions.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={selectedStatus === opt.value ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 ${selectedStatus === opt.value ? opt.color : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                        onClick={() => setSelectedStatus(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-emerald-900">Keterangan <span className="text-red-500">*</span></Label>
                  <Input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Acara keluarga / Demam tinggi"
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50"
                  />
                </div>
                <p className="text-xs text-emerald-500">
                  Hadir & Alpha diisi oleh admin. Anda hanya bisa mengajukan Izin atau Sakit.
                </p>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg">
                  <Save className="mr-2 h-4 w-4" /> Simpan Pengajuan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.hadir}</div>
            <p className="text-xs text-emerald-700">Hadir</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.izin}</div>
            <p className="text-xs text-emerald-700">Izin</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sakit}</div>
            <p className="text-xs text-emerald-700">Sakit</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-slate-500">{stats.alpha}</div>
            <p className="text-xs text-emerald-700">Belum absen</p>
          </CardContent></Card>
        </div>

        {/* Riwayat - filtered by selected date only */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3 text-emerald-900">
              Absensi Tanggal {new Date(selectedDate).toLocaleDateString("id-ID", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </h3>
            {todayRecord ? (
              <div className="flex items-center justify-between p-3 border border-emerald-200 rounded-lg bg-emerald-50/50">
                <div>
                  <p className="font-medium text-emerald-900">{userName}</p>
                  {todayRecord.keterangan && (
                    <p className="text-sm text-emerald-600">Ket: {todayRecord.keterangan}</p>
                  )}
                </div>
                <Badge className={selfStatusOptions.find((o) => o.value === todayRecord.status)?.color || "bg-emerald-100 text-emerald-800"}>
                  {todayRecord.status}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-6 text-emerald-600">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p>Belum ada absensi untuk tanggal ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}