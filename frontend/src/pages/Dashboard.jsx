// src/pages/Dashboard.jsx
import { useState, useMemo, useEffect } from "react";
import { Tag } from "antd";
import { CalendarOutlined, RiseOutlined, ShoppingOutlined, TagsOutlined, TrophyOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { useSearch } from "../context/SearchContext";
import { produitVenduService } from "../services/produitVenduService";

// ================================================================
// PALETTE — ambre en tête, puis teintes complémentaires
// ================================================================
const PALETTE = ["#D97706", "#059669", "#0284C7", "#7C3AED", "#DB2777", "#475569", "#0891B2", "#65A30D"];

const CATEGORIE_COULEUR = {
  "Chaussures": "#0284C7",
  "Vêtements": "#059669",
  "Accessoires": "#D97706",
  "Électronique": "#7C3AED",
  "Sport": "#DB2777",
};

// ================================================================
// HELPERS DATE
// ================================================================
const getDateColor = (dateString) => {
  const date = dayjs(dateString);
  const auj  = dayjs();
  if (date.isSame(auj, "day"))                        return "green";
  if (date.isSame(auj.subtract(1, "day"), "day"))     return "blue";
  if (date.isAfter(auj.subtract(7, "day")))           return "orange";
  return "default";
};

const formatDate = (dateString) => {
  const date = dayjs(dateString);
  const auj  = dayjs();
  if (date.isSame(auj, "day"))                        return "Aujourd'hui";
  if (date.isSame(auj.subtract(1, "day"), "day"))     return "Hier";
  if (date.isAfter(auj.subtract(7, "day")))           return `Il y a ${auj.diff(date, "day")} jours`;
  return date.format("DD/MM/YYYY");
};

// ================================================================
// TOOLTIP PERSONNALISÉ POUR LES GRAPHIQUES
// ================================================================
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name} : <strong>{p.value.toLocaleString()} Ar</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ================================================================
// DASHBOARD PRINCIPAL
// ================================================================
export default function Dashboard({ darkMode }) {
  const { searchTerm } = useSearch();
  const [periodeActive, setPeriodeActive] = useState("tout");
  const [loading, setLoading] = useState(true);
  const [produitsVendus, setProduitsVendus] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await produitVenduService.getAll();
      setProduitsVendus(data);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataFiltrePeriode = useMemo(() => {
    if (periodeActive === "aujourd'hui")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isSame(dayjs(), "day"));
    if (periodeActive === "semaine")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isAfter(dayjs().subtract(7, "day")));
    if (periodeActive === "mois")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isAfter(dayjs().subtract(30, "day")));
    return produitsVendus;
  }, [periodeActive, produitsVendus]);

  const dataFiltreRecherche = useMemo(() => {
    if (!searchTerm) return dataFiltrePeriode;
    return dataFiltrePeriode.filter(p =>
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prix?.toString().includes(searchTerm) ||
      dayjs(p.dateVendu).format("DD/MM/YYYY").includes(searchTerm)
    );
  }, [searchTerm, dataFiltrePeriode]);

  const totalVentes      = dataFiltrePeriode.reduce((s, p) => s + (p.prix * p.quantite), 0);
  const totalArticles    = dataFiltrePeriode.reduce((s, p) => s + p.quantite, 0);
  const nbTransactions   = dataFiltrePeriode.length;
  const ventesAujourdhui = produitsVendus
    .filter(p => dayjs(p.dateVendu).isSame(dayjs(), "day"))
    .reduce((s, p) => s + (p.prix * p.quantite), 0);
  const panierMoyen      = nbTransactions > 0 ? Math.round(totalVentes / nbTransactions) : 0;

  const dataBarres = dataFiltrePeriode.map(p => ({
    nom:   p.nom?.length > 12 ? p.nom.slice(0, 12) + "…" : p.nom || "Sans nom",
    total: p.prix * p.quantite,
    qte:   p.quantite,
    categorie: p.categorie || "Autre",
  })).sort((a, b) => b.total - a.total).slice(0, 10);

  const dataCategories = useMemo(() => {
    const map = {};
    dataFiltrePeriode.forEach(p => {
      const cat = p.categorie || "Autre";
      if (!map[cat]) map[cat] = 0;
      map[cat] += p.prix * p.quantite;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [dataFiltrePeriode]);

  const dataLigne = useMemo(() => {
    const map = {};
    dataFiltrePeriode.forEach(p => {
      const date = dayjs(p.dateVendu).format("DD/MM");
      if (!map[date]) map[date] = 0;
      map[date] += p.prix * p.quantite;
    });
    return Object.entries(map)
      .sort((a, b) => dayjs(a[0], "DD/MM").diff(dayjs(b[0], "DD/MM")))
      .map(([date, total]) => ({ date, total }));
  }, [dataFiltrePeriode]);

  const topProduit = [...dataFiltrePeriode].sort((a, b) =>
    (b.prix * b.quantite) - (a.prix * a.quantite)
  )[0];

  const periodes = [
    { key: "tout",        label: "Tout" },
    { key: "aujourd'hui", label: "Aujourd'hui" },
    { key: "semaine",     label: "7 jours" },
    { key: "mois",        label: "30 jours" },
  ];

  const cardBase = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-screen">

      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord</h2>
          <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble des ventes</p>
        </div>

        {/* Filtre période — segmented control (cohérent avec Produits) */}
        <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 self-start">
          {periodes.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodeActive(p.key)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                periodeActive === p.key
                  ? "bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BARRE KPI UNIFIÉE — même pattern que Produits/Gestion ── */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 dark:divide-gray-700">
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <RiseOutlined />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-400">Total des ventes</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white truncate">{totalVentes.toLocaleString()} Ar</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Aujourd'hui : {ventesAujourdhui.toLocaleString()} Ar</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShoppingOutlined />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-400">Articles vendus</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{totalArticles}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{nbTransactions} transaction(s)</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <TagsOutlined />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-400">Panier moyen</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white truncate">{panierMoyen.toLocaleString()} Ar</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Par transaction</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
              <TrophyOutlined />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-400">Top produit</p>
              <p className="text-base font-bold text-gray-800 dark:text-white truncate">
                {topProduit ? topProduit.nom.slice(0, 14) + (topProduit.nom.length > 14 ? "…" : "") : "—"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {topProduit ? `${(topProduit.prix * topProduit.quantite).toLocaleString()} Ar` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRAPHIQUES — ligne 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className={`rounded-xl p-5 shadow-sm border ${cardBase}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
            Ventes par produit
          </h3>
          {dataBarres.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataBarres} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
                <XAxis dataKey="nom" tick={{ fontSize: 11, fill: darkMode ? "#9CA3AF" : "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: darkMode ? "#9CA3AF" : "#6B7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
                  {dataBarres.map((entry, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`rounded-xl p-5 shadow-sm border ${cardBase}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
            Répartition par catégorie
          </h3>
          {dataCategories.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dataCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {dataCategories.map((entry, i) => (
                    <Cell key={i} fill={CATEGORIE_COULEUR[entry.name] || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} Ar`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── GRAPHIQUE LIGNE — évolution ── */}
      <div className={`rounded-xl p-5 shadow-sm border ${cardBase}`}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Évolution des ventes dans le temps
        </h3>
        {dataLigne.length < 2 ? (
          <p className="text-center text-gray-400 py-6 text-sm">
            Pas assez de données pour afficher l'évolution (au moins 2 dates différentes requises)
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dataLigne} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: darkMode ? "#9CA3AF" : "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: darkMode ? "#9CA3AF" : "#6B7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Ventes"
                stroke="#D97706"
                strokeWidth={2}
                fill="url(#gradVentes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── TABLEAU VENTES RÉCENTES ── */}
      <div className={`rounded-xl shadow-sm border overflow-auto ${cardBase}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ventes récentes
          </h3>
          {searchTerm && (
            <span className="text-sm bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
              {dataFiltreRecherche.length} résultat(s)
            </span>
          )}
        </div>

        {dataFiltreRecherche.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <SearchOutlined className="text-3xl mb-3" />
            <p className="font-medium">Aucun résultat trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Image</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Produit</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Catégorie</th>
                <th className="p-4 text-right text-xs uppercase tracking-wide text-gray-400 font-semibold">Prix unit.</th>
                <th className="p-4 text-right text-xs uppercase tracking-wide text-gray-400 font-semibold">Qté</th>
                <th className="p-4 text-right text-xs uppercase tracking-wide text-gray-400 font-semibold">Total</th>
                <th className="p-4 text-left text-xs uppercase tracking-wide text-gray-400 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {dataFiltreRecherche.slice(0, 10).map(prod => (
                <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-3">
                    <img
                      src={prod.image || "https://via.placeholder.com/150"}
                      alt={prod.nom}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800 dark:text-white">
                    {prod.nom}
                  </td>
                  <td className="p-3">
                    <Tag color={
                      prod.categorie === "Chaussures"   ? "blue"   :
                      prod.categorie === "Vêtements"    ? "green"  :
                      prod.categorie === "Accessoires"  ? "orange" :
                      prod.categorie === "Électronique" ? "purple" : 
                      prod.categorie === "Sport"        ? "red"    : "default"
                    }>
                      {prod.categorie || "Non catégorisé"}
                    </Tag>
                  </td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {prod.prix} Ar
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prod.quantite > 3 ? "bg-emerald-100 text-emerald-700" :
                      prod.quantite > 1 ? "bg-orange-100 text-orange-700" :
                                          "bg-red-100 text-red-700"}`}>
                      {prod.quantite}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {(prod.prix * prod.quantite).toLocaleString()} Ar
                  </td>
                  <td className="p-3">
                    <Tag color={getDateColor(prod.dateVendu)} icon={<CalendarOutlined />}>
                      {formatDate(prod.dateVendu)}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end items-center gap-6 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dataFiltreRecherche.length} vente(s) affichée(s)
          </span>
          <span className="font-bold text-gray-800 dark:text-white">
            Total :
            <span className="text-emerald-600 dark:text-emerald-400 ml-2">
              {dataFiltreRecherche.reduce((s, p) => s + p.prix * p.quantite, 0).toLocaleString()} Ar
            </span>
          </span>
        </div>
      </div>

    </div>
  );
}