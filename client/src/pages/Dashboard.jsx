import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
      <p className="text-slate-500 mt-1">{user?.college}</p>
    </div>
  );
}

export default Dashboard;
