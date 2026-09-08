import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMatches } from "../services/matches";
import { getMyRequests } from "../services/swapRequests";
import { getMySwaps } from "../services/swaps";
import { getSessions } from "../services/sessions";
import SkillBadge from "../components/SkillBadge";
import MatchScore from "../components/MatchScore";

function Card({ title, action, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-slate-400 italic">{children}</p>;
}

function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState(null);
  const [requests, setRequests] = useState(null);
  const [swaps, setSwaps] = useState(null);
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    getMatches({ sort: "best" }).then((all) => setMatches(all.slice(0, 3)));
    getMyRequests().then((data) =>
      setRequests(data.received.filter((r) => r.status === "pending"))
    );
    getMySwaps().then(setSwaps);
    getSessions().then((all) =>
      setSessions(all.filter((s) => s.status === "upcoming").slice(0, 3))
    );
  }, []);

  const activeSwaps = swaps?.filter((s) => s.status === "active") || null;
  const skillsExchanged = swaps
    ? [...new Set(swaps.flatMap((s) => [s.skills.userATeaches, s.skills.userBTeaches]))].length
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
      <p className="text-slate-500 mt-1">{user?.college}</p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card
          title="My Skills"
          action={
            <Link to="/profile/edit" className="text-xs text-slate-500 hover:text-slate-900">
              Edit →
            </Link>
          }
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Teaching
              </p>
              {user?.skillsToTeach.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skillsToTeach.map((s, i) => (
                    <SkillBadge key={i} skill={s.skill} proficiency={s.proficiency} />
                  ))}
                </div>
              ) : (
                <Empty>Add a skill you can teach to start matching.</Empty>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Learning
              </p>
              {user?.skillsToLearn.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skillsToLearn.map((s, i) => (
                    <SkillBadge key={i} skill={s.skill} proficiency={s.proficiency} />
                  ))}
                </div>
              ) : (
                <Empty>Add a skill you want to learn to start matching.</Empty>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="Reputation"
          action={
            <Link to={`/profile/${user?._id}`} className="text-xs text-slate-500 hover:text-slate-900">
              View profile →
            </Link>
          }
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                ⭐ {user?.rating?.average?.toFixed(1) ?? "0.0"}
              </p>
              <p className="text-xs text-slate-500">{user?.rating?.count ?? 0} reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{user?.completedSwaps ?? 0}</p>
              <p className="text-xs text-slate-500">Completed swaps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{skillsExchanged}</p>
              <p className="text-xs text-slate-500">Skills exchanged</p>
            </div>
          </div>
        </Card>

        <Card
          title="Top Matches"
          action={
            <Link to="/discover" className="text-xs text-slate-500 hover:text-slate-900">
              See all →
            </Link>
          }
        >
          {matches === null && <Empty>Loading...</Empty>}
          {matches?.length === 0 && (
            <Empty>No matches yet — add more skills to your profile.</Empty>
          )}
          <div className="space-y-2">
            {matches?.map((m) => (
              <Link
                key={m.user._id}
                to={`/profile/${m.user._id}`}
                className="flex items-center justify-between text-sm py-1.5 hover:bg-slate-50 rounded-md px-2 -mx-2"
              >
                <span className="text-slate-800">{m.user.name}</span>
                <span className="font-semibold text-slate-900">{m.score}%</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card
          title="Pending Requests"
          action={
            <Link to="/requests" className="text-xs text-slate-500 hover:text-slate-900">
              View all →
            </Link>
          }
        >
          {requests === null && <Empty>Loading...</Empty>}
          {requests?.length === 0 && <Empty>No pending requests.</Empty>}
          <div className="space-y-2">
            {requests?.map((r) => (
              <div key={r._id} className="text-sm py-1.5">
                <span className="text-slate-800">{r.sender.name}</span>
                <span className="text-slate-500">
                  {" "}
                  wants to teach you {r.senderTeaches}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Active Swaps"
          action={
            <Link to="/swaps" className="text-xs text-slate-500 hover:text-slate-900">
              View all →
            </Link>
          }
        >
          {activeSwaps === null && <Empty>Loading...</Empty>}
          {activeSwaps?.length === 0 && <Empty>No active swaps right now.</Empty>}
          <div className="space-y-2">
            {activeSwaps?.map((s) => {
              const other = s.userA._id === user._id ? s.userB : s.userA;
              return (
                <div key={s._id} className="text-sm py-1.5">
                  <span className="text-slate-800">{other.name}</span>
                  <span className="text-slate-500">
                    {" "}
                    · {s.skills.userATeaches} ↔ {s.skills.userBTeaches}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="Upcoming Sessions"
          action={
            <Link to="/swaps" className="text-xs text-slate-500 hover:text-slate-900">
              Manage →
            </Link>
          }
        >
          {sessions === null && <Empty>Loading...</Empty>}
          {sessions?.length === 0 && <Empty>No upcoming sessions scheduled.</Empty>}
          <div className="space-y-2">
            {sessions?.map((s) => (
              <div key={s._id} className="text-sm py-1.5">
                <span className="font-medium text-slate-800">{s.skill}</span>
                <span className="text-slate-500">
                  {" "}
                  — {new Date(s.date).toLocaleDateString()} at {s.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
