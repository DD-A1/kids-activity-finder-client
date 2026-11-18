import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";

export default function AdminPage({ onHome, onLogOut }) {
  const [providers, setProviders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPending = () => {
    apiRequest("/api/providers/pending")
      .then((data) => setProviders(data.providers || []))
      .catch((requestError) => setError(requestError.message));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const review = async (providerId, approvalStatus) => {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/providers/${providerId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
      });
      setMessage(`${approvalStatus === "APPROVED" ? "Approved" : "Rejected"}.`);
      loadPending();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main>
      <h1>Pending provider applications</h1>
      <button type="button" onClick={onHome}>
        Home
      </button>
      <button type="button" onClick={onLogOut}>
        Log out
      </button>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
      <ul>
        {providers.map((provider) => (
          <li key={provider.id}>
            {String(provider.display_name || "").toUpperCase()} ({provider.contact_email || provider.contact_phone})
            <button type="button" onClick={() => review(provider.id, "APPROVED")}>
              Approve
            </button>
            <button type="button" onClick={() => review(provider.id, "REJECTED")}>
              Reject
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
