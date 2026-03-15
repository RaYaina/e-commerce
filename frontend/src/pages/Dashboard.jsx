// src/pages/Dashboard.jsx
import { useState, useMemo, useEffect } from "react";
import { Tag } from "antd";
import { CalendarOutlined, RiseOutlined, ShoppingOutlined, TagsOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { useSearch } from "../context/SearchContext";
import { produitVenduService } from "../services/produitVenduService";

// ================================================================
// PALETTE DE COULEURS MODERNE POUR LES GRAPHIQUES
// ================================================================
const COULEURS = {
  // Dégradés de bleu
  blue: ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"],
  // Dégradés de vert
  green: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  // Dégradés de violet
  purple: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"],
  // Dégradés d'orange
  orange: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
  // Dégradés de rose
  pink: ["#EC4899", "#F472B6", "#F9A8D4", "#FBCFE8"],
  // Dégradés de rouge
  red: ["#EF4444", "#F87171", "#FCA5A5", "#FECACA"],
  // Dégradés de cyan
  cyan: ["#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"],
  // Dégradés d'indigo
  indigo: ["#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE"],
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
// COMPOSANT CARTE KPI
// ================================================================
function KpiCard({ titre, valeur, sous, icone, couleur, bg }) {
  return (
    <div className={`rounded-xl p-5 shadow-sm border flex items-center gap-4 ${bg}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${couleur}`}>
        {icone}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{titre}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{valeur}</p>
        {sous && <p className="text-xs text-gray-400 mt-0.5">{sous}</p>}
      </div>
    </div>
  );
}

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

  // ================================================================
  // CHARGER LES DONNÉES DU BACKEND
  // ================================================================
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

  // ── FILTRE PÉRIODE ────────────────────────────────────────────
  const dataFiltrePeriode = useMemo(() => {
    if (periodeActive === "aujourd'hui")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isSame(dayjs(), "day"));
    if (periodeActive === "semaine")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isAfter(dayjs().subtract(7, "day")));
    if (periodeActive === "mois")
      return produitsVendus.filter(p => dayjs(p.dateVendu).isAfter(dayjs().subtract(30, "day")));
    return produitsVendus;
  }, [periodeActive, produitsVendus]);

  // ── FILTRE RECHERCHE (tableau des ventes récentes) ────────────
  const dataFiltreRecherche = useMemo(() => {
    if (!searchTerm) return dataFiltrePeriode;
    return dataFiltrePeriode.filter(p =>
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prix?.toString().includes(searchTerm) ||
      dayjs(p.dateVendu).format("DD/MM/YYYY").includes(searchTerm)
    );
  }, [searchTerm, dataFiltrePeriode]);

  // ── KPIs ──────────────────────────────────────────────────────
  const totalVentes      = dataFiltrePeriode.reduce((s, p) => s + (p.prix * p.quantite), 0);
  const totalArticles    = dataFiltrePeriode.reduce((s, p) => s + p.quantite, 0);
  const nbTransactions   = dataFiltrePeriode.length;
  const ventesAujourdhui = produitsVendus
    .filter(p => dayjs(p.dateVendu).isSame(dayjs(), "day"))
    .reduce((s, p) => s + (p.prix * p.quantite), 0);
  const panierMoyen      = nbTransactions > 0 ? Math.round(totalVentes / nbTransactions) : 0;

  // ── GRAPHIQUE BARRES — ventes par produit ─────────────────────
  const dataBarres = dataFiltrePeriode.map(p => ({
    nom:   p.nom?.length > 12 ? p.nom.slice(0, 12) + "…" : p.nom || "Sans nom",
    total: p.prix * p.quantite,
    qte:   p.quantite,
    categorie: p.categorie || "Autre",
  })).sort((a, b) => b.total - a.total).slice(0, 10);

  // ── GRAPHIQUE CAMEMBERT — par catégorie ───────────────────────
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

  // ── GRAPHIQUE LIGNE — évolution chronologique ─────────────────
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

  // ── TOP PRODUIT ───────────────────────────────────────────────
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-screen">

      {/* ── EN-TÊTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord</h2>
          <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble des ventes</p>
        </div>

        {/* Filtre période */}
        <div className="flex gap-2 flex-wrap">
          {periodes.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodeActive(p.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                periodeActive === p.key
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CARTES KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titre="Total des ventes"
          valeur={`${totalVentes.toLocaleString()} Ar`}
          sous={`Aujourd'hui : ${ventesAujourdhui.toLocaleString()} Ar`}
          icone={<RiseOutlined />}
          couleur="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
          bg="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500"
        />
        <KpiCard
          titre="Articles vendus"
          valeur={totalArticles}
          sous={`${nbTransactions} transaction(s)`}
          icone={<ShoppingOutlined />}
          couleur="bg-gradient-to-br from-green-100 to-green-200 text-green-600"
          bg="bg-white dark:bg-gray-800 border-l-4 border-l-green-500"
        />
        <KpiCard
          titre="Panier moyen"
          valeur={`${panierMoyen.toLocaleString()} Ar`}
          sous="Par transaction"
          icone={<TagsOutlined />}
          couleur="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600"
          bg="bg-white dark:bg-gray-800 border-l-4 border-l-purple-500"
        />
        <KpiCard
          titre="Top produit"
          valeur={topProduit ? topProduit.nom.slice(0, 14) + (topProduit.nom.length > 14 ? "…" : "") : "—"}
          sous={topProduit ? `${(topProduit.prix * topProduit.quantite).toLocaleString()} Ar` : ""}
          icone={<CalendarOutlined />}
          couleur="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600"
          bg="bg-white dark:bg-gray-800 border-l-4 border-l-orange-500"
        />
      </div>

      {/* ── GRAPHIQUES — ligne 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Barres — ventes par produit */}
        <div className={`rounded-xl p-5 shadow-sm border ${cardBase}`}>
          <h3 className="text-base font-semibold text-gray-700 dark:text-white mb-4">
            Ventes par produit (Ar)
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
                    <Cell
                      key={i}
                      fill={
                        i === 0 ? COULEURS.blue[0] :
                        i === 1 ? COULEURS.green[0] :
                        i === 2 ? COULEURS.orange[0] :
                        i === 3 ? COULEURS.purple[0] :
                        i === 4 ? COULEURS.pink[0] :
                        i === 5 ? COULEURS.cyan[0] :
                        i === 6 ? COULEURS.indigo[0] :
                        i === 7 ? COULEURS.red[0] :
                        i === 8 ? COULEURS.green[1] :
                        COULEURS.blue[2]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Camembert — par catégorie */}
        <div className={`rounded-xl p-5 shadow-sm border ${cardBase}`}>
          <h3 className="text-base font-semibold text-gray-700 dark:text-white mb-4">
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
                    <Cell
                      key={i}
                      fill={
                        entry.name === "Chaussures" ? COULEURS.blue[0] :
                        entry.name === "Vêtements" ? COULEURS.green[0] :
                        entry.name === "Accessoires" ? COULEURS.orange[0] :
                        entry.name === "Électronique" ? COULEURS.purple[0] :
                        entry.name === "Sport" ? COULEURS.red[0] :
                        `hsl(${i * 45 % 360}, 70%, 60%)`
                      }
                    />
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
        <h3 className="text-base font-semibold text-gray-700 dark:text-white mb-4">
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
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
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
                stroke="#3B82F6"
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
          <h3 className="text-base font-semibold text-gray-700 dark:text-white">
            Ventes récentes
          </h3>
          {searchTerm && (
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              {dataFiltreRecherche.length} résultat(s) pour {searchTerm}
            </span>
          )}
        </div>

        {dataFiltreRecherche.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <span className="text-4xl mb-3">🔍</span>
            <p className="font-medium">Aucun résultat trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Produit</th>
                <th className="p-4 text-left">Catégorie</th>
                <th className="p-4 text-left">Prix unit.</th>
                <th className="p-4 text-left">Qté</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {dataFiltreRecherche.slice(0, 10).map(prod => (
                <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

                  {/* IMAGE */}
                  <td className="p-4">
                    <img
                      src={prod.image || "https://via.placeholder.com/150"}
                      alt={prod.nom}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                      onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                    />
                  </td>

                  {/* NOM */}
                  <td className="p-4 font-medium text-gray-800 dark:text-white">
                    {prod.nom}
                  </td>

                  {/* CATÉGORIE */}
                  <td className="p-4">
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

                  {/* PRIX */}
                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {prod.prix} Ar
                  </td>

                  {/* QUANTITÉ */}
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prod.quantite > 3 ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800" :
                      prod.quantite > 1 ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800" :
                                          "bg-gradient-to-r from-red-100 to-red-200 text-red-800"}`}>
                      {prod.quantite}
                    </span>
                  </td>

                  {/* TOTAL */}
                  <td className="p-4 font-bold text-green-600 dark:text-green-400">
                    {(prod.prix * prod.quantite).toLocaleString()} Ar
                  </td>

                  {/* DATE */}
                  <td className="p-4">
                    <Tag color={getDateColor(prod.dateVendu)} icon={<CalendarOutlined />}>
                      {formatDate(prod.dateVendu)}
                    </Tag>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* TOTAL RÉCAPITULATIF */}
        <div className="flex justify-end items-center gap-6 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dataFiltreRecherche.length} vente(s) affichée(s)
          </span>
          <span className="font-bold text-gray-800 dark:text-white">
            Total :
            <span className="text-green-600 dark:text-green-400 ml-2">
              {dataFiltreRecherche.reduce((s, p) => s + p.prix * p.quantite, 0).toLocaleString()} Ar
            </span>
          </span>
        </div>
      </div>

    </div>
  );
}