// Unified across every status vocabulary in the app (Swap, SwapRequest,
// Session) so one pill style/color mapping works everywhere. "upcoming" and
// "pending" both read as "not yet resolved," so they share amber.
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  upcoming: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  missed: "bg-slate-100 text-slate-600",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

export default StatusPill;
