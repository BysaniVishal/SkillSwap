import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-slate-900">
          SkillSwap
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link to="/discover" className="text-slate-600 hover:text-slate-900">
                Discover
              </Link>
              <Link to="/requests" className="text-slate-600 hover:text-slate-900">
                Requests
              </Link>
              <Link to="/swaps" className="text-slate-600 hover:text-slate-900">
                Swaps
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-slate-900">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
