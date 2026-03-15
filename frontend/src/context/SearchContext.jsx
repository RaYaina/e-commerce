import { createContext, useContext, useState, useCallback } from "react";

const SearchContext = createContext();

// Pages où la recherche est active
export const SEARCHABLE_PAGES = ["/vente", "/produits", "/cout", "/dashboard"];

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback((value) => {
    setSearchTerm(value.toLowerCase().trim());
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  return (
    <SearchContext.Provider value={{ searchTerm, handleSearch, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

// Hook pour utiliser la recherche dans les pages
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch doit être utilisé dans un SearchProvider");
  }
  return context;
}