import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider, AppState } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App";

const Auth0ProviderWithNavigate = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

  const onRedirectCallback = (appState?: AppState) => {
    const fallback = window.location.pathname.startsWith("/login/callback")
      ? "/"
      : `${window.location.pathname}${window.location.search}`;
    navigate(appState?.returnTo || fallback, { replace: true });
  };

  if (!domain || !clientId) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Configuration error</h1>
        <p>
          Set <code>REACT_APP_AUTH0_DOMAIN</code> and <code>REACT_APP_AUTH0_CLIENT_ID</code> in{" "}
          <code>app/.env.local</code> (see <code>app/env.example</code>).
        </p>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/login/callback`,
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens
    >
      {children}
    </Auth0Provider>
  );
};

const Root = () => (
  <Auth0ProviderWithNavigate>
    <Routes>
      <Route path="*" element={<App />} />
    </Routes>
  </Auth0ProviderWithNavigate>
);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Router>
    <Root />
  </Router>
);
