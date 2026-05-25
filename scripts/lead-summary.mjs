#!/usr/bin/env node
/**
 * Read-only Stonebridge AI lead summary command.
 *
 * Fetches AgentMail messages labeled `website-intake`, parses the latest intake,
 * and prints the Phase 1 summary format. No outbound actions are performed.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE_URL = 'https://api.agentmail.to/v0';
const DEFAULT_INBOX = 'stonebridgeai@agentmail.to';
const DEFAULT_LABEL = 'website-intake';

function parseArgs(argv) {
  const args = {
    inbox: DEFAULT_INBOX,
    label: DEFAULT_LABEL,
    limit: 25,
    format: 'markdown',
    file: '',
    messageId: '',
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

Options:
  --inbox <email>        AgentMail inbox, default ${DEFAULT_INBOX}
  --label <label>        Required message label, default ${DEFAULT_LABEL}
  --limit <n>            Number of recent messages to inspect, default 25
  --message-id <id>      Summarize a specific AgentMail message
  --file <path>          Parse a local intake text file, useful for tests
  --format markdown|json Output format, default markdown

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

function buildSummary(message, source) {
  const text = message.text || message.extracted_text || message.preview || '';
  const fields = parseIntake(text);
  const fit = scoreFit(fields, text);
  const urgency = scoreUrgency(fields);
  const missing = missingInfo(fields);
  const injectionFlag = detectInjection(text);

  return {
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
    draftReply: 'Not generated in Phase 1. Outbound drafting starts in Phase 2 and remains staged for approval.',
  };
}

function renderMarkdown(summary) {
  const c = summary.companyAndContact;
  const ibt = summary.interestBudgetTimeline;
  return [
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
    `Draft reply: ${summary.draftReply}`,
  ].join('\n');
}

export { parseIntake, buildSummary, renderMarkdown };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  const { source, message } = await loadLead(args);
  const summary = buildSummary(message, source);
  if (args.format === 'json') console.log(JSON.stringify(summary, null, 2));
  else if (args.format === 'markdown') console.log(renderMarkdown(summary));
  else throw new Error(`Unsupported format: ${args.format}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[lead-summary] ${error.message}`);
    process.exit(1);
  });
}
