import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { ConfigProvider, theme as antdTheme } from "antd";

export default function MainLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  // Ajouter/retirer la classe "dark" sur HTML (pour Tailwind)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      {/* Conteneur principal — hauteur écran fixe, pas de scroll global */}
      <div
        className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* HEADER FIXE en haut */}
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* SIDEBAR + CONTENU — prend tout l'espace restant sous le header */}
        <div className="flex flex-1 mt-16 overflow-hidden">

          {/* SIDEBAR — fixe, ne scroll pas */}
          <div className="h-full flex-shrink-0 overflow-y-auto">
            <Sidebar />
          </div>

          {/* CONTENU — scroll indépendamment */}
          <div
            className={`flex-1 overflow-y-auto transition-colors duration-300 ${
              darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
            }`}
          >
            {/* Injecter darkMode dans les pages */}
            {children &&
              (Array.isArray(children)
                ? children.map((child) =>
                    child
                      ? typeof child.type === "function"
                        ? React.cloneElement(child, { darkMode })
                        : child
                      : null
                  )
                : typeof children.type === "function"
                ? React.cloneElement(children, { darkMode })
                : children)}
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
}