export type Role = 'admin' | 'guru' | 'munawib' | 'orangtua';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  kelas_id: string;
  photo_url?: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  profile_id: string;
  kelas_id?: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  created_at: string;
}

export interface Kelas {
  id: string;
  name: string;
  urutan: number;
  created_at: string;
}

export interface Mapel {
  id: string;
  name: string;
  kelas_id: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  mapel_id: string;
  teacher_id: string;
  type: string;
  date: string;
  score: number;
  notes?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alfa';

export interface TeacherAttendance {
  id: string;
  teacher_id: string;
  date: string;
  status: TeacherAttendanceStatus;
  created_at: string;
}

export type TeacherAttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alfa';

export interface Payment {
  id: string;
  student_id: string;
  type: string;
  amount: number;
  month?: string;
  status: PaymentStatus;
  date: string;
  notes?: string;
  created_at: string;
}

export type PaymentStatus = 'lunas' | 'belum';

export interface PaymentType {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  created_at: string;
}

export interface MunawibMapel {
  id: string;
  munawib_id: string;
  mapel_id: string;
  kelas_id: string;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  munawib_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}
