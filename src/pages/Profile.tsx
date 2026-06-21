import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/store";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Search, Plus, Edit, Trash2, Shield, UserCheck, Users, BookOpen } from "lucide-react";
import type { Profile, Role } from "@/types";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["admin", "guru", "munawib", "orangtua"];

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin": return "Admin";
    case "guru": return "Guru";
    case "munawib": return "Munawib";
    case "orangtua": return "Orang Tua";
    default: return "Santri";
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin": return "bg-red-100 text-red-800 border-red-200";
    case "guru": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "munawib": return "bg-amber-100 text-amber-800 border-amber-200";
    case "orangtua": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "admin": return Shield;
    case "guru": return UserCheck;
    case "munawib": return BookOpen;
    default: return User;
  }
};

const getInitials = (name: string) =>
  name.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase();

export default function ProfilePage() {
  const { user } = useAuth();
  const { profiles, fetchAll, createAccount, updateAccount, deleteAccount } = useAppStore();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<Role>("guru");
  const [formPassword, setFormPassword] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const filtered = useMemo(() => {
    let list = profiles;
    if (filterRole !== "all") list = list.filter(p => p.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    return list;
  }, [profiles, filterRole, search]);

  const { paginatedItems: paginatedProfiles, currentPage, totalPages, setCurrentPage, totalItems, pageSize } = usePagination(filtered, 10);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
    return counts;
  }, [profiles]);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("guru");
    setFormPassword("");
    setDialogOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormEmail(p.email);
    setFormPhone(p.phone || "");
    setFormRole(p.role);
    setFormPassword("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Nama wajib diisi"); return; }

    try {
      if (editingId) {
        await updateAccount(editingId, formName, formRole, formPhone || undefined);
        toast.success("Pengguna berhasil diperbarui");
      } else {
        if (!formEmail.trim()) { toast.error("Email wajib diisi"); return; }
        if (!formPassword || formPassword.length < 6) { toast.error("Password minimal 6 karakter"); return; }
        await createAccount(formName, formEmail, formPassword, formRole, formPhone || undefined);
        toast.success("Pengguna berhasil ditambahkan");
      }
      setDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(editingId ? "Gagal update pengguna" : "Gagal menambah pengguna", { description: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount(deleteTarget.id);
      toast.success(`Pengguna "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal menghapus pengguna", { description: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Pengguna</h1>
            <p className="text-sm text-emerald-600 mt-0.5">Kelola semua akun pengguna sistem</p>
          </div>
          <Button onClick={openAdd} className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Total", count: profiles.length, color: "from-emerald-500 to-emerald-600" },
            { label: "Admin", count: roleCounts.admin || 0, color: "from-red-500 to-red-600" },
            { label: "Guru", count: roleCounts.guru || 0, color: "from-emerald-500 to-emerald-600" },
            { label: "Munawib", count: roleCounts.munawib || 0, color: "from-amber-500 to-amber-600" },
            { label: "Orang Tua", count: roleCounts.orangtua || 0, color: "from-purple-500 to-purple-600" },
          ].map(s => (
            <Card key={s.label} className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-4 pb-4">
                <p className="text-2xl font-bold text-emerald-800">{s.count}</p>
                <p className="text-xs text-emerald-600">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-white/80"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 bg-white/80">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6 text-center py-12">
                <Users className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-emerald-600">Tidak ada pengguna ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            paginatedProfiles.map(p => {
              const RoleIcon = getRoleIcon(p.role);
              const isSelf = user?.id === p.id;
              return (
                <Card key={p.id} className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-emerald-200">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-amber-500 text-white font-bold text-xs">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-emerald-900 truncate">{p.name}</p>
                          {isSelf && <span className="text-xs text-emerald-500">(Anda)</span>}
                        </div>
                        <p className="text-sm text-emerald-500 truncate">{p.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-xs", getRoleBadgeColor(p.role))}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {getRoleLabel(p.role)}
                          </Badge>
                          {p.phone && <span className="text-xs text-emerald-400">{p.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEdit(p)}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-9 w-9"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isSelf && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setDeleteTarget(p)}
                            className="border-red-200 text-red-500 hover:bg-red-50 h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-emerald-200 bg-white/95 backdrop-blur-sm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-900">
              {editingId ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-900">Nama Lengkap</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Nama lengkap"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
              />
            </div>
            <div>
              <Label className="text-emerald-900">Email</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={!!editingId}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 disabled:opacity-60"
              />
            </div>
            <div>
              <Label className="text-emerald-900">Telepon</Label>
              <Input
                type="tel"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="+62..."
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
              />
            </div>
            <div>
              <Label className="text-emerald-900">Role</Label>
              <Select value={formRole} onValueChange={(v: Role) => setFormRole(v)}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editingId && (
              <div>
                <Label className="text-emerald-900">Password</Label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-600 hover:to-amber-600 text-white">
              {editingId ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-800">Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-200 text-emerald-700">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
