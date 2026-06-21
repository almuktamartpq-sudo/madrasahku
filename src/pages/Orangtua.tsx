import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, Users, User } from "lucide-react";
import { toast } from "sonner";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={className}>
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

export default function OrangtuaPage() {
  const { user } = useAuth();
  const { profiles, students, parentStudents, kelas, fetchAll, addParentStudent, deleteParentStudent } = useAppStore();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const isAdmin = user?.role === "admin";
  const canView = ["admin", "guru", "munawib"].includes(user?.role ?? "");

  const orangtuaProfiles = useMemo(
    () => profiles.filter((p) => p.role === "orangtua"),
    [profiles]
  );

  const filteredData = useMemo(() => {
    let list = orangtuaProfiles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.phone ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orangtuaProfiles, search]);

  useEffect(() => {
    fetchAll();
  }, []);

  const getStudentsForParent = (parentId: string) => {
    const relations = parentStudents.filter((ps) => ps.parent_id === parentId);
    return relations.map((r) => students.find((s) => s.id === r.student_id)).filter(Boolean);
  };

  const getParentStudentRelation = (parentId: string, studentId: string) => {
    return parentStudents.find((ps) => ps.parent_id === parentId && ps.student_id === studentId);
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find((k) => k.id === kelasId)?.nama ?? "-";
  };

  const handleAdd = async () => {
    if (!selectedParent || !selectedStudent) {
      toast.error("Pilih orang tua dan santri terlebih dahulu");
      return;
    }
    // Check if relation already exists
    if (getParentStudentRelation(selectedParent, selectedStudent)) {
      toast.error("Relasi orang tua dan santri ini sudah ada");
      return;
    }
    try {
      await addParentStudent(selectedParent, selectedStudent);
      toast.success("Relasi berhasil ditambahkan");
      setShowDialog(false);
      setSelectedParent("");
      setSelectedStudent("");
    } catch (err: any) {
      toast.error("Gagal menambahkan relasi", { description: err.message });
    }
  };

  const handleDelete = async (relationId: string, parentName: string, studentName: string) => {
    if (!confirm(`Hapus relasi ${parentName} - ${studentName}?`)) return;
    try {
      await deleteParentStudent(relationId);
      toast.success("Relasi berhasil dihapus");
    } catch (err: any) {
      toast.error("Gagal menghapus relasi", { description: err.message });
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const waNumber = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
    window.open(`https://wa.me/${waNumber}`, "_blank");
  };

  if (!canView) {
    return <div className="text-center py-16 text-emerald-600">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Orang Tua</h1>
            <p className="text-sm text-emerald-600 mt-1">Data orang tua santri dan nomor WhatsApp.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowDialog(true)} className="h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" /> Tambah Relasi
            </Button>
          )}
        </div>

        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                <input
                  placeholder="Cari nama atau nomor telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 rounded-xl border border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50 w-full px-3 text-sm"
                />
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-emerald-600">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-500" />
                <p>Tidak ada data orang tua.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredData.map((parent) => {
                  const parentStudentsList = getStudentsForParent(parent.id);
                  return (
                    <div key={parent.id} className="rounded-2xl border border-emerald-200 p-4 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-amber-100">
                              <User className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-900">{parent.name}</h3>
                              <p className="text-xs text-emerald-600">{parent.email}</p>
                            </div>
                          </div>

                          {parent.phone && (
                            <button
                              onClick={() => openWhatsApp(parent.phone!)}
                              className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                              {parent.phone}
                            </button>
                          )}

                          {parentStudentsList.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {parentStudentsList.map((student: any) => {
                                const relation = getParentStudentRelation(parent.id, student.id);
                                return (
                                  <div key={student.id} className="flex items-center gap-2">
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                      {isAdmin ? `${student.name} (${getKelasName(student.kelas_id)})` : student.name}
                                    </Badge>
                                    {isAdmin && relation && (
                                      <button
                                        onClick={() => handleDelete(relation.id, parent.name, student.name)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {parentStudentsList.length === 0 && (
                            <p className="text-xs text-emerald-500 mt-2 italic">Belum ada santri terkait</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Tambah Relasi Orang Tua - Santri</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-900">Orang Tua</label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50">
                    <SelectValue placeholder="Pilih orang tua" />
                  </SelectTrigger>
                  <SelectContent>
                    {orangtuaProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-emerald-700">
                        {p.name} {p.phone ? `(${p.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-900">Santri</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-emerald-50/50">
                    <SelectValue placeholder="Pilih santri" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-emerald-700">
                        {isAdmin ? `${s.name} (${getKelasName(s.kelas_id)})` : s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                Batal
              </Button>
              <Button onClick={handleAdd} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg">
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}