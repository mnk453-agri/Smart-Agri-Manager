import { Bell, Menu, Search, UserCircle2 } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
};

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Smart Agri Manager
          </h1>

          <p className="text-sm text-slate-500">
            Agriculture & Farm Management System
          </p>
        </div>
      </div>

      <div className="hidden w-96 items-center gap-3 rounded-xl border border-slate-200 px-4 py-2 md:flex">
        <Search className="h-5 w-5 text-slate-400" />

        <input
          type="text"
          placeholder="Search..."
          className="w-full border-none bg-transparent outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          className="rounded-xl p-2 hover:bg-slate-100"
          type="button"
        >
          <Bell className="h-6 w-6 text-slate-700" />
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <UserCircle2 className="h-8 w-8 text-emerald-700" />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Administrator</p>
            <p className="text-xs text-slate-500">Online</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;