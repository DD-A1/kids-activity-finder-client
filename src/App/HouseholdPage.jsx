import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";
import { formatChild } from "./formatChild.js";

export default function HouseholdPage({ onHome, onLogOut }) {
  const [children, setChildren] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [section, setSection] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [location, setLocation] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/children")
      .then((data) => setChildren(data.children || []))
      .catch((requestError) => setError(requestError.message));

    apiRequest("/api/activities/categories")
      .then((data) => setCategories(data.categories || []))
      .catch((requestError) => setError(requestError.message));

    apiRequest("/api/activities/favorites")
      .then((data) => setFavorites(data.favorites || []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category_id", categoryId);
    if (ageMonths !== "") params.set("age_months", ageMonths);
    if (location.trim()) params.set("location", location.trim());
    apiRequest(`/api/activities/published?${params.toString()}`)
      .then((data) => setActivities(data.activities || []))
      .catch((requestError) => setError(requestError.message));
  }, [categoryId, ageMonths, location]);

  const addChild = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/children", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          display_name: displayName,
          date_of_birth: dateOfBirth,
        }),
      });
      setChildren((current) => [data.child, ...current]);
      setFirstName("");
      setDisplayName("");
      setDateOfBirth("");
      setMessage("Child profile saved.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEdit = (child) => {
    setEditingId(child.id);
    setEditFirstName(child.first_name || "");
    setEditDisplayName(child.display_name || "");
    setEditDateOfBirth(String(child.date_of_birth).slice(0, 10));
    setError("");
    setMessage("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(`/api/children/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: editFirstName,
          display_name: editDisplayName,
          date_of_birth: editDateOfBirth,
        }),
      });
      setChildren((current) =>
        current.map((child) => (child.id === data.child.id ? data.child : child)),
      );
      setEditingId(null);
      setMessage("Child profile updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteChild = async (childId) => {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/children/${childId}`, { method: "DELETE" });
      setChildren((current) => current.filter((child) => child.id !== childId));
      if (editingId === childId) {
        setEditingId(null);
      }
      setMessage("Child profile deleted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main>
      <h1>Your children</h1>
      <button type="button" onClick={onHome}>Home</button>
      <button type="button" onClick={onLogOut}>Log out</button>
      <h2>Saved favorites</h2>
      <ul>
        {favorites.map((activity) => (
          <li key={`saved-${activity.id}`}>{String(activity.title || "").toUpperCase()}</li>
        ))}
      </ul>
      <ul>
        {children.map((child) => (
          <li key={`header-${child.id}`}>{formatChild(child)}</li>
        ))}
      </ul>
      <nav>
        <button type="button" onClick={() => { setSection("all"); setCategoryId(""); }}>All</button>
        <button type="button" onClick={() => { setSection("activities"); setCategoryId(""); }}>Activities</button>
        <button type="button" onClick={() => { setSection("events"); setCategoryId(""); }}>Events</button>
      </nav>
      {section ? (
        <label>
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {section && section !== "all" && !categoryId ? <p>Choose a category.</p> : null}
      {section === "events" && categoryId ? (
        <>
          <h2>Events</h2>
          <p>Public events in this category will show here.</p>
        </>
      ) : null}
      {!section || section === "events" || (section === "activities" && !categoryId) ? null : (
        <>
          <h2>Activities</h2>
          <form onSubmit={(event) => event.preventDefault()}>
              <label>
                Age in months
                <input value={ageMonths} onChange={(event) => setAgeMonths(event.target.value)} />
              </label>
              <label>
                Location
                <input value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
          </form>
          {activities.length === 0 ? <p>No published activities in this view.</p> : null}
          <ul>
            {activities.map((activity) => (
              <li key={activity.id}>
                {String(activity.title || "").toUpperCase()}
                {activity.is_free ? " · Free" : ` · $${activity.price_amount}`}
                <button
                  type="button"
                  onClick={() => {
                    apiRequest(`/api/activities/${activity.id}/favorite`, { method: "POST" })
                      .then(() => apiRequest("/api/activities/favorites"))
                      .then((data) => setFavorites(data.favorites || []))
                      .catch((requestError) => setError(requestError.message));
                  }}
                >
                  Save
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <form onSubmit={addChild}>
        <label>
          First name
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </label>
        <label>
          Date of birth
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            required
          />
        </label>
        <button type="submit">Add child</button>
      </form>
      {message ? <p>{message}</p> : null}
      {error ? <p>{error}</p> : null}
      <ul>
        {children.map((child) => (
          <li key={child.id}>
            {editingId === child.id ? (
              <form onSubmit={saveEdit}>
                <input
                  value={editFirstName}
                  onChange={(event) => setEditFirstName(event.target.value)}
                  required
                />
                <input
                  value={editDisplayName}
                  onChange={(event) => setEditDisplayName(event.target.value)}
                  required
                />
                <input
                  type="date"
                  value={editDateOfBirth}
                  onChange={(event) => setEditDateOfBirth(event.target.value)}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                {formatChild(child)}
                <button type="button" onClick={() => startEdit(child)}>
                  Edit
                </button>
                <button type="button" onClick={() => deleteChild(child.id)}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
