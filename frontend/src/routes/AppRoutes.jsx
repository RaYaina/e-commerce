import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
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

        {/* Routes avec layout */}
        <Route
          path="*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/vente" element={<Vente />} />
                <Route path="/produits" element={<Produits />} />
                <Route path="/cout" element={<Cout />} />
                <Route path="/categories" element={<Categories />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
