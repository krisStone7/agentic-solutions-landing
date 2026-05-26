const MAX_BODY_LENGTH = 100000;
const MAX_DISCORD_CONTENT_LENGTH = 1900;
const DEFAULT_TASK_FILE = 'tasks/lead-followups.jsonl';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clean(value, fallback = 'Not provided') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return '';
}

function boolText(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = clean(value, 'No');
  return /^(true|yes|y|1)$/i.test(text) ? 'Yes' : text;
}

function normalizeUrgency(value) {
  const text = clean(value, 'normal').toLowerCase();
  if (/urgent|high|asap|immediate|emergency|today/.test(text)) return 'high';
  if (/low|later|not urgent/.test(text)) return 'low';
  return 'normal';
}

function completedEvent(payload) {
  const event = clean(payload.event || payload.type || payload.call?.event, '').toLowerCase();
  const status = clean(payload.call_status || payload.call?.call_status || payload.status || payload.call?.status, '').toLowerCase();
  return /call_(ended|analyzed)|completed|ended|post_call/.test(event) || /ended|completed|analyzed/.test(status);
}

function callPayload(payload) {
  return payload.call || payload.data?.call || payload;
}

function analysisPayload(payload, call) {
  return payload.call_analysis || payload.analysis || call.call_analysis || call.analysis || {};
}

function customPayload(analysis, call) {
  return analysis.custom_analysis_data || analysis.custom || call.custom_analysis_data || {};
}

function normalizeRetellPayload(payload) {
  const call = callPayload(payload);
  const analysis = analysisPayload(payload, call);
  const custom = customPayload(analysis, call);
  const transcript = pick(payload.transcript, call.transcript, analysis.transcript, call.transcript_object?.map?.((turn) => `${turn.role || turn.speaker || 'Speaker'}: ${turn.content || turn.text || ''}`).join('\n'));
  const summary = pick(custom.summary, custom.call_summary, analysis.call_summary, analysis.summary, payload.summary);
  const caller = pick(custom.caller, custom.caller_name, custom.name, call.caller_name, payload.caller, 'Unknown caller');
  const company = pick(custom.company, custom.company_name, payload.company, 'Unknown company');
  const phone = pick(custom.phone, custom.phone_number, call.from_number, call.fromNumber, payload.phone);
  const email = pick(custom.email, custom.email_address, payload.email);
  const contact = [phone, email].filter(Boolean).join(' / ') || 'Not provided';
  const intent = clean(pick(custom.intent, custom.call_intent, analysis.intent, payload.intent), 'unknown');
  const urgency = normalizeUrgency(pick(custom.urgency, custom.priority, analysis.urgency, payload.urgency));
  const nextAction = clean(pick(custom.recommended_next_action, custom.next_action, analysis.recommended_next_action, payload.recommended_next_action), 'Review call and decide next step');
  const escalationRequired = boolText(pick(custom.escalation_required, custom.escalation, analysis.escalation_required, payload.escalation_required, urgency === 'high'));
  const confidence = clean(pick(custom.confidence, analysis.confidence, analysis.call_successful === true ? '0.8' : ''), 'not provided');

  return {
    callId: clean(pick(call.call_id, call.id, payload.call_id, payload.id), 'unknown'),
    caller: clean(caller),
    company: clean(company),
    contact: clean(contact),
    intent,
    urgency,
    summary: clean(summary, 'No summary provided by Retell.'),
    recommendedNextAction: nextAction,
    escalationRequired,
    confidence,
    transcript: clean(transcript, 'Transcript not provided.'),
  };
}

function formatDiscordMessage(summary) {
  const transcript = summary.transcript.length > 700 ? `${summary.transcript.slice(0, 697)}...` : summary.transcript;
  const content = [
    '**New voice-agent call**',
    `- Caller: ${summary.caller}`,
    `- Company: ${summary.company}`,
    `- Contact: ${summary.contact}`,
    `- Intent: ${summary.intent}`,
    `- Urgency: ${summary.urgency}`,
    `- Summary: ${summary.summary}`,
    `- Recommended next action: ${summary.recommendedNextAction}`,
    `- Escalation required: ${summary.escalationRequired}`,
    `- Confidence: ${summary.confidence}`,
    `- Call ID: \`${summary.callId}\``,
    `- Transcript: ${transcript}`,
  ].join('\n');
  return content.length > MAX_DISCORD_CONTENT_LENGTH ? `${content.slice(0, MAX_DISCORD_CONTENT_LENGTH - 3)}...` : content;
}

function shouldQueueFollowUp(summary) {
  return summary.urgency === 'high' || /lead|sales|consult|quote|pilot|demo/i.test(`${summary.intent} ${summary.recommendedNextAction}`);
}

function followUpDecision(summary) {
  if (/\b(test|qa|synthetic)\b/i.test(`${summary.caller} ${summary.company} ${summary.callId}`)) {
    return {
      action: 'archive_qa',
      reason: 'Call appears to be test or QA evidence. No sales follow-up recommended.',
    };
  }
  if (shouldQueueFollowUp(summary)) {
    return {
      action: 'queue_follow_up',
      reason: 'Lead intent or high urgency detected. Create an internal follow-up task and draft reply for approval.',
      taskFile: DEFAULT_TASK_FILE,
    };
  }
  return {
    action: 'review_only',
    reason: 'Normal-priority call. Review summary before creating any external action.',
  };
}

async function postToDiscordWebhook(webhookUrl, content, fetchImpl = fetch) {
  const response = await fetchImpl(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Discord webhook HTTP ${response.status}: ${detail.slice(0, 500)}`);
  }
}

async function postToDiscordBot({ botToken, channelId, content, fetchImpl = fetch }) {
  const response = await fetchImpl(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Discord bot HTTP ${response.status}: ${detail.slice(0, 500)}`);
  }
}

async function postToDiscord(env, content, fetchImpl = fetch) {
  if (env.DISCORD_WEBHOOK_URL) {
    await postToDiscordWebhook(env.DISCORD_WEBHOOK_URL, content, fetchImpl);
    return 'webhook';
  }
  if (env.DISCORD_BOT_TOKEN && env.DISCORD_CHANNEL_ID) {
    await postToDiscordBot({ botToken: env.DISCORD_BOT_TOKEN, channelId: env.DISCORD_CHANNEL_ID, content, fetchImpl });
    return 'bot';
  }
  throw new Error('Discord destination is not configured. Set DISCORD_WEBHOOK_URL, or DISCORD_BOT_TOKEN plus DISCORD_CHANNEL_ID.');
}

async function handleRetellWebhook({ request, env, fetchImpl = fetch }) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) return jsonResponse({ error: 'Webhook body is too large.' }, 413);

  let payload;
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return jsonResponse({ error: 'Invalid JSON.' }, 400);
  }

  if (!completedEvent(payload)) {
    return jsonResponse({ ok: true, ignored: true, reason: 'Not a completed/analyzed call event.' });
  }

  const hasDiscordDestination = env.DISCORD_WEBHOOK_URL || (env.DISCORD_BOT_TOKEN && env.DISCORD_CHANNEL_ID);
  if (!hasDiscordDestination) {
    return jsonResponse({ error: 'Discord destination is not configured. Set DISCORD_WEBHOOK_URL, or DISCORD_BOT_TOKEN plus DISCORD_CHANNEL_ID.' }, 503);
  }

  const summary = normalizeRetellPayload(payload);
  const followUp = followUpDecision(summary);
  const message = `${formatDiscordMessage(summary)}\n- Follow-up queue rule: ${followUp.action} - ${followUp.reason}`;
  const discordTransport = await postToDiscord(env, message, fetchImpl);

  return jsonResponse({ ok: true, callId: summary.callId, followUp, discordTransport });
}

export async function onRequestPost(context) {
  return handleRetellWebhook(context);
}

export async function onRequest() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}

export {
  normalizeRetellPayload,
  formatDiscordMessage,
  followUpDecision,
  handleRetellWebhook,
};
