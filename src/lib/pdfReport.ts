import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toHijri } from "hijri-converter";
import type { Attendance, Grade, Kelas, Mapel, Student } from "@/types";

const BRAND = "MADIN AL-MUKTAMAR";
const BRAND_SUB = "Lirboyo Kota Kediri Jawa Timur";
const SEKRETARIAT = "Sekretariat: Kantor Al-Muktamar Jl. H.M Winarto Lirboyo Kota Kediri";

// ---- Helpers ----
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function dateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

function gregorianToHijriDay(dateStr: string): number {
  const d = new Date(dateStr);
  const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return h.hd;
}

function getGregorianDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    days.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addHeader(doc: jsPDF, title: string, subtitle: string, logoDataUrl: string | null): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const ML = 10; // left margin for everything
  let y = 12;

  // Logo (small, left side)
  const textStartX = logoDataUrl ? ML + 18 : ML;
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", ML, 7, 16, 16); } catch {}
  }

  // Kop: MADIN AL-MUKTAMAR (bold)
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(4, 120, 87);
  doc.text(BRAND, textStartX, 15);

  // Subtitle: Lirboyo Kota Kediri Jawa Timur
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(BRAND_SUB, textStartX, 20);

  // Sekretariat
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(SEKRETARIAT, textStartX, 24.5);

  // Double separator line (gold style)
  y = 27;
  doc.setDrawColor(180, 140, 20); // gold
  doc.setLineWidth(0.8);
  doc.line(ML, y, pageWidth - ML, y);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 1.5, pageWidth - ML, y + 1.5);
  y += 8;

  // Title (centered, emerald color)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(4, 120, 87); // emerald-600
  doc.text(title, pageWidth / 2, y, { align: "center" } as any);
  y += 5;

  // Subtitle (date range / period, centered)
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, pageWidth / 2, y, { align: "center" } as any);
  y += 8;

  return y;
}

type SummaryItem = { label: string; value: string | number; color: [number, number, number] };

function addSummaryLine(doc: jsPDF, y: number, items: SummaryItem[]): number {
  const ML = 10;
  let x = ML;

  // "Ringkasan:" label
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(4, 120, 87);
  doc.text("Ringkasan:", ML, y);
  y += 5;

  // Render each item with color
  x = ML;
  items.forEach((item, idx) => {
    if (idx > 0) {
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text("|", x, y);
      x += doc.getTextWidth("| ") + 1;
    }

    // Label (gray)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const label = `${item.label}: `;
    doc.text(label, x, y);
    x += doc.getTextWidth(label);

    // Value (colored, bold)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    const val = String(item.value);
    doc.text(val, x, y);
    x += doc.getTextWidth(val) + 3;
  });

  return y + 8;
}

function addFooter(doc: jsPDF) {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const lastPage = totalPages;
  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Nomor halaman (semua halaman)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(
      `Halaman ${i} / ${totalPages}`,
      pageW / 2 + 5,
      pageH - 8,
      { align: "center" }
    );
  }

  // Signature block (hanya halaman terakhir)
  doc.setPage(lastPage);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const x = pageW - 70;
  const y = pageH - 50;

  // Kota & tanggal
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.text(`Kediri, ${tanggal}`, x, y);

  // Mengetahui
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Mengetahui,", x, y + 6);

  // Jabatan
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Tata Usaha", x, y + 11);

  // Ruang tanda tangan
  doc.line(x, y + 27, x + 50, y + 27);

  // Nama instansi
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MADIN AL-MUKTAMAR", x, y + 32);
}

// ============================================================
// ATTENDANCE REPORT (landscape, per-day columns, by kelas)
// ============================================================
export async function generateAttendancePdf(
  attendanceList: Attendance[],
  students: Student[],
  kelasList: Kelas[],
  startDate: string,
  endDate: string,
  hijriLabel: string,
) {
  const logo = await loadLogo();
  const doc = new jsPDF("l", "mm", "a4"); // landscape
  const pageW = doc.internal.pageSize.getWidth();
  const days = getGregorianDaysInRange(startDate, endDate);
  const dayNums = days.map((d) => new Date(d).getDate());
  const hijriDays = days.map((d) => gregorianToHijriDay(d));

  // Build attendance map: studentId -> { date -> status }
  const attMap = new Map<string, Map<string, string>>();
  attendanceList
    .filter((a) => dateInRange(a.date, startDate, endDate))
    .forEach((a) => {
      if (!attMap.has(a.student_id)) attMap.set(a.student_id, new Map());
      attMap.get(a.student_id)!.set(a.date, a.status);
    });

  const startY = addHeader(
    doc,
    "Rekap Absensi Santri",
    `Bulan: ${hijriLabel}  (${formatDate(startDate)} — ${formatDate(endDate)})`,
    logo,
  );

  // Summary stats
  const totalSantri = students.length;
  let totalH = 0, totalI = 0, totalS = 0, totalA = 0;
  students.forEach((s) => {
    const sMap = attMap.get(s.id);
    if (!sMap) return;
    days.forEach((d) => {
      const st = sMap.get(d);
      if (st === "hadir") totalH++;
      else if (st === "izin") totalI++;
      else if (st === "sakit") totalS++;
      else if (st === "alfa") totalA++;
    });
  });

  let y = addSummaryLine(doc, startY, [
    { label: "Total Santri", value: totalSantri, color: [4, 120, 87] },
    { label: "Hadir", value: totalH, color: [4, 120, 87] },
    { label: "Izin", value: totalI, color: [180, 120, 0] },
    { label: "Sakit", value: totalS, color: [30, 64, 175] },
    { label: "Alpha", value: totalA, color: [200, 30, 30] },
  ]);

  // Column widths
  const colNo = 8;
  const colName = 37;
  const colDay = Math.min(7, (pageW - 10 - colNo - colName - 10) / days.length);

  kelasList.forEach((kelas) => {
    const kelasStudents = students
      .filter((s) => s.kelas_id === kelas.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (kelasStudents.length === 0) return;

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage("l");
      y = 12;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(`Kelas: ${kelas.nama}`, 10, y);
    y += 2;

    const colStyles: Record<number, any> = {
      0: { cellWidth: colNo, halign: "center" as any, fontStyle: "bold" as any },
      1: { cellWidth: colName, halign: "left" as any, fontStyle: "bold" as any },
    };
    for (let i = 0; i < days.length; i++) {
      colStyles[i + 2] = { cellWidth: colDay, halign: "center" as any };
    }
    // H, I, S, A columns use same width as daily columns
    colStyles[days.length + 2] = { cellWidth: colDay, halign: "center" as any }; // H
    colStyles[days.length + 3] = { cellWidth: colDay, halign: "center" as any }; // I
    colStyles[days.length + 4] = { cellWidth: colDay, halign: "center" as any }; // S
    colStyles[days.length + 5] = { cellWidth: colDay, halign: "center" as any }; // A

    const head = [
      [
        { content: "No", rowSpan: 2, styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } },
        { content: "Nama", rowSpan: 2, styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } },
        ...hijriDays.map((hd) => ({ content: String(hd), styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } })),
        { content: "TOTAL", colSpan: 4, styles: { halign: "center" as any, valign: "middle" as any, fillColor: [4, 120, 87] as any, textColor: [255, 255, 255] as any, fontStyle: "bold" as any } }
      ],
      [
        ...dayNums.map((d) => ({ content: String(d), styles: { halign: "center" as any, valign: "middle" as any, fontSize: 5 as any, textColor: [255, 255, 255] as any } })),
        "H", "I", "S", "A"
      ]
    ];

    autoTable(doc, {
      startY: y,
      
      head: head,
      body: kelasStudents.map((s, idx) => {
        const sMap = attMap.get(s.id);
        let h=0,i=0,ss=0,a=0;
        const row:any[]=[String(idx+1),s.name];
        days.forEach((d)=>{const st=sMap?.get(d)??"";let c=""; if(st==="hadir"){c="H";h++;} else if(st==="izin"){c="I";i++;} else if(st==="sakit"){c="S";ss++;} else if(st==="alfa"){c="A";a++;} row.push(c);});
        row.push(String(h),String(i),String(ss),String(a));
        return row;
      }),
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 1,
        textColor: [40, 40, 40] as any,
        lineColor: [200, 230, 220] as any,
        lineWidth: 0.2,
        overflow: "visible",
      },
      headStyles: {
        fillColor: [4, 120, 87] as any,
        textColor: [255, 255, 255] as any,
        fontStyle: "bold" as any,
        fontSize: 6,
        halign: "center" as any,
        valign: "middle" as any,
      },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.row.section === "body" && data.column.index >= 2 && data.column.index < days.length + 2) {
          const val = data.cell.raw as string;
          if (val === "H") { data.cell.styles.textColor = [4, 120, 87] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "I") { data.cell.styles.textColor = [180, 120, 0] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "S") { data.cell.styles.textColor = [30, 64, 175] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "A") { data.cell.styles.textColor = [200, 30, 30] as any; data.cell.styles.fontStyle = "bold" as any; }
        }
        // Left alignment for name column
        if (data.row.section === "body" && data.column.index === 1) {
          data.cell.styles.halign = "left" as any;
        }
        // Center alignment for all other columns
        if (data.row.section === "body" && data.column.index !== 1) {
          data.cell.styles.halign = "center" as any;
        }
      },
      margin: { left: 10, right: 10 }, // Reduced left/right margins
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  addFooter(doc);
  doc.save(`Absensi_${hijriLabel.replace(/\s+/g, "_")}.pdf`);
}

// ============================================================
// GRADES REPORT (portrait, grouped by kelas)
// ============================================================
export async function generateGradesPdf(
  grades: Grade[],
  students: Student[],
  kelasList: Kelas[],
  mapelList: Mapel[],
  startDate: string,
  endDate: string,
  hijriLabel: string,
) {
  const logo = await loadLogo();
  const doc = new jsPDF("p", "mm", "a4");
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const mapelMap = new Map(mapelList.map((m) => [m.id, m]));

  // Filter grades in date range
  const filtered = grades.filter((g) => dateInRange(g.date, startDate, endDate));

  const startY = addHeader(
    doc,
    "Rekap Nilai Santri",
    `Bulan: ${hijriLabel}  (${formatDate(startDate)} — ${formatDate(endDate)})`,
    logo,
  );

  // Summary
  const scores = filtered.map((g) => g.score);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  let y = addSummaryLine(doc, startY, [
      { label: "Total Data", value: scores.length, color: [4, 120, 87] },
      { label: "Rata-rata", value: avg, color: [4, 120, 87] },
      { label: "Tertinggi", value: max, color: [4, 120, 87] },
      { label: "Terendah", value: min, color: [200, 30, 30] },
    ]);

  kelasList.forEach((kelas) => {
    const kelasGrades = filtered
      .filter((g) => g.kelas_id === kelas.id)
      .sort((a, b) => {
        const sa = studentMap.get(a.student_id)?.name ?? "";
        const sb = studentMap.get(b.student_id)?.name ?? "";
        if (sa !== sb) return sa.localeCompare(sb);
        return a.date.localeCompare(b.date);
      });
    if (kelasGrades.length === 0) return;

    if (y > 250) { doc.addPage(); y = 15; }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(`Kelas: ${kelas.nama}`, 10, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["No", "Tanggal", "Nama Santri", "Mata Pelajaran", "Tipe", "Nilai", "Smt"]],
      body: kelasGrades.map((g, idx) => {
        const studentName = studentMap.get(g.student_id)?.name ?? "-";
        const mapelName = g.mapel_id ? (mapelMap.get(g.mapel_id)?.nama ?? "-") : "-";
        const typeLabel = g.type.charAt(0).toUpperCase() + g.type.slice(1);
        return [String(idx + 1), formatDate(g.date), studentName, mapelName, typeLabel, String(g.score), g.semester];
      }),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] as any, lineColor: [200, 230, 220] as any, lineWidth: 0.2 },
      headStyles: { fillColor: [4, 120, 87] as any, textColor: [255, 255, 255] as any, fontStyle: "bold" as any, fontSize: 8, halign: "center" as any },
      alternateRowStyles: { fillColor: [245, 252, 248] as any },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" as any },
        1: { cellWidth: 20, halign: "center" as any },
        2: { cellWidth: 45 },
        3: { cellWidth: 35 },
        4: { cellWidth: 16, halign: "center" as any },
        5: { cellWidth: 14, halign: "center" as any },
        6: { cellWidth: 12, halign: "center" as any },
      },
      didParseCell: (data) => {
        if (data.row.section === "body" && data.column.index === 5) {
          const val = parseInt(data.cell.raw as string);
          if (val >= 90) data.cell.styles.textColor = [4, 120, 87] as any;
          else if (val >= 75) data.cell.styles.textColor = [30, 64, 175] as any;
          else if (val >= 60) data.cell.styles.textColor = [180, 120, 0] as any;
          else data.cell.styles.textColor = [200, 30, 30] as any;
          data.cell.styles.fontStyle = "bold" as any;
        }
      },
      margin: { left: 10, right: 5 }, // Reduced right margin
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  addFooter(doc);
  doc.save(`Nilai_${hijriLabel.replace(/\s+/g, "_")}.pdf`);
}

// ============================================================
// TEACHER & MUNAWIB ATTENDANCE REPORT (landscape, per-day)
// ============================================================
export async function generateTeacherAttendancePdf(
  people: { id: string; name: string; type: "guru" | "munawib" }[],
  teacherAttendance: { profile_id: string; date: string; status: string }[],
  munawibAttendance: { profile_id: string; date: string; status: string }[],
  startDate: string,
  endDate: string,
  hijriLabel: string,
) {
  const logo = await loadLogo();
  const doc = new jsPDF("l", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const days = getGregorianDaysInRange(startDate, endDate);
  const dayNums = days.map((d) => new Date(d).getDate());
  const hijriDays = days.map((d) => gregorianToHijriDay(d));

  // Build attendance map: profile_id -> { date -> status }
  const attMap = new Map<string, Map<string, string>>();
  teacherAttendance
    .filter((a) => dateInRange(a.date, startDate, endDate))
    .forEach((a) => {
      if (!attMap.has(a.profile_id)) attMap.set(a.profile_id, new Map());
      attMap.get(a.profile_id)!.set(a.date, a.status);
    });
  munawibAttendance
    .filter((a) => dateInRange(a.date, startDate, endDate))
    .forEach((a) => {
      if (!attMap.has(a.profile_id)) attMap.set(a.profile_id, new Map());
      attMap.get(a.profile_id)!.set(a.date, a.status);
    });

  const startY = addHeader(
    doc,
    "Rekap Absensi Guru & Munawib",
    `Bulan: ${hijriLabel}  (${formatDate(startDate)} — ${formatDate(endDate)})`,
    logo,
  );

  // Summary
  let totalH = 0, totalI = 0, totalS = 0, totalA = 0;
  people.forEach((p) => {
    const pMap = attMap.get(p.id);
    if (!pMap) return;
    days.forEach((d) => {
      const st = pMap.get(d);
      if (st === "hadir") totalH++;
      else if (st === "izin") totalI++;
      else if (st === "sakit") totalS++;
      else if (st === "alfa") totalA++;
    });
  });
  const guruCount = people.filter((p) => p.type === "guru").length;
  const munawibCount = people.filter((p) => p.type === "munawib").length;

  let y = addSummaryLine(doc, startY, [
    { label: "Total", value: `${people.length} (${guruCount} Guru | ${munawibCount} Munawib)`, color: [4, 120, 87] },
    { label: "Hadir", value: totalH, color: [4, 120, 87] },
    { label: "Izin", value: totalI, color: [180, 120, 0] },
    { label: "Sakit", value: totalS, color: [30, 64, 175] },
    { label: "Alpha", value: totalA, color: [200, 30, 30] },
  ]);

  const colNo = 8;
  const colName = 37;
  const colDay = Math.min(7, (pageW - 10 - colNo - colName - 10) / days.length);

  const groups: { label: string; type: "guru" | "munawib" }[] = [
    { label: "Guru", type: "guru" },
    { label: "Munawib", type: "munawib" },
  ];

  groups.forEach((group) => {
    const groupPeople = people
      .filter((p) => p.type === group.type)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (groupPeople.length === 0) return;

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage("l");
      y = 12;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(group.label, 10, y);
    y += 2;

    const head = [
      [
        { content: "No", rowSpan: 2, styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } },
        { content: "Nama", rowSpan: 2, styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } },
        ...hijriDays.map((hd) => ({ content: String(hd), styles: { halign: "center" as any, valign: "middle" as any, textColor: [255, 255, 255] as any } })),
        { content: "TOTAL", colSpan: 4, styles: { halign: "center" as any, valign: "middle" as any, fillColor: [4, 120, 87] as any, textColor: [255, 255, 255] as any, fontStyle: "bold" as any } }
      ],
      [
        ...dayNums.map((d) => ({ content: String(d), styles: { halign: "center" as any, valign: "middle" as any, fontSize: 5 as any, textColor: [255, 255, 255] as any } })),
        "H", "I", "S", "A"
      ]
    ];

    const colStyles: Record<number, any> = {
      0: { cellWidth: colNo, halign: "center" as any, fontStyle: "bold" as any },
      1: { cellWidth: colName, halign: "left" as any, fontStyle: "bold" as any },
    };
    for (let i = 0; i < days.length; i++) {
      colStyles[i + 2] = { cellWidth: colDay, halign: "center" as any };
    }
    colStyles[days.length + 2] = { cellWidth: colDay, halign: "center" as any };
    colStyles[days.length + 3] = { cellWidth: colDay, halign: "center" as any };
    colStyles[days.length + 4] = { cellWidth: colDay, halign: "center" as any };
    colStyles[days.length + 5] = { cellWidth: colDay, halign: "center" as any };

    autoTable(doc, {
      startY: y,
      head: head,
      body: groupPeople.map((p, idx) => {
        const pMap = attMap.get(p.id);
        let h=0,i=0,ss=0,a=0;
        const row:any[]=[String(idx + 1), p.name];
        days.forEach((d) => {
          const st = pMap?.get(d) ?? "";
          let c = "";
          if(st==="hadir"){c="H";h++;} else if(st==="izin"){c="I";i++;} else if(st==="sakit"){c="S";ss++;} else if(st==="alfa"){c="A";a++;}
          row.push(c);
        });
        row.push(String(h), String(i), String(ss), String(a));
        return row;
      }),
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 1, textColor: [40, 40, 40] as any, lineColor: [200, 230, 220] as any, lineWidth: 0.2, overflow: "visible" },
      headStyles: { fillColor: [4, 120, 87] as any, textColor: [255, 255, 255] as any, fontStyle: "bold" as any, fontSize: 6, halign: "center" as any },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.row.section === "body" && data.column.index >= 2 && data.column.index < days.length + 2) {
          const val = data.cell.raw as string;
          if (val === "H") { data.cell.styles.textColor = [4, 120, 87] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "I") { data.cell.styles.textColor = [180, 120, 0] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "S") { data.cell.styles.textColor = [30, 64, 175] as any; data.cell.styles.fontStyle = "bold" as any; }
          else if (val === "A") { data.cell.styles.textColor = [200, 30, 30] as any; data.cell.styles.fontStyle = "bold" as any; }
        }
        // Left alignment for name column
        if (data.row.section === "body" && data.column.index === 1) {
          data.cell.styles.halign = "left" as any;
        }
        // Center alignment for all other columns
        if (data.row.section === "body" && data.column.index !== 1) {
          data.cell.styles.halign = "center" as any;
        }
      },
      margin: { left: 10, right: 10 }, // Original margins
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  addFooter(doc);
  doc.save(`Absensi_Guru_Munawib_${hijriLabel.replace(/\s+/g, "_")}.pdf`);
}
