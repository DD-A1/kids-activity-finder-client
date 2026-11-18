import { useEffect, useState } from "react";
import { apiRequest, readToken } from "./App/api.js";
import HomePage from "./App/HomePage.jsx";
import AccountPage from "./App/AccountPage.jsx";
import ProviderPage from "./App/ProviderPage.jsx";
import HouseholdPage from "./App/HouseholdPage.jsx";
import AdminPage from "./App/AdminPage.jsx";

export default function App() {
  const [token, setToken] = useState(readToken);
  const [audience, setAudience] = useState(null);
  const [screen, setScreen] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }

    apiRequest("/api/providers/access")
      .then((data) => setIsAdmin(Boolean(data.admin)))
      .catch(() => setIsAdmin(false));
  }, [token]);

  const goHome = () => setScreen("home");

  const chooseAudience = (nextAudience) => {
    setAudience(nextAudience);
    setScreen(token ? "app" : "account");
  };

  const signIn = (nextToken) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setScreen("app");
  };

  const logOut = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAudience(null);
    setScreen("home");
  };

  if (screen === "home") {
    return <HomePage onChoose={chooseAudience} />;
  }

  if (screen === "account" || !token) {
    return (
      <AccountPage
        audience={audience}
        onHome={goHome}
        onSignedIn={signIn}
      />
    );
  }

  if (isAdmin) {
    return <AdminPage onHome={goHome} onLogOut={logOut} />;
  }

  if (audience === "provider") {
    return <ProviderPage onHome={goHome} onLogOut={logOut} />;
  }

  return <HouseholdPage onHome={goHome} onLogOut={logOut} />;
}
