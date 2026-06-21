import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!email.trim()) {
      setError('Email wajib diisi');
      document.getElementById('email')?.focus();
      return;
    }
    if (!password.trim()) {
      setError('Password wajib diisi');
      document.getElementById('password')?.focus();
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil');
      navigate('/');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
        setError('Email atau password salah');
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi');
      } else {
        setError(msg || 'Login gagal, coba lagi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <img src="/logo.png" alt="Logo" className="h-24 w-24 rounded-3xl shadow-2xl border-4 border-white/20 mb-8" />
          <h1 className="text-5xl font-bold mb-4">Al-Muktamar</h1>
          <p className="text-xl text-white/80 mb-8">Sistem Informasi Madrasah</p>
          <div className="space-y-4 text-white/70">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              <span>Kelola data santri dengan mudah</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              <span>Pantau absensi dan nilai secara real-time</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              <span>Komunikasi terintegrasi dengan orang tua</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="Logo" className="h-20 w-20 mx-auto rounded-2xl shadow-lg border-2 border-emerald-200 mb-4" />
            <h1 className="text-3xl font-bold gradient-text">Al-Muktamar</h1>
            <p className="text-sm text-emerald-600 mt-1">Sistem Informasi Madrasah</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Selamat Datang</h2>
              <p className="text-sm text-slate-500 mt-1">Masuk untuk melanjutkan</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="h-12 bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-12 bg-slate-50/50 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 rounded-xl pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    <span>Masuk</span>
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-3 text-sm">
              <Link to="/privacy" className="text-emerald-600 hover:text-emerald-800 transition-colors font-medium">
                Kebijakan Privasi
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/contact" className="text-emerald-600 hover:text-emerald-800 transition-colors font-medium">
                Kontak
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Al-Muktamar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
