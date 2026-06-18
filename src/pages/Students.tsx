import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getLocalDate } from "@/lib/utils";
import { fetchStudents, createStudent, updateStudent, deleteStudent, uploadPhoto, deletePhoto, fetchParentStudentIds, fetchKelas, fetchPelanggaran } from "@/data/store";
import type { Student, Kelas, Pelanggaran } from "@/types";
import { toast } from "sonner";
import ModalTambahSantri from "@/components/ModalTambahSantri";
import ModalInputMassal from "@/components/ModalInputMassal";
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

const initialStudent: Student = {
  id: "",
  nis: "",
  name: "",
  kelas_id: "",
  alamat: "",
  phone: "",
  tanggal_masuk: getLocalDate(),
  created_at: "",
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [parentStudentIds, setParentStudentIds] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [pelanggaran, setPelanggaran] = useState<Pelanggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Student>(initialStudent);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [modalTambahOpen, setModalTambahOpen] = useState(false);
  const [modalMassalOpen, setModalMassalOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOrangtua = user?.role === "orangtua";
  const navigate = useNavigate();

  const navigateToPelanggaran = (studentId: string) => {
    navigate(`/pelanggaran?student=${studentId}`);
  };

  const getFillColor = (kartu: string) => {
    switch (kartu) {
      case "merah":
        return "bg-red-600 rounded-[2px] border border-red-700/60";
      case "oranye":
        return "bg-orange-500 rounded-[2px] border border-orange-600/60";
      default:
        return "bg-yellow-500 rounded-[2px] border border-yellow-600/60";
    }
  };

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
          (kelasList.find((k) => k.id === s.kelas_id)?.nama ?? "").toLowerCase().includes(q)
      );
    }
    if (kelasFilter && kelasFilter !== "all") {
      list = list.filter((s) => s.kelas_id === kelasFilter);
    }
    return list;
  }, [students, search, kelasFilter, isOrangtua, parentStudentIds]);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchKelas(), fetchPelanggaran()])
      .then(([s, k, p]) => {
        setStudents(s);
        setKelasList(k);
        setPelanggaran(p);
      })
      .finally(() => setLoading(false));
    if (isOrangtua) fetchParentStudentIds(user.id).then(setParentStudentIds);
  }, [isOrangtua, user]);

  const handleSave = async () => {
    // Validate required fields
    const requiredFields: { key: keyof Student; label: string }[] = [
      { key: "nis", label: "NIS" },
      { key: "name", label: "Nama" },
      { key: "kelas_id", label: "Kelas" },
      { key: "alamat", label: "Alamat" },
      { key: "phone", label: "Telepon" },
      { key: "tanggal_masuk", label: "Tanggal Masuk" },
    ];

    for (const field of requiredFields) {
      const value = editing[field.key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        toast.error(`Field "${field.label}" wajib diisi!`);
        // Focus the field
        const el = document.querySelector(`[data-field="${field.key}"]`) as HTMLInputElement;
        if (el) el.focus();
        return;
      }
    }

    setSaving(true);
    try {
      let photoUrl = editing.photo;

      // Upload foto baru kalau ada file yang dipilih
      if (photoFile) {
        const uploaded = await uploadPhoto(photoFile, "students");
        photoUrl = uploaded ?? undefined;
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

      const payload: Omit<Student, "id" | "created_at"> = {
        nis: editing.nis || "",
        name: editing.name || "",
        kelas_id: editing.kelas_id || "",
        alamat: editing.alamat || "",
        phone: editing.phone || "",
        tanggal_masuk: editing.tanggal_masuk,
        photo: photoUrl,
      };

      if (editing.id) {
        const saved = await updateStudent(editing.id, payload);
        setStudents((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        toast.success("Data santri berhasil diperbarui");
      } else {
        const saved = await createStudent(payload);
        setStudents((prev) => [saved, ...prev]);
        toast.success("Santri baru berhasil ditambahkan");
      }
      setDialogOpen(false);
      setEditing(initialStudent);
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

  // Handler untuk modal tambah santri
  const handleTambahSuccess = (student: Student) => {
    setStudents((prev) => [student, ...prev]);
  };

  // Handler untuk modal input massal
  const handleMassalSuccess = (newStudents: Student[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setPhotoPreview(s.photo ?? "");
    setPhotoFile(null);
    setDialogOpen(true);
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 2MB");
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-emerald-500 bg-emerald-100 rounded-xl">Memuat data santri...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Data Santri</h1>
            <p className="text-sm text-emerald-600 mt-0.5">
              {filtered.length} santri terdaftar
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                onClick={() => setModalTambahOpen(true)}
                className="bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20"
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Santri
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalMassalOpen(true)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Upload className="h-4 w-4 mr-1" /> Input Massal
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
            <Input
              placeholder="Cari nama, NIS, atau kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-emerald-200 bg-white/90"
            />
          </div>
          <Select value={kelasFilter} onValueChange={setKelasFilter}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-emerald-200">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="group rounded-xl border border-emerald-300 bg-gradient-to-b from-emerald-50 via-amber-50/60 to-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden max-w-[420px] w-full mx-auto"
            >
              {/* Header - Logo & Institution Name */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-10 w-10 rounded-full object-cover bg-white p-0.5 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-base tracking-wide leading-tight">MADIN AL-MUKTAMAR</h2>
                    <p className="text-emerald-200 text-xs leading-tight mt-0.5">Lirboyo Kota Kediri Jawa Timur</p>
                  </div>
                </div>
                {/* Secretariat line */}
                <div className="mt-1.5 bg-black/30 rounded px-2 py-0.5">
                  <p className="text-[10px] text-emerald-100 truncate">Sekretariat: Kantor Al-Muktamar Jl. H.M Winarto Lirboyo Kota Kediri</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

              {/* Body - Photo + Info */}
              <div className="p-4 flex gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {s.photo ? (
                    <img
                      src={s.photo}
                      alt={s.name}
                      className="h-[120px] w-[90px] rounded-md object-cover border-2 border-emerald-300 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-[120px] w-[90px] items-center justify-center rounded-md bg-gradient-to-b from-emerald-100 to-emerald-200 border-2 border-emerald-300 shadow-sm">
                      <User className="h-10 w-10 text-emerald-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5 text-[13px]">
                  <div className="grid grid-cols-[80px_10px_1fr] gap-0.5 leading-tight items-center">
                    <span className="font-bold text-emerald-800">Nama</span>
                    <span className="text-emerald-500 text-center">:</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-emerald-900 break-words leading-tight">{s.name}</span>
                      {(() => {
                        const studentPelanggaran = pelanggaran
                          .filter((p) => p.student_id === s.id)
                          .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                          .slice(0, 3);
                        if (studentPelanggaran.length === 0) return null;
                        return (
                          <div className="flex items-center flex-shrink-0" style={{ marginLeft: `${(studentPelanggaran.length - 1) * 4}px` }}>
                            {studentPelanggaran.map((p, idx) => (
                              <div
                                key={p.id}
                                className={`h-5 w-3.5 cursor-pointer ${getFillColor(p.kartu)}`}
                                style={{ 
                                  marginLeft: idx === 0 ? 0 : '-6px',
                                  transform: `rotate(${(idx - (studentPelanggaran.length - 1) / 2) * 8}deg)`,
                                  zIndex: studentPelanggaran.length - idx,
                                  position: 'relative'
                                }}
                                onClick={(e) => { e.stopPropagation(); navigateToPelanggaran(s.id); }}
                                title={`${p.kartu} - ${p.deskripsi}`}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <CardRow label="Stambuk" value={s.nis} />
                  <CardRow label="Kelas" value={kelasList.find((k) => k.id === s.kelas_id)?.nama ?? '-'} />
                  <CardRow label="Alamat" value={s.alamat || '-'} />
                  <CardRow label="Telepon" value={s.phone || '-'} />
                </div>
              </div>

              {/* Footer - Admin Actions */}
              {isAdmin && (
                <div className="flex gap-2 px-4 pb-3 pt-1 border-t border-emerald-200/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                    className="h-8 flex-1 text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleting(s); setDeleteOpen(true); }}
                    className="h-8 flex-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
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
            <Users className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-emerald-500 font-medium">Tidak ada data santri</p>
            <p className="text-sm text-emerald-400">Coba ubah filter pencarian</p>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detailStudent} onOpenChange={() => setDetailStudent(null)}>
          <DialogContent className="max-w-md rounded-2xl border-emerald-200 bg-white/90">
            {detailStudent && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Detail Santri</DialogTitle>
                  <DialogDescription className="text-emerald-600">Informasi lengkap data santri</DialogDescription>
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">{detailStudent.name}</h3>
                        {pelanggaran.some((p) => p.student_id === detailStudent.id) && (
                          <Badge className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 border-red-200 rounded-full px-2 py-1">
                            <span className="inline-block h-3 w-1.5 rounded-full bg-red-600" />
                            Pelanggar
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-emerald-600">NIS: {detailStudent.nis}</p>
                      <Badge className="mt-1 bg-teal-50 text-teal-700 border-teal-200">{kelasList.find((k) => k.id === detailStudent.kelas_id)?.nama ?? "-"}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 bg-gradient-to-br from-emerald-50/50 to-amber-50/50 rounded-xl p-4 border border-emerald-200/50">
                    <InfoRow icon={Phone} label="Telepon" value={detailStudent.phone} />
                    <InfoRow icon={MapPin} label="Alamat" value={detailStudent.alamat} />
                    <InfoRow icon={Calendar} label="Tanggal Masuk" value={detailStudent.tanggal_masuk} />
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto border-emerald-200 bg-white/90">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">{editing.id ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
              <DialogDescription className="text-emerald-600">
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
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100">
                      <User className="h-8 w-8 text-emerald-400" />
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
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Upload className="h-4 w-4" /> Upload Foto
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <p className="text-xs text-emerald-400">Maks. 2MB</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">NIS</Label>
                  <Input data-field="nis" value={editing.nis} onChange={(e) => setEditing({ ...editing, nis: e.target.value })} className="h-10 rounded-xl border-emerald-200" placeholder="2024001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Kelas</Label>
                  <Select data-field="kelas_id" value={editing.kelas_id} onValueChange={(v) => setEditing({ ...editing, kelas_id: v })}>
                    <SelectTrigger className="h-10 rounded-xl border-emerald-200">
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
                <Label className="text-xs text-emerald-600">Nama Lengkap</Label>
                <Input data-field="name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-10 rounded-xl border-emerald-200" placeholder="Nama siswa" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Telepon</Label>
                  <Input data-field="phone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="h-10 rounded-xl border-emerald-200" placeholder="0812..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-600">Tanggal Masuk</Label>
                  <Input data-field="tanggal_masuk" type="date" value={editing.tanggal_masuk} onChange={(e) => setEditing({ ...editing, tanggal_masuk: e.target.value })} className="h-10 rounded-xl border-emerald-200" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-600">Alamat</Label>
                <Input data-field="alamat" value={editing.alamat} onChange={(e) => setEditing({ ...editing, alamat: e.target.value })} className="h-10 rounded-xl border-emerald-200" placeholder="Alamat lengkap" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20"
                >
                  {saving ? "Menyimpan..." : editing.id ? "Simpan Perubahan" : "Tambah Siswa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="rounded-2xl border-emerald-200 bg-white/90">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-emerald-800">Hapus Data Siswa?</AlertDialogTitle>
              <AlertDialogDescription className="text-emerald-600">
                Anda akan menghapus data <strong>{deleting?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-500 hover:bg-red-600">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Tambah Santri */}
        <ModalTambahSantri
          open={modalTambahOpen}
          onOpenChange={setModalTambahOpen}
          kelasData={kelasList}
          onSuccess={handleTambahSuccess}
        />

        {/* Modal Input Massal */}
        <ModalInputMassal
          open={modalMassalOpen}
          onOpenChange={setModalMassalOpen}
          kelasData={kelasList}
          onSuccess={handleMassalSuccess}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
      <div>
        <p className="text-xs text-emerald-400">{label}</p>
        <p className="text-sm text-emerald-700">{value}</p>
      </div>
    </div>
  );
}

function CardRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[80px_10px_1fr] gap-0.5 leading-tight items-baseline">
      <span className={`font-semibold ${highlight ? 'text-emerald-800' : 'text-emerald-700'}`}>{label}</span>
      <span className="text-emerald-500 text-center">:</span>
      <span className={`font-semibold truncate ${highlight ? 'text-emerald-900' : 'text-emerald-800'}`}>{value}</span>
    </div>
  );
}