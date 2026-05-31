import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatDiscordMessage, followUpDecision, handleRetellWebhook, normalizeRetellPayload, parseRetellSignature, verifyRetellSignature } from '../functions/api/retell-webhook.js';

const payload = JSON.parse(readFileSync('test/fixtures/retell-completed-call.json', 'utf8'));
const retellApiKey = 'retell_test_webhook_key';
const signedNow = 1780000000000;

function retellSignature(rawBody, apiKey = retellApiKey, timestamp = signedNow) {
  const digest = createHmac('sha256', apiKey).update(`${rawBody}${timestamp}`).digest('hex');
  return `v=${timestamp},d=${digest}`;
}

function signedRetellRequest(body, { apiKey = retellApiKey, timestamp = signedNow } = {}) {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://stonebridgeai.co/api/retell-webhook', {
    method: 'POST',
    headers: { 'X-Retell-Signature': retellSignature(rawBody, apiKey, timestamp) },
    body: rawBody,
  });
}

test('normalizes completed Retell call into required Discord summary fields', () => {
  const summary = normalizeRetellPayload(payload);
  assert.equal(summary.callId, 'retell-call-001');
  assert.equal(summary.caller, 'Morgan Rivera');
  assert.equal(summary.company, 'Example Co');
  assert.equal(summary.contact, '+13105550123 / test@example.com');
  assert.equal(summary.intent, 'lead');
  assert.equal(summary.urgency, 'normal');
  assert.match(summary.summary, /AI receptionist/);
  assert.equal(summary.recommendedNextAction, 'schedule consult');
  assert.equal(summary.escalationRequired, 'No');
  assert.equal(summary.confidence, '0.86');
  assert.match(summary.transcript, /Stonebridge AI/);
});

test('formats Discord message without mentions and with call fields', () => {
  const content = formatDiscordMessage(normalizeRetellPayload(payload));
  assert.match(content, /\*\*New voice-agent call\*\*/);
  assert.match(content, /Caller: Morgan Rivera/);
  assert.match(content, /Call ID: `retell-call-001`/);
  assert.doesNotMatch(content, /@everyone|@here/);
});

test('applies simple follow-up queue rule for lead calls and QA calls', () => {
  const leadDecision = followUpDecision(normalizeRetellPayload(payload));
  assert.equal(leadDecision.action, 'queue_follow_up');

  const qaDecision = followUpDecision({ ...normalizeRetellPayload(payload), company: 'Stonebridge QA Test', caller: 'Test Caller' });
  assert.equal(qaDecision.action, 'archive_qa');
});


test('verifies Retell webhook signatures using raw body plus timestamp', async () => {
  const rawBody = JSON.stringify(payload);
  const signature = retellSignature(rawBody);

  assert.deepEqual(parseRetellSignature(signature), {
    timestamp: String(signedNow),
    digest: signature.split('d=')[1],
  });
  assert.equal(await verifyRetellSignature({ rawBody, signature, apiKey: retellApiKey, now: signedNow }), true);
  assert.equal(await verifyRetellSignature({ rawBody, signature, apiKey: 'wrong-key', now: signedNow }), false);
});

test('rejects Retell webhooks with missing, expired, or invalid signatures', async () => {
  const rawBody = JSON.stringify(payload);
  const env = { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook', RETELL_API_KEY: retellApiKey };

  const missing = await handleRetellWebhook({
    request: new Request('https://stonebridgeai.co/api/retell-webhook', { method: 'POST', body: rawBody }),
    env,
    now: signedNow,
  });
  assert.equal(missing.status, 401);

  const expired = await handleRetellWebhook({
    request: signedRetellRequest(rawBody, { timestamp: signedNow - (6 * 60 * 1000) }),
    env,
    now: signedNow,
  });
  assert.equal(expired.status, 401);

  const badDigest = await handleRetellWebhook({
    request: new Request('https://stonebridgeai.co/api/retell-webhook', {
      method: 'POST',
      headers: { 'X-Retell-Signature': `v=${signedNow},d=${'0'.repeat(64)}` },
      body: rawBody,
    }),
    env,
    now: signedNow,
  });
  assert.equal(badDigest.status, 401);
});

test('requires a configured Retell webhook API key before processing POSTs', async () => {
  const response = await handleRetellWebhook({
    request: signedRetellRequest(payload),
    env: { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook' },
    now: signedNow,
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.error, /signature verification is not configured/);
});

test('posts completed call to Discord webhook and returns follow-up decision', async () => {
  let posted = null;
  const request = signedRetellRequest(payload);
  const response = await handleRetellWebhook({
    request,
    env: { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook', RETELL_API_KEY: retellApiKey },
    now: signedNow,
    fetchImpl: async (url, init) => {
      posted = { url, body: JSON.parse(init.body) };
      return new Response(null, { status: 204 });
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.callId, 'retell-call-001');
  assert.equal(body.followUp.action, 'queue_follow_up');
  assert.equal(posted.url, 'https://discord.example/webhook');
  assert.match(posted.body.content, /Follow-up queue rule: queue_follow_up/);
});
import { buildVoiceCallTask, appendVoiceCallTask, readQueue } from '../scripts/retell-call-followup.mjs';

test('creates local internal follow-up task records for voice-agent leads', () => {
  const summary = normalizeRetellPayload(payload);
  const task = buildVoiceCallTask(summary, { now: '2026-05-25T12:00:00.000Z' });
  assert.equal(task.status, 'open');
  assert.equal(task.priority, 'medium');
  assert.equal(task.dueDate, '2026-05-28');
  assert.equal(task.draftReply.sendAction, false);
  assert.equal(task.externalActionPerformed, false);

  const dir = mkdtempSync(join(tmpdir(), 'voice-call-task-'));
  const taskFile = join(dir, 'voice-call-followups.jsonl');
  assert.equal(appendVoiceCallTask(task, taskFile).created, true);
  assert.equal(appendVoiceCallTask(task, taskFile).created, false);
  assert.equal(readQueue(taskFile).length, 1);
});
