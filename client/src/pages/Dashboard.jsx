import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
      <p className="text-slate-500 mt-1">{user?.college}</p>
      <Link
        to="/profile/edit"
        className="inline-block mt-4 text-sm border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50"
      >
        Edit my profile
      </Link>
    </div>
  );
}

export default Dashboard;
