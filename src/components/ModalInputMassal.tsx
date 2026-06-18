import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import * as api from "@/data/api";
import type { Student, Kelas } from "@/types";
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ExcelRow {
  NIS: string;
  "Nama Lengkap": string;
  Alamat: string;
  "No. HP": string;
  "Nama Kelas": string;
  "Tanggal Masuk": string;
}

interface ParsedStudent {
  nis: string;
  name: string;
  alamat: string;
  phone: string;
  tanggal_masuk: string;
  kelas_id: string | null;
  kelas_nama: string;
  row_number: number;
  valid: boolean;
  error?: string;
}

interface ModalInputMassalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelasData: Kelas[];
  onSuccess: (students: Student[]) => void;
}

export default function ModalInputMassal({
  open,
  onOpenChange,
  kelasData,
  onSuccess,
}: ModalInputMassalProps) {
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download template Excel
  const handleDownloadTemplate = () => {
    const kelasNames = kelasData.map((k) => k.nama).join(", ");
    const header: (keyof ExcelRow)[] = [
      "NIS",
      "Nama Lengkap",
      "Alamat",
      "No. HP",
      "Nama Kelas",
      "Tanggal Masuk",
    ];

    // Sample data row
    const sampleData: ExcelRow[] = [
      {
        NIS: "2024001",
        "Nama Lengkap": "Ahmad Fauzi",
        Alamat: "Jl. Merdeka No. 10, Kediri",
        "No. HP": "081234567890",
        "Nama Kelas": kelasData[0]?.nama || "Kelas 1",
        "Tanggal Masuk": "2024-07-01",
      },
    ];

    const ws = XLSX.utils.json_to_sheet<ExcelRow>(sampleData, {
      header,
    });

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // NIS
      { wch: 25 }, // Nama Lengkap
      { wch: 35 }, // Alamat
      { wch: 18 }, // No. HP
      { wch: 20 }, // Nama Kelas
      { wch: 18 }, // Tanggal Masuk
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Santri");

    // Add note sheet
    const noteContent = [
      ["Keterangan Kolom:"],
      [""],
      ["NIS", "Nomor Induk Santri (WAJIB)"],
      ["Nama Lengkap", "Nama lengkap santri (WAJIB)"],
      ["Alamat", "Alamat lengkap (WAJIB)"],
      ["No. HP", "Nomor HP/WhatsApp (WAJIB)"],
      ["Nama Kelas", `Pilih dari: ${kelasNames || "(belum ada kelas)"} (OPSIONAL)`],
      ["Tanggal Masuk", "Format: YYYY-MM-DD (WAJIB)"],
    ];
    const wsNote = XLSX.utils.aoa_to_sheet(noteContent);
    wsNote["!cols"] = [{ wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsNote, "Petunjuk");

    XLSX.writeFile(wb, "Template_Input_Santri.xlsx");
    toast.success("Template berhasil didownload");
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Format file harus Excel (.xlsx atau .xls)");
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        if (jsonData.length === 0) {
          toast.error("File Excel kosong atau tidak ada data");
          return;
        }

        // Parse dan validasi setiap baris
        const parsed: ParsedStudent[] = jsonData.map((row, index) => {
          const rowNum = index + 2; // +2 karena header = baris 1
          const nis = String(row.NIS || "").trim();
          const name = String(row["Nama Lengkap"] || "").trim();
          const alamat = String(row.Alamat || "").trim();
          const phone = String(row["No. HP"] || "").trim();
          const kelasNama = String(row["Nama Kelas"] || "").trim();
          const tanggalMasuk = String(row["Tanggal Masuk"] || "").trim();

          // Validasi field wajib
          if (!nis) return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: "NIS kosong" };
          if (!name) return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: "Nama Lengkap kosong" };
          if (!alamat) return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: "Alamat kosong" };
          if (!phone) return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: "No. HP kosong" };
          if (!tanggalMasuk) return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: "Tanggal Masuk kosong" };

          // Validasi format tanggal
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(tanggalMasuk)) {
            return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: `Format tanggal salah (harus YYYY-MM-DD): ${tanggalMasuk}` };
          }

          // Match kelas nama ke UUID
          let kelasId: string | null = null;
          if (kelasNama) {
            const matchedKelas = kelasData.find(
              (k) => k.nama.toLowerCase() === kelasNama.toLowerCase()
            );
            if (!matchedKelas) {
              return { nis, name, alamat, phone, tanggal_masuk: tanggalMasuk, kelas_id: null, kelas_nama: kelasNama, row_number: rowNum, valid: false, error: `Kelas "${kelasNama}" tidak ditemukan pada baris ${rowNum}` };
            }
            kelasId = matchedKelas.id;
          }

          return {
            nis,
            name,
            alamat,
            phone,
            tanggal_masuk: tanggalMasuk,
            kelas_id: kelasId,
            kelas_nama: kelasNama,
            row_number: rowNum,
            valid: true,
          };
        });

        setParsedData(parsed);

        const validCount = parsed.filter((p) => p.valid).length;
        const invalidCount = parsed.filter((p) => !p.valid).length;

        if (invalidCount === 0) {
          toast.success(`${validCount} data berhasil divalidasi`);
        } else {
          toast.warning(`${validCount} valid, ${invalidCount} baris memiliki error`);
        }
      } catch (err) {
        toast.error("Gagal membaca file Excel", {
          description: err instanceof Error ? err.message : "Format file tidak valid",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Submit bulk data
  const handleBulkSave = async () => {
    const validData = parsedData.filter((p) => p.valid);
    if (validData.length === 0) {
      toast.error("Tidak ada data valid untuk disimpan");
      return;
    }

    setSaving(true);
    const savedStudents: Student[] = [];
    const errors: string[] = [];

    for (const item of validData) {
      try {
        const payload: Omit<Student, "id" | "created_at"> = {
          nis: item.nis,
          name: item.name,
          alamat: item.alamat,
          phone: item.phone,
          tanggal_masuk: item.tanggal_masuk,
          kelas_id: item.kelas_id || "",
        };
        const saved = await api.createStudent(payload);
        savedStudents.push(saved);
      } catch (err) {
        errors.push(`Baris ${item.row_number} (${item.name}): ${err instanceof Error ? err.message : "Gagal"}`);
      }
    }

    if (savedStudents.length > 0) {
      toast.success(`${savedStudents.length} santri berhasil ditambahkan`);
      onSuccess(savedStudents);
    }

    if (errors.length > 0) {
      toast.error(`${errors.length} data gagal disimpan`, {
        description: errors.slice(0, 3).join("\n") + (errors.length > 3 ? "\n..." : ""),
      });
    }

    setSaving(false);
    setParsedData([]);
    setFileName("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setParsedData([]);
    setFileName("");
    onOpenChange(false);
  };

  const validCount = parsedData.filter((p) => p.valid).length;
  const invalidCount = parsedData.filter((p) => !p.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto border-emerald-200 bg-white/95">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-emerald-700 to-amber-700 bg-clip-text text-transparent">
            Input Massal Santri
          </DialogTitle>
          <DialogDescription className="text-emerald-600">
            Upload file Excel untuk menambahkan banyak santri sekaligus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Download Template */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">1</span>
              <span className="font-medium text-emerald-800">Download Template</span>
            </div>
            <p className="text-sm text-emerald-600 mb-3">
              Download file Excel template, lalu isi sesuai format yang ditentukan.
            </p>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template Excel
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">2</span>
              <span className="font-medium text-amber-800">Upload File Excel</span>
            </div>
            <p className="text-sm text-amber-600 mb-3">
              Upload file Excel yang sudah diisi.
            </p>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-sm text-amber-700 hover:bg-amber-100 transition-colors">
                  <Upload className="h-4 w-4" />
                  Pilih File Excel
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <FileSpreadsheet className="h-4 w-4" />
                  {fileName}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Preview & Validate */}
          {parsedData.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                <span className="font-medium text-blue-800">Preview Data</span>
              </div>

              <div className="flex gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {validCount} valid
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {invalidCount} error
                  </div>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-blue-200">
                <table className="w-full text-xs">
                  <thead className="bg-blue-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Baris</th>
                      <th className="px-2 py-1.5 text-left">NIS</th>
                      <th className="px-2 py-1.5 text-left">Nama</th>
                      <th className="px-2 py-1.5 text-left">Kelas</th>
                      <th className="px-2 py-1.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {parsedData.map((item, idx) => (
                      <tr key={idx} className={item.valid ? "bg-white" : "bg-red-50"}>
                        <td className="px-2 py-1.5">{item.row_number}</td>
                        <td className="px-2 py-1.5">{item.nis || "-"}</td>
                        <td className="px-2 py-1.5">{item.name || "-"}</td>
                        <td className="px-2 py-1.5">{item.kelas_nama || "-"}</td>
                        <td className="px-2 py-1.5">
                          {item.valid ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600" title={item.error}>
                              <AlertCircle className="h-3 w-3" /> {item.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-10 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={saving || validCount === 0}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white hover:shadow-lg hover:shadow-emerald-700/20 disabled:opacity-50"
            >
              {saving
                ? "Menyimpan..."
                : validCount > 0
                ? `Simpan ${validCount} Santri`
                : "Upload File Terlebih Dahulu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
