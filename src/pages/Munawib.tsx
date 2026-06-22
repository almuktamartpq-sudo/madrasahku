import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/data/store";
import * as api from "@/data/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { UserCircle, Edit, BookOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";
import Pagination from "@/components/Pagination";
import type { Profile } from "@/types";

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function MunawibPage() {
  const { profiles, mapel, fetchAll } = useAppStore();
  const [showDialog, setShowDialog] = useState(false);
  const [munawibMapel, setMunawibMapel] = useState<any[]>([]);
  const [munawibSchedule, setMunawibSchedule] = useState<any[]>([]);

  const [editingMunawib, setEditingMunawib] = useState<Profile | null>(null);
  const [formSelectedMapel, setFormSelectedMapel] = useState<string[]>([]);
  const [formSelectedDays, setFormSelectedDays] = useState<number[]>([]);

  const munawibList = useMemo(
    () => profiles.filter((p) => p.role === "munawib").sort((a, b) => a.name.localeCompare(b.name)),
    [profiles]
  );

  const { paginatedItems: paginatedMunawib, currentPage, totalPages, setCurrentPage, totalItems, pageSize } = usePagination(munawibList, 10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const mapelData = await api.fetchMunawibMapel();
      setMunawibMapel(mapelData);
      // Load schedule
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.from("munawib_schedule").select("*");
      setMunawibSchedule(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (munawib: Profile) => {
    setEditingMunawib(munawib);
    const assigned = munawibMapel.filter((mm) => mm.profile_id === munawib.id).map((mm) => mm.mapel_id);
    setFormSelectedMapel(assigned);
    const days = munawibSchedule.filter((s) => s.profile_id === munawib.id).map((s) => s.day_of_week);
    setFormSelectedDays(days);
    setShowDialog(true);
  };

  const handleToggleMapel = (mapelId: string) => {
    setFormSelectedMapel((prev) =>
      prev.includes(mapelId) ? prev.filter((id) => id !== mapelId) : [...prev, mapelId]
    );
  };

  const handleToggleDay = (day: number) => {
    setFormSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!editingMunawib) return;
    try {
      const profileId = editingMunawib.id;

      // Update mapel assignments
      const oldMapel = munawibMapel.filter((mm) => mm.profile_id === profileId);
      for (const old of oldMapel) {
        await api.deleteMunawibMapel(old.id);
      }
      for (const mapelId of formSelectedMapel) {
        await api.createMunawibMapel({ profile_id: profileId, mapel_id: mapelId });
      }

      // Update schedule
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("munawib_schedule").delete().eq("profile_id", profileId);
      if (formSelectedDays.length > 0) {
        const schedules = formSelectedDays.map((day) => ({ profile_id: profileId, day_of_week: day }));
        await supabase.from("munawib_schedule").insert(schedules);
      }

      toast.success("Data munawib berhasil diupdate");
      setShowDialog(false);
      loadData();
      fetchAll();
    } catch (err: any) {
      toast.error("Gagal menyimpan", { description: err.message });
    }
  };

  const getMapelNames = (profileId: string) => {
    const assigned = munawibMapel.filter((mm) => mm.profile_id === profileId);
    return assigned.map((mm) => {
      const m = mapel.find((mp) => mp.id === mm.mapel_id);
      return m ? m.nama : "?";
    });
  };

  const getScheduleDays = (profileId: string) => {
    return munawibSchedule
      .filter((s) => s.profile_id === profileId)
      .map((s) => DAY_NAMES[s.day_of_week] || "?");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Data Munawib</h1>
        </div>
        {/* Munawib List */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            {munawibList.length === 0 ? (
              <div className="text-center py-12 text-emerald-700">
                <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                <p>Belum ada data munawib</p>
                <p className="text-sm mt-2">Tambahkan akun Munawib di halaman Pengguna</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedMunawib.map((m) => {
                  const mapelNames = getMapelNames(m.id);
                  const days = getScheduleDays(m.id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 border border-emerald-200 rounded-lg hover:bg-emerald-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-emerald-900">{m.name}</p>
                        <p className="text-xs text-emerald-600 truncate">{m.email}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {days.length > 0 && days.map((d, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CalendarDays className="h-2.5 w-2.5 mr-0.5" />{d}
                            </Badge>
                          ))}
                          {mapelNames.map((nama, i) => (
                            <Badge key={`m${i}`} variant="secondary" className="text-[10px] px-1.5 bg-amber-50 text-amber-700">
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />{nama}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200" onClick={() => openEdit(m)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} />

        {/* Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Edit Data Munawib</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingMunawib && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br from-emerald-500 to-amber-500">
                    {getInitials(editingMunawib.name)}
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">{editingMunawib.name}</p>
                    <p className="text-xs text-emerald-600">{editingMunawib.email}</p>
                  </div>
                </div>
              )}

              {/* Jadwal Hari Masuk */}
              <div className="space-y-2">
                <Label className="text-emerald-900">Jadwal Hari Masuk</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`p-2 rounded-lg text-xs font-medium border transition ${
                        formSelectedDays.includes(day)
                          ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                          : "border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {DAY_NAMES[day]}
                    </button>
                  ))}
                </div>
                {formSelectedDays.length > 0 && (
                  <p className="text-xs text-emerald-600">{formSelectedDays.length} hari dipilih</p>
                )}
              </div>

              {/* Mapel Multi-select */}
              <div className="space-y-2">
                <Label className="text-emerald-900">Kitab / Mata Pelajaran</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-emerald-200 rounded-md p-2">
                  {mapel.map((m) => {
                    const isSelected = formSelectedMapel.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMapel(m.id)}
                        className={`flex items-center gap-2 p-2 rounded text-xs text-left transition ${
                          isSelected ? "bg-emerald-100 border-emerald-400 border text-emerald-800" : "border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
                        }`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="truncate text-emerald-800">{m.nama}</span>
                      </button>
                    );
                  })}
                  {mapel.length === 0 && <p className="text-xs text-emerald-600 col-span-2">Belum ada data mapel</p>}
                </div>
                {formSelectedMapel.length > 0 && (
                  <p className="text-xs text-emerald-600">{formSelectedMapel.length} kitab dipilih</p>
                )}
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