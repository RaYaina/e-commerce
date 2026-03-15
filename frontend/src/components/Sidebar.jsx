import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChartBarIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";

export default function Sidebar({ darkMode }) {
  const [open, setOpen] = useState(false);

  // Fermer automatiquement le sidebar après clic (mobile)
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* BOUTON MOBILE - juste ouvrir */}
      <button
        className="md:hidden p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow border dark:border-gray-700"
        onClick={() => setOpen(true)}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-14 md:top-0 md:relative
          bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-700
          h-full w-64 p-5
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Menu</h2>

        <nav className="flex flex-col space-y-4">

          {/* Vente */}
          <Link
            to="/vente"
            onClick={handleLinkClick}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
            <span className="text-gray-800 dark:text-white md:block">Vente de produit</span>
          </Link>

          {/* Liste produit */}
          <Link
            to="/produits"
            onClick={handleLinkClick}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ClipboardDocumentListIcon className="w-6 h-6 text-green-600" />
            <span className="text-gray-800 dark:text-white md:block">Liste de produit</span>
          </Link>

          {/* Liste coût */}
          <Link
            to="/cout"
            onClick={handleLinkClick}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <BanknotesIcon className="w-6 h-6 text-yellow-500" />
            <span className="text-gray-800 dark:text-white md:block">Liste de coût</span>
          </Link>

          {/* Tableau de bord */}
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ChartBarIcon className="w-6 h-6 text-purple-600" />
            <span className="text-gray-800 dark:text-white md:block">Tableau de bord</span>
          </Link>

        </nav>
      </div>
    </>
  );
}
