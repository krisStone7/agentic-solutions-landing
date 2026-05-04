const MAX_FIELD_LENGTH = 4000;
const MAX_BODY_LENGTH = 25000;
const INBOX_ID = 'stonebridgeai@agentmail.to';

const allowedOrigins = new Set([
  'https://stonebridge-ai-landing.pages.dev',
  'https://agentic-solutions-landing.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function corsHeaders(origin = '') {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function jsonResponse(payload, status = 200, origin = '') {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function clean(value) {
  return String(value || '').trim().slice(0, MAX_FIELD_LENGTH);
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map(clean).filter(Boolean).slice(0, 25)
    : [];
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderSubmission(data) {
  const tools = [...data.tools, data.otherTools].filter(Boolean).join(', ') || 'Not provided';

  return [
    'New AI Integration Readiness Intake',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company}`,
    `Website: ${data.website || 'Not provided'}`,
    '',
    'What the company does:',
    data.business,
    '',
    'Workflow to improve:',
    data.workflow,
    '',
    'Tools:',
    tools,
    '',
    'Where work gets stuck:',
    data.bottlenecks,
    '',
    'Sensitive data or access concerns:',
    data.sensitiveData || 'Not provided',
    '',
    `Interest: ${data.interest}`,
    `Budget: ${data.budget || 'Not provided'}`,
    `Timeline: ${data.timeline || 'Not provided'}`,
    '',
    'Anything else:',
    data.notes || 'Not provided',
  ].join('\n');
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') || ''),
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const contentType = request.headers.get('Content-Type') || '';

  if (!contentType.includes('application/json')) {
    return jsonResponse({ error: 'Expected JSON request body.' }, 415, origin);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return jsonResponse({ error: 'Submission is too large.' }, 413, origin);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Invalid JSON.' }, 400, origin);
  }

  const data = {
    name: clean(body.name),
    email: clean(body.email),
    company: clean(body.company),
    website: clean(body.website),
    business: clean(body.business),
    workflow: clean(body.workflow),
    tools: cleanList(body.tools),
    otherTools: clean(body.otherTools),
    bottlenecks: clean(body.bottlenecks),
    sensitiveData: clean(body.sensitiveData),
    interest: clean(body.interest),
    budget: clean(body.budget),
    timeline: clean(body.timeline),
    notes: clean(body.notes),
  };

  const requiredFields = ['name', 'email', 'company', 'business', 'workflow', 'bottlenecks', 'interest'];
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length) {
    return jsonResponse({ error: `Missing required fields: ${missing.join(', ')}` }, 400, origin);
  }

  if (!validateEmail(data.email)) {
    return jsonResponse({ error: 'Please provide a valid email address.' }, 400, origin);
  }

  if (!env.AGENTMAIL_API_KEY) {
    return jsonResponse({ error: 'Email delivery is not configured yet.' }, 503, origin);
  }

  const text = renderSubmission(data);

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(INBOX_ID)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AGENTMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [INBOX_ID],
      reply_to: data.email,
      subject: `Stonebridge AI intake: ${data.company}`,
      text,
      labels: ['website-intake', 'lead', 'stonebridge-ai'],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return jsonResponse({ error: 'Unable to send intake email.', detail: detail.slice(0, 500) }, 502, origin);
  }

  return jsonResponse({ ok: true }, 200, origin);
}

export async function onRequest() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
