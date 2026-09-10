import { Link } from "react-router-dom";
import Card from "./ui/Card";
import Button from "./ui/Button";
import StatusPill from "./ui/StatusPill";

function RequestCard({ request, role, onAction }) {
  const otherUser = role === "sent" ? request.receiver : request.sender;

  if (!otherUser) {
    // The other user's account no longer exists (e.g. removed test data) —
    // skip rendering rather than crash on a null reference.
    return null;
  }

  return (
    <Card hover className="flex items-start justify-between gap-4">
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

        <div className="mt-2">
          <StatusPill status={request.status} />
        </div>
      </div>

      {request.status === "pending" && (
        <div className="flex flex-col gap-2 shrink-0">
          {role === "received" ? (
            <>
              <Button size="sm" onClick={() => onAction(request._id, "accepted")}>
                Accept
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onAction(request._id, "rejected")}>
                Reject
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => onAction(request._id, "cancelled")}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default RequestCard;
