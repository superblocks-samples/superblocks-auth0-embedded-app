import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider, AppState } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App";
import EmbeddedApp from "./components/EmbeddedApp";

const landingAppId = process.env.REACT_APP_SUPERBLOCKS_APPLICATION_ID;

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

const NoLandingAppMessage = () => (
  <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
    <h1>No landing Superblocks app configured</h1>
    <p>
      Open any Superblocks app directly at <code>/apps/&lt;applicationId&gt;</code>, or set{" "}
      <code>REACT_APP_SUPERBLOCKS_APPLICATION_ID</code> in <code>app/.env.local</code> to choose
      the app rendered at <code>/</code> (see <code>app/env.example</code>).
    </p>
  </div>
);

const Root = () => (
  <Auth0ProviderWithNavigate>
    <App>
      <Routes>
        <Route path="/login/callback" element={null} />
        <Route path="/apps/:appId/*" element={<EmbeddedApp />} />
        <Route path="*" element={landingAppId ? <EmbeddedApp /> : <NoLandingAppMessage />} />
      </Routes>
    </App>
  </Auth0ProviderWithNavigate>
);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Router>
    <Root />
  </Router>
);
