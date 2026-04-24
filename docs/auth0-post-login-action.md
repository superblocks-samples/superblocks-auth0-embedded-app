# Auth0 Post-Login Action (Superblocks token)

This replaces the old Lambda token exchange: Superblocks session minting runs inside Auth0 during login, and the React app reads the `superblocks_token` claim from the ID token.

Official Superblocks steps: [Login embed users with Auth0](https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso).

## Source file in this repo

Use [auth0/actions/superblocks-login.js](../auth0/actions/superblocks-login.js) as the Action body (adjust `metadata` / `groupIds` if needed).

> **Per environment.** Actions live inside a tenant. If you use separate dev/prod tenants (recommended — see [setup-auth0-app.md](setup-auth0-app.md#tenants-and-environments-read-this-first)), repeat the steps below in **each** tenant and give the prod Action a production-grade `SUPERBLOCKS_TOKEN`.

## Dashboard setup

1. In Auth0: **Actions → Library → Build Custom → Build from scratch**.
2. **Name:** e.g. `Superblocks Login`  
   **Trigger:** **Login / Post Login**
3. **Secrets** (Action → **Secrets**):
   - `SUPERBLOCKS_TOKEN` — your Superblocks **Embed** access token
   - (optional) `SUPERBLOCKS_REGION` — `app` (default) or `eu`
4. **Dependencies:** add **`axios`**.
5. Paste the code from `auth0/actions/superblocks-login.js`.
6. **Deploy** the Action.
7. **Actions → Flows → Login** — drag the Action into the flow and **Apply**.

## Auth0 CLI (optional)

You can manage Actions with the CLI; see Auth0’s docs for your CLI version, for example:

- [Install the Auth0 CLI](https://auth0.com/docs/deploy-monitor/auth0-cli/install-auth0-cli)
- [Manage Actions using the CLI](https://auth0.com/docs/deploy-monitor/auth0-cli/manage-actions)

Typical workflow: create or update the Action in the dashboard once, then use `auth0 actions list` / `auth0 actions show` to inspect. Full “deploy from Git” automation is organization-specific; this sample optimizes for the documented Dashboard + copy-paste path.

## Verify

After a full login (sign out of the app and Auth0 if needed), decode the ID token in [jwt.io](https://jwt.io) (do not share production tokens) or log `await getIdTokenClaims()` in development — you should see `superblocks_token`.

If the claim is missing, the Action did not run, secrets are wrong, or the Action is not in the Login flow.
