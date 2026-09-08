import { Link } from "react-router-dom";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

function RequestCard({ request, role, onAction }) {
  const otherUser = role === "sent" ? request.receiver : request.sender;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <Link to={`/profile/${otherUser._id}`} className="font-medium text-slate-900 hover:underline">
          {otherUser.name}
        </Link>
        <p className="text-sm text-slate-500">{otherUser.college}</p>

        <p className="text-sm text-slate-700 mt-2">
          {role === "sent" ? (
            <>
              You offered to teach <strong>{request.senderTeaches}</strong> and learn{" "}
              <strong>{request.senderLearns}</strong> from them.
            </>
          ) : (
            <>
              They can teach you <strong>{request.senderTeaches}</strong> and want to learn{" "}
              <strong>{request.senderLearns}</strong> from you.
            </>
          )}
        </p>
        {request.message && (
          <p className="text-sm text-slate-500 mt-1 italic">"{request.message}"</p>
        )}

        <span
          className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[request.status]}`}
        >
          {request.status}
        </span>
      </div>

      {request.status === "pending" && (
        <div className="flex flex-col gap-2 shrink-0">
          {role === "received" ? (
            <>
              <button
                onClick={() => onAction(request._id, "accepted")}
                className="bg-slate-900 text-white text-sm rounded-md px-3 py-1.5 hover:bg-slate-700"
              >
                Accept
              </button>
              <button
                onClick={() => onAction(request._id, "rejected")}
                className="border border-slate-300 text-sm rounded-md px-3 py-1.5 hover:bg-slate-50"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              onClick={() => onAction(request._id, "cancelled")}
              className="border border-slate-300 text-sm rounded-md px-3 py-1.5 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default RequestCard;
