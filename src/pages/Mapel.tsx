import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Mapel } from "@/types";

export default function MapelPage() {
  const { mapel, kelas, fetchAll } = useAppStore();
  const [showDialog, setShowDialog] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formKelasId, setFormKelasId] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditingMapel(null);
    setFormNama("");
    setFormKelasId(kelas[0]?.id || "");
    setShowDialog(true);
  };

  const openEdit = (m: Mapel) => {
    setEditingMapel(m);
    setFormNama(m.nama);
    setFormKelasId(m.kelas_id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formNama || !formKelasId) { toast.error("Lengkapi semua field"); return; }
    try {
      if (editingMapel) {
        await api.updateMapel(editingMapel.id, { nama: formNama, kelas_id: formKelasId });
        toast.success("Mapel berhasil diupdate");
      } else {
        await api.createMapel({ nama: formNama, kelas_id: formKelasId });
        toast.success("Mapel berhasil ditambahkan");
      }
      setShowDialog(false);
      fetchAll();
    } catch (err: any) { toast.error("Gagal menyimpan", { description: err.message }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus mapel ini?")) return;
    try {
      await api.deleteMapel(id);
      toast.success("Mapel dihapus");
      fetchAll();
    } catch (err: any) { toast.error("Gagal menghapus", { description: err.message }); }
  };

  // Group mapel by kelas, sorted by urutan
  const groupedMapel = useMemo(() => {
    const sortedKelas = [...kelas].sort((a, b) => a.urutan - b.urutan);
    return sortedKelas.map((k) => ({
      kelas: k,
      items: mapel
        .filter((m) => m.kelas_id === k.id)
        .sort((a, b) => a.nama.localeCompare(b.nama)),
    })).filter((g) => g.items.length > 0);
  }, [mapel, kelas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Mata Pelajaran</h1>
          <Button className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Tambah Mapel</Button>
        </div>
        {mapel.length === 0 ? (
          <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-12 text-emerald-700">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                <p>Belum ada data mata pelajaran</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedMapel.map(({ kelas: k, items }) => (
              <Card key={k.id} className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-emerald-800">{k.nama}</h2>
                    <span className="text-xs text-emerald-500 ml-auto">{items.length} mapel</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-200 bg-emerald-50/50">
                          <th className="text-center py-2.5 px-3 font-medium text-emerald-900 w-12">No</th>
                          <th className="text-left py-2.5 px-3 font-medium text-emerald-900">Mata Pelajaran</th>
                          <th className="text-center py-2.5 px-3 font-medium text-emerald-900 w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((m, idx) => (
                          <tr key={m.id} className="border-b border-emerald-100 hover:bg-emerald-50/30 transition-colors last:border-0">
                            <td className="py-2.5 px-3 text-center text-emerald-500 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-emerald-800">{m.nama}</td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800" onClick={() => openEdit(m)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-800" onClick={() => handleDelete(m.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">{editingMapel ? "Edit Mapel" : "Tambah Mapel"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-emerald-900">Nama Mata Pelajaran</Label>
                <Input value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Contoh: Al-Quran" className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-900">Kelas</Label>
                <Select value={formKelasId} onValueChange={setFormKelasId}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {[...kelas].sort((a, b) => a.urutan - b.urutan).map((k) => (
                      <SelectItem key={k.id} value={k.id} className="text-emerald-700">{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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