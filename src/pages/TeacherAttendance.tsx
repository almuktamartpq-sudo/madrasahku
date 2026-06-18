import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Save, CheckCircle2, AlertTriangle, FileText, Clock, Search, ClipboardCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha";

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string }> = {
  hadir: { label: "Hadir", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  izin: { label: "Izin", icon: FileText, color: "bg-amber-50 text-amber-700 border-amber-200" },
  sakit: { label: "Sakit", icon: AlertTriangle, color: "bg-blue-50 text-blue-700 border-blue-200" },
  alpha: { label: "Alpha", icon: Clock, color: "bg-red-50 text-red-700 border-red-200" },
};

interface UnifiedPerson {
  id: string;
  name: string;
  email: string;
  type: "guru" | "munawib";
  // For guru: teacher.id, for munawib: munawib.id
  sourceId: string;
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { teacherAttendance, profiles, fetchAll } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];
  const [search, setSearch] = useState("");
  const [keteranganDialog, setKeteranganDialog] = useState<{ personId: string; personType: "guru" | "munawib"; status: AttendanceStatus } | null>(null);
  const [keteranganInput, setKeteranganInput] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const calRef = useRef<HTMLDivElement>(null);

  // Munawib attendance state
  const [munawibAttendance, setMunawibAttendance] = useState<any[]>([]);
  const [munawibSchedule, setMunawibSchedule] = useState<{ profile_id: string; day_of_week: number }[]>([]);

  useEffect(() => {
    fetchAll();
    loadMunawibAttendance();
    loadMunawibSchedule();
  }, [selectedDate]);

  const loadMunawibAttendance = async () => {
    try {
      const { data } = await supabase
        .from("munawib_attendance")
        .select("*")
        .order("date", { ascending: false });
      setMunawibAttendance(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMunawibSchedule = async () => {
    try {
      const { data } = await supabase
        .from("munawib_schedule")
        .select("profile_id, day_of_week");
      setMunawibSchedule(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Get the DB day of week for the selected date (1=Mon...7=Sun)
  const selectedDbDay = useMemo(() => {
    const jsDay = new Date(selectedDate).getDay(); // 0=Sun, 1=Mon...6=Sat
    return jsDay === 0 ? 7 : jsDay;
  }, [selectedDate]);

  // Set of munawib profile_ids scheduled for the selected day
  const scheduledMunawibIds = useMemo(() => {
    return new Set(
      munawibSchedule
        .filter((s) => s.day_of_week === selectedDbDay)
        .map((s) => s.profile_id)
    );
  }, [munawibSchedule, selectedDbDay]);

  // Build unified list: guru (always) + munawib (only on scheduled days)
  const allPeople: UnifiedPerson[] = useMemo(() => {
    const guruList: UnifiedPerson[] = profiles
      .filter((p) => p.role === "guru")
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        type: "guru" as const,
        sourceId: p.id,
      }));

    const munawibList: UnifiedPerson[] = profiles
      .filter((p) => p.role === "munawib" && scheduledMunawibIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        type: "munawib" as const,
        sourceId: p.id,
      }));

    return [...guruList, ...munawibList];
  }, [profiles, scheduledMunawibIds]);

  // Dates with attendance for calendar highlighting
  const datesWithAttendance = useMemo(() => {
    const guruDates = new Set(teacherAttendance.map((a: { date: string }) => a.date));
    const munawibDates = new Set(munawibAttendance.map((a: { date: string }) => a.date));
    return new Set([...guruDates, ...munawibDates]);
  }, [teacherAttendance, munawibAttendance]);

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

  // Build day view: show ALL people, with or without attendance records
  const dayView = useMemo(() => {
    // Guru records for selected date (now uses profile_id)
    const guruDateRecords = teacherAttendance.filter((a) => a.date === selectedDate);
    const guruRecordMap = new Map(guruDateRecords.map((a) => [a.profile_id, a]));

    // Munawib records for selected date (now uses profile_id)
    const munawibDateRecords = munawibAttendance.filter((a) => a.date === selectedDate);
    const munawibRecordMap = new Map(munawibDateRecords.map((a) => [a.profile_id, a]));

    // Include ALL people with their records (null if no record)
    let withRecords = allPeople.map((p) => {
      let record: any = null;
      if (p.type === "guru") {
        record = guruRecordMap.get(p.sourceId) ?? null;
      } else {
        record = munawibRecordMap.get(p.sourceId) ?? null;
      }
      return { person: p, record };
    });

    if (search) {
      const q = search.toLowerCase();
      withRecords = withRecords.filter((item) => item.person.name.toLowerCase().includes(q));
    }

    return withRecords;
  }, [allPeople, teacherAttendance, munawibAttendance, selectedDate, search]);

  const stats = useMemo(() => {
    const records = dayView.map((d) => d.record);
    return {
      hadir: records.filter((r) => r?.status === "hadir").length,
      izin: records.filter((r) => r?.status === "izin").length,
      sakit: records.filter((r) => r?.status === "sakit").length,
      alpha: records.filter((r) => !r || r.status === "alpha").length,
      total: dayView.length,
      guru: allPeople.filter((p) => p.type === "guru").length,
      munawib: allPeople.filter((p) => p.type === "munawib").length,
    };
  }, [dayView, allPeople]);

  const allHaveRecords = useMemo(
    () => dayView.length > 0 && dayView.every((d) => d.record !== null),
    [dayView]
  );

  // Batch: mark all un-absenced as "hadir"
  const handleBatchAbsensi = async () => {
    try {
      // Guru batch (now uses profile_id)
      const existingGuruIds = new Set(
        teacherAttendance.filter((a) => a.date === selectedDate).map((a) => a.profile_id)
      );
      const guruProfiles = profiles.filter((p) => p.role === "guru");
      const newGurus = guruProfiles.filter((p) => !existingGuruIds.has(p.id));
      if (newGurus.length > 0) {
        const guruRecords = newGurus.map((p) => ({
          profile_id: p.id,
          date: selectedDate,
          status: "hadir",
        }));
        await api.createTeacherAttendanceBatch(guruRecords);
      }

      // Munawib batch (now uses profile_id)
      const existingMunawibIds = new Set(
        munawibAttendance.filter((a) => a.date === selectedDate).map((a) => a.profile_id)
      );
      const munawibProfiles = profiles.filter((p) => p.role === "munawib" && scheduledMunawibIds.has(p.id));
      const newMunawibs = munawibProfiles.filter((p) => !existingMunawibIds.has(p.id));
      if (newMunawibs.length > 0) {
        const munawibRecords = newMunawibs.map((p) => ({
          profile_id: p.id,
          date: selectedDate,
          status: "hadir",
        }));
        const { error } = await supabase
          .from("munawib_attendance")
          .upsert(munawibRecords, {
            onConflict: 'profile_id,date',
            ignoreDuplicates: false
          });
        if (error) throw error;
      }

      const totalNew = newGurus.length + newMunawibs.length;
      if (totalNew === 0) {
        toast.info(`Semua guru & munawib (${allPeople.length}) sudah diabsen hari ini`);
      } else {
        toast.success(`${totalNew} orang (${newGurus.length} guru + ${newMunawibs.length} munawib) berhasil diabsen hadir`);
        fetchAll();
        loadMunawibAttendance();
      }
    } catch (err: any) {
      toast.error("Gagal absensi massal", { description: err.message });
    }
  };

  // Update single person status
  const handleUpdateStatus = async (person: UnifiedPerson, status: AttendanceStatus) => {
    let existing: any = null;
    if (person.type === "guru") {
      existing = teacherAttendance.find((a) => a.profile_id === person.sourceId && a.date === selectedDate);
    } else {
      existing = munawibAttendance.find((a) => a.profile_id === person.sourceId && a.date === selectedDate);
    }

    // If izin/sakit and no keterangan, show dialog
    if ((status === "izin" || status === "sakit") && !existing?.keterangan) {
      setKeteranganDialog({ personId: person.sourceId, personType: person.type, status });
      setKeteranganInput("");
      return;
    }

    try {
      if (person.type === "guru") {
        await api.createTeacherAttendance({
          profile_id: person.sourceId,
          date: selectedDate,
          status,
          keterangan: existing?.keterangan,
        });
      } else {
        // For munawib, use upsert to handle both insert and update
        const { error } = await supabase
          .from("munawib_attendance")
          .upsert({
            profile_id: person.sourceId,
            date: selectedDate,
            status,
            keterangan: existing?.keterangan,
          }, {
            onConflict: 'profile_id,date',
            ignoreDuplicates: false
          });
        
        if (error) throw error;
      }
      fetchAll();
      loadMunawibAttendance();
    } catch (err: any) {
      toast.error("Gagal update absensi", { description: err.message });
    }
  };

  const handleKeteranganSave = async () => {
    if (!keteranganDialog) return;
    try {
      if (keteranganDialog.personType === "guru") {
        await api.createTeacherAttendance({
          profile_id: keteranganDialog.personId,
          date: selectedDate,
          status: keteranganDialog.status,
          keterangan: keteranganInput || undefined,
        });
      } else {
        // For munawib, use upsert to handle both insert and update
        const { error } = await supabase
          .from("munawib_attendance")
          .upsert({
            profile_id: keteranganDialog.personId,
            date: selectedDate,
            status: keteranganDialog.status,
            keterangan: keteranganInput || undefined,
          }, {
            onConflict: 'profile_id,date',
            ignoreDuplicates: false
          });
        
        if (error) throw error;
      }
      setKeteranganDialog(null);
      setKeteranganInput("");
      fetchAll();
      loadMunawibAttendance();
    } catch (err: any) {
      toast.error("Gagal menyimpan", { description: err.message });
    }
  };

  const getStatus = (person: UnifiedPerson): AttendanceStatus | null => {
    if (person.type === "guru") {
      const record = teacherAttendance.find((a) => a.profile_id === person.sourceId && a.date === selectedDate);
      return (record?.status as AttendanceStatus) || null;
    } else {
      const record = munawibAttendance.find((a) => a.profile_id === person.sourceId && a.date === selectedDate);
      return (record?.status as AttendanceStatus) || null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Absensi Guru & Munawib</h1>
          {!allHaveRecords && (
            <Button onClick={handleBatchAbsensi} className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg">
              <ClipboardCheck className="mr-2 h-4 w-4" /> Absen Semua Hadir
            </Button>
          )}
        </div>

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
                  <span>{new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                </button>

                {calOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-2xl border border-emerald-200 bg-white shadow-lg p-4">
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
                        return (
                          <button
                            key={i}
                            disabled={isFuture}
                            onClick={() => { setSelectedDate(cell.date); setCalOpen(false); }}
                            className={cn(
                              "h-8 w-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center mx-auto",
                              isFuture
                                ? "text-emerald-200 cursor-not-allowed"
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
              <div className="flex-1 space-y-1">
                <Label className="text-emerald-900">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <Input
                    placeholder="Cari nama guru atau munawib..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg"><CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
            <p className="text-xs text-emerald-700">({stats.guru} Guru | {stats.munawib} Munawib)</p>
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
                <p>Tidak ada guru atau munawib ditemukan</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {dayView.map(({ person, record }, index) => {
                      const currentStatus = (record?.status as AttendanceStatus) || "hadir";
                      
                      // Format tanggal: dd/mm/yy
                      const formatDate = (dateStr: string) => {
                        const date = new Date(dateStr);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear().toString().slice(-2);
                        return `${day}/${month}/${year}`;
                      };

                      return (
                        <tr key={`${person.type}-${person.id}`} className="border-b border-emerald-100 hover:bg-emerald-50/50">
                          <td className="py-3 px-4 text-sm text-emerald-600">{index + 1}</td>
                          <td className="py-3 px-4 text-sm text-emerald-600">{formatDate(selectedDate)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-emerald-900">{person.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0">
                                {person.type === "guru" ? "G" : "M"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Select 
                              value={currentStatus} 
                              onValueChange={(value: AttendanceStatus) => handleUpdateStatus(person, value)}
                            >
                              <SelectTrigger className="h-9 w-32 text-sm border-emerald-200 focus:border-emerald-400">
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
                          <td className="py-3 px-4">
                            {record?.keterangan ? (
                              <span className="text-sm text-emerald-600">{record.keterangan}</span>
                            ) : (
                              <span className="text-sm text-emerald-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keterangan Dialog */}
        <Dialog open={!!keteranganDialog} onOpenChange={() => setKeteranganDialog(null)}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Keterangan {keteranganDialog?.status === "izin" ? "Izin" : "Sakit"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-emerald-900">Masukkan keterangan</Label>
              <Input
                value={keteranganInput}
                onChange={(e) => setKeteranganInput(e.target.value)}
                placeholder="Contoh: Acara keluarga / Demam"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setKeteranganDialog(null)}>Batal</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white" onClick={handleKeteranganSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}