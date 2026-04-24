/**
 * Auth0 Post-Login Action: fetch a Superblocks session and add it to the ID token.
 *
 * Dashboard: Actions → Library → Create → Build from scratch
 * Trigger: Login / Post Login
 *
 * Secrets (Action → Secrets):
 *   SUPERBLOCKS_TOKEN — Embed access token from Superblocks Admin
 *   (optional) SUPERBLOCKS_REGION — "app" (default) or "eu"
 *
 * Dependencies: add `axios` in the Action editor.
 *
 * @see https://docs.superblocks.com/hosting/embedded-apps/how-tos/use-auth-for-sso
 */
exports.onExecutePostLogin = async (event, api) => {
  const axios = require("axios");

  const region = event.secrets.SUPERBLOCKS_REGION || "app";
  const superblocksTokenUrl = `https://${region}.superblocks.com/api/v1/public/token`;

  const user = {
    email: event.user.email,
    name: event.user.name,
    metadata: {
      // "externalUserId": event.user.user_metadata?.id,
      // "externalOrgId": event.organization?.metadata?.id,
    },
    // groupIds: ["<YOUR_GROUP_IDS>"],
  };

  const response = await axios.request({
    method: "post",
    url: superblocksTokenUrl,
    headers: {
      authorization: `Bearer ${event.secrets.SUPERBLOCKS_TOKEN}`,
      "content-type": "application/json",
    },
    data: user,
  });

  const token = response.data;
  api.idToken.setCustomClaim("superblocks_token", token.access_token);
};
