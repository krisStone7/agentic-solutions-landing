import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSummary } from '../scripts/lead-summary.mjs';

test('parses synthetic E2E intake into Phase 1 summary fields', () => {
  const text = readFileSync('test/fixtures/e2e-intake.txt', 'utf8');
  const summary = buildSummary({
    message_id: 'fixture-e2e',
    subject: 'Stonebridge AI intake: Stonebridge AI Test E2E-20260523T080527Z',
    labels: ['website-intake', 'lead', 'stonebridge-ai'],
    text,
    created_at: '2026-05-23T08:05:28.331Z',
  }, 'fixture');

  assert.equal(summary.companyAndContact.company, 'Stonebridge AI Test E2E-20260523T080527Z');
  assert.equal(summary.companyAndContact.email, 'volt-e2e-test@example.com');
  assert.match(summary.workflowTheyWantImproved, /Verify live Cloudflare Pages/);
  assert.equal(summary.fitScore, 'low');
  assert.equal(summary.urgencyScore, 'high');
  assert.equal(summary.promptInjectionRisk, 'none detected');
  assert.match(summary.draftReply, /Not generated in Phase 1/);
});

test('flags prompt-injection text as untrusted lead content', () => {
  const text = readFileSync('test/fixtures/prompt-injection-intake.txt', 'utf8');
  const summary = buildSummary({
    message_id: 'fixture-injection',
    subject: 'Stonebridge AI intake: Injection Test Co',
    labels: ['website-intake'],
    text,
  }, 'fixture');

  assert.equal(summary.promptInjectionRisk, 'flagged');
  assert.match(summary.recommendedNextAction, /Review manually/);
});
