import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchStudents, createStudent, updateStudent, deleteStudent, uploadPhoto, deletePhoto, fetchParentStudentIds, fetchKelas } from "@/data/store";
import type { Student, KelasItem } from "@/types";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  X,
  Phone,
  MapPin,
  Calendar,
  Users,
  User,
  School,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyStudent: Student = {
  id: "",
  nis: "",
  name: "",
  kelasId: "",
  alamat: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  tanggalMasuk: new Date().toISOString().split("T")[0],
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Student>(emptyStudent);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const isAdmin = user?.role === "admin";
  const isOrangtua = user?.role === "orangtua";

  const filtered = useMemo(() => {
    let list = students;
    if (isOrangtua && parentStudentIds.length > 0) {
      list = list.filter((s) => parentStudentIds.includes(s.id));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          (s.kelas ?? "").toLowerCase().includes(q)
      );
    }
    if (kelasFilter && kelasFilter !== "all") {
      list = list.filter((s) => s.kelasId === kelasFilter);
    }
    return list;
  }, [students, search, kelasFilter, isOrangtua, parentStudentIds]);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchKelas()])
      .then(([s, k]) => {
        setStudents(s);
        setKelasList(k);
      })
      .finally(() => setLoading(false));
    if (isOrangtua) fetchParentStudentIds(user.id).then(setParentStudentIds);
  }, [isOrangtua, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let photoUrl = editing.photo;

      // Upload foto baru kalau ada file yang dipilih
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, "students");
        // Hapus foto lama dari storage kalau ada
        if (editing.photo && editing.photo !== photoUrl) {
          await deletePhoto(editing.photo);
        }
      } else if (photoPreview && photoPreview !== editing.photo) {
        // photoPreview di-clear (tombol X), hapus foto lama
        if (editing.photo) {
          await deletePhoto(editing.photo);
          photoUrl = undefined;
        }
      }

      const payload = { ...editing, photo: photoUrl };
      if (editing.id) {
        const saved = await updateStudent(payload);
        setStudents((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        toast.success("Data santri berhasil diperbarui");
      } else {
        const saved = await createStudent(payload);
        setStudents((prev) => [saved, ...prev]);
        toast.success("Santri baru berhasil ditambahkan");
      }
      setDialogOpen(false);
      setEditing(emptyStudent);
      setPhotoPreview("");
      setPhotoFile(null);
    } catch (err) {
      toast.error("Gagal menyimpan data santri", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      if (deleting.photo) {
        await deletePhoto(deleting.photo);
      }
      await deleteStudent(deleting.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success(`Data ${deleting.name} berhasil dihapus`);
    } catch (err) {
      toast.error("Gagal menghapus data santri", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setDeleteOpen(false);
      setDeleting(null);
    }
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setPhotoPreview(s.photo ?? "");
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditing(emptyStudent);
    setPhotoPreview("");
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500">Memuat data santri...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Santri</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} santri terdaftar
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openAdd}
            className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Santri
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, NIS, atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
          />
        </div>
        <Select value={kelasFilter} onValueChange={setKelasFilter}>
          <SelectTrigger className="h-10 w-[180px] rounded-xl">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {kelasList.map((k) => (
              <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setDetailStudent(s)}
            className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700/10 to-emerald-600/10">
                    <User className="h-6 w-6 text-emerald-700/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{s.name}</h3>
                <p className="text-xs text-slate-500">{s.nis}</p>
                <Badge variant="secondary" className="mt-1.5 text-xs bg-teal-50 text-teal-700 border-teal-200">
                  {s.kelas ?? "-"}
                </Badge>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                  className="h-8 flex-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setDeleting(s); setDeleteOpen(true); }}
                  className="h-8 flex-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Hapus
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Tidak ada data santri</p>
          <p className="text-sm text-slate-400">Coba ubah filter pencarian</p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailStudent} onOpenChange={() => setDetailStudent(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {detailStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Detail Santri</DialogTitle>
                <DialogDescription>Informasi lengkap data santri</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {detailStudent.photo ? (
                    <img src={detailStudent.photo} alt={detailStudent.name} className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700/10 to-emerald-600/10">
                      <User className="h-10 w-10 text-emerald-700/30" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{detailStudent.name}</h3>
                    <p className="text-sm text-slate-500">NIS: {detailStudent.nis}</p>
                    <Badge className="mt-1 bg-teal-50 text-teal-700 border-teal-200">{detailStudent.kelas ?? "-"}</Badge>
                  </div>
                </div>
                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                  <InfoRow icon={Phone} label="Telepon" value={detailStudent.phone} />
                  <InfoRow icon={MapPin} label="Alamat" value={detailStudent.alamat} />
                  <InfoRow icon={Calendar} label="Tanggal Masuk" value={detailStudent.tanggalMasuk} />
                  <InfoRow icon={Users} label="Nama Orang Tua" value={detailStudent.parentName} />
                  <InfoRow icon={Phone} label="Telepon Orang Tua" value={detailStudent.parentPhone} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
            <DialogDescription>
              {editing.id ? "Perbarui data siswa" : "Isi data untuk menambahkan siswa baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                    <User className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                {photoPreview && (
                  <button
                    onClick={() => setPhotoPreview("")}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Upload className="h-4 w-4" /> Upload Foto
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">NIS</Label>
                <Input value={editing.nis} onChange={(e) => setEditing({ ...editing, nis: e.target.value })} className="h-10 rounded-xl" placeholder="2024001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Kelas</Label>
                <Select value={editing.kelasId} onValueChange={(v) => setEditing({ ...editing, kelasId: v })}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {kelasList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Nama Lengkap</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-10 rounded-xl" placeholder="Nama siswa" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Telepon</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="h-10 rounded-xl" placeholder="0812..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Tanggal Masuk</Label>
                <Input type="date" value={editing.tanggalMasuk} onChange={(e) => setEditing({ ...editing, tanggalMasuk: e.target.value })} className="h-10 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Alamat</Label>
              <Input value={editing.alamat} onChange={(e) => setEditing({ ...editing, alamat: e.target.value })} className="h-10 rounded-xl" placeholder="Alamat lengkap" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Nama Orang Tua</Label>
                <Input value={editing.parentName} onChange={(e) => setEditing({ ...editing, parentName: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Telepon Orang Tua</Label>
                <Input value={editing.parentPhone} onChange={(e) => setEditing({ ...editing, parentPhone: e.target.value })} className="h-10 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl">
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white"
              >
                {saving ? "Menyimpan..." : editing.id ? "Simpan Perubahan" : "Tambah Siswa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus data <strong>{deleting?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}
