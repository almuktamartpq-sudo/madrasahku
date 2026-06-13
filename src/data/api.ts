import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Role, Student, Teacher, Kelas, Mapel, Grade, Attendance, AttendanceStatus, Payment, PaymentStatus, PaymentType, Profile, TeacherAttendance, MunawibMapel, AttendanceLog } from '@/types';

// Accounts
export async function fetchAllAccounts(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createAccount(name: string, email: string, password: string, role: Role): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
  if (error) throw error;
  if (data.user) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await supabase.from('profiles').update({ name, role }).eq('id', data.user.id);
  }
}

export async function updateAccount(id: string, name: string, role: Role): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('profiles').update({ name, role }).eq('id', id);
  if (error) throw error;
}

export async function deleteAccount(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.rpc('admin_delete_user', { target_id: id });
  if (error) throw error;
}

// Santri
export async function fetchStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('students').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createStudent(student: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('students').insert(student).select().single();
  if (error) throw error;
  return data;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

// Teachers
export async function fetchTeachers(): Promise<Teacher[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('teachers').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createTeacher(teacher: Omit<Teacher, 'id' | 'created_at'>): Promise<Teacher> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('teachers').insert(teacher).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('teachers').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeacher(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw error;
}

// Kelas
export async function fetchKelas(): Promise<Kelas[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('kelas').select('*').order('urutan');
  if (error) throw error;
  return data || [];
}

export async function createKelas(kelas: Omit<Kelas, 'id' | 'created_at'>): Promise<Kelas> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('kelas').insert(kelas).select().single();
  if (error) throw error;
  return data;
}

export async function updateKelas(id: string, updates: Partial<Kelas>): Promise<Kelas> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('kelas').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteKelas(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('kelas').delete().eq('id', id);
  if (error) throw error;
}

// Mapel
export async function fetchMapel(): Promise<Mapel[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('mapel').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createMapel(mapel: Omit<Mapel, 'id' | 'created_at'>): Promise<Mapel> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('mapel').insert(mapel).select().single();
  if (error) throw error;
  return data;
}

export async function updateMapel(id: string, updates: Partial<Mapel>): Promise<Mapel> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('mapel').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMapel(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('mapel').delete().eq('id', id);
  if (error) throw error;
}

// Grades
export async function fetchGrades(): Promise<Grade[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('grades').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createGrade(grade: Omit<Grade, 'id' | 'created_at'>): Promise<Grade> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('grades').insert(grade).select().single();
  if (error) throw error;
  return data;
}

export async function updateGrade(id: string, updates: Partial<Grade>): Promise<Grade> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGrade(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('grades').delete().eq('id', id);
  if (error) throw error;
}

// Attendance
export async function fetchAttendance(): Promise<Attendance[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAttendanceBatch(records: Omit<Attendance, 'id' | 'created_at'>[]): Promise<Attendance[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('attendance').insert(records).select();
  if (error) throw error;
  return data || [];
}

export async function updateAttendance(id: string, status: AttendanceStatus): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('attendance').update({ status }).eq('id', id);
  if (error) throw error;
}

// Teacher Attendance
export async function fetchTeacherAttendance(): Promise<TeacherAttendance[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('teacher_attendance').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTeacherAttendance(record: Omit<TeacherAttendance, 'id' | 'created_at'>): Promise<TeacherAttendance> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('teacher_attendance').insert(record).select().single();
  if (error) throw error;
  return data;
}

// Payments
export async function fetchPayments(): Promise<Payment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('payments').insert(payment).select().single();
  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// Payment Types
export async function fetchPaymentTypes(): Promise<PaymentType[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('payment_types').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createPaymentType(pt: Omit<PaymentType, 'id' | 'created_at'>): Promise<PaymentType> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('payment_types').insert(pt).select().single();
  if (error) throw error;
  return data;
}

export async function updatePaymentType(id: string, updates: Partial<PaymentType>): Promise<PaymentType> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('payment_types').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePaymentType(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('payment_types').delete().eq('id', id);
  if (error) throw error;
}

// Munawib Mapel
export async function fetchMunawibMapel(): Promise<MunawibMapel[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('munawib_mapel').select('*');
  if (error) throw error;
  return data || [];
}

export async function createMunawibMapel(record: Omit<MunawibMapel, 'id' | 'created_at'>): Promise<MunawibMapel> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('munawib_mapel').insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMunawibMapel(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('munawib_mapel').delete().eq('id', id);
  if (error) throw error;
}

// Attendance Logs
export async function fetchAttendanceLogs(): Promise<AttendanceLog[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('attendance_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAttendanceLog(log: Omit<AttendanceLog, 'id' | 'created_at'>): Promise<AttendanceLog> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('attendance_logs').insert(log).select().single();
  if (error) throw error;
  return data;
}
