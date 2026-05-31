# Retell Live Deployment Checklist

Purpose: move the local Retell -> Discord MVP from tested code to a live Stonebridge AI demo path.

## Current status

- Local webhook code exists: `functions/api/retell-webhook.js`
- Local follow-up helper exists: `scripts/retell-call-followup.mjs`
- Unit/integration tests pass locally with a mocked Discord webhook
- Production build passes locally
- No live Discord webhook secret has been configured by Volt
- Retell webhook signature verification is implemented locally and must be deployed with `RETELL_WEBHOOK_API_KEY` before live testing
- No Retell webhook configuration has been changed by Volt
- No real call has been placed by Volt

## Deployment target

Cloudflare Pages project serving:

```text
https://stonebridgeai.co
```

Expected live endpoint after deploy:

```text
POST https://stonebridgeai.co/api/retell-webhook
```

Cloudflare Pages Functions should route `functions/api/retell-webhook.js` to that endpoint.

## Required secrets

Set these in Cloudflare Pages project settings, not in git:

```text
RETELL_WEBHOOK_API_KEY=<Retell API key with webhook badge>
DISCORD_WEBHOOK_URL=<Discord webhook URL for #inbound-calls>
```

`RETELL_API_KEY` is also accepted for Retell verification. `RETELL_WEBHOOK_API_KEY` is preferred because it makes the secret purpose explicit.

Security requirements:

- Keep the webhook URL and bot token out of repository files, Discord chat, logs, screenshots, and test fixtures.
- Rotate any secret immediately if exposed.
- The webhook code sends `allowed_mentions: { parse: [] }` to avoid accidental pings.
- The webhook rejects unsigned, expired, or invalid `X-Retell-Signature` requests with HTTP 401.
- Retell signatures are checked as `HMAC-SHA256(raw_body + timestamp, Retell webhook API key)` with a 5 minute replay window.

## Pre-deploy validation

From repo root:

```bash
npm test
npm run build
```

Expected result:

- All tests pass
- Vite production build succeeds

## Deploy options

### Option A: Git-backed Cloudflare Pages deployment

Use this if the Cloudflare Pages project already builds from GitHub.

1. Review local diff.
2. Commit the webhook, tests, scripts, and docs.
3. Push to GitHub.
4. Confirm Cloudflare Pages deploy succeeds.
5. Confirm the live endpoint is present.

### Option B: Direct Wrangler deployment

Use this if Cloudflare credentials are available on the host and direct deployment is preferred.

1. Confirm Wrangler is authenticated.
2. Set the secret using Wrangler or the Cloudflare dashboard.
3. Deploy the Pages project.
4. Confirm the live endpoint is present.

Volt should not choose this path without Kris approval because it changes live infrastructure.

## Retell configuration

In Retell, set the agent webhook URL to:

```text
https://stonebridgeai.co/api/retell-webhook
```

Subscribe/send completed or analyzed call events. The webhook accepts events/statuses matching completed, ended, analyzed, or post-call patterns.

## Real test call checklist

1. Place one test call to the Retell agent number.
2. Use a clearly synthetic caller identity, for example `Test Caller / Example Co`.
3. Ask for an AI receptionist that captures missed calls and qualifies leads.
4. Wait for the Retell completed/analyzed event.
5. Verify `#inbound-calls` receives a message containing:
   - caller
   - company
   - contact
   - intent
   - urgency
   - summary
   - recommended next action
   - escalation flag
   - confidence
   - call ID
   - transcript
   - follow-up queue rule
6. Confirm no email, calendar invite, CRM update, or outbound contact occurred.

## Follow-up queue handling

For a captured payload file:

```bash
npm run call:task -- --file path/to/retell-payload.json
npm run call:tasks
```

The queue helper writes internal JSONL records only and marks `externalActionPerformed: false`.

## Go/no-go criteria

Go live only if:

- Tests pass
- Build passes
- Retell signature verification is configured with `RETELL_WEBHOOK_API_KEY` or `RETELL_API_KEY`
- Discord delivery is configured as either `DISCORD_WEBHOOK_URL`, or `DISCORD_BOT_TOKEN` plus `DISCORD_CHANNEL_ID`
- Retell points to the correct endpoint
- One real test call posts correctly to Discord
- Follow-up tasks remain internal and approval-gated

Rollback:

- Remove or disable the Retell webhook URL in Retell
- Remove/rotate `DISCORD_WEBHOOK_URL` if needed
- Revert the deployment commit if the endpoint causes errors
