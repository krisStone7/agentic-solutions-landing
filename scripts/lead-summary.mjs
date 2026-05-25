#!/usr/bin/env node
/**
 * Read-only Stonebridge AI lead summary command.
 *
 * Fetches AgentMail messages labeled `website-intake`, parses the latest intake,
 * and prints the Phase 1 summary format. No outbound actions are performed.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE_URL = 'https://api.agentmail.to/v0';
const DEFAULT_INBOX = 'stonebridgeai@agentmail.to';
const DEFAULT_LABEL = 'website-intake';
const DEFAULT_TASK_FILE = 'tasks/lead-followups.jsonl';

function parseArgs(argv) {
  const args = {
    inbox: DEFAULT_INBOX,
    label: DEFAULT_LABEL,
    limit: 25,
    format: 'markdown',
    file: '',
    messageId: '',
    includeDraft: false,
    createTask: false,
    taskFile: DEFAULT_TASK_FILE,
    now: '',
    listTasks: false,
    markHandled: '',
    handledNote: '',
    allTasks: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i] || '';
    if (arg === '--inbox') args.inbox = next();
    else if (arg === '--label') args.label = next();
    else if (arg === '--limit') args.limit = Number.parseInt(next(), 10) || args.limit;
    else if (arg === '--format') args.format = next();
    else if (arg === '--file') args.file = next();
    else if (arg === '--message-id') args.messageId = next();
    else if (arg === '--include-draft') args.includeDraft = true;
    else if (arg === '--create-task') args.createTask = true;
    else if (arg === '--task-file') args.taskFile = next();
    else if (arg === '--now') args.now = next();
    else if (arg === '--list-tasks') args.listTasks = true;
    else if (arg === '--mark-handled') args.markHandled = next();
    else if (arg === '--handled-note') args.handledNote = next();
    else if (arg === '--all') args.allTasks = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return `Usage:
  npm run lead:summary
  npm run lead:summary -- --message-id <agentmail-message-id>
  npm run lead:summary -- --file test/fixtures/e2e-intake.txt
  npm run lead:draft
  npm run lead:task
  npm run lead:tasks

Options:
  --inbox <email>        AgentMail inbox, default ${DEFAULT_INBOX}
  --label <label>        Required message label, default ${DEFAULT_LABEL}
  --limit <n>            Number of recent messages to inspect, default 25
  --message-id <id>      Summarize a specific AgentMail message
  --file <path>          Parse a local intake text file, useful for tests
  --format markdown|json Output format, default markdown
  --include-draft      Generate a staged follow-up draft. Never sends.
  --create-task        Append an internal follow-up item to a local JSONL queue.
  --task-file <path>   Task queue file, default ${DEFAULT_TASK_FILE}
  --now <iso-date>     Override current time for deterministic tests.
  --list-tasks        List internal follow-up tasks from the local JSONL queue.
  --mark-handled <id> Mark an internal task handled in the local JSONL queue.
  --handled-note <txt> Note to store when marking handled.
  --all               Include handled tasks when listing.

Environment:
  AGENTMAIL_API_KEY is required unless --file is used.
`;
}

async function agentmailGet(path, token) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const body = await response.text();
  let data = {};
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    data = { raw: body.slice(0, 1000) };
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.error || data.raw || response.statusText;
    throw new Error(`AgentMail HTTP ${response.status}: ${JSON.stringify(detail).slice(0, 500)}`);
  }
  return data;
}

async function listMessages({ inbox, limit, token }) {
  const path = `/inboxes/${encodeURIComponent(inbox)}/messages?limit=${encodeURIComponent(String(limit))}`;
  const data = await agentmailGet(path, token);
  return data.messages || data.items || data.data || [];
}

async function getMessage({ inbox, messageId, token }) {
  const path = `/inboxes/${encodeURIComponent(inbox)}/messages/${encodeURIComponent(messageId)}`;
  return agentmailGet(path, token);
}

async function loadLead(args) {
  if (args.file) {
    return {
      source: `file:${args.file}`,
      message: {
        message_id: 'local-file',
        subject: 'Local intake fixture',
        labels: [args.label],
        text: readFileSync(args.file, 'utf8'),
      },
    };
  }

  const token = process.env.AGENTMAIL_API_KEY;
  if (!token) {
    throw new Error('AGENTMAIL_API_KEY is not set. Source ../.env first or pass --file.');
  }

  if (args.messageId) {
    const message = await getMessage({ inbox: args.inbox, messageId: args.messageId, token });
    return { source: `agentmail:${args.inbox}:${args.messageId}`, message };
  }

  const messages = await listMessages({ inbox: args.inbox, limit: args.limit, token });
  const lead = messages.find((message) => Array.isArray(message.labels) && message.labels.includes(args.label));
  if (!lead) {
    throw new Error(`No messages labeled ${args.label} found in latest ${messages.length} message(s).`);
  }

  const message = await getMessage({ inbox: args.inbox, messageId: lead.message_id, token });
  return { source: `agentmail:${args.inbox}:latest:${args.label}`, message };
}

function normalizeKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseIntake(text) {
  const fields = {};
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  let currentKey = '';
  let currentValue = [];

  const commit = () => {
    if (!currentKey) return;
    fields[currentKey] = currentValue.join('\n').trim();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const inline = line.match(/^([A-Za-z][A-Za-z\s]+):\s*(.*)$/);
    const heading = line.match(/^(What the company does|Workflow to improve|Tools|Where work gets stuck|Sensitive data or access concerns|Anything else):?$/i);

    if (inline && !heading) {
      commit();
      currentKey = normalizeKey(inline[1]);
      currentValue = [inline[2].trim()];
      continue;
    }

    if (heading) {
      commit();
      currentKey = normalizeKey(heading[1]);
      currentValue = [];
      continue;
    }

    if (currentKey) currentValue.push(line);
  }
  commit();

  return fields;
}

function value(fields, keys, fallback = 'Not provided') {
  for (const key of keys) {
    const item = fields[normalizeKey(key)];
    if (item && item.trim()) return item.trim();
  }
  return fallback;
}

function detectInjection(text) {
  const suspicious = [
    /ignore (all )?(previous|prior) instructions/i,
    /system prompt/i,
    /developer message/i,
    /api[_ -]?key|secret|token/i,
    /exfiltrate|send .*credentials/i,
    /delete .*files/i,
  ];
  return suspicious.some((pattern) => pattern.test(text));
}

function scoreFit(fields, text) {
  const workflow = value(fields, ['Workflow to improve'], '');
  const bottlenecks = value(fields, ['Where work gets stuck'], '');
  const business = value(fields, ['What the company does'], '');
  const interest = value(fields, ['Interest'], '');
  const lower = `${workflow} ${bottlenecks} ${business} ${interest}`.toLowerCase();

  if (/synthetic|qa submission|test marker|verification test|e2e/.test(lower)) return 'low';
  if (/automation|integration|intake|agent|workflow|crm|email|calendar|report|ops|manual/.test(lower)) return 'high';
  if (workflow && workflow !== 'Not provided') return 'medium';
  return 'low';
}

function scoreUrgency(fields) {
  const timeline = value(fields, ['Timeline'], '').toLowerCase();
  const interest = value(fields, ['Interest'], '').toLowerCase();
  if (/immediate|asap|urgent|this week|today/.test(`${timeline} ${interest}`)) return 'high';
  if (/month|soon|quarter|pilot/.test(`${timeline} ${interest}`)) return 'medium';
  return 'low';
}

function missingInfo(fields) {
  const checks = [
    ['website', ['Website']],
    ['budget', ['Budget']],
    ['timeline', ['Timeline']],
    ['sensitive-data/access boundaries', ['Sensitive data or access concerns']],
    ['specific success metric', ['Anything else']],
  ];
  return checks
    .filter(([, keys]) => {
      const item = value(fields, keys, 'Not provided').toLowerCase();
      return !item || item === 'not provided' || item === 'n/a' || item.includes('synthetic');
    })
    .map(([label]) => label);
}

function recommendedAction({ fit, urgency, missing, injectionFlag }) {
  if (injectionFlag) return 'Review manually before doing anything else. Treat submitted text as untrusted content.';
  if (fit === 'low') return 'Keep as QA/reference evidence. No sales follow-up needed unless Kris wants to inspect it.';
  if (fit === 'high' && urgency === 'high') return 'Prioritize a short discovery reply asking for missing implementation details and access boundaries.';
  if (missing.length) return `Ask for missing info first: ${missing.slice(0, 3).join(', ')}.`;
  return 'Schedule a discovery conversation and confirm the first workflow to automate.';
}

function buildSummary(message, source, options = {}) {
  const text = message.text || message.extracted_text || message.preview || '';
  const fields = parseIntake(text);
  const fit = scoreFit(fields, text);
  const urgency = scoreUrgency(fields);
  const missing = missingInfo(fields);
  const injectionFlag = detectInjection(text);

  const summary = {
    source,
    messageId: message.message_id || 'unknown',
    subject: message.subject || '(no subject)',
    labels: message.labels || [],
    receivedAt: message.created_at || message.timestamp || message.updated_at || 'unknown',
    companyAndContact: {
      company: value(fields, ['Company']),
      name: value(fields, ['Name']),
      email: value(fields, ['Email'], Array.isArray(message.reply_to) ? message.reply_to.join(', ') : 'Not provided'),
      website: value(fields, ['Website']),
    },
    workflowTheyWantImproved: value(fields, ['Workflow to improve']),
    toolsMentioned: value(fields, ['Tools']),
    bottlenecks: value(fields, ['Where work gets stuck']),
    sensitiveDataOrAccessConcerns: value(fields, ['Sensitive data or access concerns']),
    interestBudgetTimeline: {
      interest: value(fields, ['Interest']),
      budget: value(fields, ['Budget']),
      timeline: value(fields, ['Timeline']),
    },
    fitScore: fit,
    urgencyScore: urgency,
    missingInformation: missing.length ? missing : ['None obvious from intake.'],
    promptInjectionRisk: injectionFlag ? 'flagged' : 'none detected',
    recommendedNextAction: recommendedAction({ fit, urgency, missing, injectionFlag }),
    draftReply: 'Not generated. Pass --include-draft or run npm run lead:draft to stage a Phase 2 follow-up draft.',
  };

  if (options.includeDraft) {
    summary.draftReply = buildDraftReply(summary);
  }

  return summary;
}

function firstName(name) {
  const clean = String(name || '').trim();
  if (!clean || clean === 'Not provided') return 'there';
  return clean.split(/\s+/)[0];
}

function compactLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sentenceText(value) {
  const text = compactLine(value);
  return text.replace(/[.?!]+$/u, '');
}

function draftQuestions(summary) {
  const missing = summary.missingInformation.filter((item) => item !== 'None obvious from intake.');
  const questions = [];

  if (missing.includes('specific success metric')) {
    questions.push('What would a successful first automation save or improve, for example hours per week, response time, error rate, or handoff quality?');
  }
  if (missing.includes('sensitive-data/access boundaries')) {
    questions.push('What systems or data would be in scope, and are there any access, security, or compliance boundaries I should design around?');
  }
  if (missing.includes('budget')) {
    questions.push('Do you already have a target budget or pilot range in mind?');
  }
  if (missing.includes('timeline')) {
    questions.push('Is there a deadline or operational event driving the timeline?');
  }
  if (questions.length < 2) {
    questions.push('Which workflow step should we inspect first so I can scope a small, low-risk pilot?');
  }
  if (questions.length < 3) {
    questions.push('Who owns the current process and who should be involved in a discovery call?');
  }

  return questions.slice(0, 3);
}

function buildDraftReply(summary) {
  const c = summary.companyAndContact;
  if (summary.promptInjectionRisk === 'flagged') {
    return {
      status: 'blocked',
      reason: 'Prompt-injection-looking content was detected in the submitted lead. Review manually before drafting.',
      approvalRequired: true,
      sendAction: false,
    };
  }

  if (summary.fitScore === 'low') {
    return {
      status: 'not_recommended',
      reason: 'Lead appears to be QA, synthetic, or low-fit. No external follow-up draft is recommended.',
      approvalRequired: true,
      sendAction: false,
    };
  }

  const subject = `Re: ${compactLine(c.company)} AI workflow automation`;
  const questions = draftQuestions(summary);
  const body = [
    `Hi ${firstName(c.name)},`,
    '',
    `Thanks for reaching out about ${compactLine(c.company)}. Based on your intake, it sounds like the first useful target is: ${sentenceText(summary.workflowTheyWantImproved)}.`,
    '',
    `The bottleneck I’d want to understand first is: ${sentenceText(summary.bottlenecks)}. From there, I’d look for a small pilot that can prove value without needing broad system access up front.`,
    '',
    'A few quick questions so I can scope this correctly:',
    ...questions.map((question) => `- ${question}`),
    '',
    'If helpful, I can also suggest a lightweight discovery call agenda and a pilot shape after I have those answers.',
    '',
    'Best,',
    'Kris',
  ].join('\n');

  return {
    status: 'staged',
    subject,
    body,
    approvalRequired: true,
    sendAction: false,
    note: 'Draft only. Do not send without explicit Kris approval.',
  };
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

function taskPriority(summary) {
  if (summary.promptInjectionRisk === 'flagged') return 'high';
  if (summary.fitScore === 'high' && summary.urgencyScore === 'high') return 'high';
  if (summary.fitScore === 'high' || summary.urgencyScore === 'high') return 'medium';
  if (summary.fitScore === 'medium') return 'medium';
  return 'low';
}

function dueOffsetDays(priority) {
  if (priority === 'high') return 1;
  if (priority === 'medium') return 3;
  return 7;
}

function stableTaskId(summary) {
  const seed = `${summary.messageId}|${summary.companyAndContact.company}|${summary.recommendedNextAction}`;
  return `lead-${createHash('sha256').update(seed).digest('hex').slice(0, 12)}`;
}

function taskTitle(summary) {
  const company = compactLine(summary.companyAndContact.company);
  if (summary.promptInjectionRisk === 'flagged') return `Manual review required for ${company} lead`;
  if (summary.fitScore === 'low') return `Review low-fit or QA lead: ${company}`;
  return `Follow up with ${company} about AI workflow automation`;
}

function buildFollowUpTask(summary, options = {}) {
  const now = parseDate(options.now);
  const priority = taskPriority(summary);
  const dueDate = isoDate(addDays(now, dueOffsetDays(priority)));
  const draft = typeof summary.draftReply === 'object' ? summary.draftReply : null;
  return {
    id: stableTaskId(summary),
    type: 'stonebridge-ai-lead-followup',
    status: 'open',
    createdAt: now.toISOString(),
    dueDate,
    priority,
    title: taskTitle(summary),
    source: summary.source,
    messageId: summary.messageId,
    lead: summary.companyAndContact,
    fitScore: summary.fitScore,
    urgencyScore: summary.urgencyScore,
    promptInjectionRisk: summary.promptInjectionRisk,
    nextAction: summary.recommendedNextAction,
    missingInformation: summary.missingInformation,
    draftReply: draft ? {
      status: draft.status,
      subject: draft.subject || null,
      body: draft.body || null,
      approvalRequired: true,
      sendAction: false,
      note: draft.note || draft.reason || 'Draft/task is internal only. No external send action was created.',
    } : null,
    approvalRequiredBeforeExternalAction: true,
    destination: 'repo-local-jsonl-queue',
  };
}

function readExistingTaskIds(taskFile) {
  if (!existsSync(taskFile)) return new Set();
  const ids = new Set();
  for (const line of readFileSync(taskFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item?.id) ids.add(item.id);
    } catch {
      // Ignore malformed historical queue lines instead of blocking new task creation.
    }
  }
  return ids;
}

function appendFollowUpTask(task, taskFile) {
  mkdirSync(dirname(taskFile), { recursive: true });
  const ids = readExistingTaskIds(taskFile);
  if (ids.has(task.id)) return { created: false, taskFile, task };
  appendFileSync(taskFile, `${JSON.stringify(task)}\n`, 'utf8');
  return { created: true, taskFile, task };
}


function readTaskQueue(taskFile) {
  if (!existsSync(taskFile)) return [];
  const tasks = [];
  for (const [index, line] of readFileSync(taskFile, 'utf8').split('\n').entries()) {
    if (!line.trim()) continue;
    try {
      tasks.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`Could not parse ${taskFile} line ${index + 1}: ${error.message}`);
    }
  }
  return tasks;
}

function writeTaskQueue(tasks, taskFile) {
  mkdirSync(dirname(taskFile), { recursive: true });
  const body = tasks.map((task) => JSON.stringify(task)).join('\n');
  writeFileSync(taskFile, body ? `${body}\n` : '', 'utf8');
}

function isTaskOverdue(task, now = new Date()) {
  if (task.status !== 'open') return false;
  if (!task.dueDate) return false;
  return task.dueDate < isoDate(now);
}

function taskSortKey(task) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return [task.status === 'open' ? 0 : 1, task.dueDate || '9999-99-99', priorityRank[task.priority] ?? 9, task.createdAt || ''];
}

function compareTasks(a, b) {
  const left = taskSortKey(a);
  const right = taskSortKey(b);
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] < right[i]) return -1;
    if (left[i] > right[i]) return 1;
  }
  return 0;
}

function listFollowUpTasks(taskFile, options = {}) {
  const now = parseDate(options.now);
  const allTasks = readTaskQueue(taskFile).sort(compareTasks);
  const tasks = options.all ? allTasks : allTasks.filter((task) => task.status === 'open');
  return {
    taskFile,
    now: now.toISOString(),
    total: allTasks.length,
    shown: tasks.length,
    open: allTasks.filter((task) => task.status === 'open').length,
    overdue: allTasks.filter((task) => isTaskOverdue(task, now)).length,
    tasks: tasks.map((task) => ({ ...task, overdue: isTaskOverdue(task, now) })),
  };
}

function markTaskHandled(taskFile, taskId, options = {}) {
  if (!taskId) throw new Error('--mark-handled requires a task id.');
  const now = parseDate(options.now);
  const tasks = readTaskQueue(taskFile);
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) throw new Error(`Task not found: ${taskId}`);
  const task = tasks[index];
  if (task.status === 'handled') {
    return { changed: false, taskFile, task };
  }
  tasks[index] = {
    ...task,
    status: 'handled',
    handledAt: now.toISOString(),
    handledNote: options.note || 'Marked handled internally. No external action was performed by this command.',
    externalActionPerformed: false,
  };
  writeTaskQueue(tasks, taskFile);
  return { changed: true, taskFile, task: tasks[index] };
}

function renderTaskListMarkdown(result) {
  const lines = [
    '# Stonebridge AI Lead Follow-up Tasks',
    '',
    `Queue file: ${result.taskFile}`,
    `Open: ${result.open}`,
    `Overdue: ${result.overdue}`,
    `Shown: ${result.shown} of ${result.total}`,
  ];

  if (!result.tasks.length) {
    lines.push('', 'No matching tasks.');
    return lines.join('\n');
  }

  for (const task of result.tasks) {
    const overdue = task.overdue ? ' OVERDUE' : '';
    const lead = task.lead || {};
    lines.push(
      '',
      `- ${task.id} [${task.status}] ${task.priority || 'unknown'}${overdue}`,
      `  Title: ${task.title}`,
      `  Due: ${task.dueDate || 'none'}`,
      `  Lead: ${lead.company || 'Unknown'}${lead.email ? ` <${lead.email}>` : ''}`,
      `  Next: ${task.nextAction || 'Not provided'}`,
      `  External action enabled: no`,
    );
  }

  return lines.join('\n');
}

function renderHandledMarkdown(result) {
  const task = result.task;
  return [
    '# Stonebridge AI Lead Task Update',
    '',
    `Task ${result.changed ? 'marked handled' : 'already handled'}: ${task.id}`,
    `Queue file: ${result.taskFile}`,
    `Title: ${task.title}`,
    `Status: ${task.status}`,
    `Handled at: ${task.handledAt || 'previously handled'}`,
    `External action performed by this command: no`,
  ].join('\n');
}

function renderTaskMarkdown(taskResult) {
  const verb = taskResult.created ? 'created' : 'already queued';
  const task = taskResult.task;
  return [
    '',
    '# Internal Follow-up Task',
    '',
    `Task ${verb}: ${task.id}`,
    `Queue file: ${taskResult.taskFile}`,
    `Title: ${task.title}`,
    `Due: ${task.dueDate}`,
    `Priority: ${task.priority}`,
    `Next action: ${task.nextAction}`,
    `External action enabled: no`,
    `Approval required before external action: yes`,
  ].join('\n');
}

function renderMarkdown(summary, taskResult = null) {
  const c = summary.companyAndContact;
  const ibt = summary.interestBudgetTimeline;
  const lines = [
    '# Stonebridge AI Lead Summary',
    '',
    `Source: ${summary.source}`,
    `Message: ${summary.messageId}`,
    `Subject: ${summary.subject}`,
    `Received: ${summary.receivedAt}`,
    `Labels: ${summary.labels.join(', ') || 'none'}`,
    '',
    `Company and contact: ${c.company}, ${c.name} <${c.email}>${c.website !== 'Not provided' ? `, ${c.website}` : ''}`,
    '',
    `Workflow they want improved: ${summary.workflowTheyWantImproved}`,
    '',
    `Tools mentioned: ${summary.toolsMentioned}`,
    '',
    `Bottlenecks: ${summary.bottlenecks}`,
    '',
    `Sensitive-data or access concerns: ${summary.sensitiveDataOrAccessConcerns}`,
    '',
    `Interest, budget, timeline: ${ibt.interest}; ${ibt.budget}; ${ibt.timeline}`,
    '',
    `Fit score: ${summary.fitScore}`,
    `Urgency score: ${summary.urgencyScore}`,
    `Prompt-injection risk: ${summary.promptInjectionRisk}`,
    '',
    'Missing information:',
    ...summary.missingInformation.map((item) => `- ${item}`),
    '',
    `Recommended next action: ${summary.recommendedNextAction}`,
    '',
    typeof summary.draftReply === 'string'
      ? `Draft reply: ${summary.draftReply}`
      : [
          'Draft reply: STAGED ONLY, approval required, not sent',
          `Subject: ${summary.draftReply.subject || '(none)'}`,
          '',
          summary.draftReply.body || summary.draftReply.reason || '(no body)',
          '',
          `Send action: ${summary.draftReply.sendAction ? 'enabled' : 'disabled'}`,
        ].join('\n'),
  ];

  if (taskResult) lines.push(renderTaskMarkdown(taskResult));
  return lines.join('\n');
}

export {
  parseIntake,
  buildSummary,
  renderMarkdown,
  buildDraftReply,
  buildFollowUpTask,
  appendFollowUpTask,
  listFollowUpTasks,
  markTaskHandled,
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (args.markHandled) {
    const result = markTaskHandled(args.taskFile, args.markHandled, { now: args.now, note: args.handledNote });
    if (args.format === 'json') console.log(JSON.stringify(result, null, 2));
    else if (args.format === 'markdown') console.log(renderHandledMarkdown(result));
    else throw new Error(`Unsupported format: ${args.format}`);
    return;
  }

  if (args.listTasks) {
    const result = listFollowUpTasks(args.taskFile, { now: args.now, all: args.allTasks });
    if (args.format === 'json') console.log(JSON.stringify(result, null, 2));
    else if (args.format === 'markdown') console.log(renderTaskListMarkdown(result));
    else throw new Error(`Unsupported format: ${args.format}`);
    return;
  }

  const { source, message } = await loadLead(args);
  const includeDraft = args.includeDraft || args.createTask;
  const summary = buildSummary(message, source, { includeDraft });
  const taskResult = args.createTask
    ? appendFollowUpTask(buildFollowUpTask(summary, { now: args.now }), args.taskFile)
    : null;
  if (args.format === 'json') console.log(JSON.stringify(taskResult ? { summary, taskResult } : summary, null, 2));
  else if (args.format === 'markdown') console.log(renderMarkdown(summary, taskResult));
  else throw new Error(`Unsupported format: ${args.format}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[lead-summary] ${error.message}`);
    process.exit(1);
  });
}
