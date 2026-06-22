import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { BeforeInstallPromptEvent } from "@/types";
import Footer from "@/components/Footer";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  BookOpen,
  Library,
  CalendarDays,
  UserCircle,
  UserCog,
  Download,
  AlertTriangle,
  HeartHandshake,
  DoorOpen,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
  iconColor: string;
  bgColor: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru",
  munawib: "Munawib",
  orangtua: "Orang Tua",
};

const allMenuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["admin", "guru", "munawib"], iconColor: "#16a34a", bgColor: "#dcfce7" },
  { label: "Guru", icon: UserCheck, href: "/guru", roles: ["admin", "orangtua"], iconColor: "#2563eb", bgColor: "#dbeafe" },
  { label: "Munawib", icon: UserCircle, href: "/munawib", roles: ["admin"], iconColor: "#9333ea", bgColor: "#f3e8ff" },
  { label: "Santri", icon: Users, href: "/students", roles: ["admin", "guru", "munawib", "orangtua"], iconColor: "#0891b2", bgColor: "#cffafe" },
  { label: "Pelanggaran", icon: AlertTriangle, href: "/pelanggaran", roles: ["admin", "guru", "munawib", "orangtua"], iconColor: "#ea580c", bgColor: "#fff7ed" },
  { label: "Orang Tua", icon: HeartHandshake, href: "/orangtua", roles: ["admin", "guru", "munawib"], iconColor: "#e11d48", bgColor: "#ffe4e6" },
  { label: "Kelas", icon: DoorOpen, href: "/kelas", roles: ["admin"], iconColor: "#0d9488", bgColor: "#ccfbf1" },
  { label: "Mapel", icon: BookOpen, href: "/mapel", roles: ["admin"], iconColor: "#4f46e5", bgColor: "#e0e7ff" },
  { label: "Nilai", icon: GraduationCap, href: "/grades", roles: ["admin", "guru", "munawib", "orangtua"], iconColor: "#d97706", bgColor: "#fef3c7" },
  { label: "Absensi Santri", icon: ClipboardCheck, href: "/attendance", roles: ["admin", "guru", "munawib", "orangtua"], iconColor: "#06b6d4", bgColor: "#cffafe" },
  { label: "Absensi Guru", icon: CalendarDays, href: "/teacher-attendance", roles: ["admin"], iconColor: "#0e7490", bgColor: "#cffafe" },
  { label: "Pembayaran", icon: CreditCard, href: "/payments", roles: ["admin", "guru", "orangtua"], iconColor: "#dc2626", bgColor: "#fee2e2" },
  { label: "Absensiku", icon: CalendarDays, href: "/my-attendance", roles: ["guru", "munawib"], iconColor: "#0891b2", bgColor: "#cffafe" },
  { label: "Pengguna", icon: UserCog, href: "/profile", roles: ["admin"], iconColor: "#475569", bgColor: "#f1f5f9" },
  { label: "Pengaturan", icon: Settings, href: "/settings", roles: ["admin"], iconColor: "#7c3aed", bgColor: "#ede9fe" },
];

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = allMenuItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
    {/* Mobile Home Screen */}
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50 lg:hidden">
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="flex h-16 items-center gap-3 px-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-cover border-2 border-white/20" />
            <div>
              <span className="font-bold text-lg tracking-wide">MDT AL-MUKTAMAR</span>
              <p className="text-[10px] text-emerald-100 font-medium">Jl. H.M Winarto Lirboyo Kota Kediri</p>
            </div>
          </div>
          {isInstallable && (
            <Button variant="ghost" size="icon" onClick={handleInstall} className="ml-auto text-white hover:bg-white/20 hover:text-yellow-300 border border-white/30">
              <Download className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-200">
          <Avatar className="h-10 w-10 border-2 border-amber-300 ring-2 ring-amber-100">
            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white text-sm font-bold">
              {user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 truncate">{user?.name}</p>
            <p className="text-xs text-amber-600 font-medium">{roleLabels[user?.role ?? "admin"]}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-amber-600 hover:text-red-600 hover:bg-amber-100 rounded-lg">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid Menu */}
        <nav className="grid grid-cols-3 gap-3 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="mobile-nav-item flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-5 text-center relative"
            >
              <div className="icon-wrapper flex h-14 w-14 items-center justify-center rounded-xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl opacity-20 blur-sm"></div>
                <item.icon className="h-7 w-7 relative z-10 text-white" style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} />
              </div>
              <span className="text-xs font-bold gradient-text leading-tight tracking-wide">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer - always at bottom */}
      <Footer />
    </div>

    {/* Desktop Home Screen */}
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Beranda</h1>
          <p className="text-sm text-emerald-600 mt-1">Selamat datang, {user?.name}. Pilih menu di bawah.</p>
        </div>
        <nav className="grid grid-cols-4 xl:grid-cols-5 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 bg-white/70 backdrop-blur-sm border border-white/60 shadow-md hover:shadow-xl hover:bg-white/90 transition-all duration-300 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6" />
              </div>
              <span className="font-semibold text-emerald-800 group-hover:text-emerald-600 transition-colors">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
    </>
  );
}

