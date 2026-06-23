import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/data/store";
import { fetchParentStudentIds, fetchProfileKelasId } from "@/data/store";
import { getLocalDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Pelanggaran } from "@/types";

const jenisOptions = [
  { value: "ringan", label: "Ringan" },
  { value: "sedang", label: "Sedang" },
  { value: "berat", label: "Berat" },
];

const kartuForJenis: Record<string, string> = {
  ringan: "kuning",
  sedang: "oranye",
  berat: "merah",
};

export default function PelanggaranPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student");
  const { students, pelanggaran, kelas, fetchAll, addPelanggaran, updatePelanggaran, deletePelanggaran } = useAppStore();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Pelanggaran | null>(null);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    student_id: "",
    tanggal: getLocalDate(),
    jenis: "ringan" as "ringan" | "sedang" | "berat",
    kartu: "kuning" as "kuning" | "oranye" | "merah",
    deskripsi: "",
    created_by: undefined as string | undefined,
  });

  // Tailwind config overrides for emerald-gold theme
  const cardClasses = "bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 border-emerald-200/60 shadow-lg hover:shadow-xl transition-all duration-300";
  const buttonClasses = "bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300";
  const gradientText = "gradient-text";
  const gradientTextDark = "gradient-text";

  const canModify = user?.role === "admin" || user?.role === "guru";
  const isOrangtua = user?.role === "orangtua";
  const isGuru = user?.role === "guru";
  const [guruKelasId, setGuruKelasId] = useState<string | null>(null);

  const dialogStudents = useMemo(() => {
    if (isGuru && guruKelasId) return students.filter((s) => s.kelas_id === guruKelasId);
    return students;
  }, [students, isGuru, guruKelasId]);

  const visiblePelanggaran = useMemo(() => {
    let list = pelanggaran;
    if (isOrangtua && parentStudentIds.length > 0) {
      list = list.filter((p) => parentStudentIds.includes(p.student_id));
    }
    if (studentIdParam) {
      list = list.filter((p) => p.student_id === studentIdParam);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const student = students.find((s) => s.id === p.student_id);
        return (
          p.jenis.toLowerCase().includes(q) ||
          p.kartu.toLowerCase().includes(q) ||
          p.deskripsi.toLowerCase().includes(q) ||
          student?.name.toLowerCase().includes(q) ||
          student?.nis.toLowerCase().includes(q)
        );
      });
    }
    if (user?.role === "munawib") {
      return list;
    }
    return list;
  }, [pelanggaran, search, students, user, studentIdParam, isOrangtua, parentStudentIds]);

  useEffect(() => {
    fetchAll();
    if (isOrangtua && user?.id) {
      fetchParentStudentIds(user.id).then(setParentStudentIds);
    }
    if (isGuru && user?.id) {
      fetchProfileKelasId(user.id).then(setGuruKelasId);
    }
    // Auto-fill search with student name when navigating from student card
    if (studentIdParam && students.length > 0) {
      const student = students.find((s) => s.id === studentIdParam);
      if (student) setSearch(student.name);
    }
  }, [isOrangtua, user?.id, studentIdParam, students]);

  const openNew = () => {
    setEditing(null);
    setForm({
      student_id: "",
      tanggal: getLocalDate(),
      jenis: "ringan",
      kartu: "kuning",
      deskripsi: "",
      created_by: user?.id ? user.id as string : undefined,
    });
    setShowDialog(true);
  };

  const openEdit = (pel: Pelanggaran) => {
    setEditing(pel);
    setForm({
      student_id: pel.student_id,
      tanggal: pel.tanggal,
      jenis: pel.jenis,
      kartu: pel.kartu,
      deskripsi: pel.deskripsi,
      created_by: pel.created_by as string | undefined,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.student_id || !form.deskripsi) {
      toast.error("Lengkapi semua field terlebih dahulu");
      return;
    }

    const { student_id, ...restForm } = form;
    const formPayload = { ...restForm, created_by: user?.id };

    try {
      if (editing) {
        await updatePelanggaran(editing.id, { ...formPayload, student_id } as Partial<Pelanggaran>);
        toast.success("Pelanggaran berhasil diupdate");
      } else {
        await addPelanggaran({ ...formPayload, student_id } as Omit<Pelanggaran, "id" | "created_at">);
        toast.success("Pelanggaran berhasil ditambahkan");
      }
      setShowDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal menyimpan pelanggaran", { description: err.message });
    }
  };

  const handleDelete = async (pel: Pelanggaran) => {
    if (!confirm("Hapus pelanggaran ini?")) return;
    try {
      await deletePelanggaran(pel.id);
      toast.success("Pelanggaran berhasil dihapus");
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal menghapus pelanggaran", { description: err.message });
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || "-";
  const getStudentKelas = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student) return "-";
    return kelas.find((k) => k.id === student.kelas_id)?.nama || "-";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${gradientText}`}>Pelanggaran</h1>
          <p className="text-sm text-emerald-600/70 mt-1">Catatan pelanggaran santri jenis:kartu | ringan:kuning, sedang:oranye, berat:merah.</p>
        </div>
        {canModify && (
          <Button onClick={openNew} className={buttonClasses}>
            <Plus className="h-4 w-4 mr-2" /> Tambah Pelanggaran
          </Button>
        )}
      </div>

      <Card className={cardClasses}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <Input
                placeholder="Cari nama santri, jenis, kartu, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white/80 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 transition-colors duration-200"
              />
            </div>
          </div>

          {visiblePelanggaran.length === 0 ? (
            <div className="text-center py-12 text-emerald-600/70">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400/50" />
              <p className="text-emerald-600/80">Tidak ada data pelanggaran.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePelanggaran.map((pel) => (
                <div key={pel.id} className="rounded-2xl border border-emerald-200/40 p-4 bg-white/60 shadow-sm hover:bg-emerald-50/30 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <div
                          className={
                            pel.kartu === "merah"
                              ? "h-5 w-3.5 bg-red-600 rounded-[2px] border border-red-700/60"
                              : pel.kartu === "oranye"
                              ? "h-5 w-3.5 bg-orange-500 rounded-[2px] border border-orange-600/60"
                              : "h-5 w-3.5 bg-yellow-500 rounded-[2px] border border-yellow-600/60"
                          }
                        />
                      </div>
                      <p className="font-semibold text-emerald-800">{getStudentName(pel.student_id)} <span className="text-sm text-emerald-600/70">({getStudentKelas(pel.student_id)})</span></p>
                      <p className="text-sm text-emerald-600/70 mt-2">{pel.deskripsi}</p>
                    </div>
                    <div className="flex gap-2">
                      {canModify && (
                        <>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-emerald-100 hover:text-emerald-700 transition-colors duration-200" onClick={() => openEdit(pel)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-100 hover:text-red-700 transition-colors duration-200" onClick={() => handleDelete(pel)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
        <DialogContent className="bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 border-emerald-200/60">
          <DialogHeader>
            <DialogTitle className={gradientTextDark}>{editing ? "Edit Pelanggaran" : "Tambah Pelanggaran"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-emerald-800 font-medium">Santri</Label>
              <Select value={form.student_id || undefined} onValueChange={(value) => setForm({ ...form, student_id: value })}>
                <SelectTrigger className="bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200">
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {dialogStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-emerald-800 font-medium">Tanggal</Label>
                <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="h-10 rounded-xl bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-800 font-medium">Jenis</Label>
                <Select
                  value={form.jenis}
                  onValueChange={(value) => {
                    const kartu = (kartuForJenis[value as string] || "kuning") as "kuning" | "oranye" | "merah";
                    setForm({
                      ...form,
                      jenis: value as "ringan" | "sedang" | "berat",
                      kartu,
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-emerald-800 font-medium">Deskripsi</Label>
                <Input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className="h-10 rounded-xl bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200" placeholder="Keterangan pelanggaran" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">Batal</Button>
            <Button onClick={handleSave} className={buttonClasses}>{editing ? "Update" : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
