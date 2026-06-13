import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Menu,
  BookOpen,
  User,
  Library,
  CalendarDays,
  UserCircle,
  UserCog,
  Download,
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
  { label: "Dashboard", icon: LayoutDashboard, href: "/", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Santri", icon: Users, href: "/students", roles: ["admin"] },
  { label: "Guru", icon: UserCheck, href: "/teachers", roles: ["admin"] },
  { label: "Kelas", icon: Library, href: "/kelas", roles: ["admin"] },
  { label: "Mapel", icon: BookOpen, href: "/mapel", roles: ["admin"] },
  { label: "Nilai", icon: GraduationCap, href: "/grades", roles: ["admin", "guru", "munawib", "orangtua"] },
  { label: "Absensi Santri", icon: ClipboardCheck, href: "/attendance", roles: ["admin", "guru", "munawib"] },
  { label: "Absensi Guru", icon: CalendarDays, href: "/teacher-attendance", roles: ["admin"] },
  { label: "Pembayaran", icon: CreditCard, href: "/payments", roles: ["admin", "orangtua"] },
  { label: "Munawib", icon: UserCircle, href: "/munawib", roles: ["admin"] },
  { label: "Absensi Saya", icon: CalendarDays, href: "/my-attendance", roles: ["munawib"] },
  { label: "Pengguna", icon: UserCog, href: "/profile", roles: ["admin"] },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = allNavItems.filter((item) => user && item.roles.includes(user.role));

  const sidebar = (
    <div className={cn("flex h-full flex-col bg-emerald-900 text-white transition-all duration-300", collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
        <img src="/icon.png" alt="Logo" className="h-9 w-9 rounded-xl object-cover" />
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
            onClick={() => setMobileOpen(false)}
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[260px]">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4 lg:hidden shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/icon.png" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
            <span className="font-bold text-emerald-800">MUKTAMAR</span>
          </div>
          {isInstallable && (
            <Button variant="ghost" size="icon" onClick={handleInstall} className="text-emerald-600">
              <Download className="h-5 w-5" />
            </Button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
