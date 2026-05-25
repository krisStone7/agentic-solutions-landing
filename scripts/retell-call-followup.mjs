#!/usr/bin/env node
/**
 * Internal Retell voice-call follow-up queue helper.
 * Creates local JSONL records only. It never contacts leads, sends emails, or creates calendar/CRM records.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeRetellPayload, followUpDecision } from '../functions/api/retell-webhook.js';

const DEFAULT_TASK_FILE = 'tasks/voice-call-followups.jsonl';

function parseArgs(argv) {
  const args = { file: '', taskFile: DEFAULT_TASK_FILE, now: '', list: false, format: 'markdown' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i] || '';
    if (arg === '--file') args.file = next();
    else if (arg === '--task-file') args.taskFile = next();
    else if (arg === '--now') args.now = next();
    else if (arg === '--list') args.list = true;
    else if (arg === '--format') args.format = next();
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return `Usage:
  npm run call:task -- --file test/fixtures/retell-completed-call.json
  npm run call:tasks

Options:
  --file <path>       Retell completed-call JSON fixture or captured payload.
  --task-file <path>  Local JSONL queue, default ${DEFAULT_TASK_FILE}
  --now <iso-date>    Override current time for deterministic tests.
  --list              List local voice-call follow-up records.
  --format json|markdown
`;
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function stableId(summary) {
  return `call-${createHash('sha256').update(`${summary.callId}|${summary.company}|${summary.recommendedNextAction}`).digest('hex').slice(0, 12)}`;
}

function buildVoiceCallTask(summary, options = {}) {
  const now = parseDate(options.now);
  const decision = followUpDecision(summary);
  const priority = summary.urgency === 'high' ? 'high' : decision.action === 'queue_follow_up' ? 'medium' : 'low';
  const status = decision.action === 'archive_qa' ? 'archived_qa' : 'open';
  const dueDate = status === 'open' ? isoDate(addDays(now, priority === 'high' ? 1 : 3)) : null;
  return {
    id: stableId(summary),
    type: 'stonebridge-ai-voice-call-followup',
    status,
    createdAt: now.toISOString(),
    dueDate,
    priority,
    title: status === 'archived_qa'
      ? `Archive QA voice call evidence: ${summary.company}`
      : `Follow up on voice-agent lead: ${summary.company}`,
    call: summary,
    queueRule: decision,
    nextAction: decision.action === 'queue_follow_up'
      ? summary.recommendedNextAction
      : decision.reason,
    draftReply: decision.action === 'queue_follow_up'
      ? {
          status: 'needed',
          note: 'Draft reply should be staged for Kris approval before any external send.',
          approvalRequired: true,
          sendAction: false,
        }
      : null,
    approvalRequiredBeforeExternalAction: true,
    externalActionPerformed: false,
    destination: 'repo-local-jsonl-queue',
  };
}

function readQueue(taskFile) {
  if (!existsSync(taskFile)) return [];
  return readFileSync(taskFile, 'utf8').split('\n').filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`Could not parse ${taskFile} line ${index + 1}: ${error.message}`); }
  });
}

function appendVoiceCallTask(task, taskFile) {
  mkdirSync(dirname(taskFile), { recursive: true });
  const existing = readQueue(taskFile);
  const found = existing.find((item) => item.id === task.id);
  if (found) return { created: false, taskFile, task: found };
  appendFileSync(taskFile, `${JSON.stringify(task)}\n`, 'utf8');
  return { created: true, taskFile, task };
}

function renderTaskResult(result) {
  const task = result.task;
  return [
    '# Voice-call Follow-up Queue',
    '',
    `Task ${result.created ? 'created' : 'already queued'}: ${task.id}`,
    `Queue file: ${result.taskFile}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Due: ${task.dueDate || 'none'}`,
    `Company: ${task.call.company}`,
    `Caller: ${task.call.caller}`,
    `Queue rule: ${task.queueRule.action} - ${task.queueRule.reason}`,
    `External action enabled: no`,
    `Approval required before external action: yes`,
  ].join('\n');
}

function renderList(taskFile) {
  const tasks = readQueue(taskFile);
  const lines = ['# Voice-call Follow-up Queue', '', `Queue file: ${taskFile}`, `Records: ${tasks.length}`];
  for (const task of tasks) {
    lines.push('', `- ${task.id} [${task.status}] ${task.priority}`, `  Company: ${task.call?.company || 'Unknown'}`, `  Due: ${task.dueDate || 'none'}`, `  Next: ${task.nextAction || 'Not provided'}`, '  External action enabled: no');
  }
  return lines.join('\n');
}

export { buildVoiceCallTask, appendVoiceCallTask, readQueue };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usage()); return; }
  if (args.list) {
    const result = args.format === 'json' ? { taskFile: args.taskFile, tasks: readQueue(args.taskFile) } : renderList(args.taskFile);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    return;
  }
  if (!args.file) throw new Error('--file is required unless --list is used.');
  const payload = JSON.parse(readFileSync(args.file, 'utf8'));
  const summary = normalizeRetellPayload(payload);
  const result = appendVoiceCallTask(buildVoiceCallTask(summary, { now: args.now }), args.taskFile);
  console.log(args.format === 'json' ? JSON.stringify(result, null, 2) : renderTaskResult(result));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[retell-call-followup] ${error.message}`);
    process.exit(1);
  });
}
