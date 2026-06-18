import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Role, Profile, Student, Kelas, Mapel, Grade, Attendance, AttendanceStatus, Payment, PaymentType, TeacherAttendance, MunawibMapel, AttendanceLog, Pelanggaran, ParentStudent } from '@/types'
import * as api from './api'

// Re-export API functions for pages that import directly
export * from './api'

interface AppState {
  loading: boolean
  profiles: Profile[]
  students: Student[]
  kelas: Kelas[]
  mapel: Mapel[]
  grades: Grade[]
  attendance: Attendance[]
  teacherAttendance: TeacherAttendance[]
  payments: Payment[]
  paymentTypes: PaymentType[]
  munawibMapel: MunawibMapel[]
  attendanceLogs: AttendanceLog[]
  pelanggaran: Pelanggaran[]
  parentStudents: ParentStudent[]
  
  fetchAll: () => Promise<void>
  // Student methods
  addStudent: (s: Omit<Student, 'id' | 'created_at'>) => Promise<void>
  updateStudent: (id: string, s: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  // Kelas methods
  addKelas: (k: Omit<Kelas, 'id' | 'created_at'>) => Promise<void>
  updateKelas: (id: string, k: Partial<Kelas>) => Promise<void>
  deleteKelas: (id: string) => Promise<void>
  // Mapel methods
  addMapel: (m: Omit<Mapel, 'id' | 'created_at'>) => Promise<void>
  updateMapel: (id: string, m: Partial<Mapel>) => Promise<void>
  deleteMapel: (id: string) => Promise<void>
  // Grade methods
  addGrade: (g: Omit<Grade, 'id' | 'created_at'>) => Promise<void>
  updateGrade: (id: string, g: Partial<Grade>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
  // Pelanggaran methods
  addPelanggaran: (p: Omit<Pelanggaran, 'id' | 'created_at'>) => Promise<void>
  updatePelanggaran: (id: string, p: Partial<Pelanggaran>) => Promise<void>
  deletePelanggaran: (id: string) => Promise<void>
  // Attendance methods
  addAttendanceBatch: (records: Omit<Attendance, 'id' | 'created_at'>[]) => Promise<void>
  updateAttendance: (id: string, status: AttendanceStatus) => Promise<void>
  // Payment methods
  addPayment: (p: Omit<Payment, 'id' | 'created_at'>) => Promise<void>
  updatePayment: (id: string, p: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  // Payment Type methods
  addPaymentType: (pt: Omit<PaymentType, 'id' | 'created_at'>) => Promise<void>
  updatePaymentType: (id: string, pt: Partial<PaymentType>) => Promise<void>
  deletePaymentType: (id: string) => Promise<void>
  // Parent-Student methods
  addParentStudent: (parent_id: string, student_id: string) => Promise<void>
  deleteParentStudent: (id: string) => Promise<void>
  // Account methods
  createAccount: (name: string, email: string, password: string, role: Role, phone?: string) => Promise<void>
  updateAccount: (id: string, name: string, role: Role, phone?: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  profiles: [],
  students: [],
  kelas: [],
  mapel: [],
  grades: [],
  attendance: [],
  teacherAttendance: [],
  payments: [],
  paymentTypes: [],
  munawibMapel: [],
  attendanceLogs: [],
  pelanggaran: [],
  parentStudents: [],

  fetchAll: async () => {
    if (!isSupabaseConfigured) return
    set({ loading: true })
    try {
      const [
        profiles, students, kelas, mapel, grades,
        attendance, teacherAttendance, payments, paymentTypes,
        munawibMapel, attendanceLogs, pelanggaran, parentStudents
      ] = await Promise.all([
        api.fetchAllAccounts(),
        api.fetchStudents(),
        api.fetchKelas(),
        api.fetchMapel(),
        api.fetchGrades(),
        api.fetchAttendance(),
        api.fetchTeacherAttendance(),
        api.fetchPayments(),
        api.fetchPaymentTypes(),
        api.fetchMunawibMapel(),
        api.fetchAttendanceLogs(),
        api.fetchPelanggaran(),
        api.fetchAllParentStudents(),
      ])
      set({ profiles, students, kelas, mapel, grades, attendance, teacherAttendance, payments, paymentTypes, munawibMapel, attendanceLogs, pelanggaran, parentStudents })
    } finally {
      set({ loading: false })
    }
  },

  addStudent: async (s) => {
    const student = await api.createStudent(s)
    set((state) => ({ students: [...state.students, student] }))
  },
  updateStudent: async (id, s) => {
    const student = await api.updateStudent(id, s)
    set((state) => ({ students: state.students.map((x) => (x.id === id ? student : x)) }))
  },
  deleteStudent: async (id) => {
    await api.deleteStudent(id)
    set((state) => ({ students: state.students.filter((x) => x.id !== id) }))
  },

  addKelas: async (k) => {
    const kelas = await api.createKelas(k)
    set((state) => ({ kelas: [...state.kelas, kelas] }))
  },
  updateKelas: async (id, k) => {
    const kelas = await api.updateKelas(id, k)
    set((state) => ({ kelas: state.kelas.map((x) => (x.id === id ? kelas : x)) }))
  },
  deleteKelas: async (id) => {
    await api.deleteKelas(id)
    set((state) => ({ kelas: state.kelas.filter((x) => x.id !== id) }))
  },

  addMapel: async (m) => {
    const mapel = await api.createMapel(m)
    set((state) => ({ mapel: [...state.mapel, mapel] }))
  },
  updateMapel: async (id, m) => {
    const mapel = await api.updateMapel(id, m)
    set((state) => ({ mapel: state.mapel.map((x) => (x.id === id ? mapel : x)) }))
  },
  deleteMapel: async (id) => {
    await api.deleteMapel(id)
    set((state) => ({ mapel: state.mapel.filter((x) => x.id !== id) }))
  },

  addGrade: async (g) => {
    const grade = await api.createGrade(g)
    set((state) => ({ grades: [...state.grades, grade] }))
  },
  updateGrade: async (id, g) => {
    const grade = await api.updateGrade(id, g)
    set((state) => ({ grades: state.grades.map((x) => (x.id === id ? grade : x)) }))
  },
  deleteGrade: async (id) => {
    await api.deleteGrade(id)
    set((state) => ({ grades: state.grades.filter((x) => x.id !== id) }))
  },
  // Pelanggaran methods
  addPelanggaran: async (p) => {
    const pelanggaran = await api.createPelanggaran(p)
    set((state) => ({ pelanggaran: [pelanggaran, ...state.pelanggaran] }))
  },
  updatePelanggaran: async (id, p) => {
    const pelanggaran = await api.updatePelanggaran(id, p)
    set((state) => ({ pelanggaran: state.pelanggaran.map((x) => (x.id === id ? pelanggaran : x)) }))
  },
  deletePelanggaran: async (id) => {
    await api.deletePelanggaran(id)
    set((state) => ({ pelanggaran: state.pelanggaran.filter((x) => x.id !== id) }))
  },

  addAttendanceBatch: async (records) => {
    const saved = await api.createAttendanceBatch(records)
    set((state) => ({ attendance: [...saved, ...state.attendance] }))
  },
  updateAttendance: async (id, status) => {
    await api.updateAttendance(id, status)
    set((state) => ({
      attendance: state.attendance.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
  },

  addPayment: async (p) => {
    const payment = await api.createPayment(p)
    set((state) => ({ payments: [...state.payments, payment] }))
  },
  updatePayment: async (id, p) => {
    const payment = await api.updatePayment(id, p)
    set((state) => ({ payments: state.payments.map((x) => (x.id === id ? payment : x)) }))
  },
  deletePayment: async (id) => {
    await api.deletePayment(id)
    set((state) => ({ payments: state.payments.filter((x) => x.id !== id) }))
  },

  addPaymentType: async (pt) => {
    const paymentType = await api.createPaymentType(pt)
    set((state) => ({ paymentTypes: [...state.paymentTypes, paymentType] }))
  },
  updatePaymentType: async (id, pt) => {
    const paymentType = await api.updatePaymentType(id, pt)
    set((state) => ({ paymentTypes: state.paymentTypes.map((x) => (x.id === id ? paymentType : x)) }))
  },
  deletePaymentType: async (id) => {
    await api.deletePaymentType(id)
    set((state) => ({ paymentTypes: state.paymentTypes.filter((x) => x.id !== id) }))
  },

  createAccount: async (name, email, password, role, phone) => {
    await api.createAccount(name, email, password, role, phone)
    await get().fetchAll()
  },
  updateAccount: async (id, name, role, phone) => {
    await api.updateAccount(id, name, role, phone)
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, name, role, phone } : p)),
    }))
  },
  deleteAccount: async (id) => {
    await api.deleteAccount(id)
    set((state) => ({ profiles: state.profiles.filter((p) => p.id !== id) }))
  },

  // Parent-Student methods
  addParentStudent: async (parent_id, student_id) => {
    const ps = await api.createParentStudent(parent_id, student_id)
    set((state) => ({ parentStudents: [...state.parentStudents, ps] }))
  },
  deleteParentStudent: async (id) => {
    await api.deleteParentStudent(id)
    set((state) => ({ parentStudents: state.parentStudents.filter((x) => x.id !== id) }))
  },
}))
