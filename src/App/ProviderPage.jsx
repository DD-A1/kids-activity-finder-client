import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";

export default function ProviderPage({ onHome, onLogOut }) {
  const [providerType, setProviderType] = useState("ORGANIZATION");
  const [providerName, setProviderName] = useState("");
  const [providerDescription, setProviderDescription] = useState("");
  const [providerWebsite, setProviderWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityFormat, setActivityFormat] = useState("IN_PERSON");
  const [activitySummary, setActivitySummary] = useState("");
  const [minimumAge, setMinimumAge] = useState("");
  const [maximumAge, setMaximumAge] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [priceAmount, setPriceAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/providers/mine")
      .then((data) => setApplications(data.providers || []))
      .catch((requestError) => setError(requestError.message));
    apiRequest("/api/activities/mine")
      .then((data) => setActivities(data.activities || []))
      .catch(() => setActivities([]));
  }, []);

  const submitApplication = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/providers", {
        method: "POST",
        body: JSON.stringify({
          provider_type: providerType,
          display_name: providerName,
          description: providerDescription,
          website_url: providerWebsite,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        }),
      });
      setApplications((current) => [data.provider, ...current]);
      setProviderName("");
      setProviderDescription("");
      setProviderWebsite("");
      setContactEmail("");
      setContactPhone("");
      setMessage("Application submitted. Status: pending.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitActivity = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const approved = applications.find((provider) => provider.approval_status === "APPROVED");
    if (!approved) {
      setError("An approved provider is required before an activity can be submitted.");
      return;
    }

    try {
      const data = await apiRequest("/api/activities", {
        method: "POST",
        body: JSON.stringify({
          provider_id: approved.id,
          title: activityTitle,
          short_description: activitySummary,
          activity_format: activityFormat,
          minimum_age_months: minimumAge,
          maximum_age_months: maximumAge,
          is_free: isFree,
          price_amount: priceAmount,
        }),
      });
      setActivities((current) => [data.activity, ...current]);
      setActivityTitle("");
      setActivitySummary("");
      setMinimumAge("");
      setMaximumAge("");
      setPriceAmount("");
      setMessage("Activity submitted. Status: pending review.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const approvedProvider = applications.find((provider) => provider.approval_status === "APPROVED");

  return (
    <main>
      <h1>Provider application</h1>
      <p>
        Apply as an organization or an independent instructor. Approval comes
        before you can submit activities.
      </p>
      <button type="button" onClick={onHome}>
        Home
      </button>
      <button type="button" onClick={onLogOut}>
        Log out
      </button>
      <form onSubmit={submitApplication}>
        <label>
          Provider type
          <select
            value={providerType}
            onChange={(event) => setProviderType(event.target.value)}
          >
            <option value="ORGANIZATION">Organization</option>
            <option value="INDEPENDENT_INSTRUCTOR">Independent instructor</option>
          </select>
        </label>
        <label>
          Display name
          <input
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            required
          />
        </label>
        <label>
          Description
          <input
            value={providerDescription}
            onChange={(event) => setProviderDescription(event.target.value)}
          />
        </label>
        <label>
          Website
          <input
            value={providerWebsite}
            onChange={(event) => setProviderWebsite(event.target.value)}
          />
        </label>
        <label>
          Public email
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </label>
        <label>
          Public phone
          <input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </label>
        <button type="submit">Submit application</button>
      </form>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
      <ul>
        {applications.map((provider) => (
          <li key={provider.id}>
            {String(provider.display_name || "").toUpperCase()} ({provider.approval_status})
          </li>
        ))}
      </ul>
      {approvedProvider ? (
        <form onSubmit={submitActivity}>
          <h2>Submit an activity</h2>
          <label>
            Title
            <input
              value={activityTitle}
              onChange={(event) => setActivityTitle(event.target.value)}
              required
            />
          </label>
          <label>
            Format
            <select
              value={activityFormat}
              onChange={(event) => setActivityFormat(event.target.value)}
            >
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </label>
          <label>
            Short description
            <input
              value={activitySummary}
              onChange={(event) => setActivitySummary(event.target.value)}
            />
          </label>
          <label>
            Minimum age in months
            <input
              value={minimumAge}
              onChange={(event) => setMinimumAge(event.target.value)}
            />
          </label>
          <label>
            Maximum age in months
            <input
              value={maximumAge}
              onChange={(event) => setMaximumAge(event.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={isFree}
              onChange={(event) => setIsFree(event.target.checked)}
            />
            Free
          </label>
          {isFree ? null : (
            <label>
              Price
              <input
                value={priceAmount}
                onChange={(event) => setPriceAmount(event.target.value)}
              />
            </label>
          )}
          <button type="submit">Submit activity</button>
        </form>
      ) : null}
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            {String(activity.title || "").toUpperCase()} ({activity.publication_status})
          </li>
        ))}
      </ul>
    </main>
  );
}
