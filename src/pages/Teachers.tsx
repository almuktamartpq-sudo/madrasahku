import { useState, useMemo, useEffect } from "react";
import { fetchTeachers, createTeacher, updateTeacher, deleteTeacher, uploadPhoto, deletePhoto, fetchKelas, fetchGuruProfiles } from "@/data/store";
import type { Teacher, KelasItem } from "@/types";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  X,
  Phone,
  Mail,
  BookOpen,
  UserCheck,
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

const emptyTeacher: Teacher = {
  id: "",
  name: "",
  kelasId: "",
  phone: "",
  email: "",
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher>(emptyTeacher);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [guruProfiles, setGuruProfiles] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const filtered = useMemo(() => {
    if (!search) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.kelas ?? "").toLowerCase().includes(q)
    );
  }, [teachers, search]);

  useEffect(() => {
    Promise.all([fetchTeachers(), fetchKelas(), fetchGuruProfiles()])
      .then(([t, k, p]) => { setTeachers(t); setKelasList(k); setGuruProfiles(p); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const missing: string[] = [];
    if (!editing.name.trim()) missing.push("Nama Lengkap");
    if (!editing.phone.trim()) missing.push("Telepon");
    if (!editing.email.trim()) missing.push("Email");
    if (missing.length > 0) {
      toast.error("Field wajib belum diisi", { description: missing.join(", ") });
      return;
    }

    setSaving(true);
    try {
      let photoUrl = editing.photo;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, "teachers");
        if (editing.photo && editing.photo !== photoUrl) await deletePhoto(editing.photo);
      } else if (photoPreview && photoPreview !== editing.photo) {
        if (editing.photo) { await deletePhoto(editing.photo); photoUrl = undefined; }
      }

      const payload = { ...editing, photo: photoUrl };
      if (editing.id) {
        const saved = await updateTeacher(payload);
        setTeachers((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        toast.success("Data guru berhasil diperbarui");
      } else {
        const saved = await createTeacher(payload);
        setTeachers((prev) => [saved, ...prev]);
        toast.success("Guru baru berhasil ditambahkan");
      }
      setDialogOpen(false);
      setEditing(emptyTeacher);
      setPhotoPreview("");
      setPhotoFile(null);
    } catch (err) {
      toast.error("Gagal menyimpan data guru", { description: err instanceof Error ? err.message : "Terjadi kesalahan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      if (deleting.photo) await deletePhoto(deleting.photo);
      await deleteTeacher(deleting.id);
      setTeachers((prev) => prev.filter((t) => t.id !== deleting.id));
      toast.success(`Data ${deleting.name} berhasil dihapus`);
    } catch (err) {
      toast.error("Gagal menghapus data guru", { description: err instanceof Error ? err.message : "Terjadi kesalahan" });
    } finally {
      setDeleteOpen(false);
      setDeleting(null);
    }
  };

  const openEdit = (t: Teacher) => { setEditing(t); setPhotoPreview(t.photo ?? ""); setPhotoFile(null); setDialogOpen(true); };
  const openAdd = () => { setEditing(emptyTeacher); setPhotoPreview(""); setPhotoFile(null); setDialogOpen(true); };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-500">Memuat data guru...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Guru</h1>
          <p className="text-sm text-slate-500 mt-0.5">{teachers.length} guru terdaftar</p>
        </div>
        <Button onClick={openAdd} className="h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 transition-all">
          <Plus className="h-4 w-4 mr-2" /> Tambah Guru
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Cari nama atau kelas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl border-slate-200 bg-white" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((t) => (
          <div key={t.id} onClick={() => setDetailTeacher(t)} className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-200">
                    <UserCheck className="h-6 w-6 text-teal-600/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{t.name.replace(", S.Pd.", "").replace(", S.Kom.", "")}</h3>
                <Badge variant="secondary" className="mt-1.5 text-xs bg-amber-50 text-amber-700 border-amber-200">{t.kelas ?? "-"}</Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(t); }} className="h-8 flex-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(t); setDeleteOpen(true); }} className="h-8 flex-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-3 w-3 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Tidak ada data guru</p>
        </div>
      )}

      <Dialog open={!!detailTeacher} onOpenChange={() => setDetailTeacher(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {detailTeacher && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Detail Guru</DialogTitle>
                <DialogDescription>Informasi lengkap data guru</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {detailTeacher.photo ? (
                    <img src={detailTeacher.photo} alt={detailTeacher.name} className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
                      <UserCheck className="h-10 w-10 text-teal-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{detailTeacher.name}</h3>
                    <Badge className="mt-1 bg-amber-50 text-amber-700 border-amber-200">{detailTeacher.kelas ?? "-"}</Badge>
                  </div>
                </div>
                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                  <InfoRow icon={Mail} label="Email" value={detailTeacher.email} />
                  <InfoRow icon={Phone} label="Telepon" value={detailTeacher.phone} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Guru" : "Tambah Guru Baru"}</DialogTitle>
            <DialogDescription>{editing.id ? "Perbarui data guru" : "Isi data untuk menambahkan guru baru"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                    <UserCheck className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                {photoPreview && (
                  <button onClick={() => setPhotoPreview("")} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center">
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

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Kelas</Label>
              <Select value={editing.kelasId} onValueChange={(v) => setEditing({ ...editing, kelasId: v })}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {kelasList.map((k) => (<SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Akun Guru (Email)</Label>
              <Select value={editing.profileId ?? ""} onValueChange={(v) => {
                const profile = guruProfiles.find((p) => p.id === v);
                if (profile) {
                  setEditing({ ...editing, profileId: profile.id, email: profile.email, name: editing.name || profile.name });
                }
              }}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih akun guru" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {guruProfiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Pilih akun guru yang sudah terdaftar di menu Pengguna</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Telepon</Label>
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="h-10 rounded-xl" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 h-10 rounded-xl">Batal</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                {saving ? "Menyimpan..." : editing.id ? "Simpan" : "Tambah Guru"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Guru?</AlertDialogTitle>
            <AlertDialogDescription>Anda akan menghapus data <strong>{deleting?.name}</strong>. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction>
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
