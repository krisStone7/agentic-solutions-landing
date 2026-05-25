import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatDiscordMessage, followUpDecision, handleRetellWebhook, normalizeRetellPayload } from '../functions/api/retell-webhook.js';

const payload = JSON.parse(readFileSync('test/fixtures/retell-completed-call.json', 'utf8'));

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

test('posts completed call to Discord webhook and returns follow-up decision', async () => {
  let posted = null;
  const request = new Request('https://stonebridgebai.com/api/retell-webhook', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const response = await handleRetellWebhook({
    request,
    env: { DISCORD_WEBHOOK_URL: 'https://discord.example/webhook' },
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
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
