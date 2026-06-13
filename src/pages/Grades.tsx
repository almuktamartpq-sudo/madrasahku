import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchGrades, createGrade, fetchStudents, fetchKelas, fetchMapel, fetchParentStudentIds, fetchTeacherKelasId } from "@/data/store";
import type { Grade, GradeType, KelasItem, MapelItem } from "@/types";
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
import { cn } from "@/lib/utils";

const gradeTypeConfig: Record<GradeType, { label: string; color: string }> = {
  tamrin: { label: "Tamrin", color: "bg-blue-50 text-blue-700 border-blue-200" },
  uts: { label: "UTS", color: "bg-amber-50 text-amber-700 border-amber-200" },
  uas: { label: "UAS", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchStudents>>>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGrade, setNewGrade] = useState<Partial<Grade>>({
    type: "tamrin",
    score: 80,
    semester: "2",
    date: new Date().toISOString().split("T")[0],
    kelasId: "",
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isOrangtua = user?.role === "orangtua";
  const isGuru = user?.role === "guru";
  const canAdd = user?.role === "admin" || user?.role === "guru";

  const filtered = useMemo(() => {
    let list = grades;
    if (isOrangtua && parentStudentIds.length > 0) {
      list = list.filter((g) => parentStudentIds.includes(g.studentId));
    }
    if (isGuru && guruKelasId) {
      list = list.filter((g) => g.kelasId === guruKelasId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((g) => {
        const s = students.find((st) => st.id === g.studentId);
        return s?.name.toLowerCase().includes(q);
      });
    }
    if (studentFilter !== "all") list = list.filter((g) => g.studentId === studentFilter);
    if (kelasFilter !== "all") list = list.filter((g) => g.kelasId === kelasFilter);
    if (typeFilter !== "all") list = list.filter((g) => g.type === typeFilter);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades, search, studentFilter, kelasFilter, typeFilter, isOrangtua, isGuru, parentStudentIds, guruKelasId, students, kelasList]);

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name ?? "-";
  const getStudentKelas = (id: string) => students.find((s) => s.id === id)?.kelas ?? "-";
  const getKelasName = (kelasId: string) => kelasList.find((k) => k.id === kelasId)?.nama ?? "-";

  // Filtered student list (guru sees only their kelas students)
  const studentList = useMemo(() => {
    let list = students;
    if (isOrangtua && parentStudentIds.length > 0) list = list.filter((s) => parentStudentIds.includes(s.id));
    if (isGuru && guruKelasId) list = list.filter((s) => s.kelasId === guruKelasId);
    return list;
  }, [students, isOrangtua, isGuru, parentStudentIds, guruKelasId]);

  // Filtered mapel list (guru sees only their kelas mapel)
  const dialogMapelList = useMemo(() => {
    if (isGuru && guruKelasId) return mapelList.filter((m) => m.kelasId === guruKelasId);
    return mapelList;
  }, [mapelList, isGuru, guruKelasId]);

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
    Promise.all([fetchGrades(), fetchStudents(), fetchKelas(), fetchMapel()])
      .then(([gradeData, studentData, kelasData, mapelData]) => {
        setGrades(gradeData);
        setStudents(studentData);
        setKelasList(kelasData);
        setMapelList(mapelData);
      })
      .finally(() => setLoading(false));
    if (isOrangtua) fetchParentStudentIds(user.id).then(setParentStudentIds);
    if (isGuru) fetchTeacherKelasId(user.id).then(setGuruKelasId);
  }, [isOrangtua, isGuru, user]);

  const handleAdd = async () => {
    if (!newGrade.studentId || !newGrade.kelasId) return;
    const grade: Grade = {
      id: "",
      studentId: newGrade.studentId,
      kelasId: newGrade.kelasId,
      type: newGrade.type as GradeType,
      score: newGrade.score ?? 80,
      semester: newGrade.semester ?? "2",
      date: newGrade.date ?? "",
      keterangan: newGrade.keterangan,
    };
    const saved = await createGrade(grade);
    setGrades((prev) => [saved, ...prev]);
    setDialogOpen(false);
    setNewGrade({
      type: "tamrin",
      score: 80,
      semester: "2",
      date: new Date().toISOString().split("T")[0],
      kelasId: "",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-teal-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-teal-50";
    if (score >= 75) return "bg-blue-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-red-50";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500">Memuat data nilai...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nilai</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.count} data nilai &middot; Rata-rata: {stats.avg}
          </p>
        </div>
        {canAdd && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Nilai
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <GraduationCap className="h-5 w-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{stats.avg}</p>
          <p className="text-xs text-slate-500">Rata-rata</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <TrendingUp className="h-5 w-5 text-teal-500 mb-2" />
          <p className="text-2xl font-bold text-teal-600">{stats.max}</p>
          <p className="text-xs text-slate-500">Nilai Tertinggi</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <TrendingUp className="h-5 w-5 text-red-400 mb-2 rotate-180" />
          <p className="text-2xl font-bold text-red-500">{stats.min}</p>
          <p className="text-xs text-slate-500">Nilai Terendah</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
          <BookOpen className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
          <p className="text-xs text-slate-500">Total Data</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama santri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
          />
        </div>
        {!isGuru && (
          <Select value={kelasFilter} onValueChange={setKelasFilter}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl">
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
          <SelectTrigger className="h-10 w-[130px] rounded-xl">
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
          <Button variant="ghost" size="sm" onClick={() => { setStudentFilter("all"); setKelasFilter("all"); setTypeFilter("all"); }} className="h-10">
            Reset Filter
          </Button>
        )}
      </div>

      {/* Grades Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Santri</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Kelas</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Tipe</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Nilai</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Semester</th>
                <th className="text-left py-3.5 px-4 font-medium text-slate-500">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((g) => (
                <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{getStudentName(g.studentId)}</p>
                    <p className="text-xs text-slate-400">{getStudentKelas(g.studentId)}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{getKelasName(g.kelasId)}</td>
                  <td className="py-3 px-4">
                    <Badge className={cn("text-xs", gradeTypeConfig[g.type].color)}>
                      {gradeTypeConfig[g.type].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("font-bold text-lg", getScoreColor(g.score))}>{g.score}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">Semester {g.semester}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {new Date(g.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data nilai</p>
            <p className="text-sm text-slate-400">Coba ubah filter</p>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Nilai Baru</DialogTitle>
            <DialogDescription>Input nilai santri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Santri</Label>
              <Select value={newGrade.studentId ?? ""} onValueChange={(v) => setNewGrade({ ...newGrade, studentId: v })}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {studentList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.kelas ?? "-"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Mata Pelajaran</Label>
                <Select
                  value={
                    mapelList.find((m) => m.kelasId === newGrade.kelasId)?.id ?? ""
                  }
                  onValueChange={(v) => {
                    const selected = mapelList.find((m) => m.id === v);
                    setNewGrade({ ...newGrade, kelasId: selected?.kelasId ?? "" });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih Mapel" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {dialogMapelList.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nama}{isGuru ? "" : ` (${m.kelasNama ?? "-"})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Tipe</Label>
                <Select value={newGrade.type} onValueChange={(v) => setNewGrade({ ...newGrade, type: v as GradeType })}>
                  <SelectTrigger className="h-10 rounded-xl">
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
                <Label className="text-xs text-slate-600">Nilai</Label>
                <Input type="number" min={0} max={100} value={newGrade.score} onChange={(e) => setNewGrade({ ...newGrade, score: Number(e.target.value) })} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Semester</Label>
                <Select value={newGrade.semester} onValueChange={(v) => setNewGrade({ ...newGrade, semester: v })}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-600">Tanggal</Label>
                  <Calendar
                    className="h-4 w-4 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                  />
                </div>
                <Input ref={dateInputRef} type="date" value={newGrade.date} onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })} className="h-10 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl">Batal</Button>
              <Button onClick={handleAdd} disabled={!newGrade.studentId} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                Simpan Nilai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
