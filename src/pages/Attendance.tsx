import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAttendance, createAttendance, createAttendanceBatch, updateAttendance, fetchStudents, fetchParentStudentIds, fetchTeacherKelasId, fetchKelas } from "@/data/store";
import type { Attendance, AttendanceStatus, KelasItem } from "@/types";
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
} from "lucide-react";
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

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string }> = {
  hadir: { label: "Hadir", icon: CheckCircle2, color: "bg-teal-50 text-teal-700 border-teal-200" },
  izin: { label: "Izin", icon: FileText, color: "bg-amber-50 text-amber-700 border-amber-200" },
  sakit: { label: "Sakit", icon: AlertTriangle, color: "bg-blue-50 text-blue-700 border-blue-200" },
  alpha: { label: "Alpha", icon: Clock, color: "bg-red-50 text-red-700 border-red-200" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchStudents>>>([]);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState<Partial<Attendance>>({
    date: new Date().toISOString().split("T")[0],
    status: "hadir",
  });
  // Keterangan dialog for izin/sakit via Aksi dropdown
  const [keteranganDialog, setKeteranganDialog] = useState<{ id: string; status: AttendanceStatus } | null>(null);
  const [keteranganInput, setKeteranganInput] = useState("");

  const isOrangtua = user?.role === "orangtua";
  const isGuru = user?.role === "guru";

  // Filter visible students by role
  const visibleStudents = useMemo(() => {
    if (isOrangtua && parentStudentIds.length > 0) {
      return students.filter((s) => parentStudentIds.includes(s.id));
    }
    if (isGuru && guruKelasId) {
      return students.filter((s) => s.kelasId === guruKelasId);
    }
    return students;
  }, [students, isOrangtua, isGuru, parentStudentIds, guruKelasId, kelasList]);

  // Build the day view: all visible students + their attendance for the selected date
  const dayView = useMemo(() => {
    const dateRecords = attendance.filter((a) => a.date === dateFilter);
    const recordByStudentId = new Map(dateRecords.map((a) => [a.studentId, a]));

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
      alpha: records.filter((r) => !r || r.status === "alpha").length,
      total: dayView.length,
    };
  }, [dayView]);

  // Check if all visible students already have records for the selected date
  const allHaveRecords = useMemo(
    () => dayView.length > 0 && dayView.every((d) => d.record !== null),
    [dayView]
  );

  const uniqueDates = useMemo(
    () => [...new Set(attendance.map((a) => a.date))].sort((a, b) => b.localeCompare(a)).slice(0, 30),
    [attendance]
  );

  useEffect(() => {
    Promise.all([fetchAttendance(), fetchStudents(), fetchKelas()])
      .then(([attendanceData, studentData, kelasData]) => {
        setAttendance(attendanceData);
        setStudents(studentData);
        setKelasList(kelasData);
      })
      .finally(() => setLoading(false));
    if (isOrangtua) fetchParentStudentIds(user.id).then(setParentStudentIds);
    if (isGuru) fetchTeacherKelasId(user.id).then(setGuruKelasId);
  }, [isOrangtua, isGuru, user]);

  const handleUpdateStatus = async (id: string, status: AttendanceStatus) => {
    const record = attendance.find((a) => a.id === id);
    if (!record) return;
    // If changing to izin or sakit, require keterangan
    if ((status === "izin" || status === "sakit") && !record.keterangan) {
      setKeteranganDialog({ id, status });
      setKeteranganInput("");
      return;
    }
    const saved = await updateAttendance({ ...record, status });
    setAttendance((prev) => prev.map((a) => (a.id === id ? saved : a)));
  };

  const handleKeteranganSave = async () => {
    if (!keteranganDialog) return;
    const record = attendance.find((a) => a.id === keteranganDialog.id);
    if (!record) return;
    const saved = await updateAttendance({
      ...record,
      status: keteranganDialog.status,
      keterangan: keteranganInput || undefined,
    });
    setAttendance((prev) => prev.map((a) => (a.id === keteranganDialog.id ? saved : a)));
    setKeteranganDialog(null);
    setKeteranganInput("");
  };

  const handleAddSingle = async () => {
    if (!newAttendance.studentId) return;
    // Check duplicate
    const exists = attendance.some(
      (a) => a.studentId === newAttendance.studentId && a.date === newAttendance.date
    );
    if (exists) {
      toast.error("Santri sudah diabsen pada tanggal ini");
      return;
    }
    const record: Attendance = {
      id: "",
      studentId: newAttendance.studentId,
      date: newAttendance.date ?? "",
      status: newAttendance.status as AttendanceStatus,
      keterangan: newAttendance.status !== "hadir" ? newAttendance.keterangan : undefined,
    };
    const saved = await createAttendance(record);
    setAttendance((prev) => [saved, ...prev]);
    setDialogOpen(false);
    setNewAttendance({ date: new Date().toISOString().split("T")[0], status: "hadir" });
  };

  const handleBatchAbsensi = async () => {
    const existingIds = new Set(
      attendance.filter((a) => a.date === dateFilter).map((a) => a.studentId)
    );
    const newStudents = visibleStudents.filter((s) => !existingIds.has(s.id));
    if (newStudents.length === 0) {
      toast.info(`Semua santri (${visibleStudents.length}) sudah diabsen hari ini`);
      return;
    }
    const records: Attendance[] = newStudents.map((s) => ({
      id: "",
      studentId: s.id,
      date: dateFilter,
      status: "hadir" as AttendanceStatus,
    }));
    const saved = await createAttendanceBatch(records);
    setAttendance((prev) => [...saved, ...prev]);
    toast.success(`${saved.length} dari ${visibleStudents.length} santri berhasil diabsen hadir`);
  };

  const canAdd = user?.role === "admin" || user?.role === "guru";

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500">Memuat data absensi...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Absensi Santri</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.total > 0
              ? `${stats.hadir} hadir, ${stats.izin + stats.sakit + stats.alpha} tidak hadir`
              : "Data absensi santri"}
          </p>
        </div>
        {canAdd && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBatchAbsensi}
              disabled={allHaveRecords}
              className="h-10 rounded-xl"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Absen Massal
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={allHaveRecords}
              className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Absensi
            </Button>
          </div>
        )}
      </div>

      {allHaveRecords && canAdd && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          Semua santri sudah diabsen untuk tanggal ini. Anda masih bisa mengubah status melalui kolom Aksi.
        </div>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {([
            { key: "hadir", label: "Hadir", color: "bg-teal-50 text-teal-700", num: stats.hadir },
            { key: "izin", label: "Izin", color: "bg-amber-50 text-amber-700", num: stats.izin },
            { key: "sakit", label: "Sakit", color: "bg-blue-50 text-blue-700", num: stats.sakit },
            { key: "alpha", label: "Alpha", color: "bg-red-50 text-red-700", num: stats.alpha },
          ] as const).map((s) => (
            <div key={s.key} className={cn("rounded-2xl p-3 text-center", s.color)}>
              <p className="text-2xl font-bold">{s.num}</p>
              <p className="text-xs font-medium">{s.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{stats.total > 0 ? Math.round((s.num / stats.total) * 100) : 0}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama santri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500">Tanggal:</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 w-40 rounded-xl border-slate-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {uniqueDates.slice(0, 7).map((d) => (
            <Badge
              key={d}
              variant={dateFilter === d ? "default" : "outline"}
              className={cn(
                "cursor-pointer h-9 px-3 text-xs font-medium",
                dateFilter === d ? "bg-emerald-700" : "hover:bg-slate-100"
              )}
              onClick={() => setDateFilter(d)}
            >
              {new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </Badge>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Santri</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Tanggal</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Status</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Keterangan</th>
                {canAdd && <th className="text-left py-3.5 px-4 font-medium text-slate-500">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {dayView.slice(0, 60).map(({ student: s, record: a }) => {
                if (a) {
                  const StatusIcon = statusConfig[a.status].icon;
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.kelas ?? "-"}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn("gap-1", statusConfig[a.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[a.status].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-[150px] truncate">
                        {a.keterangan ?? "-"}
                      </td>
                      {canAdd && (
                        <td className="py-3 px-4">
                          <Select value={a.status} onValueChange={(v) => handleUpdateStatus(a.id, v as AttendanceStatus)}>
                            <SelectTrigger className="h-8 w-28 text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
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
                // No record - auto alpha
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors bg-red-50/30">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.kelas ?? "-"}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(dateFilter).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="gap-1 bg-red-50 text-red-700 border-red-200">
                        <Clock className="h-3 w-3" />
                        Alpha
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">Otomatis alpha</td>
                    {canAdd && (
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setNewAttendance({ studentId: s.id, date: dateFilter, status: "hadir" });
                            setDialogOpen(true);
                          }}
                        >
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
        {dayView.length === 0 && (
          <div className="text-center py-16">
            <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data santri</p>
            <p className="text-sm text-slate-400">Coba ubah filter tanggal</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Absensi</DialogTitle>
            <DialogDescription>Catat kehadiran santri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Santri</Label>
              <Select value={newAttendance.studentId ?? ""} onValueChange={(v) => setNewAttendance({ ...newAttendance, studentId: v })}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.kelas ?? "-"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Tanggal</Label>
                <Input type="date" value={newAttendance.date} onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Status</Label>
                <Select value={newAttendance.status} onValueChange={(v) => setNewAttendance({ ...newAttendance, status: v as AttendanceStatus })}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
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
                <Label className="text-xs text-slate-600">Keterangan</Label>
                <Input value={newAttendance.keterangan ?? ""} onChange={(e) => setNewAttendance({ ...newAttendance, keterangan: e.target.value })} className="h-10 rounded-xl" placeholder="Alasan tidak hadir" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl">Batal</Button>
              <Button onClick={handleAddSingle} disabled={!newAttendance.studentId} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keterangan Dialog (when changing to izin/sakit via Aksi) */}
      <Dialog open={!!keteranganDialog} onOpenChange={() => setKeteranganDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Isi Keterangan</DialogTitle>
            <DialogDescription>Wajib diisi saat mengubah status ke {keteranganDialog?.status}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Keterangan</Label>
              <Input
                value={keteranganInput}
                onChange={(e) => setKeteranganInput(e.target.value)}
                className="h-10 rounded-xl"
                placeholder="Alasan izin/sakit"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setKeteranganDialog(null)} className="flex-1 h-10 rounded-xl">Batal</Button>
              <Button onClick={handleKeteranganSave} disabled={!keteranganInput.trim()} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
