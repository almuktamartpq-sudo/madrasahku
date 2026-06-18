import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserCheck, Search, Edit } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={className}>
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

export default function GuruPage() {
  const { user } = useAuth();
  const { profiles, kelas, fetchAll } = useAppStore();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Profile | null>(null);
  const [formKelasId, setFormKelasId] = useState<string>("");

  const isAdmin = user?.role === "admin";
  const isOrangtua = user?.role === "orangtua";

  useEffect(() => {
    fetchAll();
  }, []);

  const guruList = useMemo(() => {
    let list = profiles.filter((p) => p.role === "guru");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles, search]);

  const openEdit = (guru: Profile) => {
    setEditingGuru(guru);
    setFormKelasId(guru.kelas_id || "none");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingGuru) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("profiles")
        .update({
          kelas_id: formKelasId === "none" ? null : formKelasId || null,
        })
        .eq("id", editingGuru.id);
      if (error) throw error;
      toast.success("Data guru berhasil diupdate");
      setShowDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal menyimpan", { description: err.message });
    }
  };

  const getKelasName = (kelasId?: string) => {
    if (!kelasId) return "-";
    return kelas.find((k) => k.id === kelasId)?.nama || "-";
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const waNumber = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
    window.open(`https://wa.me/${waNumber}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">
            {isOrangtua ? "Guru" : "Data Guru"}
          </h1>
        </div>

        {/* Search */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <Input
                placeholder="Cari nama guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Guru List */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            {guruList.length === 0 ? (
              <div className="text-center py-12 text-emerald-700">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                <p>Belum ada data guru</p>
              </div>
            ) : isOrangtua ? (
              <div className="space-y-2">
                {guruList.map((guru) => (
                  <div key={guru.id} className="flex items-center justify-between p-4 border border-emerald-200 rounded-xl hover:bg-emerald-50/50 transition-colors">
                    <p className="font-medium text-emerald-900">{guru.name}</p>
                    {guru.phone && (
                      <button
                        onClick={() => openWhatsApp(guru.phone!)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        {guru.phone}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {guruList.map((guru) => (
                  <div key={guru.id} className="flex items-center gap-3 p-3 border border-emerald-200 rounded-lg hover:bg-emerald-50/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      guru.avatar ? "bg-gradient-to-br from-emerald-500 to-amber-500" : "bg-emerald-500"
                    }`}>
                      {guru.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-emerald-900">{guru.name}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                          {getKelasName(guru.kelas_id)}
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-600 truncate">{guru.email}</p>
                      {guru.phone && <p className="text-xs text-emerald-600">{guru.phone}</p>}
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 border-emerald-200" onClick={() => openEdit(guru)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Edit Data Guru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingGuru && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-r from-emerald-500 to-amber-500">
                    {editingGuru.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">{editingGuru.name}</p>
                    <p className="text-xs text-emerald-600">{editingGuru.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-emerald-900">Kelas</Label>
                <Select value={formKelasId} onValueChange={setFormKelasId}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-emerald-700">Tidak ada kelas</SelectItem>
                    {kelas.map((k) => (
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