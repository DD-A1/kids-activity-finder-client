import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";

const rankOf = {
  parent: 0,
  provider: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

const rankFor = (roles) =>
  roles.reduce((highest, role) => Math.max(highest, rankOf[role] ?? 0), 0);

export default function AdminPage({ roles, onHome, onLogOut }) {
  const rank = rankFor(roles);
  const canReviewActivities = rank >= rankOf.moderator;
  const canReviewProviders = rank >= rankOf.admin;
  const canSeeRoles = rank >= rankOf.super_admin;
  const [providers, setProviders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQueues = () => {
    if (canReviewProviders) {
      apiRequest("/api/providers/pending")
        .then((data) => setProviders(data.providers || []))
        .catch((requestError) => setError(requestError.message));
    }
    if (canReviewActivities) {
      apiRequest("/api/activities/pending")
        .then((data) => setActivities(data.activities || []))
        .catch((requestError) => setError(requestError.message));
    }
  };

  useEffect(() => {
    loadQueues();
  }, [roles]);

  const reviewProvider = async (providerId, approvalStatus) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/providers/${providerId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
      });
      setMessage(approvalStatus === "APPROVED" ? "Provider approved." : "Provider rejected.");
      loadQueues();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const reviewActivity = async (activityId, publicationStatus) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/activities/${activityId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ publication_status: publicationStatus }),
      });
      setMessage(publicationStatus === "PUBLISHED" ? "Activity published." : "Activity rejected.");
      loadQueues();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main>
      <h1>Staff workspace</h1>
      <p>Your roles: {roles.join(", ") || "none"}</p>
      <button type="button" onClick={onHome}>Home</button>
      <button type="button" onClick={onLogOut}>Log out</button>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}

      {canReviewActivities ? (
        <section>
          <h2>Activities waiting for review</h2>
          <ul>
            {activities.map((activity) => (
              <li key={activity.id}>
                {String(activity.title || "").toUpperCase()}
                <button type="button" onClick={() => reviewActivity(activity.id, "PUBLISHED")}>
                  Publish
                </button>
                <button type="button" onClick={() => reviewActivity(activity.id, "REJECTED")}>
                  Reject
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canReviewProviders ? (
        <section>
          <h2>Provider applications</h2>
          <ul>
            {providers.map((provider) => (
              <li key={provider.id}>
                {String(provider.display_name || "").toUpperCase()} ({provider.contact_email || provider.contact_phone})
                <button type="button" onClick={() => reviewProvider(provider.id, "APPROVED")}>
                  Approve
                </button>
                <button type="button" onClick={() => reviewProvider(provider.id, "REJECTED")}>
                  Reject
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canSeeRoles ? (
        <section>
          <h2>Role assignment</h2>
          <p>Super admin only. Roles are still granted in the database, using the role assignment notes.</p>
        </section>
      ) : null}
    </main>
  );
}
