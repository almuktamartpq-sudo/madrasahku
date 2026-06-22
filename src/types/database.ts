export type Role = 'admin' | 'guru' | 'munawib' | 'orangtua';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  kelas_id?: string;
  created_at: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  photo?: string;
  alamat: string;
  phone: string;
  tanggal_masuk: string;
  kelas_id: string;
  created_at: string;
}



export interface Kelas {
  id: string;
  nama: string;
  urutan: number;
  created_at: string;
}

export interface Mapel {
  id: string;
  nama: string;
  kelas_id: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  type: string;
  score: number;
  semester: string;
  date: string;
  keterangan?: string;
  kelas_id?: string;
  mapel_id?: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  keterangan?: string;
  created_at: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alfa';

export interface TeacherAttendance {
  id: string;
  profile_id: string;
  date: string;
  status: string;
  keterangan?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date?: string;
  bulan?: number;
  tahun?: number;
  keterangan?: string;
  created_at: string;
}

export type PaymentStatus = 'lunas' | 'belum_lunas';

export interface PaymentType {
  id: string;
  nama: string;
  jumlah: number;
  is_active: boolean;
  created_at: string;
}

export interface MunawibMapel {
  id: string;
  profile_id: string;
  mapel_id: string;
}

export interface MunawibAttendance {
  id: string;
  profile_id: string;
  date: string;
  status: string;
  keterangan?: string;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  profile_id: string;
  date: string;
  status: string;
  keterangan?: string;
  created_at: string;
}

export type PelanggaranJenis = 'ringan' | 'sedang' | 'berat';
export type PelanggaranKartu = 'kuning' | 'oranye' | 'merah';

export interface Pelanggaran {
  id: string;
  student_id: string;
  tanggal: string;
  jenis: PelanggaranJenis;
  kartu: PelanggaranKartu;
  deskripsi: string;
  created_by?: string;
  created_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
}
