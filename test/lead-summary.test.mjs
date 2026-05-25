import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendFollowUpTask, buildFollowUpTask, buildSummary, listFollowUpTasks, markTaskHandled } from '../scripts/lead-summary.mjs';

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
  assert.match(summary.draftReply, /Pass --include-draft/);
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


test('generates a staged Phase 2 follow-up draft for a high-fit lead', () => {
  const text = readFileSync('test/fixtures/high-fit-intake.txt', 'utf8');
  const summary = buildSummary({
    message_id: 'fixture-high-fit',
    subject: 'Stonebridge AI intake: Acme Field Services',
    labels: ['website-intake'],
    text,
  }, 'fixture', { includeDraft: true });

  assert.equal(summary.fitScore, 'high');
  assert.equal(summary.draftReply.status, 'staged');
  assert.equal(summary.draftReply.approvalRequired, true);
  assert.equal(summary.draftReply.sendAction, false);
  assert.match(summary.draftReply.subject, /Acme Field Services/);
  assert.match(summary.draftReply.body, /Hi Jordan/);
  assert.match(summary.draftReply.body, /A few quick questions/);
});

test('does not generate an email body when prompt-injection text is flagged', () => {
  const text = readFileSync('test/fixtures/prompt-injection-intake.txt', 'utf8');
  const summary = buildSummary({
    message_id: 'fixture-injection',
    subject: 'Stonebridge AI intake: Injection Test Co',
    labels: ['website-intake'],
    text,
  }, 'fixture', { includeDraft: true });

  assert.equal(summary.draftReply.status, 'blocked');
  assert.equal(summary.draftReply.sendAction, false);
  assert.match(summary.draftReply.reason, /Prompt-injection/);
});


test('creates an internal Phase 3 follow-up task in a local JSONL queue', () => {
  const text = readFileSync('test/fixtures/high-fit-intake.txt', 'utf8');
  const summary = buildSummary({
    message_id: 'fixture-high-fit',
    subject: 'Stonebridge AI intake: Acme Field Services',
    labels: ['website-intake'],
    text,
  }, 'fixture', { includeDraft: true });

  const task = buildFollowUpTask(summary, { now: '2026-05-24T12:00:00.000Z' });
  assert.equal(task.type, 'stonebridge-ai-lead-followup');
  assert.equal(task.status, 'open');
  assert.equal(task.priority, 'medium');
  assert.equal(task.dueDate, '2026-05-27');
  assert.equal(task.approvalRequiredBeforeExternalAction, true);
  assert.equal(task.draftReply.sendAction, false);

  const dir = mkdtempSync(join(tmpdir(), 'lead-task-'));
  const taskFile = join(dir, 'lead-followups.jsonl');
  const first = appendFollowUpTask(task, taskFile);
  const second = appendFollowUpTask(task, taskFile);
  const lines = readFileSync(taskFile, 'utf8').trim().split('\n');

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).id, task.id);
});

test('lists open internal follow-up tasks with overdue status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lead-task-list-'));
  const taskFile = join(dir, 'lead-followups.jsonl');
  const openTask = {
    id: 'lead-open',
    status: 'open',
    priority: 'high',
    dueDate: '2026-05-20',
    createdAt: '2026-05-19T00:00:00.000Z',
    title: 'Follow up with Northstar',
    lead: { company: 'Northstar Field Services', email: 'morgan@example.com' },
    nextAction: 'Schedule discovery.',
  };
  const handledTask = {
    id: 'lead-handled',
    status: 'handled',
    priority: 'low',
    dueDate: '2026-05-18',
    createdAt: '2026-05-18T00:00:00.000Z',
    title: 'Handled task',
  };
  appendFollowUpTask(openTask, taskFile);
  appendFollowUpTask(handledTask, taskFile);

  const result = listFollowUpTasks(taskFile, { now: '2026-05-24T12:00:00.000Z' });

  assert.equal(result.total, 2);
  assert.equal(result.open, 1);
  assert.equal(result.overdue, 1);
  assert.equal(result.shown, 1);
  assert.equal(result.tasks[0].id, 'lead-open');
  assert.equal(result.tasks[0].overdue, true);
});

test('marks an internal follow-up task handled without external action', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lead-task-handle-'));
  const taskFile = join(dir, 'lead-followups.jsonl');
  const task = {
    id: 'lead-handle-me',
    status: 'open',
    priority: 'medium',
    dueDate: '2026-05-25',
    title: 'Follow up with Acme',
  };
  appendFollowUpTask(task, taskFile);

  const result = markTaskHandled(taskFile, 'lead-handle-me', {
    now: '2026-05-26T12:00:00.000Z',
    note: 'Kris handled manually.',
  });
  const list = listFollowUpTasks(taskFile, { now: '2026-05-26T12:00:00.000Z', all: true });

  assert.equal(result.changed, true);
  assert.equal(result.task.status, 'handled');
  assert.equal(result.task.handledNote, 'Kris handled manually.');
  assert.equal(result.task.externalActionPerformed, false);
  assert.equal(list.open, 0);
  assert.equal(list.tasks[0].status, 'handled');
});
