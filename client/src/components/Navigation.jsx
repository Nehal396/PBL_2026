import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navigation() {
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      window.alert(error.message);
    }
  }

  const links = [
    ["Explore", "/browse"],
    ...(user?.role === "provider" ? [["Manage listings", "/provider"]] : []),
    ...(user?.role === "admin" ? [["Admin", "/admin"]] : [])
  ];

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" to="/" aria-label="Rentix home"><span className="brand-mark">r</span>rentix<span className="brand-period">.</span></Link>
        <button className="mobile-menu icon-button" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <div className="nav-actions">
            {!ready ? <span className="nav-loading">Loading…</span> : user ? (
              <>
                <NavLink className="nav-account" to="/dashboard" onClick={() => setOpen(false)}>Hi, {user.name.split(" ")[0]}</NavLink>
                <button className="button button-small button-outline" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="nav-login" to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link className="button button-small button-dark" to="/register" onClick={() => setOpen(false)}>Get started <ArrowUpRight size={15} /></Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
