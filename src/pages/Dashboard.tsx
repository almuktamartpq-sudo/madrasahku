import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
import {
  Users,
  UserCheck,
  CreditCard,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { MunawibAttendance } from "@/types";
import { cn, getLocalDate } from "@/lib/utils";

const statCardBase = "rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm";
const statIconBase = "flex h-10 w-10 items-center justify-center rounded-xl";

export default function DashboardPage() {
  const { user } = useAuth();
  const { students, profiles, payments, attendance, grades, kelas, mapel, teacherAttendance, parentStudents } = useAppStore();

  const [munawibAttendance, setMunawibAttendance] = useState<MunawibAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const parentStudentIds = useMemo(() => {
    if (user?.role !== "orangtua") return [];
    return parentStudents.filter(ps => ps.parent_id === user.id).map(ps => ps.student_id);
  }, [user, parentStudents]);

  const guruKelasId = useMemo(() => {
    if (user?.role !== "guru") return null;
    const prof = profiles.find(p => p.id === user.id);
    return prof?.kelas_id ?? null;
  }, [user, profiles]);

  useEffect(() => {
    const loadMunawib = async () => {
      try {
        const data = await api.fetchMunawibAttendance();
        setMunawibAttendance(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    loadMunawib();
  }, []);

  // Filter based on role
  const filteredStudents = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return students.filter((s) => parentStudentIds.includes(s.id));
    }
    if (user?.role === "guru" && guruKelasId) {
      return students.filter((s) => s.kelas_id === guruKelasId);
    }
    return students;
  }, [students, user, parentStudentIds, guruKelasId]);

  const filteredPayments = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return payments.filter((p) => parentStudentIds.includes(p.student_id));
    }
    if (user?.role === "guru" && guruKelasId) {
      const kelasStudentIds = new Set(students.filter((s) => s.kelas_id === guruKelasId).map((s) => s.id));
      return payments.filter((p) => kelasStudentIds.has(p.student_id));
    }
    return payments;
  }, [payments, user, parentStudentIds, guruKelasId, students]);

  const filteredAttendance = useMemo(() => {
    let list = attendance;
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      list = list.filter((a) => parentStudentIds.includes(a.student_id));
    }
    if (user?.role === "guru" && guruKelasId) {
      const kelasStudentIds = new Set(students.filter((s) => s.kelas_id === guruKelasId).map((s) => s.id));
      list = list.filter((a) => kelasStudentIds.has(a.student_id));
    }
    return list;
  }, [attendance, user, parentStudentIds, guruKelasId, students]);

  const filteredGrades = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return grades.filter((g) => parentStudentIds.includes(g.student_id));
    }
    if (user?.role === "guru" && guruKelasId) {
      return grades.filter((g) => g.kelas_id === guruKelasId);
    }
    return grades;
  }, [grades, user, parentStudentIds, guruKelasId]);

  // Absensi Santri Hari Ini
  const todaysAttendance = useMemo(() => {
    const today = getLocalDate();
    const todayData = filteredAttendance.filter((a) => a.date === today);
    return {
      hadir: todayData.filter((a) => a.status === "hadir").length,
      izin: todayData.filter((a) => a.status === "izin").length,
      sakit: todayData.filter((a) => a.status === "sakit").length,
      alpha: todayData.filter((a) => a.status === "alfa").length,
      total: todayData.length,
    };
  }, [filteredAttendance]);

  // Pembayaran
  const paymentStats = useMemo(() => {
    const lunas = filteredPayments.filter((p) => p.status === "lunas").length;
    const pending = filteredPayments.filter((p) => p.status !== "lunas").length;
    return { lunas, pending, total: filteredPayments.length };
  }, [filteredPayments]);

  const totalKelas = kelas.length;
  const totalMunawib = profiles.filter((p) => p.role === "munawib").length;
  const totalOrangtua = profiles.filter((p) => p.role === "orangtua").length;

  // Absensi Guru Hari Ini (admin only)
  const todaysTeacherAttendance = useMemo(() => {
    const today = getLocalDate();
    const data = teacherAttendance.filter((a) => a.date === today);
    return {
      hadir: data.filter((a) => a.status === "hadir").length,
      izin: data.filter((a) => a.status === "izin").length,
      sakit: data.filter((a) => a.status === "sakit").length,
      alpha: data.filter((a) => a.status === "alfa").length,
      total: data.length,
    };
  }, [teacherAttendance]);

  // Absensi Munawib Hari Ini (admin only)
  const todaysMunawibAttendance = useMemo(() => {
    const today = getLocalDate();
    const data = munawibAttendance.filter((a) => a.date === today);
    return {
      hadir: data.filter((a) => a.status === "hadir").length,
      izin: data.filter((a) => a.status === "izin").length,
      sakit: data.filter((a) => a.status === "sakit").length,
      alpha: data.filter((a) => a.status === "alfa").length,
      total: data.length,
    };
  }, [munawibAttendance]);

  // Recent payments (belum lunas)
  const recentPayments = useMemo(
    () => filteredPayments.filter((p) => p.status !== "lunas").slice(0, 5),
    [filteredPayments]
  );

  // Recent absences — group consecutive izin/sakit per student into date ranges
  const recentAbsences = useMemo(() => {
    const nonHadir = filteredAttendance
      .filter((a) => a.status !== "hadir")
      .sort((a, b) => b.date.localeCompare(a.date));

    // Group by student_id + status + keterangan for izin/sakit
    const groups: Map<string, { student_id: string; status: string; keterangan: string; dates: string[] }> = new Map();
    const standalone: typeof nonHadir = [];

    for (const a of nonHadir) {
      if (a.status === "izin" || a.status === "sakit") {
        const key = `${a.student_id}|${a.status}|${a.keterangan || ""}`;
        if (!groups.has(key)) {
          groups.set(key, { student_id: a.student_id, status: a.status, keterangan: a.keterangan || "", dates: [] });
        }
        groups.get(key)!.dates.push(a.date);
      } else {
        standalone.push(a);
      }
    }

    // Build grouped entries
    const fmtDate = (d: string) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getFullYear()).slice(-2)}`;
    };

    type AbsenceEntry = { student_id: string; status: string; keterangan: string; dateDisplay: string; id: string };
    const entries: AbsenceEntry[] = [];

    for (const [, g] of groups) {
      const sorted = g.dates.sort();
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const dateDisplay = sorted.length > 1 ? `${fmtDate(first)} - ${fmtDate(last)}` : fmtDate(first);
      entries.push({ student_id: g.student_id, status: g.status, keterangan: g.keterangan, dateDisplay, id: `${g.student_id}-${g.status}-${first}` });
    }

    // Add standalone (alfa) entries
    for (const a of standalone) {
      entries.push({ student_id: a.student_id, status: a.status, keterangan: a.keterangan || "", dateDisplay: fmtDate(a.date), id: a.id });
    }

    // Sort by most recent date
    entries.sort((a, b) => {
      const aDate = a.dateDisplay.includes(" - ") ? a.dateDisplay.split(" - ")[1] : a.dateDisplay;
      const bDate = b.dateDisplay.includes(" - ") ? b.dateDisplay.split(" - ")[1] : b.dateDisplay;
      return bDate.localeCompare(aDate);
    });

    return entries.slice(0, 5);
  }, [filteredAttendance]);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name ?? "-";

  const getKelasName = (kelasId: string) => {
    return kelas.find((k) => k.id === kelasId)?.nama ?? "-";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-emerald-500 bg-emerald-100 rounded-xl">Memuat dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-emerald-600 mt-0.5">
            Selamat datang, {user?.name}. Ringkasan data sekolah hari ini.
          </p>
        </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-600")}>
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-800">{filteredStudents.length}</p>
          <p className="text-xs text-emerald-600">Total Santri</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-600")}>
            <UserCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-800">{profiles.filter((p) => p.role === "guru").length}</p>
          <p className="text-xs text-emerald-600">Total Guru</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-600")}>
            <UserCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-800">{totalMunawib}</p>
          <p className="text-xs text-emerald-600">Total Munawib</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-amber-50 to-red-50 text-amber-600")}>
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-800">{totalOrangtua}</p>
          <p className="text-xs text-emerald-600">Total Orang Tua</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-600")}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-800">{mapel?.length ?? 0}</p>
          <p className="text-xs text-emerald-600">Total Mapel</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-gradient-to-br from-emerald-50 to-blue-50 text-blue-600")}>
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-800">{totalKelas}</p>
          <p className="text-xs text-emerald-600">Total Kelas</p>
        </div>
      </div>

      {/* Attendance & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absensi Santri Hari Ini */}
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-emerald-800">Absensi Santri Hari Ini</h2>
          </div>
          {todaysAttendance.total === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Tidak ada data absensi untuk hari ini (akhir pekan/libur).
            </p>
          ) : (
            <div className="space-y-3">
              <StatRow label="Hadir" value={todaysAttendance.hadir} total={todaysAttendance.total} color="bg-teal-500" />
              <StatRow label="Izin" value={todaysAttendance.izin} total={todaysAttendance.total} color="bg-amber-500" />
              <StatRow label="Sakit" value={todaysAttendance.sakit} total={todaysAttendance.total} color="bg-blue-500" />
              <StatRow label="Alpha" value={todaysAttendance.alpha} total={todaysAttendance.total} color="bg-red-500" />
            </div>
          )}
        </div>

        {/* Status Pembayaran */}
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-emerald-800">Status Pembayaran</h2>
          </div>
          <div className="space-y-3">
            <StatRow label="Lunas" value={paymentStats.lunas} total={paymentStats.total} color="bg-teal-500" />
            <StatRow label="Belum Lunas" value={paymentStats.pending} total={paymentStats.total} color="bg-red-500" />
          </div>
          {recentPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Pembayaran Tertunda</p>
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-emerald-700">{getStudentName(p.student_id)}</span>
                  </div>
                  <span className="text-emerald-600 font-medium">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Absensi Guru Hari Ini - admin only */}
      {user?.role === "admin" && (
      <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-emerald-800">Absensi Guru Hari Ini</h2>
        </div>
        {todaysTeacherAttendance.total === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Tidak ada data absensi guru untuk hari ini.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <StatRow label="Hadir" value={todaysTeacherAttendance.hadir} total={todaysTeacherAttendance.total} color="bg-teal-500" />
            <StatRow label="Izin" value={todaysTeacherAttendance.izin} total={todaysTeacherAttendance.total} color="bg-amber-500" />
            <StatRow label="Sakit" value={todaysTeacherAttendance.sakit} total={todaysTeacherAttendance.total} color="bg-blue-500" />
            <StatRow label="Alpha" value={todaysTeacherAttendance.alpha} total={todaysTeacherAttendance.total} color="bg-red-500" />
          </div>
        )}
      </div>
      )}

      {/* Absensi Munawib Hari Ini - admin only */}
      {user?.role === "admin" && (
      <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-emerald-800">Absensi Munawib Hari Ini</h2>
        </div>
        {todaysMunawibAttendance.total === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Tidak ada data absensi munawib untuk hari ini.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <StatRow label="Hadir" value={todaysMunawibAttendance.hadir} total={todaysMunawibAttendance.total} color="bg-teal-500" />
            <StatRow label="Izin" value={todaysMunawibAttendance.izin} total={todaysMunawibAttendance.total} color="bg-amber-500" />
            <StatRow label="Sakit" value={todaysMunawibAttendance.sakit} total={todaysMunawibAttendance.total} color="bg-blue-500" />
            <StatRow label="Alpha" value={todaysMunawibAttendance.alpha} total={todaysMunawibAttendance.total} color="bg-red-500" />
          </div>
        )}
      </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ketidakhadiran Terbaru */}
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-emerald-800">Ketidakhadiran Terbaru</h2>
          </div>
          {recentAbsences.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Semua santri hadir pada catatan terbaru.</p>
          ) : (
            <div className="space-y-2">
              {recentAbsences.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-50">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">{getStudentName(a.student_id)}</p>
                    <p className="text-xs text-emerald-500">{a.dateDisplay}{a.keterangan ? ` \u00b7 ${a.keterangan}` : ""}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    a.status === "sakit" && "bg-blue-50 text-blue-600",
                    a.status === "izin" && "bg-amber-50 text-amber-600",
                    a.status === "alfa" && "bg-red-50 text-red-600",
                  )}>
                    {a.status === "sakit" ? "Sakit" : a.status === "izin" ? "Izin" : "Alpha"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nilai Tertinggi */}
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-emerald-800">Nilai Tertinggi</h2>
          </div>
          <div className="space-y-2">
            {(() => {
              const studentAvgs = filteredStudents.map((s) => {
                const sGrades = filteredGrades.filter((g) => g.student_id === s.id);
                const avg = sGrades.length > 0 ? Math.round(sGrades.reduce((a, g) => a + g.score, 0) / sGrades.length) : 0;
                return { student: s, avg };
              });
              return studentAvgs
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5)
                .map(({ student, avg }, i) => (
                  <div key={student.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-emerald-50">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-200 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-700">{student.name}</p>
                      <p className="text-xs text-emerald-500">{getKelasName(student.kelas_id)}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{avg}</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

const StatRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-emerald-600">{label}</span>
        <span className="text-sm font-semibold text-emerald-800">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
