import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchStudents,
  fetchTeachers,
  fetchPayments,
  fetchAttendance,
  fetchGrades,
  fetchParentStudentIds,
  fetchTeacherKelasId,
  fetchTeacherAttendance,
  fetchTeacherIdByProfile,
  fetchMunawibKelasIds,
  fetchMunawibIdByProfile,
  fetchMunawibAttendance,
} from "@/data/store";
import {
  Users,
  UserCheck,
  CreditCard,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Student, Teacher, Payment, Attendance, Grade, TeacherAttendanceItem, MunawibAttendanceItem } from "@/types";
import { cn } from "@/lib/utils";

const statCardBase = "rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-300";
const statIconBase = "flex h-10 w-10 items-center justify-center rounded-xl";

export default function DashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceItem[]>([]);
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);

  // Munawib state
  const [munawibKelasIds, setMunawibKelasIds] = useState<string[]>([]);
  const [myMunawibId, setMyMunawibId] = useState<string | null>(null);
  const [munawibAttendance, setMunawibAttendance] = useState<MunawibAttendanceItem[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [s, t, p, a, g] = await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchPayments(),
        fetchAttendance(),
        fetchGrades(),
      ]);
      setStudents(s);
      setTeachers(t);
      setPayments(p);
      setAttendance(a);
      setGrades(g);

      if (user?.role === "orangtua") {
        const ids = await fetchParentStudentIds(user.id);
        setParentStudentIds(ids);
      }
      if (user?.role === "guru") {
        const kid = await fetchTeacherKelasId(user.id);
        setGuruKelasId(kid);
        const tid = await fetchTeacherIdByProfile(user.id);
        setMyTeacherId(tid);
      }
      if (user?.role === "munawib") {
        const kids = await fetchMunawibKelasIds(user.id);
        setMunawibKelasIds(kids);
        const mid = await fetchMunawibIdByProfile(user.id);
        setMyMunawibId(mid);
        const mData = await fetchMunawibAttendance();
        setMunawibAttendance(mData);
      }
      // Fetch teacher attendance
      const taData = await fetchTeacherAttendance();
      setTeacherAttendance(taData);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Filter based on role
  const filteredStudents = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return students.filter((s) => parentStudentIds.includes(s.id));
    }
    if (user?.role === "guru" && guruKelasId) {
      return students.filter((s) => s.kelasId === guruKelasId);
    }
    if (user?.role === "munawib" && munawibKelasIds.length > 0) {
      return students.filter((s) => munawibKelasIds.includes(s.kelasId ?? ""));
    }
    return students;
  }, [students, user, parentStudentIds, guruKelasId, munawibKelasIds]);

  const filteredPayments = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return payments.filter((p) => parentStudentIds.includes(p.studentId));
    }
    return payments;
  }, [payments, user, parentStudentIds]);

  const filteredAttendance = useMemo(() => {
    let list = attendance;
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      list = list.filter((a) => parentStudentIds.includes(a.studentId));
    }
    if (user?.role === "guru" && guruKelasId) {
      const kelasStudentIds = new Set(students.filter((s) => s.kelasId === guruKelasId).map((s) => s.id));
      list = list.filter((a) => kelasStudentIds.has(a.studentId));
    }
    if (user?.role === "munawib" && munawibKelasIds.length > 0) {
      const kelasStudentIds = new Set(students.filter((s) => munawibKelasIds.includes(s.kelasId ?? "")).map((s) => s.id));
      list = list.filter((a) => kelasStudentIds.has(a.studentId));
    }
    return list;
  }, [attendance, user, parentStudentIds, guruKelasId, munawibKelasIds, students]);

  const filteredGrades = useMemo(() => {
    if (user?.role === "orangtua" && parentStudentIds.length > 0) {
      return grades.filter((g) => parentStudentIds.includes(g.studentId));
    }
    if (user?.role === "guru" && guruKelasId) {
      return grades.filter((g) => g.kelasId === guruKelasId);
    }
    if (user?.role === "munawib" && munawibKelasIds.length > 0) {
      return grades.filter((g) => munawibKelasIds.includes(g.kelasId ?? ""));
    }
    return grades;
  }, [grades, user, parentStudentIds, guruKelasId, munawibKelasIds]);

  // Stats
  const todaysAttendance = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayData = filteredAttendance.filter((a) => a.date === today);
    return {
      hadir: todayData.filter((a) => a.status === "hadir").length,
      izin: todayData.filter((a) => a.status === "izin").length,
      sakit: todayData.filter((a) => a.status === "sakit").length,
      alpha: todayData.filter((a) => a.status === "alpha").length,
      total: todayData.length,
    };
  }, [filteredAttendance]);

  const paymentStats = useMemo(() => {
    const lunas = filteredPayments.filter((p) => p.status === "lunas").length;
    const pending = filteredPayments.filter((p) => p.status !== "lunas").length;
    return { lunas, pending, total: filteredPayments.length };
  }, [filteredPayments]);

  const avgGrade = useMemo(() => {
    if (filteredGrades.length === 0) return 0;
    const sum = filteredGrades.reduce((acc, g) => acc + g.score, 0);
    return Math.round(sum / filteredGrades.length);
  }, [filteredGrades]);

  // Teacher attendance stats
  const todaysTeacherAttendance = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let data = teacherAttendance.filter((a) => a.date === today);
    // Guru only sees their own attendance
    if (user?.role === "guru" && myTeacherId) {
      data = data.filter((a) => a.teacherId === myTeacherId);
    }
    return {
      hadir: data.filter((a) => a.status === "hadir").length,
      izin: data.filter((a) => a.status === "izin").length,
      sakit: data.filter((a) => a.status === "sakit").length,
      alpha: data.filter((a) => a.status === "alpha").length,
      total: data.length,
    };
  }, [teacherAttendance, user, myTeacherId]);

  // Munawib attendance stats
  const todaysMunawibAttendance = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let data = munawibAttendance.filter((a) => a.date === today);
    if (user?.role === "munawib" && myMunawibId) {
      data = data.filter((a) => a.munawibId === myMunawibId);
    }
    return {
      hadir: data.filter((a) => a.status === "hadir").length,
      izin: data.filter((a) => a.status === "izin").length,
      sakit: data.filter((a) => a.status === "sakit").length,
      alpha: data.filter((a) => a.status === "alpha").length,
      total: data.length,
    };
  }, [munawibAttendance, user, myMunawibId]);

  // Recent payments
  const recentPayments = useMemo(
    () => filteredPayments.filter((p) => p.status !== "lunas").sort(() => 0.5 - Math.random()).slice(0, 5),
    [filteredPayments]
  );

  // Recent absences
  const recentAbsences = useMemo(
    () => filteredAttendance.filter((a) => a.status !== "hadir").sort(() => 0.5 - Math.random()).slice(0, 5),
    [filteredAttendance]
  );

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name ?? "-";

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Selamat datang, {user?.name}. Ringkasan data sekolah hari ini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-blue-50 text-blue-600")}>
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{filteredStudents.length}</p>
          <p className="text-xs text-slate-500">Total Santri</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-teal-50 text-teal-600")}>
            <UserCheck className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{teachers.length}</p>
          <p className="text-xs text-slate-500">Total Guru</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-amber-50 text-amber-600")}>
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{paymentStats.lunas}</p>
          <p className="text-xs text-slate-500">Pembayaran Lunas</p>
        </div>

        <div className={statCardBase}>
          <div className={cn(statIconBase, "bg-purple-50 text-purple-600")}>
            <GraduationCap className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{avgGrade}</p>
          <p className="text-xs text-slate-500">Rata-rata Nilai</p>
        </div>
      </div>

      {/* Attendance & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-teal-600" />
            <h2 className="font-semibold text-slate-800">Absensi Hari Ini</h2>
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

        {/* Payment Summary */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-slate-800">Status Pembayaran</h2>
          </div>
          <div className="space-y-3">
            <StatRow label="Lunas" value={paymentStats.lunas} total={paymentStats.total} color="bg-teal-500" />
            <StatRow label="Belum Lunas & Tertunda" value={paymentStats.pending} total={paymentStats.total} color="bg-red-500" />
          </div>
          {recentPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Pembayaran Tertunda</p>
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-slate-700">{getStudentName(p.studentId)}</span>
                  </div>
                  <span className="text-slate-500">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teacher Attendance */}
      {user?.role !== "munawib" && (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-800">
            {user?.role === "guru" ? "Absensiku Hari Ini" : "Absensi Guru Hari Ini"}
          </h2>
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

      {/* Munawib Attendance */}
      {user?.role === "munawib" && (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-slate-800">Absensiku Hari Ini</h2>
        </div>
        {todaysMunawibAttendance.total === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Tidak ada data absensi untuk hari ini.
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
        {/* Recent Absences */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-slate-800">Ketidakhadiran Terbaru</h2>
          </div>
          {recentAbsences.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Semua santri hadir pada catatan terbaru.</p>
          ) : (
            <div className="space-y-2">
              {recentAbsences.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{getStudentName(a.studentId)}</p>
                    <p className="text-xs text-slate-400">{a.date} &middot; {a.keterangan}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    a.status === "sakit" && "bg-blue-50 text-blue-600",
                    a.status === "izin" && "bg-amber-50 text-amber-600",
                    a.status === "alpha" && "bg-red-50 text-red-600",
                  )}>
                    {a.status === "sakit" ? "Sakit" : a.status === "izin" ? "Izin" : "Alpha"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Nilai Tertinggi</h2>
          </div>
          <div className="space-y-2">
            {(() => {
              const studentAvgs = filteredStudents.map((s) => {
                const sGrades = filteredGrades.filter((g) => g.studentId === s.id);
                const avg = sGrades.length > 0 ? Math.round(sGrades.reduce((a, g) => a + g.score, 0) / sGrades.length) : 0;
                return { student: s, avg };
              });
              return studentAvgs
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5)
                .map(({ student, avg }, i) => (
                  <div key={student.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50">
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
                      <p className="text-sm font-medium text-slate-700">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.kelas ?? "-"}</p>
                    </div>
                    <span className="text-sm font-bold text-teal-600">{avg}</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
