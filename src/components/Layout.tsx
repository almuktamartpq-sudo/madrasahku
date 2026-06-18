import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Library,
  CalendarDays,
  UserCircle,
  UserCog,
  Download,
  AlertTriangle,
  HeartHandshake,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru",
  munawib: "Munawib",
  orangtua: "Orang Tua",
};

const allNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["admin", "guru", "munawib"] },
  { label: "Guru", icon: UserCheck, href: "/guru", roles: ["admin", "orangtua"] },
  { label: "Munawib", icon: UserCircle, href: "/munawib", roles: ["admin"] },
  { label: "Santri", icon: Users, href: "/students", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Pelanggaran", icon: AlertTriangle, href: "/pelanggaran", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Orang Tua", icon: HeartHandshake, href: "/orangtua", roles: ["admin", "guru", "munawib"] },
  { label: "Kelas", icon: Library, href: "/kelas", roles: ["admin"] },
  { label: "Mapel", icon: BookOpen, href: "/mapel", roles: ["admin"] },
  { label: "Nilai", icon: GraduationCap, href: "/grades", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Absensi Santri", icon: ClipboardCheck, href: "/attendance", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Absensi Guru", icon: CalendarDays, href: "/teacher-attendance", roles: ["admin"] },
  { label: "Pembayaran", icon: CreditCard, href: "/payments", roles: ["admin", "guru", "orangtua"] },
  { label: "Absensiku", icon: CalendarDays, href: "/my-attendance", roles: ["guru", "munawib"] },
  { label: "Pengguna", icon: UserCog, href: "/profile", roles: ["admin"] },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = allNavItems.filter((item) => user && item.roles.includes(user.role));

  // Current page title for mobile header
  const currentPageTitle = allNavItems.find((item) => item.href === location.pathname)?.label ?? "MUKTAMAR";

  // ============ DESKTOP SIDEBAR ============
  const sidebar = (
    <div className={cn("flex h-full flex-col bg-emerald-900 text-white transition-all duration-300", collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
        <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-xl object-cover" />
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight">MUKTAMAR</h1>
            <p className="text-[10px] text-white/50 -mt-0.5">Sistem Manajemen MUKTAMAR</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive ? "bg-amber-500/15 text-amber-400" : "text-white/60 hover:bg-white/8 hover:text-white",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <AvatarFallback className="bg-emerald-500 text-white text-sm font-bold">
              {user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-white/50">{roleLabels[user?.role ?? "admin"]}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="mt-2 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 mx-auto flex">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>

      <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center justify-center h-10 border-t border-white/10 text-white/40 hover:text-white/80 transition-colors">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );

  // ============ MOBILE HEADER WITH BACK BUTTON ============
  const mobileHeader = (
    <div className="lg:hidden flex h-14 items-center gap-3 border-b border-emerald-600/20 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 px-3 shrink-0 shadow-lg">
      <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9 hover:bg-white/20">
        <ArrowLeft className="h-5 w-5 text-white" />
      </Button>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-white truncate drop-shadow-sm">{currentPageTitle}</span>
      </div>
      {isInstallable && (
        <Button variant="ghost" size="icon" onClick={handleInstall} className="text-white hover:bg-white/20">
          <Download className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-amber-50 to-yellow-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with back button */}
        {mobileHeader}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">{children}</div>
        </main>

        {/* Sticky footer (mobile only) */}
        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
}
