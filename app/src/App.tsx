import React, { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation, useNavigate } from "react-router-dom";
import ErrorPage from "./components/ErrorPage";
import "./App.css";

interface AppError {
  title: string;
  message: string;
  details?: string;
  statusCode?: number;
}

interface SuperblocksAuthContextValue {
  token: string;
  signOut: () => void;
  reportAuthError: (error: AppError) => void;
}

const SuperblocksAuthContext = createContext<SuperblocksAuthContextValue | undefined>(undefined);

export const useSuperblocksAuth = (): SuperblocksAuthContextValue => {
  const ctx = useContext(SuperblocksAuthContext);
  if (!ctx) {
    throw new Error("useSuperblocksAuth must be used within <App>");
  }
  return ctx;
};

const loadingContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  flexDirection: "column",
  gap: "1rem",
};

const spinnerStyle: React.CSSProperties = {
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #3498db",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 1s linear infinite",
};

const toolbarButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 12,
  fontFamily: "system-ui, sans-serif",
  background: "#fff",
  color: "#111",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  cursor: "pointer",
};

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="App">
    <div style={loadingContainerStyle}>
      <div style={spinnerStyle} />
      <p>{message}</p>
    </div>
  </div>
);

const App = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const [superblocksToken, setSuperblocksToken] = useState<string | undefined>();
  const [error, setError] = useState<AppError | null>(null);

  const handleLogout = useCallback(() => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  // The landing app owns "/" and any non-/apps path (via the catch-all route),
  // so only show the back button when we're inside a non-landing app's route.
  const showBackToLanding = location.pathname.startsWith("/apps/");

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

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
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

  if (!superblocksToken) {
    return <LoadingScreen message="Authenticating..." />;
  }

  return (
    <SuperblocksAuthContext.Provider
      value={{
        token: superblocksToken,
        signOut: handleLogout,
        reportAuthError: setError,
      }}
    >
      <div className="App app-shell">
        <div className="app-toolbar">
          <div className="app-toolbar-left">
            {showBackToLanding && (
              <button onClick={() => navigate("/")} style={toolbarButtonStyle}>
                ← Back to landing page
              </button>
            )}
          </div>
          <div className="app-toolbar-right">
            <button onClick={handleLogout} style={toolbarButtonStyle}>
              Sign out
            </button>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </div>
    </SuperblocksAuthContext.Provider>
  );
};

export default App;
