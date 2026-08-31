import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { to: "/vente", label: "Vente de produit", icon: ShoppingCartIcon },
  { to: "/produits", label: "Liste de produit", icon: ClipboardDocumentListIcon },
  { to: "/cout", label: "Liste de coût", icon: BanknotesIcon },
  { to: "/dashboard", label: "Tableau de bord", icon: ChartBarIcon },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  return (
    <>
      {/* BOUTON MOBILE */}
      <button
        className="md:hidden m-3 p-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md"
        onClick={() => setOpen(true)}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* OVERLAY MOBILE */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR — suit le mode clair/sombre du reste de l'app */}
      <aside
        className={`
          fixed top-14 md:top-0 md:relative z-50 md:z-auto
          bg-white dark:bg-gray-800 h-full w-64 flex flex-col border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Bouton fermer (mobile) */}
        <button
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
          onClick={() => setOpen(false)}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* MARQUE */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-900/20 flex-shrink-0">
            <Squares2X2Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-brand text-gray-800 dark:text-white font-bold text-[15px] leading-tight tracking-tight truncate">
              Mon Application
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">Gestion commerciale</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Menu
          </p>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${active
                    ? "bg-amber-500 text-white font-semibold shadow-sm"
                    : "text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-gray-400 dark:text-gray-500"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PIED DE SIDEBAR */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} Mon Application</p>
        </div>
      </aside>
    </>
  );
}