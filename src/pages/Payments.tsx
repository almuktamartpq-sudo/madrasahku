import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Search, CheckCircle, Zap, Edit, Trash2, Power, Users } from "lucide-react";
import { toast } from "sonner";
import type { PaymentType } from "@/types";
import { getCrudEnabled } from "@/pages/Settings";

export default function Payments() {
  const { user } = useAuth();
  const { students, payments, paymentTypes, fetchAll } = useAppStore();
  const isAdmin = user?.role === "admin" && getCrudEnabled("payments");
  const [activeTab, setActiveTab] = useState<"types" | "students">(isAdmin ? "types" : "students");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Payment Type CRUD
  const cardClasses = "bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 border-emerald-200/60 shadow-lg hover:shadow-xl transition-all duration-300";
  const buttonClasses = "bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300";
  const gradientText = "gradient-text";
  const gradientTextDark = "gradient-text";

  // Payment Type CRUD
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState<PaymentType | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formJumlah, setFormJumlah] = useState("");

  // Activate confirmation
  const [activateTarget, setActivateTarget] = useState<PaymentType | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  // Payment type CRUD handlers
  const openAddType = () => {
    setEditingType(null);
    setFormNama("");
    setFormJumlah("");
    setShowTypeDialog(true);
  };

  const openEditType = (pt: PaymentType) => {
    setEditingType(pt);
    setFormNama(pt.nama);
    setFormJumlah(pt.jumlah.toString());
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (!formNama || !formJumlah) { toast.error("Lengkapi semua field"); return; }
    try {
      if (editingType) {
        await api.updatePaymentType(editingType.id, { nama: formNama, jumlah: Number(formJumlah) });
        toast.success("Jenis pembayaran diupdate");
      } else {
        await api.createPaymentType({ nama: formNama, jumlah: Number(formJumlah), is_active: false });
        toast.success("Jenis pembayaran ditambahkan");
      }
      setShowTypeDialog(false);
      fetchAll();
    } catch (err: any) { toast.error("Gagal menyimpan", { description: err.message }); }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Hapus jenis pembayaran ini?")) return;
    try {
      await api.deletePaymentType(id);
      toast.success("Jenis pembayaran dihapus");
      fetchAll();
    } catch (err: any) { toast.error("Gagal menghapus", { description: err.message }); }
  };

  // Activate handler
  const handleActivate = async () => {
    if (!activateTarget) return;
    try {
      const count = await api.activatePaymentType(activateTarget.id);
      toast.success(`${count} tagihan baru dibuat untuk semua santri`);
      setShowActivateDialog(false);
      setActivateTarget(null);
      fetchAll();
    } catch (err: any) { toast.error("Gagal mengaktifkan", { description: err.message }); }
  };

  // Mark student paid
  const handleMarkPaid = async (paymentId: string) => {
    try {
      await api.markStudentPaid(paymentId);
      toast.success("Pembayaran ditandai lunas");
      fetchAll();
    } catch (err: any) { toast.error("Gagal update", { description: err.message }); }
  };

  // Mark all paid for selected type
  const handleMarkAllPaid = async () => {
    if (!selectedType) return;
    try {
      await api.markAllPaidForType(selectedType);
      toast.success("Semua santri ditandai lunas");
      fetchAll();
    } catch (err: any) { toast.error("Gagal update", { description: err.message }); }
  };

  // Filter payments by selected type
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (selectedType) {
      result = result.filter((p) => p.type === selectedType);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const student = students.find((s) => s.id === p.student_id);
        return student?.name.toLowerCase().includes(q);
      });
    }
    return result.sort((a, b) => {
      const sa = students.find((s) => s.id === a.student_id)?.name || "";
      const sb = students.find((s) => s.id === b.student_id)?.name || "";
      return sa.localeCompare(sb);
    });
  }, [payments, students, selectedType, search]);

  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const lunas = filteredPayments.filter((p) => p.status === "lunas").length;
    const belum = total - lunas;
    return { total, lunas, belum };
  }, [filteredPayments]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const getStudentName = (studentId: string) => students.find((s) => s.id === studentId)?.name || "Unknown";

  const selectedPaymentType = paymentTypes.find((pt) => pt.nama === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
      <h1 className={`text-3xl font-bold ${gradientText}`}>Pembayaran</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-emerald-200/30">
        {isAdmin && (
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-all duration-300 ${
              activeTab === "types" 
                ? "border-emerald-500 text-emerald-700 bg-gradient-to-r from-emerald-100/50 to-amber-100/50" 
                : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50/30"
            }`}
            onClick={() => setActiveTab("types")}
          >
            <CreditCard className="inline h-4 w-4 mr-1" /> Jenis Pembayaran
          </button>
        )}
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-all duration-300 ${
            activeTab === "students" 
              ? "border-emerald-500 text-emerald-700 bg-gradient-to-r from-emerald-100/50 to-amber-100/50" 
              : "border-transparent text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50/30"
          }`}
          onClick={() => setActiveTab("students")}
        >
          <Users className="inline h-4 w-4 mr-1" /> Tagihan Santri
        </button>
      </div>

      {/* ==================== TAB: JENIS PEMBAYARAN ==================== */}
      {activeTab === "types" && (
        <>
          <div className="flex justify-end">
            {isAdmin && <Button onClick={openAddType} className={buttonClasses}><Plus className="mr-2 h-4 w-4" /> Tambah Jenis</Button>}
          </div>
          <Card className={cardClasses}>
            <CardContent className="pt-6">
              {paymentTypes.length === 0 ? (
                <div className="text-center py-12 text-emerald-600/70">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-emerald-400/50" />
                  <p className="text-emerald-600/80">Belum ada jenis pembayaran</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentTypes.map((pt) => {
                    const paymentCount = payments.filter((p) => p.type === pt.nama).length;
                    const lunasCount = payments.filter((p) => p.type === pt.nama && p.status === "lunas").length;
                    return (
                      <div key={pt.id} className="flex items-center gap-3 p-4 border border-emerald-200/40 rounded-xl bg-white/60 hover:bg-emerald-50/30 hover:border-emerald-300/60 transition-all duration-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-emerald-800">{pt.nama}</p>
                            {pt.is_active ? (
                              <Badge className="bg-gradient-to-r from-emerald-100 to-amber-100 text-emerald-800 border-emerald-300">Aktif</Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-300 text-amber-700">Belum Aktif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-emerald-600/70">
                            <span className="font-medium">{formatCurrency(Number(pt.jumlah))}</span> &middot; <span className="font-semibold text-amber-600">{lunasCount}/{paymentCount}</span> lunas
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {isAdmin && !pt.is_active && (
                            <Button
                              size="sm"
                              className={buttonClasses}
                              onClick={() => { setActivateTarget(pt); setShowActivateDialog(true); }}
                            >
                              <Zap className="h-3 w-3 mr-1" /> Aktifkan
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 hover:text-emerald-700 transition-colors duration-200" onClick={() => openEditType(pt)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-700 transition-colors duration-200" onClick={() => handleDeleteType(pt.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ==================== TAB: TAGIHAN SANTRI ==================== */}
      {activeTab === "students" && (
        <>
          {/* Filters */}
          <Card className={cardClasses}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama santri..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white/80 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 transition-colors duration-200"
                  />
                </div>
                <select
                  className="border border-emerald-300 rounded-md px-3 py-2 text-sm bg-white/80 focus:border-emerald-400 focus:ring-emerald-200 transition-colors duration-200"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Semua Jenis</option>
                  {paymentTypes.map((pt) => (
                    <option key={pt.id} value={pt.nama}>{pt.nama}</option>
                  ))}
                </select>
                {isAdmin && selectedType && stats.belum > 0 && (
                  <Button variant="outline" onClick={handleMarkAllPaid} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors duration-200">
                    <CheckCircle className="mr-2 h-4 w-4" /> Lunaskan Semua ({stats.belum})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className={cardClasses}><CardContent className="pt-4 text-center">
              <div className={`text-2xl font-bold ${gradientText}`}>{stats.total}</div>
              <p className="text-xs text-emerald-600/70">Total Tagihan</p>
            </CardContent></Card>
            <Card className={cardClasses}><CardContent className="pt-4 text-center">
              <div className={`text-2xl font-bold ${gradientText}`}>{stats.lunas}</div>
              <p className="text-xs text-emerald-600/70">Lunas</p>
            </CardContent></Card>
            <Card className={cardClasses}><CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.belum}</div>
              <p className="text-xs text-emerald-600/70">Belum Lunas</p>
            </CardContent></Card>
          </div>

          {/* Student Payment List */}
          <Card className={cardClasses}>
            <CardContent className="pt-6">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-emerald-600/70">
                  <p className="text-emerald-600/80">Tidak ada data tagihan</p>
                  {paymentTypes.length > 0 && !paymentTypes.some((pt) => pt.is_active) && (
                    <p className="text-sm mt-2 text-amber-600">Aktifkan jenis pembayaran terlebih dahulu</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPayments.map((p) => {
                    const isLunas = p.status === "lunas";
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 border border-emerald-200/40 rounded-xl ${isLunas ? "bg-gradient-to-r from-emerald-50/30 to-amber-50/30" : "bg-white/60"} hover:bg-emerald-50/40 transition-all duration-300`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                          isLunas ? "bg-gradient-to-r from-emerald-500 to-amber-500" : "bg-gradient-to-r from-red-500 to-amber-500"
                        }`}>
                          {isLunas ? <CheckCircle className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-emerald-800">{getStudentName(p.student_id)}</p>
                          <div className="flex gap-2 text-xs text-emerald-600/70">
                            <span className="font-medium">{p.type}</span>
                            <span>&middot;</span>
                            <span className="font-semibold">{formatCurrency(Number(p.amount))}</span>
                            {p.bulan && p.tahun && (
                              <><span>&middot;</span><span className="text-amber-600">Bln {p.bulan}/{p.tahun}</span></>
                            )}
                          </div>
                        </div>
                        {isLunas ? (
                          <Badge className="bg-gradient-to-r from-emerald-100 to-amber-100 text-emerald-800 border-emerald-300">
                            <CheckCircle className="h-3 w-3 mr-1" /> Lunas
                          </Badge>
                        ) : isAdmin ? (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              className={buttonClasses}
                              onClick={() => handleMarkPaid(p.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Lunas
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await api.deletePayment(p.id);
                                  fetchAll();
                                  toast.success("Pembayaran dihapus");
                                } catch (err: any) {
                                  toast.error("Gagal hapus", { description: err.message });
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Belum Lunas
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Payment Type Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 border-emerald-200/60">
          <DialogHeader>
            <DialogTitle className={gradientTextDark}>{editingType ? "Edit Jenis Pembayaran" : "Tambah Jenis Pembayaran"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-emerald-800 font-medium">Nama Jenis</Label>
              <Input value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Contoh: SPP Bulanan" className="bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-emerald-800 font-medium">Jumlah (Rp)</Label>
              <Input type="number" value={formJumlah} onChange={(e) => setFormJumlah(e.target.value)} placeholder="50000" className="bg-white/80 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">Batal</Button>
            <Button onClick={handleSaveType} className={buttonClasses}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 border-emerald-200/60">
          <AlertDialogHeader>
            <AlertDialogTitle className={gradientTextDark}>Aktifkan {activateTarget?.nama}?</AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-700">
              Akan membuat tagihan <strong className="text-amber-700">{formatCurrency(Number(activateTarget?.jumlah || 0))}</strong> untuk{" "}
              <strong className="text-emerald-800">{students.length} santri</strong> yang belum memiliki tagihan jenis ini.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} className={buttonClasses}>
              <Zap className="h-4 w-4 mr-1" /> Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
