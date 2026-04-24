import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { SuperblocksEmbed } from "@superblocksteam/embed-react";
import ErrorPage from "./components/ErrorPage";
import "./App.css";

// embed-react v2 only re-exports `SuperblocksEmbed` from its package root, so
// mirror the relevant event shapes locally to match the v2 callback signatures.
type NavigationEvent = {
  url: string;
  href: string;
  appId?: string;
  pathname?: string;
  search?: string;
  queryParams?: Record<string, string>;
};
type AuthErrorEvent = { error: string };

interface AppError {
  title: string;
  message: string;
  details?: string;
  statusCode?: number;
}

const App = () => {
  const location = useLocation();
  const { isLoading, isAuthenticated, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();
  const [superblocksToken, setSuperblocksToken] = useState<string>();
  const [error, setError] = useState<AppError | null>(null);

  // Strip the Auth0 callback path so it never gets forwarded to the embed,
  // which would render a 404 inside the Superblocks app.
  const rawPath = `${location.pathname}${location.search}`;
  const path = location.pathname.startsWith("/login/callback") ? "" : rawPath;

  const superblocksApplicationId = process.env.REACT_APP_SUPERBLOCKS_APPLICATION_ID;
  const superblocksUrl = process.env.REACT_APP_SUPERBLOCKS_URL;
  const superblocksAppVersion = process.env.REACT_APP_SUPERBLOCKS_APP_VERSION || "2.0";

  const getSuperblocksEmbedUrl = () => {
    const basePath =
      superblocksAppVersion === "2.0" ? "/code-mode/embed/applications" : "/embed/applications";
    return `${superblocksUrl}${basePath}/${superblocksApplicationId}${path}`;
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const loadSuperblocksTokenFromIdToken = useCallback(async () => {
    setError(null);
    try {
      const claims = await getIdTokenClaims();
      const token = claims?.superblocks_token as string | undefined;
      if (!token) {
        setError({
          title: "Superblocks token missing",
          message:
            "Your ID token does not include superblocks_token. Add the Post-Login Action to your Auth0 Login flow and ensure it sets this claim.",
          details:
            "See auth0/actions/superblocks-login.js and https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso",
        });
        return;
      }
      setSuperblocksToken(token);
    } catch (err) {
      console.error("Failed to read ID token claims:", err);
      setError({
        title: "Authentication error",
        message: "Could not read your session. Try signing out and signing in again.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }, [getIdTokenClaims]);

  const handleRetry = () => {
    setError(null);
    if (isAuthenticated) {
      loadSuperblocksTokenFromIdToken();
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const onCallback = window.location.pathname.startsWith("/login/callback");
      const returnTo = onCallback
        ? "/"
        : `${window.location.pathname}${window.location.search}`;
      loginWithRedirect({ appState: { returnTo } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadSuperblocksTokenFromIdToken();
    }
  }, [isAuthenticated, isLoading, loadSuperblocksTokenFromIdToken]);

  const handleAuthError = (event: AuthErrorEvent) => {
    console.error("Superblocks authentication error:", event);
    setSuperblocksToken(undefined);
    setError({
      title: "Session Expired",
      message: "Your Superblocks session has expired or encountered an authentication error.",
      details: event?.error,
    });
  };

  const handleNavigation = (event: NavigationEvent) => {
    const route = `${event.pathname ?? ""}${event.search ?? ""}` || event.href || event.url;
    console.log(`User navigated to: ${route}`);
    window.history.pushState({ path: route }, "", route);
  };

  const handleEvents = (eventName: string, payload: Record<string, unknown>) => {
    switch (eventName) {
      case "logout":
        handleLogout();
        break;
      default:
        console.log(`Unknown event ${eventName}`, payload);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPage
        title={error.title}
        message={error.message}
        details={error.details}
        statusCode={error.statusCode}
        onRetry={handleRetry}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="App">
      {superblocksToken ? (
        <SuperblocksEmbed
          src={getSuperblocksEmbedUrl()}
          onNavigation={handleNavigation}
          onAuthError={handleAuthError}
          onEvent={handleEvents}
          token={superblocksToken}
        />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Authenticating...</p>
        </div>
      )}
    </div>
  );
};

export default App;
