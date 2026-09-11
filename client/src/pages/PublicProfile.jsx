import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUser } from "../services/users";
import SkillBadge from "../components/SkillBadge";
import RequestSwapForm from "../components/RequestSwapForm";
import ReviewCard from "../components/ReviewCard";
import { getReviews } from "../services/reviews";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useInView } from "../hooks/useInView";

function ProfileSection({ children }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  return (
    <div ref={ref} className={`reveal ${inView ? "reveal-visible" : ""}`}>
      <Card padding="lg">{children}</Card>
    </div>
  );
}

function PublicProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(null);
    setError("");
    getUser(id)
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"));
    getReviews({ user: id }).then(setReviews);
  }, [id]);

  if (error) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-slate-500">Loading...</div>;
  }

  const isMe = me && me._id === profile._id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 bg-slate-100 min-h-[calc(100vh-4rem)]">
      <ProfileSection>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-slate-500">{profile.college}</p>
          </div>
          {isMe && (
            <Button variant="secondary" size="sm" to="/profile/edit">
              Edit profile
            </Button>
          )}
        </div>

        {profile.bio && <p className="text-slate-700 mt-4">{profile.bio}</p>}

        <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
          <span>⭐ {profile.rating?.average?.toFixed(1) ?? "0.0"} ({profile.rating?.count ?? 0} reviews)</span>
          <span>{profile.completedSwaps ?? 0} completed swaps</span>
          <span className="capitalize">{profile.learningPreference}</span>
        </div>
      </ProfileSection>

      <ProfileSection>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Can teach</h2>
        {profile.skillsToTeach?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.skillsToTeach.map((s, i) => (
              <SkillBadge
                key={i}
                skill={s.skill}
                proficiency={s.proficiency}
                verificationMethod={s.verificationMethod}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No teaching skills added yet.</p>
        )}
      </ProfileSection>

      <ProfileSection>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Wants to learn</h2>
        {profile.skillsToLearn?.length ? (
          <div className="space-y-2">
            {profile.skillsToLearn.map((s, i) => (
              <div key={i}>
                <SkillBadge skill={s.skill} proficiency={s.proficiency} />
                {s.goal && <p className="text-sm text-slate-500 mt-1 ml-1">"{s.goal}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No learning goals added yet.</p>
        )}
      </ProfileSection>

      {!isMe && me && <RequestSwapForm me={me} profile={profile} />}

      {reviews.length > 0 && (
        <ProfileSection>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Reviews</h2>
          <div className="space-y-2">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        </ProfileSection>
      )}

      {profile.availability?.length > 0 && (
        <ProfileSection>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Availability</h2>
          <ul className="text-sm text-slate-600 space-y-1">
            {profile.availability.map((slot, i) => (
              <li key={i}>
                {slot.day}: {slot.start} – {slot.end}
              </li>
            ))}
          </ul>
        </ProfileSection>
      )}
    </div>
  );
}

export default PublicProfile;
