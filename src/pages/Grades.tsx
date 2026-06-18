import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGrades, createGrade, fetchStudents, fetchKelas, fetchMapel, fetchParentStudentIds, fetchProfileKelasId } from "@/data/store";
import type { Grade, Kelas, Mapel } from "@/types";
import {
  Search,
  Plus,
  GraduationCap,
  TrendingUp,
  BookOpen,
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
import { cn, getLocalDate } from "@/lib/utils";

const gradeTypeConfig: Record<string, { label: string; color: string }> = {
  tamrin: { label: "Tamrin", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  uts: { label: "UTS", color: "bg-amber-50 text-amber-700 border-amber-200" },
  uas: { label: "UAS", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchStudents>>>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMapelId, setSelectedMapelId] = useState("");
  const [newGrade, setNewGrade] = useState<Partial<Grade>>({
    type: "tamrin",
    score: 80,
    semester: "1",
    date: getLocalDate(),
    kelas_id: "",
    student_id: "",
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isOrangtua = user?.role === "orangtua";
  const isGuru = user?.role === "guru";
  const canAdd = user?.role === "admin" || user?.role === "guru";

  const filtered = useMemo(() => {
    let list = grades;
    if (isOrangtua && parentStudentIds.length > 0) {
      list = list.filter((g) => parentStudentIds.includes(g.student_id));
    }
    if (isGuru && guruKelasId) {
      list = list.filter((g) => g.kelas_id === guruKelasId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((g) => {
        const s = students.find((st) => st.id === g.student_id);
        return s?.name.toLowerCase().includes(q);
      });
    }
    if (studentFilter !== "all") list = list.filter((g) => g.student_id === studentFilter);
    if (kelasFilter !== "all") list = list.filter((g) => g.kelas_id === kelasFilter);
    if (typeFilter !== "all") list = list.filter((g) => g.type === typeFilter);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades, search, studentFilter, kelasFilter, typeFilter, isOrangtua, isGuru, parentStudentIds, guruKelasId, students, kelasList]);

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name ?? "-";
  const getStudentKelas = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student?.kelas_id) return "-";
    return kelasList.find((k) => k.id === student.kelas_id)?.nama ?? "-";
  };
  const getKelasName = (kelasId: string) => kelasList.find((k) => k.id === kelasId)?.nama ?? "-";

  // Filtered student list (guru sees only their kelas students)
  const studentList = useMemo(() => {
    let list = students;
    if (isOrangtua && parentStudentIds.length > 0) list = list.filter((s) => parentStudentIds.includes(s.id));
    if (isGuru && guruKelasId) list = list.filter((s) => s.kelas_id === guruKelasId);
    return list;
  }, [students, isOrangtua, isGuru, parentStudentIds, guruKelasId]);

  // Filtered mapel list based on selected student's kelas
  const dialogMapelList = useMemo(() => {
    if (newGrade.student_id) {
      const student = students.find((s) => s.id === newGrade.student_id);
      if (student?.kelas_id) {
        const kelasMapel = mapelList.filter((m) => m.kelas_id === student.kelas_id);
        if (kelasMapel.length > 0) return kelasMapel;
      }
    }
    if (isGuru && guruKelasId) return mapelList.filter((m) => m.kelas_id === guruKelasId);
    return mapelList;
  }, [mapelList, newGrade.student_id, students, isGuru, guruKelasId]);

  // Summary stats
  const stats = useMemo(() => {
    const filteredGrades = filtered;
    if (filteredGrades.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
    const scores = filteredGrades.map((g) => g.score);
    return {
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      max: Math.max(...scores),
      min: Math.min(...scores),
      count: scores.length,
    };
  }, [filtered]);

  useEffect(() => {
    Promise.all([
      fetchGrades().catch(() => [] as Grade[]),
      fetchStudents(),
      fetchKelas(),
      fetchMapel(),
    ])
      .then(([gradeData, studentData, kelasData, mapelData]) => {
        setGrades(gradeData);
        setStudents(studentData);
        setKelasList(kelasData);
        setMapelList(mapelData);
      })
      .finally(() => setLoading(false));
    if (isOrangtua && user?.id) {
      fetchParentStudentIds(user.id).then(setParentStudentIds);
    }
    if (isGuru && user?.id) fetchProfileKelasId(user.id).then(setGuruKelasId);
  }, [isOrangtua, isGuru, user?.id]);

  const handleAdd = async () => {
    if (!newGrade.student_id || !newGrade.kelas_id) return;
    const grade: Omit<Grade, 'id' | 'created_at'> = {
      student_id: newGrade.student_id!,
      kelas_id: newGrade.kelas_id!,
      type: newGrade.type ?? "tamrin",
      score: newGrade.score ?? 80,
      semester: newGrade.semester ?? "1",
      date: newGrade.date ?? getLocalDate(),
    };
    const saved = await createGrade(grade);
    setGrades((prev) => [saved, ...prev]);
    setDialogOpen(false);
    setSelectedMapelId("");
    setNewGrade({
      type: "tamrin",
      score: 80,
      semester: "1",
      date: getLocalDate(),
      kelas_id: "",
      student_id: "",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };



  if (loading) {
    return <div className="flex items-center justify-center h-48 text-emerald-500 bg-emerald-100 rounded-xl">Memuat data nilai...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Nilai</h1>
          <p className="text-sm text-emerald-600 mt-0.5">
            {stats.count} data nilai &middot; Rata-rata: {stats.avg}
          </p>
        </div>
        {canAdd && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Nilai
          </Button>
        )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-lg">
          <GraduationCap className="h-5 w-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-800">{stats.avg}</p>
          <p className="text-xs text-emerald-600">Rata-rata</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{stats.max}</p>
          <p className="text-xs text-emerald-600">Nilai Tertinggi</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-lg">
          <TrendingUp className="h-5 w-5 text-amber-600 mb-2 rotate-180" />
          <p className="text-2xl font-bold text-amber-600">{stats.min}</p>
          <p className="text-xs text-emerald-600">Nilai Terendah</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-lg">
          <BookOpen className="h-5 w-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-800">{stats.count}</p>
          <p className="text-xs text-emerald-600">Total Data</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
          <Input
            placeholder="Cari nama santri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200"
          />
        </div>
        {!isGuru && (
          <Select value={kelasFilter} onValueChange={setKelasFilter}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {kelasList.map((k) => (
                <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-[130px] rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
            <SelectValue placeholder="Tipe Nilai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="tamrin">Tamrin</SelectItem>
            <SelectItem value="uts">UTS</SelectItem>
            <SelectItem value="uas">UAS</SelectItem>
          </SelectContent>
        </Select>
        {studentFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => { setStudentFilter("all"); setKelasFilter("all"); setTypeFilter("all"); }} className="h-10 text-emerald-600 hover:bg-emerald-50">
            Reset Filter
          </Button>
        )}
      </div>

      {/* Grades Table */}
      <div className="rounded-2xl border border-emerald-200 bg-white/90 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-emerald-100 bg-emerald-50/50">
                <th className="text-left py-3 px-3 font-medium text-emerald-600 w-10">No.</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600">Tgl</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600 min-w-[140px]">Nama</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600">Kls</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600">Tipe</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600">Nilai</th>
                <th className="text-left py-3 px-3 font-medium text-emerald-600">Smt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((g, idx) => {
                const d = new Date(g.date);
                const tgl = `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear().toString().slice(-2)}`;
                return (
                <tr key={g.id} className="border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-emerald-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 text-emerald-600 text-xs whitespace-nowrap">{tgl}</td>
                  <td className="py-2.5 px-3 font-medium text-emerald-800">{getStudentName(g.student_id)}</td>
                  <td className="py-2.5 px-3 text-emerald-600 text-xs">{getKelasName(g.kelas_id ?? "")}</td>
                  <td className="py-2.5 px-3">
                    <Badge className={cn("text-xs", gradeTypeConfig[g.type].color)}>
                      {gradeTypeConfig[g.type].label}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn("font-bold", getScoreColor(g.score))}>{g.score}</span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-500 text-center">{g.semester}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-emerald-500 font-medium">Tidak ada data nilai</p>
            <p className="text-sm text-emerald-400">Coba ubah filter</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedMapelId(""); }}>
        <DialogContent className="max-w-md rounded-2xl border-emerald-200 bg-white/90">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Tambah Nilai Baru</DialogTitle>
            <DialogDescription className="text-emerald-600">Input nilai santri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Santri</Label>
              <Select value={newGrade.student_id ?? ""} onValueChange={(v) => {
                const student = students.find((s) => s.id === v);
                setSelectedMapelId("");
                setNewGrade({ ...newGrade, student_id: v, kelas_id: student?.kelas_id ?? "" });
              }}>
                <SelectTrigger className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {studentList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({getStudentKelas(s.id)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Mata Pelajaran</Label>
                <Select
                  value={selectedMapelId}
                  onValueChange={(v) => {
                    setSelectedMapelId(v);
                    const selected = mapelList.find((m) => m.id === v);
                    setNewGrade({ ...newGrade, kelas_id: selected?.kelas_id ?? "" });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
                    <SelectValue placeholder="Pilih Mapel" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {dialogMapelList.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nama}{isGuru ? "" : ` (${getKelasName(m.kelas_id)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Tipe</Label>
                <Select value={newGrade.type} onValueChange={(v) => setNewGrade({ ...newGrade, type: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="tamrin">Tamrin</SelectItem>
                    <SelectItem value="uts">UTS</SelectItem>
                    <SelectItem value="uas">UAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Nilai</Label>
                <Input type="number" min={0} max={100} value={newGrade.score} onChange={(e) => setNewGrade({ ...newGrade, score: Number(e.target.value) })} className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Semester</Label>
                <Select value={newGrade.semester} onValueChange={(v) => setNewGrade({ ...newGrade, semester: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 relative z-50">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-emerald-600">Tanggal</Label>
                  <Calendar
                    className="h-4 w-4 text-emerald-400 hover:text-emerald-600 cursor-pointer transition-colors"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                  />
                </div>
                <Input ref={dateInputRef} type="date" value={newGrade.date} onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })} className="h-10 rounded-xl border-emerald-200 bg-white focus:border-emerald-400 focus:ring-emerald-200" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50">Batal</Button>
              <Button onClick={handleAdd} disabled={!newGrade.student_id || !newGrade.kelas_id} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white">
                Simpan Nilai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}