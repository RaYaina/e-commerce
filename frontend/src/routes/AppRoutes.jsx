import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import Produits from "../pages/Produits";
import Cout from "../pages/Cout";
import Vente from "../pages/Vente";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Categories from "../pages/Categories";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques sans layout */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes protégées avec layout */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <MainLayout>
                {(darkMode) => (
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
                    <Route path="/vente" element={<Vente darkMode={darkMode} />} />
                    <Route path="/produits" element={<Produits darkMode={darkMode} />} />
                    <Route path="/cout" element={<Cout darkMode={darkMode} />} />
                    <Route path="/categories" element={<Categories darkMode={darkMode} />} />
                  </Routes>
                )}
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}