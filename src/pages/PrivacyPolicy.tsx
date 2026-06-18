import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Kebijakan Privasi</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/60 shadow-lg p-6 md:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Al-Muktamar mengumpulkan informasi yang diperlukan untuk operasional sistem informasi madrasah, termasuk nama, email, nomor telepon, data akademik santri, dan informasi pembayaran. Data ini hanya digunakan untuk kepentingan internal lembaga.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">2. Penggunaan Data</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Data yang dikumpulkan digunakan untuk: pengelolaan data santri dan guru, pencatatan absensi dan nilai, manajemen pembayaran, serta komunikasi internal antara pihak madrasah dan orang tua/wali.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">3. Keamanan Data</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasional untuk melindungi data pribadi Anda, termasuk enkripsi data, kontrol akses berbasis peran, dan penyimpanan yang aman menggunakan infrastruktur cloud terpercaya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">4. Berbagi Data</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Data pribadi tidak akan dibagikan kepada pihak ketiga tanpa persetujuan, kecuali diwajibkan oleh hukum. Akses data dibatasi sesuai peran pengguna (admin, guru, munawib, orang tua) melalui sistem Row Level Security (RLS).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">5. Hak Pengguna</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan data pribadi Anda. Untuk permintaan terkait data, silakan hubungi administrator madrasah melalui halaman Kontak.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-emerald-800 mb-2">6. Perubahan Kebijakan</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan diinformasikan melalui sistem atau komunikasi resmi dari pihak madrasah.
            </p>
          </section>

          <div className="pt-4 border-t border-emerald-100">
            <p className="text-xs text-slate-400">Terakhir diperbarui: Juni 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
