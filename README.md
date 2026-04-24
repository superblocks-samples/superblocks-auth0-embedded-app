# Superblocks Embed + React + Auth0

This example shows how to embed a Superblocks application in a React app using [Auth0](https://auth0.com/) for identity and an [Auth0 Post-Login Action](https://auth0.com/docs/customize/actions) to mint a Superblocks session token—no AWS Lambda or SAM required. The flow follows [Login embed users with Auth0](https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso).

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌───────────────┐
│  React App  │────────▶│      Auth0       │         │  Superblocks  │
│  (Embed)    │◀────────│   Universal      │         │               │
└─────────────┘         │   Login + Action │         └───────────────┘
      │                 └──────────────────┘                 ▲
      │                          │                            │
      │     Post-Login Action calls Superblocks public token API
      │     and sets ID token claim: superblocks_token
      └────────────────────────────────────────────────────────┘
```

**Flow**

1. User signs in with Auth0 (Authorization Code + PKCE, refresh tokens enabled on the SPA).
2. A Post-Login Action calls Superblocks `POST /api/v1/public/token` with your **Embed access token** and user profile, then adds `superblocks_token` to the ID token.
3. The React app reads `superblocks_token` from ID token claims and passes it to `SuperblocksEmbed`.

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Auth0** tenant (free tier is fine)
- **Auth0 CLI** (optional but recommended for app setup): [Auth0 CLI](https://github.com/auth0/auth0-cli)
- **Superblocks** org with embed enabled and an **Embed** access token ([Create an Embed access token](https://docs.superblocks.com/admin/org-administration/auth/access-tokens))

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/superblocks-samples/superblocks-auth0-embedded-app.git
cd superblocks-auth0-embedded-app
cd app && npm install && cd ..
```

This sample uses `@superblocksteam/embed-react@2.0.0`, which resolves from the **public npm registry**. If you use a different version or registry and `npm install` returns **401 Unauthorized**, configure `~/.npmrc` for that registry per [Superblocks](https://docs.superblocks.com/) / your org’s setup, then install again in `app/`.

### 2. Create the Auth0 SPA application

Use the [Auth0 CLI](https://auth0.github.io/auth0-cli/auth0_apps_create.html) (after `auth0 login`):

```bash
auth0 apps create \
  --name "Superblocks Embed (local)" \
  --type spa \
  --callbacks "http://localhost:3000/login/callback" \
  --logout-urls "http://localhost:3000" \
  --origins "http://localhost:3000" \
  --web-origins "http://localhost:3000"
```

Note the **Client ID** and your tenant **Domain** (for example `dev-abc.us.auth0.com`). More detail: [docs/setup-auth0-app.md](docs/setup-auth0-app.md).

### 3. Deploy the Post-Login Action

Copy the code from [auth0/actions/superblocks-login.js](auth0/actions/superblocks-login.js) into an Auth0 Action (trigger: **Login / Post Login**), add the `axios` dependency, create secrets `SUPERBLOCKS_TOKEN` (your embed access token) and optionally `SUPERBLOCKS_REGION` (`app` or `eu`), then add the Action to the **Login** flow. Step-by-step: [docs/auth0-post-login-action.md](docs/auth0-post-login-action.md). The Superblocks tutorial is here: [use-auth-for-sso](https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso).

### 4. Configure the React app

Create React App loads variables whose names start with `REACT_APP_` from a file named **`.env.local`** in the **`app/`** directory (not the repo root). Restart the dev server after you change this file.

```bash
cp app/env.example app/.env.local
```

Edit **`app/.env.local`** in a text editor and set the values below (no quotes needed for simple values; no spaces around `=`).

| Variable | Where to get the value |
| -------- | ---------------------- |
| `REACT_APP_AUTH0_DOMAIN` | Auth0 Dashboard → **Applications** → your SPA → **Settings** → **Domain** (e.g. `dev-abc.us.auth0.com`). Or the tenant domain shown after `auth0 login` / in the CLI output when you create the app. |
| `REACT_APP_AUTH0_CLIENT_ID` | Same Auth0 application page → **Client ID**. If you used the CLI, it prints the client id when the app is created. |
| `REACT_APP_SUPERBLOCKS_APPLICATION_ID` | Superblocks Admin → **Applications** → open your app → copy its **application ID** (UUID) from the URL or app settings. |
| `REACT_APP_SUPERBLOCKS_URL` | Your Superblocks instance **origin only**: `https://app.superblocks.com` (US) or `https://eu.superblocks.com` (EU), or your org’s custom host. Do not include a path or trailing slash. |

Example (replace with your real values):

```env
REACT_APP_AUTH0_DOMAIN=dev-abc.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_SUPERBLOCKS_APPLICATION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_SUPERBLOCKS_URL=https://app.superblocks.com
```

### 5. Run locally

Run this from the **repository root** (the folder that contains the root `package.json`, e.g. `superblocks-auth0-embedded-app`), not from inside `app/`:

```bash
npm start
```

That runs `react-scripts start` in **`app/`** via the root script. You must finish **step 1** first so dependencies exist under **`app/node_modules`** (including `react-scripts`). If you skipped install or it failed, run:

```bash
cd app && npm install && cd ..
```

Then try `npm start` again from the repo root.

**Alternative:** from **`app/`** you can run `npm run dev` (same dev server; uses the `dev` script in `app/package.json`).

Open [http://localhost:3000](http://localhost:3000). You should be redirected to Auth0, then return to the app with the embed loaded.

## Production

For real users, **create a dedicated Auth0 application for production** — and ideally a separate Auth0 **tenant** as well (e.g. `mycompany-dev`, `mycompany-prod`). Don't simply add production URLs to the local SPA you made in step 2; that mixes environments and widens the redirect-URI attack surface. Details and CLI commands: [docs/setup-auth0-app.md → Production application](docs/setup-auth0-app.md#production-application).

1. **Auth0 prod SPA** — create a new SPA in your prod tenant with prod URLs only:

   ```bash
   auth0 tenants use mycompany-prod   # if you split tenants
   auth0 apps create \
     --name "Superblocks Embed (prod)" \
     --type spa \
     --callbacks "https://app.example.com/login/callback" \
     --logout-urls "https://app.example.com" \
     --origins   "https://app.example.com" \
     --web-origins "https://app.example.com"
   ```

2. **Post-Login Action** — repeat [docs/auth0-post-login-action.md](docs/auth0-post-login-action.md) inside the prod tenant, with a production Superblocks embed token in `SUPERBLOCKS_TOKEN`.

3. **Build & host** — `cd app && npm run build` and host `app/build/` on S3, Netlify, Vercel, etc.

4. **Production env vars** — set the **prod** SPA's domain/client id and the prod Superblocks app id/url in your hosting provider's environment variables (`REACT_APP_AUTH0_DOMAIN`, `REACT_APP_AUTH0_CLIENT_ID`, `REACT_APP_SUPERBLOCKS_APPLICATION_ID`, `REACT_APP_SUPERBLOCKS_URL`).

## Configuration reference

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `REACT_APP_AUTH0_DOMAIN` | Yes | Auth0 domain |
| `REACT_APP_AUTH0_CLIENT_ID` | Yes | SPA client ID |
| `REACT_APP_SUPERBLOCKS_APPLICATION_ID` | Yes | Superblocks app ID |
| `REACT_APP_SUPERBLOCKS_URL` | Yes | Superblocks instance URL |
| `REACT_APP_SUPERBLOCKS_APP_VERSION` | No | `2.0` (code mode) or `1.0` (legacy); default `2.0` |

## Scripts

Run **`npm start`** and **`npm run build`** from the **repository root**. Install dependencies from **`app/`** (see step 1).

| Command | Where | Description |
| ------- | ----- | ----------- |
| `npm install` | `app/` | Install React app dependencies (`react-scripts`, embed SDK, etc.) |
| `npm start` | repo root | Start the dev server (port 3000) |
| `npm run build` | `app/` | Production build → `app/build/` |

## Troubleshooting

**`react-scripts: command not found`**  
Dependencies are not installed in **`app/`**. From the repo root run `cd app && npm install`. Confirm **`app/node_modules/.bin/react-scripts`** exists. If `npm install` in `app/` fails with **401** on `@superblocksteam/embed-react`, fix registry authentication (see step 1), then install again.

**`EACCES: permission denied … app/node_modules/.cache`** (or other `EACCES` errors during `npm install` / `npm start`)  
`app/node_modules` was created with elevated permissions (e.g. an earlier `sudo npm install`), so the dev server can't write its cache. Fix ownership and reinstall:

```bash
sudo chown -R "$(id -un)":"$(id -gn)" app/node_modules
cd app && rm -rf node_modules/.cache && npm install
```

**`superblocks_token` missing on ID token**  
Confirm the Action is deployed, secrets are set, `axios` is added, and the Action is attached to the **Login** flow. Sign out and sign in again.

**Redirect URI mismatch**  
Callback URL in Auth0 must exactly match `https://<your-host>/login/callback` (or `http://localhost:3000/login/callback` for local dev).

**EU Superblocks**  
Set Action secret `SUPERBLOCKS_REGION` to `eu` (see [auth0/actions/superblocks-login.js](auth0/actions/superblocks-login.js)).

## Resources

- [Superblocks: Login embed users with Auth0](https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso)
- [Embedded app authentication](https://docs.superblocks.com/hosting/embedded-apps/authentication)
- [Auth0 CLI](https://github.com/auth0/auth0-cli)
- [Auth0 React SDK](https://github.com/auth0/auth0-react)

## License

Sample/demo application for reference (MIT).
