import { Route, Routes } from "react-router-dom";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Browse from "./pages/Browse.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

function Shell({ children }) {
  return <><Navigation /><main>{children}</main><Footer /></>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell><Home /></Shell>} />
      <Route path="/browse" element={<Shell><Browse /></Shell>} />
      <Route path="/products/:id" element={<Shell><ProductDetails /></Shell>} />
      <Route path="/login" element={<Shell><AuthPage mode="login" /></Shell>} />
      <Route path="/register" element={<Shell><AuthPage mode="register" /></Shell>} />
      <Route path="/dashboard" element={<Shell><ProtectedRoute><Dashboard /></ProtectedRoute></Shell>} />
      <Route path="/provider" element={<Shell><ProtectedRoute roles={["provider", "admin"]}><Dashboard /></ProtectedRoute></Shell>} />
      <Route path="/admin" element={<Shell><ProtectedRoute roles={["admin"]}><Dashboard /></ProtectedRoute></Shell>} />
      <Route path="*" element={<Shell><NotFound /></Shell>} />
    </Routes>
  );
}
