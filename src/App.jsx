import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

const readToken = () => localStorage.getItem("token");

const formatChild = (child) => {
  const name = String(child.display_name || "").toUpperCase();
  const birthText = String(child.date_of_birth).slice(0, 10);
  const [year, month, day] = birthText.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());

  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    months = 0;
  }

  const age =
    months < 24
      ? `${months} ${months === 1 ? "month" : "months"}`
      : `${Math.floor(months / 12)} ${Math.floor(months / 12) === 1 ? "year" : "years"}`;

  return `${name}, ${age}`;
};

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = readToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export default function App() {
  const [token, setToken] = useState(readToken);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [children, setChildren] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [householdCount, setHouseholdCount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    apiRequest("/api/children")
      .then((data) => setChildren(data.children || []))
      .catch((requestError) => setError(requestError.message));

    apiRequest("/api/household")
      .then((data) => {
        const count = data.household?.household_children_count;
        setHouseholdCount(count === null || count === undefined ? "" : String(count));
      })
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  const saveSession = (nextToken) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
  };

  const submitAccount = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token);
      setMessage(mode === "register" ? "Account created." : "Logged in.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

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
    const birthDate = String(child.date_of_birth).slice(0, 10);
    setEditingId(child.id);
    setEditFirstName(child.first_name || "");
    setEditDisplayName(child.display_name || "");
    setEditDateOfBirth(birthDate);
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

  const saveHousehold = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmed = householdCount.trim();
    const body =
      trimmed === ""
        ? { household_children_count: null }
        : { household_children_count: Number(trimmed) };

    try {
      const data = await apiRequest("/api/household", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const count = data.household?.household_children_count;
      setHouseholdCount(count === null || count === undefined ? "" : String(count));
      setMessage("Household profile saved.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const logOut = () => {
    localStorage.removeItem("token");
    setToken(null);
    setChildren([]);
    setHouseholdCount("");
    setMessage("");
    setError("");
  };

  if (!token) {
    return (
      <main>
        <h1>Kids Activity Finder</h1>
        <form onSubmit={submitAccount}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <button type="submit">
            {mode === "register" ? "Create account" : "Log in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "register" ? "login" : "register")}
        >
          {mode === "register"
            ? "I already have an account"
            : "Create an account"}
        </button>
        {error ? <p>{error}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <h1>Your household</h1>
      <button type="button" onClick={logOut}>
        Log out
      </button>
      <form onSubmit={saveHousehold}>
        <label>
          Children in the household
          <input
            type="number"
            min="0"
            step="1"
            value={householdCount}
            onChange={(event) => setHouseholdCount(event.target.value)}
          />
        </label>
        <button type="submit">Save household</button>
      </form>
      <p>Leave this blank to skip it. It is separate from the child list.</p>
      <h2>Your children</h2>
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
