import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

export default function Contact() {
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
            <MessageCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Kontak Kami</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/60 shadow-lg p-6 md:p-8 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Untuk pertanyaan, bantuan, atau informasi lebih lanjut mengenai sistem Al-Muktamar, silakan hubungi kami melalui saluran berikut:
          </p>

          <div className="space-y-4">
            {/* WhatsApp */}
            <a
              href="https://wa.me/6285851600898"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/60 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">WhatsApp</p>
                <p className="text-sm text-slate-500">085-851-600-898</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+6285851600898"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/60 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Telepon</p>
                <p className="text-sm text-slate-500">085-851-600-898</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:info@almuktamar.sch.id"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/60 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Email</p>
                <p className="text-sm text-slate-500">almuktamartpq@gmail.com</p>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Alamat</p>
                <p className="text-sm text-slate-500">Kantor TPQ-MADIN Al-Muktamar, Jl. H.M Winarto Kec. Lirboyo, Kota Kediri, Jawa Timur</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-100">
            <p className="text-xs text-slate-400">Jam operasional: Malam Sabtu - Malam Kamis, 17.30 - 21.00 WIB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
