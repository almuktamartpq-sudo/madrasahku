export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="shrink-0 bg-gradient-to-r from-emerald-100 to-amber-100 border-t border-emerald-200/60">
      <div className="px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Internal Use
        </span>
        <span className="text-[10px] text-emerald-600">v1.0</span>
        <span className="text-emerald-400">·</span>
        <span className="text-[10px] text-emerald-600">&copy; {currentYear} Al-Muktamar | Semua hak dilindungi undang-undang</span>
      </div>
    </footer>
  );
}
