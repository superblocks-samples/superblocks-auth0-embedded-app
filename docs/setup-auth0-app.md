# Configure Auth0 for this sample

The React app expects an Auth0 **Single Page Application** using the Authorization Code flow with PKCE. This guide uses the [Auth0 CLI](https://github.com/auth0/auth0-cli) where possible.

## Tenants and environments (read this first)

For anything beyond a personal demo, **use a separate Auth0 application per environment, and ideally a separate tenant** (for example `mycompany-dev` and `mycompany-prod`). Auth0's free plan supports multiple tenants under the same login.

Why:

- **Tenant isolation** — change connections, branding, Actions, MFA policy, etc. without touching production users.
- **Per-app URLs** — keeping `localhost:3000` out of the prod app's allowed callbacks/logout/origins lists removes a real attack surface.
- **Separate secrets** — the Post-Login Action's `SUPERBLOCKS_TOKEN` is usually a different embed token in prod.
- **Different env vars per build** — `REACT_APP_AUTH0_DOMAIN` and `REACT_APP_AUTH0_CLIENT_ID` differ per environment.

This guide first sets up the **local development** SPA. Repeat the same steps in your prod tenant (or, if using a single tenant, create a second application named e.g. `Superblocks Embed (prod)` with prod URLs only) — see [Production application](#production-application) at the bottom.

## Install and log in

Install the CLI (example on macOS):

```bash
brew install auth0/auth0-cli/auth0
auth0 login
```

Pick the tenant you want to act on when prompted. To switch tenants later:

```bash
auth0 tenants list
auth0 tenants use <tenant-name>
```

> Tip: if you have separate dev and prod tenants, run all the commands below while the **dev** tenant is active.

## Create the SPA application (local development)

Local development URLs:

- **Callback:** `http://localhost:3000/login/callback` (must match `authorizationParams.redirect_uri` in `app/src/index.tsx`)
- **Logout:** `http://localhost:3000`
- **Allowed Origins / Web Origins:** `http://localhost:3000`

Non-interactive example:

```bash
auth0 apps create \
  --name "Superblocks Embed (local)" \
  --type spa \
  --callbacks "http://localhost:3000/login/callback" \
  --logout-urls "http://localhost:3000" \
  --origins "http://localhost:3000" \
  --web-origins "http://localhost:3000"
```

CLI reference: [auth0 apps create](https://auth0.github.io/auth0-cli/auth0_apps_create.html).

From the output (or **Applications → Your app** in the dashboard), copy:

- **Domain** → `REACT_APP_AUTH0_DOMAIN`
- **Client ID** → `REACT_APP_AUTH0_CLIENT_ID`

## Refresh tokens (recommended)

The sample sets `useRefreshTokens` on `Auth0Provider`. In the Auth0 Dashboard, open your SPA → **Settings** → enable **Refresh Token Rotation** if required by your tenant, and ensure **Refresh Token** grant is allowed for the application (SPAs created via CLI typically include appropriate grant types).

## Production application

For production, **do not** simply add prod URLs to the local SPA. Instead, create a dedicated SPA — preferably in a separate tenant.

```bash
# If using a separate prod tenant:
auth0 tenants use mycompany-prod

auth0 apps create \
  --name "Superblocks Embed (prod)" \
  --type spa \
  --callbacks "https://app.example.com/login/callback" \
  --logout-urls "https://app.example.com" \
  --origins   "https://app.example.com" \
  --web-origins "https://app.example.com"
```

Then in your hosting provider (S3, Netlify, Vercel, etc.) set the **prod** values of:

- `REACT_APP_AUTH0_DOMAIN`
- `REACT_APP_AUTH0_CLIENT_ID`
- `REACT_APP_SUPERBLOCKS_APPLICATION_ID`
- `REACT_APP_SUPERBLOCKS_URL`

Repeat the **Post-Login Action** setup ([auth0-post-login-action.md](auth0-post-login-action.md)) inside the prod tenant, with a production Superblocks embed token.

> If you genuinely have a throwaway demo and want to keep one application, you can add the prod URLs to the local SPA's allowed lists. Migrate to a dedicated prod app before any real users hit it.

## Next step

Configure the Post-Login Action: [auth0-post-login-action.md](auth0-post-login-action.md).
