import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAttendance, createAttendance, createAttendanceBatch, updateAttendance, fetchStudents, fetchParentStudentIds, fetchProfileKelasId, fetchKelas } from "@/data/store";
import type { Attendance, AttendanceStatus, Kelas } from "@/types";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ClipboardCheck,
  Plus,
  Calendar,
  CalendarDays,
  Palmtree,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  isOffDay,
  isHoliday,
  getHoliday,
  getHolidayDates,
  getTodayHolidayNotice,
  getUpcomingHolidayNotice,
  addCustomHoliday,
  OFF_DAY_NAME,
} from "@/data/holidays";

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string }> = {
  hadir: { label: "Hadir", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  izin: { label: "Izin", icon: FileText, color: "bg-amber-50 text-amber-700 border-amber-200" },
  sakit: { label: "Sakit", icon: AlertTriangle, color: "bg-blue-50 text-blue-700 border-blue-200" },
  alfa: { label: "Alpha", icon: Clock, color: "bg-red-50 text-red-700 border-red-200" },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchStudents>>>([]);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState<Partial<Attendance>>({
    date: new Date().toISOString().split("T")[0],
    status: "hadir",
  });
  const [keteranganDialog, setKeteranganDialog] = useState<{ id: string; status: AttendanceStatus } | null>(null);
  const [keteranganInput, setKeteranganInput] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const calRef = useRef<HTMLDivElement>(null);

  const isOrangtua = user?.role === "orangtua";
  const isGuru = user?.role === "guru";
  const today = new Date().toISOString().split("T")[0];

  const visibleStudents = useMemo(() => {
    if (isOrangtua && parentStudentIds.length > 0) {
      return students.filter((s) => parentStudentIds.includes(s.id));
    }
    if (isGuru && guruKelasId) {
      return students.filter((s) => s.kelas_id === guruKelasId);
    }
    return students;
  }, [students, isOrangtua, isGuru, parentStudentIds, guruKelasId, kelasList]);

  const dayView = useMemo(() => {
    const dateRecords = attendance.filter((a) => a.date === dateFilter);
    const recordByStudentId = new Map(dateRecords.map((a) => [a.student_id, a]));
    let filteredStudents = visibleStudents;
    if (search) {
      const q = search.toLowerCase();
      filteredStudents = filteredStudents.filter((s) => s.name.toLowerCase().includes(q));
    }
    return filteredStudents.map((s) => ({
      student: s,
      record: recordByStudentId.get(s.id) ?? null,
    }));
  }, [attendance, visibleStudents, dateFilter, search]);

  const stats = useMemo(() => {
    const records = dayView.map((d) => d.record);
    return {
      hadir: records.filter((r) => r?.status === "hadir").length,
      izin: records.filter((r) => r?.status === "izin").length,
      sakit: records.filter((r) => r?.status === "sakit").length,
      alpha: records.filter((r) => !r || r.status === "alfa").length,
      total: dayView.length,
    };
  }, [dayView]);

  const allHaveRecords = useMemo(
    () => dayView.length > 0 && dayView.every((d) => d.record !== null),
    [dayView]
  );

  const datesWithAttendance = useMemo(() => {
    const visibleStudentIds = new Set(visibleStudents.map((s) => s.id));
    return new Set(
      attendance
        .filter((a) => visibleStudentIds.has(a.student_id))
        .map((a) => a.date)
    );
  }, [attendance, visibleStudents]);

  const holidayDates = useMemo(() => getHolidayDates(), []);

  // Holiday notification on mount
  useEffect(() => {
    const todayNotice = getTodayHolidayNotice();
    if (todayNotice) toast.info(todayNotice, { duration: 5000 });
    const upcoming = getUpcomingHolidayNotice();
    if (upcoming && !todayNotice) toast.info(`Libur mendatang: ${upcoming}`, { duration: 4000 });
  }, []);

  // Liburkan handler (admin only)
  const handleLiburkan = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const holidayName = `Libur ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
    addCustomHoliday(todayStr, holidayName);
    toast.success(`Tanggal ${todayStr} ditandai sebagai hari libur`);
    // Force re-render holiday dates
    window.location.reload();
  };

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

  useEffect(() => {
    Promise.all([fetchAttendance(), fetchStudents(), fetchKelas()])
      .then(([attendanceData, studentData, kelasData]) => {
        setAttendance(attendanceData);
        setStudents(studentData);
        setKelasList(kelasData);
      })
      .finally(() => setLoading(false));
    if (isOrangtua) fetchParentStudentIds(user.id).then(setParentStudentIds);
    if (isGuru) fetchProfileKelasId(user.id).then(setGuruKelasId);
  }, [isOrangtua, isGuru, user]);

  const handleUpdateStatus = async (id: string, status: AttendanceStatus) => {
    const record = attendance.find((a) => a.id === id);
    if (!record) return;
    if ((status === "izin" || status === "sakit") && !record.keterangan) {
      setKeteranganDialog({ id, status });
      setKeteranganInput("");
      return;
    }
    await updateAttendance(record.id, status);
    setAttendance((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleKeteranganSave = async () => {
    if (!keteranganDialog) return;
    const record = attendance.find((a) => a.id === keteranganDialog.id);
    if (!record) return;
    await updateAttendance(record.id, keteranganDialog.status);
    if (keteranganInput) {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("attendance").update({ keterangan: keteranganInput }).eq("id", record.id);
    }
    setAttendance((prev) => prev.map((a) => (a.id === keteranganDialog.id ? { ...a, status: keteranganDialog.status, keterangan: keteranganInput || a.keterangan } : a)));
    setKeteranganDialog(null);
    setKeteranganInput("");
  };

  const handleAddSingle = async () => {
    if (!newAttendance.student_id) return;
    const exists = attendance.some(
      (a) => a.student_id === newAttendance.student_id && a.date === newAttendance.date
    );
    if (exists) {
      toast.error("Santri sudah diabsen pada tanggal ini");
      return;
    }
    if (!newAttendance.date) {
      toast.error("Tanggal absensi harus diisi");
      return;
    }
    const record = {
      student_id: newAttendance.student_id,
      date: newAttendance.date,
      status: newAttendance.status as AttendanceStatus,
      keterangan: newAttendance.status !== "hadir" ? newAttendance.keterangan : undefined,
    };
    const saved = await createAttendance(record);
    setAttendance((prev) => [saved, ...prev]);
    setDialogOpen(false);
    setNewAttendance({ date: new Date().toISOString().split("T")[0], status: "hadir" });
  };

  const handleBatchAbsensi = async () => {
    if (!dateFilter) {
      toast.error("Tanggal filter tidak boleh kosong");
      return;
    }
    const existingIds = new Set(
      attendance.filter((a) => a.date === dateFilter).map((a) => a.student_id)
    );
    const newStudents = visibleStudents.filter((s) => !existingIds.has(s.id));
    if (newStudents.length === 0) {
      toast.info(`Semua santri (${visibleStudents.length}) sudah diabsen hari ini`);
      return;
    }
    const records = newStudents.map((s) => ({
      student_id: s.id,
      date: dateFilter,
      status: "hadir" as AttendanceStatus,
    }));
    const saved = await createAttendanceBatch(records);
    setAttendance((prev) => [...saved, ...prev]);
    toast.success(`${saved.length} dari ${visibleStudents.length} santri berhasil diabsen hadir`);
  };

  const canAdd = user?.role === "admin" || user?.role === "guru";

  const getKelasName = (kelasId: string | null) => {
    if (!kelasId) return "-";
    const kelasItem = kelasList.find((k) => k.id === kelasId);
    return kelasItem?.nama ?? "-";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-emerald-500 bg-emerald-100 rounded-xl">Memuat data absensi...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Absensi Santri</h1>
          <div className="flex gap-2">
            {user?.role === "admin" && (
              <Button onClick={handleLiburkan} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <Palmtree className="mr-2 h-4 w-4" /> Liburkan Hari Ini
              </Button>
            )}
            {canAdd && !allHaveRecords && (
              <Button onClick={handleBatchAbsensi} className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg">
                <ClipboardCheck className="mr-2 h-4 w-4" /> Absen Semua Hadir
              </Button>
            )}
          </div>
        </div>

        {/* Holiday/Off-day banner */}
        {(isOffDay(dateFilter) || isHoliday(dateFilter)) && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <Palmtree className="h-4 w-4 shrink-0" />
            <span>
              {isHoliday(dateFilter)
                ? `Libur: ${getHoliday(dateFilter)?.name}`
                : `${OFF_DAY_NAME} — Hari libur madrasah`}
            </span>
          </div>
        )}

        {/* Date & Search */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative" ref={calRef}>
                <Label className="text-emerald-900">Tanggal</Label>
                <button
                  onClick={() => setCalOpen(!calOpen)}
                  className="flex items-center gap-2 h-10 px-3 mt-1 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>{new Date(dateFilter).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                </button>
                {calOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-2xl border border-emerald-200 bg-white shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })} className="h-8 w-8 rounded-lg hover:bg-emerald-100 flex items-center justify-center text-emerald-600">‹</button>
                      <p className="text-sm font-semibold text-emerald-900">{calMonthLabel}</p>
                      <button onClick={() => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })} className="h-8 w-8 rounded-lg hover:bg-emerald-100 flex items-center justify-center text-emerald-600">›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                      {["M","S","S","R","K","J","S"].map((d, i) => (<div key={i} className="text-[10px] font-medium text-emerald-600 py-1">{d}</div>))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarGrid.map((cell, i) => {
                        if (cell.blank) return <div key={i} />;
                        const isSelected = cell.date === dateFilter;
                        const hasAtt = datesWithAttendance.has(cell.date);
                        const isThursday = new Date(cell.date).getDay() === 4;
                        const holiday = getHoliday(cell.date);
                        const isNonOp = isThursday || !!holiday;
                        const isDisabled = isFuture || isNonOp;
                        return (
                          <button key={i} disabled={isDisabled} onClick={() => { setDateFilter(cell.date); setCalOpen(false); }}
                            title={holiday ? holiday.name : isThursday ? `${OFF_DAY_NAME} - Libur` : undefined}
                            className={cn("h-8 w-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center mx-auto",
                              isFuture ? "text-emerald-200 cursor-not-allowed" : isNonOp ? "bg-red-50 text-red-400 cursor-not-allowed line-through" : isSelected ? "bg-emerald-700 text-white" : hasAtt ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-emerald-600 hover:bg-emerald-100"
                            )}
                          >{cell.day}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-emerald-900">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <Input placeholder="Cari nama santri..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50" />
                </div>
              </div>
              {canAdd && (
                <div className="flex items-end">
                  <Button onClick={() => setDialogOpen(true)} disabled={allHaveRecords} className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 disabled:opacity-50">
                    <Plus className="h-4 w-4 mr-2" /> Tambah Absensi
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
            <p className="text-xs text-emerald-700">Total Santri</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.hadir}</div>
            <p className="text-xs text-emerald-700">Hadir</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.izin}</div>
            <p className="text-xs text-emerald-700">Izin</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sakit}</div>
            <p className="text-xs text-emerald-700">Sakit</p>
          </CardContent></Card>
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-slate-500">{stats.alpha}</div>
            <p className="text-xs text-emerald-700">Belum absen</p>
          </CardContent></Card>
        </div>

        {/* Tabel Absensi */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            {dayView.length === 0 ? (
              <div className="text-center py-12 text-emerald-600">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-500" />
                <p>Tidak ada data santri</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700">No</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700">Tanggal</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700 min-w-[180px]">Nama</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700">Keterangan</th>
                      {canAdd && <th className="text-left py-3 px-4 text-sm font-semibold text-emerald-700">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dayView.map(({ student: s, record: a }, index) => {
                      if (a) {
                        const StatusIcon = statusConfig[a.status].icon;
                        return (
                          <tr key={s.id} className="border-b border-emerald-100 hover:bg-emerald-50/50">
                            <td className="py-3 px-4 text-sm text-emerald-600">{index + 1}</td>
                            <td className="py-3 px-4 text-sm text-emerald-600">{formatDate(a.date)}</td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-emerald-900">{s.name}</span>
                              {!isGuru && <p className="text-xs text-emerald-500 mt-0.5">{getKelasName(s.kelas_id)}</p>}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={cn("gap-1", statusConfig[a.status].color)}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[a.status].label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {a.keterangan ? <span className="text-sm text-emerald-600">{a.keterangan}</span> : <span className="text-sm text-emerald-400">-</span>}
                            </td>
                            {canAdd && (
                              <td className="py-3 px-4">
                                <Select value={a.status} onValueChange={(v) => handleUpdateStatus(a.id, v as AttendanceStatus)}>
                                  <SelectTrigger className="h-9 w-32 text-sm border-emerald-200 focus:border-emerald-400"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hadir">Hadir</SelectItem>
                                    <SelectItem value="izin">Izin</SelectItem>
                                    <SelectItem value="sakit">Sakit</SelectItem>
                                    <SelectItem value="alpha">Alpha</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return (
                        <tr key={s.id} className="border-b border-emerald-100 hover:bg-emerald-50/50 bg-emerald-50/20">
                          <td className="py-3 px-4 text-sm text-emerald-600">{index + 1}</td>
                          <td className="py-3 px-4 text-sm text-emerald-600">{formatDate(dateFilter)}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-emerald-900">{s.name}</span>
                            {!isGuru && <p className="text-xs text-emerald-500 mt-0.5">{getKelasName(s.kelas_id)}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="gap-1 bg-slate-50 text-slate-500 border-slate-200">
                              <Clock className="h-3 w-3" /> Belum absen
                            </Badge>
                          </td>
                          <td className="py-3 px-4"><span className="text-sm text-emerald-400">-</span></td>
                          {canAdd && (
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => { setNewAttendance({ student_id: s.id, date: dateFilter, status: "hadir" }); setDialogOpen(true); }}>
                                Tandai Hadir
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-emerald-200 bg-white/95">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Tambah Absensi</DialogTitle>
              <DialogDescription className="text-emerald-600">Catat kehadiran santri</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Santri</Label>
                <Select value={newAttendance.student_id ?? ""} onValueChange={(v) => setNewAttendance({ ...newAttendance, student_id: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-emerald-200"><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({getKelasName(s.kelas_id)})</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Tanggal</Label>
                  <Input type="date" value={newAttendance.date} onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })} className="h-10 rounded-xl border-emerald-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Status</Label>
                  <Select value={newAttendance.status} onValueChange={(v) => setNewAttendance({ ...newAttendance, status: v as AttendanceStatus })}>
                    <SelectTrigger className="h-10 rounded-xl border-emerald-200"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="izin">Izin</SelectItem>
                      <SelectItem value="sakit">Sakit</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newAttendance.status !== "hadir" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Keterangan</Label>
                  <Input value={newAttendance.keterangan ?? ""} onChange={(e) => setNewAttendance({ ...newAttendance, keterangan: e.target.value })} className="h-10 rounded-xl border-emerald-200" placeholder="Alasan tidak hadir" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">Batal</Button>
                <Button onClick={handleAddSingle} disabled={!newAttendance.student_id} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white">Simpan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Keterangan Dialog */}
        <Dialog open={!!keteranganDialog} onOpenChange={() => setKeteranganDialog(null)}>
          <DialogContent className="max-w-sm rounded-2xl border-emerald-200 bg-white/95">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Isi Keterangan</DialogTitle>
              <DialogDescription className="text-emerald-600">Wajib diisi saat mengubah status ke {keteranganDialog?.status}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Keterangan</Label>
                <Input value={keteranganInput} onChange={(e) => setKeteranganInput(e.target.value)} className="h-10 rounded-xl border-emerald-200" placeholder="Alasan izin/sakit" autoFocus />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setKeteranganDialog(null)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">Batal</Button>
                <Button onClick={handleKeteranganSave} disabled={!keteranganInput.trim()} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white">Simpan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
