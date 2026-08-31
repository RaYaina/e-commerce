import AppRoutes from "./routes/AppRoutes";
import { SearchProvider } from "./context/SearchContext";

function App() {
  return (
    // SearchProvider enveloppe toute l'app pour rendre la recherche globale
    <SearchProvider>
      <AppRoutes />
    </SearchProvider>
  );
}

export default App;