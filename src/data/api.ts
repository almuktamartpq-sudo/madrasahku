import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Role, Student, Kelas, Mapel, Grade, Attendance, AttendanceStatus, Payment, PaymentType, Profile, TeacherAttendance, MunawibMapel, MunawibAttendance, AttendanceLog, Pelanggaran, ParentStudent } from '@/types';

// Accounts
export async function fetchAllAccounts(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createAccount(name: string, email: string, password: string, role: Role, phone?: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Save admin session before signUp (signUp replaces current session)
  const { data: { session: adminSession } } = await supabase.auth.getSession();

  // 1. Create auth user (this replaces the current session with the new user)
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Gagal membuat user');

  // 2. Directly insert profile
  const { error: insertError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    name,
    role,
    phone: phone || null,
  });

  // If insert fails (trigger might have created it), try update
  if (insertError) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name, role, phone: phone || null })
      .eq('id', data.user.id);
    if (updateError) throw updateError;
  }

  // 3. Restore admin session so admin stays logged in
  if (adminSession) {
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    });
  }
}

export async function updateAccount(id: string, name: string, role: Role, phone?: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('profiles').update({ name, role, phone: phone || null }).eq('id', id);
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
  const { data, error } = await supabase.from('mapel').select('*').order('nama');
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
  const { data, error } = await supabase.from('grades').select('*').order('created_at', { ascending: false });
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

export async function createAttendance(record: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  
  const { data, error } = await supabase.from('attendance').insert(record).select().single();
  if (error) throw error;
  return data;
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
  
  // First check if record already exists
  const { data: existingData, error: fetchError } = await supabase
    .from('teacher_attendance')
    .select('id')
    .eq('profile_id', record.profile_id)
    .eq('date', record.date)
    .maybeSingle();
  
  if (fetchError) throw fetchError;
  
  if (existingData) {
    // Update existing record
    const { data, error } = await supabase
      .from('teacher_attendance')
      .update({
        status: record.status,
        keterangan: record.keterangan
      })
      .eq('id', existingData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new record
    const { data, error } = await supabase.from('teacher_attendance').insert(record).select().single();
    if (error) throw error;
    return data;
  }
}

export async function createTeacherAttendanceBatch(records: Omit<TeacherAttendance, 'id' | 'created_at'>[]): Promise<TeacherAttendance[]> {
  if (!isSupabaseConfigured) return [];
  
  // Use upsert to handle both insert and update
  // Supabase will use the unique constraint (profile_id, date) to determine if update is needed
  const { data, error } = await supabase
    .from('teacher_attendance')
    .upsert(records, { 
      onConflict: 'profile_id,date',
      ignoreDuplicates: false 
    })
    .select();
  
  if (error) throw error;
  return data || [];
}

// Payments
export async function fetchPayments(): Promise<Payment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('payments').select('*').order('due_date', { ascending: false });
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
  const { data, error } = await supabase.from('payment_types').select('*').order('nama');
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

// Activate payment type: set is_active=true and create payment records for ALL students
export async function activatePaymentType(paymentTypeId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  
  // 1. Get the payment type details
  const { data: pt, error: ptError } = await supabase
    .from('payment_types')
    .select('*')
    .eq('id', paymentTypeId)
    .single();
  if (ptError) throw ptError;

  // 2. Get all students
  const { data: allStudents, error: sError } = await supabase.from('students').select('id');
  if (sError) throw sError;
  if (!allStudents || allStudents.length === 0) return 0;

  // 3. Get existing payments for this type to avoid duplicates
  const { data: existing } = await supabase
    .from('payments')
    .select('student_id')
    .eq('type', pt.nama);
  const existingIds = new Set((existing || []).map((e: { student_id: string }) => e.student_id));

  // 4. Create payment records for students who don't have one yet
  const newPayments = allStudents
    .filter((s: { id: string }) => !existingIds.has(s.id))
    .map((s: { id: string }) => ({
      student_id: s.id,
      type: pt.nama,
      amount: Number(pt.jumlah),
      status: 'belum_lunas',
      due_date: new Date().toISOString().split('T')[0],
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
    }));

  if (newPayments.length > 0) {
    const { error: insertError } = await supabase.from('payments').insert(newPayments);
    if (insertError) throw insertError;
  }

  // 5. Mark payment type as active
  await supabase.from('payment_types').update({ is_active: true }).eq('id', paymentTypeId);

  return newPayments.length;
}

// Mark a specific student's payment as paid
export async function markStudentPaid(paymentId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('payments')
    .update({ 
      status: 'lunas', 
      paid_date: new Date().toISOString().split('T')[0] 
    })
    .eq('id', paymentId);
  if (error) throw error;
}

// Bulk mark all students for a payment type as paid
export async function markAllPaidForType(typeName: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('payments')
    .update({ 
      status: 'lunas', 
      paid_date: new Date().toISOString().split('T')[0] 
    })
    .eq('type', typeName)
    .eq('status', 'belum_lunas');
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

// Munawib Attendance Logs (previously called attendance_logs)
export async function fetchAttendanceLogs(): Promise<AttendanceLog[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('munawib_attendance').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createAttendanceLog(log: { profile_id: string; date: string; status: string; keterangan?: string }): Promise<AttendanceLog> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('munawib_attendance').insert(log).select().single();
  if (error) throw error;
  return data;
}

// Pelanggaran
export async function fetchPelanggaran(): Promise<Pelanggaran[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('pelanggaran').select('*').order('tanggal', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPelanggaran(record: Omit<Pelanggaran, 'id' | 'created_at'>): Promise<Pelanggaran> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('pelanggaran').insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updatePelanggaran(id: string, updates: Partial<Pelanggaran>): Promise<Pelanggaran> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('pelanggaran').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePelanggaran(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('pelanggaran').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// MISSING FUNCTIONS - Added for page compatibility
// ============================================

// Parent-Student relationship (untuk role orangtua)
export async function fetchParentStudentIds(parentId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('parent_students')
    .select('student_id')
    .eq('parent_id', parentId);
  if (error) return [];
  return (data || []).map((d: { student_id: string }) => d.student_id);
}

// Profile kelas mapping (kelas_id is directly on profiles table)
export async function fetchProfileKelasId(profileId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('kelas_id')
    .eq('id', profileId)
    .single();
  if (error || !data) return null;
  return data.kelas_id || null;
}

// Munawib attendance
export async function fetchMunawibAttendance(): Promise<MunawibAttendance[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('munawib_attendance')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// Photo upload to Supabase Storage
export async function uploadPhoto(file: File, bucket: string = 'photos'): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl || null;
}

// Delete photo from Supabase Storage
export async function deletePhoto(url: string, bucket: string = 'photos'): Promise<void> {
  if (!isSupabaseConfigured) return;
  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  await supabase.storage.from(bucket).remove([fileName]);
}

// Fetch guru profiles (profiles with role=guru)
export async function fetchGuruProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'guru')
    .order('name');
  if (error) return [];
  return data || [];
}

// Parent-Student CRUD
export async function fetchAllParentStudents(): Promise<ParentStudent[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('parent_students')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function createParentStudent(parent_id: string, student_id: string): Promise<ParentStudent> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('parent_students')
    .insert({ parent_id, student_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteParentStudent(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('parent_students')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Fetch orangtua profiles
export async function fetchOrangtuaProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'orangtua')
    .order('name');
  if (error) return [];
  return data || [];
}

// Update profile
export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
