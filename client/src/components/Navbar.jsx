import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const LOGGED_OUT_LINKS = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Sign up" },
];

const LOGGED_IN_LINKS = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/discover", label: "Discover" },
  { to: "/requests", label: "Requests" },
  { to: "/swaps", label: "Swaps" },
  { to: "/resources", label: "Resources" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function linkClasses(to) {
    const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
    return `text-sm rounded-full px-3 py-1.5 transition hover:-translate-y-0.5 ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;
  }

  const links = user ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold text-slate-900 flex items-center gap-1.5">
          SkillSwap
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClasses(l.to)}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
              Logout
            </Button>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-slate-700 text-xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 flex flex-col gap-1 p-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClasses(l.to)}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
              Logout
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
