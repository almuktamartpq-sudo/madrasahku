import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
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
import { Library, Plus, Edit, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import type { Kelas } from "@/types";

export default function KelasPage() {
  const { kelas, fetchAll, updateKelas, deleteKelas } = useAppStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formNama, setFormNama] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditingKelas(null);
    setFormNama("");
    setShowDialog(true);
  };

  const openEdit = (k: Kelas) => {
    setEditingKelas(k);
    setFormNama(k.nama);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formNama) { toast.error("Nama kelas wajib diisi"); return; }
    try {
      if (editingKelas) {
        await api.updateKelas(editingKelas.id, { nama: formNama });
        toast.success("Kelas berhasil diupdate");
      } else {
        await api.createKelas({ nama: formNama, urutan: kelas.length });
        toast.success("Kelas berhasil ditambahkan");
      }
      setShowDialog(false);
      fetchAll();
    } catch (err: any) { toast.error("Gagal menyimpan", { description: err.message }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kelas ini?")) return;
    try {
      await api.deleteKelas(id);
      toast.success("Kelas dihapus");
      fetchAll();
    } catch (err: any) { toast.error("Gagal menghapus", { description: err.message }); }
  };

  const moveKelas = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = kelas.findIndex((k) => k.id === id);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= kelas.length) return;

    const current = kelas[currentIndex];
    const next = kelas[nextIndex];

    try {
      await Promise.all([
        api.updateKelas(current.id, { urutan: next.urutan }),
        api.updateKelas(next.id, { urutan: current.urutan }),
      ]);
      toast.success(`Kelas ${direction === 'up' ? 'naik' : 'turun'} urutan`);
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal memperbarui urutan", { description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">Kelas</h1>
          <Button className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Tambah Kelas</Button>
        </div>
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            {kelas.length === 0 ? (
              <div className="text-center py-12 text-emerald-700">
                <Library className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                <p>Belum ada data kelas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...kelas].sort((a, b) => a.urutan - b.urutan).map((k, index) => (
                  <div key={k.id} className="flex items-center gap-3 p-3 border border-emerald-200 rounded-lg hover:bg-emerald-50/50 transition-colors">
                    <GripVertical className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">{k.nama}</p>
                      <p className="text-xs text-emerald-600">Urutan: {k.urutan}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveKelas(k.id, 'up')}
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === kelas.length - 1}
                        onClick={() => moveKelas(k.id, 'down')}
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200" onClick={() => openEdit(k)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-800 border-red-200" onClick={() => handleDelete(k.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">{editingKelas ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-emerald-900">Nama Kelas</Label>
                <Input value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Contoh: Kelas 1" className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white" onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

