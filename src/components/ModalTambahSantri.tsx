import { useState } from "react";
import { getLocalDate } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as api from "@/data/api";
import type { Student, Kelas } from "@/types";

interface StudentInput {
  nis: string;
  name: string;
  alamat: string;
  phone: string;
  tanggal_masuk: string;
  kelas_id: string | null;
}

interface ModalTambahSantriProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelasData: Kelas[];
  onSuccess: (student: Student) => void;
}

const initialInput: StudentInput = {
  nis: "",
  name: "",
  alamat: "",
  phone: "",
  tanggal_masuk: getLocalDate(),
  kelas_id: null,
};

export default function ModalTambahSantri({
  open,
  onOpenChange,
  kelasData,
  onSuccess,
}: ModalTambahSantriProps) {
  const [form, setForm] = useState<StudentInput>(initialInput);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validasi field wajib
    const required: { key: keyof StudentInput; label: string }[] = [
      { key: "nis", label: "NIS" },
      { key: "name", label: "Nama Lengkap" },
      { key: "alamat", label: "Alamat" },
      { key: "phone", label: "No. HP" },
      { key: "tanggal_masuk", label: "Tanggal Masuk" },
    ];

    for (const field of required) {
      const value = form[field.key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        toast.error(`Field "${field.label}" wajib diisi!`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Omit<Student, "id" | "created_at"> = {
        nis: form.nis.trim(),
        name: form.name.trim(),
        alamat: form.alamat.trim(),
        phone: form.phone.trim(),
        tanggal_masuk: form.tanggal_masuk,
        kelas_id: form.kelas_id || "",
      };

      const saved = await api.createStudent(payload);
      toast.success(`Santri "${saved.name}" berhasil ditambahkan`);
      onSuccess(saved);
      setForm(initialInput);
      onOpenChange(false);
    } catch (err) {
      toast.error("Gagal menambahkan santri", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(initialInput);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto border-emerald-200 bg-white/95">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">
            Tambah Santri Baru
          </DialogTitle>
          <DialogDescription className="text-emerald-600">
            Isi data santri dengan lengkap dan benar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">
                NIS <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                className="h-10 rounded-xl border-emerald-200"
                placeholder="2024001"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Kelas</Label>
              <Select
                value={form.kelas_id || ""}
                onValueChange={(v) => setForm({ ...form, kelas_id: v || null })}
              >
                <SelectTrigger className="h-10 rounded-xl border-emerald-200">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {kelasData.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-600">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 rounded-xl border-emerald-200"
              placeholder="Nama lengkap santri"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">
                No. HP <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 rounded-xl border-emerald-200"
                placeholder="0812..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">
                Tanggal Masuk <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.tanggal_masuk}
                onChange={(e) =>
                  setForm({ ...form, tanggal_masuk: e.target.value })
                }
                className="h-10 rounded-xl border-emerald-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-600">
              Alamat <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className="h-10 rounded-xl border-emerald-200"
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20"
            >
              {saving ? "Menyimpan..." : "Tambah Santri"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
