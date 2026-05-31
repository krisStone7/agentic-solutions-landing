import React, { useState } from 'react';


const workflowAuditDeliverables = [
  'Workflow map showing actors, tools, handoffs, delays, and decision points',
  'Automation opportunity register ranked by value, effort, risk, and data readiness',
  'Top 3 AI workflow candidates with recommended agent role, inputs, outputs, and approval gates',
  'Integration notes for CRM, email, calendar, documents, spreadsheets, and internal systems',
  '30/60/90 day roadmap with quick wins, pilot scope, and implementation prerequisites',
];

const workflowAuditBestFor = [
  'Owners who know AI matters but need a concrete starting workflow',
  'Teams stuck in email, spreadsheets, CRMs, ticket queues, scheduling, or manual reporting',
  'Operations-heavy businesses that need useful automation, not novelty demos',
];

const workflowAuditSignals = [
  'Work waits on one person to triage, copy, approve, or follow up',
  'Customer context lives across too many tools',
  'The team has repeatable decisions that still require judgment and escalation',
];

const auditDiscoverySteps = [
  {
    title: 'Map one real workflow',
    detail:
      'We start with a recent lead, request, quote, ticket, or follow-up and trace it from trigger to completion.',
  },
  {
    title: 'Find the failure points',
    detail:
      'We identify where work stalls, context is copied by hand, ownership is unclear, or reminders depend on memory.',
  },
  {
    title: 'Select AI-safe candidates',
    detail:
      'We prioritize work AI can summarize, classify, draft, route, or queue before a human approves the customer-visible action.',
  },
  {
    title: 'Define safety gates',
    detail:
      'We document what the system may read, what it may draft, and what it must never send, book, update, or promise without approval.',
  },
];

const auditCandidateExamples = [
  {
    title: 'Lead intake triage',
    detail: 'Summarize the request, extract contact details, classify urgency, draft a next reply, and queue the follow-up.',
  },
  {
    title: 'Inbox to task queue',
    detail: 'Classify customer messages, extract owner and due date, flag sensitive requests, and stage the next action.',
  },
  {
    title: 'Quote follow-up assistant',
    detail: 'Notice stale quotes, draft context-aware follow-ups, and remind the owner before the opportunity goes cold.',
  },
];

const auditScoreFactors = [
  'Clear business pain tied to revenue, time, response speed, or customer experience',
  'Repeatable workflow with a known owner and visible trigger',
  'Multiple systems involved, such as inbox, CRM, calendar, spreadsheet, forms, or phone',
  'Useful draft-only, read-only, or approval-gated starting point',
  'Manageable data sensitivity and a clear safe access path',
  'Easy ROI story in dollars, hours, missed leads, or reduced delay',
];

const auditOutputs = [
  'Workflow map with tools, people, handoffs, decision points, and failure modes',
  'Top 3 AI candidates ranked by value, effort, risk, and data readiness',
  'Recommended first build with integrations, approval gates, acceptance tests, and rollback plan',
  'Security and operations notes covering data sensitivity, credential boundaries, logging, and limitations',
];


const toolOptions = [
  'Email',
  'Calendar',
  'CRM',
  'Help desk or ticketing',
  'Project management',
  'Chat or internal comms',
  'Document storage',
  'Spreadsheets',
  'Accounting or invoicing',
  'ERP/MRP',
  'Ecommerce',
  'Scheduling or booking',
  'Forms or surveys',
  'Databases',
  'Internal custom software',
];

const interestOptions = [
  'AI Workflow Audit',
  'Implementation help now',
  'Exploring options',
  'Not sure yet',
];

const budgetOptions = [
  'Under $2,500',
  '$2,500-$5,000',
  '$5,000-$15,000',
  '$15,000-$50,000',
  '$50,000+',
  'Not sure yet',
];

const timelineOptions = [
  'Immediately or within 2 weeks',
  '30 days',
  '60-90 days',
  '3-6 months',
  'Exploring only',
];

const initialIntakeForm = {
  name: '',
  email: '',
  company: '',
  website: '',
  business: '',
  workflow: '',
  tools: [],
  otherTools: '',
  bottlenecks: '',
  sensitiveData: '',
  interest: '',
  budget: '',
  timeline: '',
  notes: '',
};

const agentRoles = [
  {
    title: 'AI Receptionist',
    summary: 'Responds quickly when customers reach out, even when the owner is busy.',
    tasks: ['Answers common questions', 'Qualifies new leads', 'Books appointments', 'Sends reminders'],
  },
  {
    title: 'AI Operations Assistant',
    summary: 'Keeps routine business work moving without forcing everything through the owner.',
    tasks: ['Tracks follow-ups', 'Updates CRMs and spreadsheets', 'Summarizes daily activity', 'Flags overdue work'],
  },
  {
    title: 'AI Sales Assistant',
    summary: 'Turns interest into organized opportunities with consistent follow-through.',
    tasks: ['Replies to inbound leads', 'Drafts quotes', 'Maintains pipeline notes', 'Schedules next steps'],
  },
  {
    title: 'AI Marketing Assistant',
    summary: 'Helps turn business activity into useful content customers actually see.',
    tasks: ['Drafts emails and posts', 'Repurposes ideas', 'Plans campaigns', 'Tracks engagement signals'],
  },
];

const dayTimeline = [
  {
    time: '8:00 AM',
    title: 'Morning briefing',
    description: 'The owner receives a clean summary of new leads, unpaid invoices, appointments, and urgent messages.',
  },
  {
    time: '10:30 AM',
    title: 'New lead captured',
    description: 'A website inquiry is answered automatically, qualified with a few smart questions, and routed into the right next step.',
  },
  {
    time: '1:00 PM',
    title: 'Follow-up sent',
    description: 'The agent notices a quote has not been accepted and sends a polite follow-up before the opportunity goes cold.',
  },
  {
    time: '4:30 PM',
    title: 'Marketing draft prepared',
    description: 'A recent customer win is turned into a draft email, social post, or testimonial request for review.',
  },
  {
    time: 'End of day',
    title: 'Work summarized',
    description: 'The owner sees what was handled, what changed, and which decisions still need a human call.',
  },
];

const services = [
  {
    title: 'AI Chief of Staff',
    description:
      'Deploy a practical AI operating layer that captures leads, follows up with customers, and keeps front-office work moving without adding more admin load.',
  },
  {
    title: 'Customer Operations Automation',
    description:
      'Connect AI receptionist, calendar, CRM, payment, and follow-up workflows so every opportunity has an owner, context, and next step.',
  },
  {
    title: 'Growth Visibility And Web Operations',
    description:
      'Maintain website content, track business activity, and turn analytics into clear insight on where the company is growing and where attention is needed.',
  },
];

const steps = [
  'Assess the operating context, existing tools, and the work that should be delegated to agents.',
  'Stand up private AI infrastructure with practical defaults for local development and team usage.',
  'Define workflows, prompts, safety rules, and review checkpoints so the system is useful on day one.',
  'Train the team on usage patterns, then refine based on real work rather than abstract demos.',
];


const intakeWorkflowSteps = [
  'Inbound call, form, or email',
  'AI intake summary',
  'Fit and urgency score',
  'Staged reply or task',
  'Human approval',
  'CRM, scheduling, or follow-up',
];

const problemBullets = [
  'Missed calls and slow replies cost revenue.',
  'Shared inboxes bury useful context.',
  'Staff manually copy details into CRMs and spreadsheets.',
  'Follow-up quality varies by person and workload.',
  'Owners lack a consistent view of lead urgency and next action.',
];

const demoProofPoints = [
  ['Fit', 'High'],
  ['Urgency', 'Medium'],
  ['Draft reply', 'Staged only'],
  ['Send action', 'Disabled'],
  ['Follow-up task', 'Created with due date and priority'],
  ['Duplicate protection', 'Reruns do not create duplicate tasks'],
];

const safetyRules = [
  'No outbound email without approval',
  'No calendar booking without approval',
  'No CRM writes unless explicitly enabled',
  'No pricing promises or technical commitments by the agent',
  'Escalation for urgent, confidential, legal, safety-critical, or low-confidence cases',
  'Lead-submitted text treated as untrusted input',
];

const pilotIncludes = [
  'One lead source mapped: calls, website forms, or shared inbox',
  'Structured lead summary schema',
  'AI receptionist or transcript-based intake path',
  'Staged follow-up draft',
  'Internal task or notification queue',
  'Escalation and approval rules',
  'Test cases for normal leads, spam, urgent requests, and unsupported claims',
  'Handoff and training session',
];

const bestFitCustomers = [
  'HVAC, electrical, plumbing, commercial maintenance, property services, inspection, and specialty repair firms',
  'Teams with high inbound call or form volume',
  'Businesses using shared inboxes, Google Calendar, HubSpot, Jobber, Housecall Pro, Airtable, Sheets, or similar tools',
  'Owners who want faster response without giving an AI unchecked authority',
];

const notFirstFitCustomers = [
  'Healthcare, legal, finance, or regulated intake without a separate compliance review',
  'Teams that want fully autonomous customer commitments on day one',
  'Businesses without a clear inbound lead workflow',
];

function AiReceptionistPage() {
  return (
    <div className="page-shell landing-page">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            SAI
          </span>
          <span>Stonebridge AI</span>
        </a>
        <nav className="nav landing-nav">
          <a href="#workflow">Workflow</a>
          <a href="#demo-workflow">Demo</a>
          <a href="#pilot">Pilot Offer</a>
          <a href="/#intake">Intake Form</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">AI Receptionist Pilot</p>
            <h1>AI receptionist and lead qualification system in 7 days</h1>
            <p className="lead">
              Capture more inbound calls, forms, and emails, then turn each request into a structured summary,
              urgency score, staged follow-up, and internal next step. Nothing sends, books, or updates customer
              systems without approval.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/#intake">
                Book a 30-minute intake review
              </a>
              <a className="button button-secondary" href="#demo-workflow">
                See the 2-minute demo workflow
              </a>
            </div>
            <p className="safety-line">
              Approval-gated by design: human approval stays in front of outbound messages, scheduling, CRM updates,
              pricing, and customer commitments.
            </p>
          </div>

          <aside className="hero-panel receptionist-panel">
            <p className="panel-label">Pilot snapshot</p>
            <ul className="metric-list">
              <li>
                <strong>7 days</strong>
                <span>to map one intake path and launch the first controlled workflow</span>
              </li>
              <li>
                <strong>Minutes</strong>
                <span>to summarize, score, and assign qualified inbound requests</span>
              </li>
              <li>
                <strong>Approval-gated</strong>
                <span>so drafts, bookings, writes, and commitments stay under human control</span>
              </li>
            </ul>
          </aside>
        </section>

        <section className="section split-panel" id="problem">
          <div className="section-heading narrow">
            <p className="eyebrow">The Problem</p>
            <h2>Leads get lost between tools, not because teams do not care.</h2>
          </div>
          <div className="proof-card">
            <p>
              Service teams do not usually lose leads because they lack effort. They lose leads in the handoff between
              call, inbox, CRM, scheduler, and follow-up.
            </p>
            <ul className="check-list">
              {problemBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="workflow">
          <div className="section-heading wide">
            <p className="eyebrow">Workflow Diagram</p>
            <h2>From inbound request to approved next step.</h2>
            <p className="section-intro">
              The system automates intake, triage, drafting, and task handoff. It does not autonomously make
              commitments to customers.
            </p>
          </div>
          <ol className="workflow-strip" aria-label="AI receptionist workflow">
            {intakeWorkflowSteps.map((step, index) => (
              <li key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="section demo-section" id="demo-workflow">
          <div className="section-heading wide">
            <p className="eyebrow">Sanitized Demo Example</p>
            <h2>A field-services intake example with safe boundaries.</h2>
            <p className="section-intro">
              A regional maintenance company receives a request for help automating website intake, email triage, CRM
              updates, and scheduling handoff. The system extracts the contact, tools, bottleneck, budget range,
              timeline, sensitive-data notes, fit score, urgency score, missing information, and recommended next
              action. It then stages a follow-up draft and creates an internal task.
            </p>
          </div>
          <div className="demo-grid">
            <article className="screenshot-card">
              <p className="panel-label">Lead summary</p>
              <dl>
                {demoProofPoints.slice(0, 3).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article className="screenshot-card accent-panel">
              <p className="panel-label">Staged draft</p>
              <p>
                Thanks for sharing the workflow. I captured website intake, inbox triage, CRM update, and scheduling
                handoff as the first path to review.
              </p>
              <span className="status-pill">Send action: disabled</span>
            </article>
            <article className="screenshot-card">
              <p className="panel-label">Internal task</p>
              <dl>
                {demoProofPoints.slice(4).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>
        </section>

        <section className="section safety-section" id="safety">
          <div className="safety-card">
            <div className="section-heading wide">
              <p className="eyebrow">Safety And Control</p>
              <h2>Automation where it helps, approval where it matters.</h2>
            </div>
            <div className="safety-badge">Approval-gated automation</div>
            <ul className="check-list two-column-list">
              {safetyRules.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section pilot-section" id="pilot">
          <div className="section-heading wide">
            <p className="eyebrow">Pilot Offer</p>
            <h2>7-Day AI Intake Pilot</h2>
            <p className="section-intro">
              Every qualified inbound request gets summarized, scored, and assigned a next step within minutes during
              the agreed operating window.
            </p>
          </div>
          <div className="pilot-layout">
            <article className="proof-card">
              <h3>Includes</h3>
              <ul className="check-list">
                {pilotIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="pricing-card">
              <h3>Pricing frame</h3>
              <ul className="metric-list">
                <li>
                  <strong>$750</strong>
                  <span>Workflow diagnostic</span>
                </li>
                <li>
                  <strong>$3,000 to $7,500</strong>
                  <span>Pilot build</span>
                </li>
                <li>
                  <strong>$500 to $2,000 per month</strong>
                  <span>Ongoing monitoring and improvement</span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section fit-section" id="fit">
          <div className="section-heading wide">
            <p className="eyebrow">Best Fit</p>
            <h2>Built for service businesses with real intake volume.</h2>
          </div>
          <div className="comparison-grid">
            <article className="comparison-column accent-panel">
              <h3>Best-fit customers</h3>
              <ul>
                {bestFitCustomers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="comparison-column muted-panel">
              <h3>Not first fit</h3>
              <ul>
                {notFirstFitCustomers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="section cta-section" id="final-cta">
          <div className="cta-card landing-cta">
            <p className="eyebrow">Next Step</p>
            <h2>Want to find the highest-friction lead handoff in your business?</h2>
            <p>
              Book a 30-minute intake review. We will map one lead path, identify the manual handoffs, and show where
              approval-gated AI can safely reduce response time.
            </p>
            <a className="button button-primary" href="/#intake">
              Book intake review
            </a>
            <p className="microcopy">No obligation. Bring one real workflow. We will keep the first scope narrow.</p>
          </div>
        </section>
      </main>
    </div>
  );
}


function HomePage() {
  const [intakeForm, setIntakeForm] = useState(initialIntakeForm);
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });

  const updateField = (event) => {
    const { name, value } = event.target;
    setIntakeForm((current) => ({ ...current, [name]: value }));
  };

  const updateToolSelection = (event) => {
    const { value, checked } = event.target;
    setIntakeForm((current) => ({
      ...current,
      tools: checked
        ? [...current.tools, value]
        : current.tools.filter((tool) => tool !== value),
    }));
  };

  const handleIntakeSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ state: 'submitting', message: 'Sending intake response...' });

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeForm),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'The intake function is not available yet.');
      }

      setFormStatus({
        state: 'success',
        message: 'Thanks. Your intake was sent to Stonebridge AI.',
      });
      setIntakeForm(initialIntakeForm);
    } catch (error) {
      setFormStatus({
        state: 'error',
        message: `${error.message} Please try again or contact Stonebridge AI directly.`,
      });
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            SAI
          </span>
          <span>Stonebridge AI</span>
        </a>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#readiness-audit">Workflow Audit</a>
          <a href="#intake">Intake</a>
          <a href="#ai-workforce">AI Workforce</a>
          <a href="#process">How It Works</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-copy">
            <h1>Turnkey AI Infrastructure.</h1>
            <p className="lead">
              Stonebridge AI helps teams launch clean, usable environments for
              agent-assisted work. The focus is straightforward: reliable setup,
              workable operating patterns, and outcomes that hold up under real
              project pressure.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">
                See What Your First AI Agent Could Do
              </a>
              <a className="button button-secondary" href="#services">
                Review Services
              </a>
            </div>
          </div>

          <aside className="hero-panel">
            <p className="panel-label">Typical engagement</p>
            <ul className="metric-list">
              <li>
                <strong>1-2 weeks</strong>
                <span>for initial environment and workflow setup</span>
              </li>
              <li>
                <strong>Clear scope</strong>
                <span>focused on operations, tooling, and team adoption</span>
              </li>
              <li>
                <strong>Hands-on delivery</strong>
                <span>not just a strategy deck or speculative roadmap</span>
              </li>
            </ul>
          </aside>
        </section>


        <section className="section audit-section" id="readiness-audit">
          <div className="audit-card">
            <div className="section-heading wide">
              <p className="eyebrow">First Offer</p>
              <h2>AI workflow audit for practical automation opportunities.</h2>
              <p className="section-intro">
                Stop guessing where AI belongs in the business. Stonebridge AI
                traces one or more real workflows end to end, identifies where
                agents can safely reduce admin load, and turns the findings into
                a prioritized roadmap grounded in your tools, data, and risk profile.
              </p>
            </div>

            <div className="audit-layout">
              <div className="audit-summary">
                <p>
                  The audit is a focused entry engagement for companies that want
                  practical AI integration but are not ready to commit to a full
                  build. It turns messy operational work into a clear map of
                  candidate agents, human approval points, required integrations,
                  and the safest first pilot.
                </p>
                <div className="audit-price">
                  <span>Audit investment</span>
                  <strong>$500-$3,500 workflow audit</strong>
                  <p>Final scope depends on workflow complexity, number of systems involved, and the outcome you want from the audit.</p>
                </div>
                <div className="consultation-note">
                  <strong>First consultation is free.</strong>
                  <p>We start with a no-cost conversation to confirm whether Stonebridge AI is the right fit before recommending a paid audit.</p>
                </div>
                <a className="button button-primary" href="#intake">
                  Request a Workflow Audit
                </a>
              </div>

              <div className="audit-list-panel">
                <h3>What you get</h3>
                <ul>
                  {workflowAuditDeliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="audit-list-panel muted-panel">
                <h3>Best for</h3>
                <ul>
                  {workflowAuditBestFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="audit-list-panel audit-wide-panel">
                <h3>Good audit signals</h3>
                <ul>
                  {workflowAuditSignals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section discovery-section" id="workflow-audit-discovery">
          <div className="section-heading wide">
            <p className="eyebrow">Workflow Audit Discovery</p>
            <h2>A focused way to find the first safe AI workflow.</h2>
            <p className="section-intro">
              The Workflow Audit starts with one real operating process, not a generic AI demo. In 30 minutes, we look
              for the highest-friction handoff, score whether AI is a good fit, and define a controlled first slice that
              keeps customer-visible actions behind human approval.
            </p>
          </div>

          <div className="discovery-grid">
            <article className="discovery-card discovery-overview">
              <p className="panel-label">How discovery works</p>
              <ol className="numbered-list">
                {auditDiscoverySteps.map((step, index) => (
                  <li key={step.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="discovery-card">
              <p className="panel-label">Good fit signals</p>
              <ul className="check-list">
                {auditScoreFactors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="discovery-card accent-panel">
              <p className="panel-label">Example first slices</p>
              <div className="mini-card-stack">
                {auditCandidateExamples.map((candidate) => (
                  <div className="mini-card" key={candidate.title}>
                    <h3>{candidate.title}</h3>
                    <p>{candidate.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="audit-output-panel">
            <div>
              <p className="eyebrow">What the audit produces</p>
              <h2>Clear next steps, not a vague AI wish list.</h2>
            </div>
            <ul className="check-list two-column-list">
              {auditOutputs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="approval-note">
              <strong>Safety boundary:</strong> the first build is scoped as read-only, draft-only, or approval-gated
              unless you explicitly approve a broader operating mode.
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2>An AI Chief of Staff for growing service businesses.</h2>
          </div>
          <div className="card-grid">
            {services.map((service) => (
              <article className="card" key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>


        <section className="section workforce-section" id="ai-workforce">
          <div className="section-heading wide">
            <p className="eyebrow">AI Workforce</p>
            <h2>What can an AI agent actually do?</h2>
            <p className="section-intro">
              Think of an AI workforce as a set of reliable digital teammates.
              Each agent has a clear job, works inside your existing tools, and
              brings decisions back to a human when judgment matters.
            </p>
          </div>

          <div className="role-grid">
            {agentRoles.map((role) => (
              <article className="role-card" key={role.title}>
                <div>
                  <h3>{role.title}</h3>
                  <p>{role.summary}</p>
                </div>
                <ul>
                  {role.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section day-section" id="day-in-the-life">
          <div className="section-heading wide">
            <p className="eyebrow">A Day With Your AI Workforce</p>
            <h2>Your operation keeps moving while you run it.</h2>
            <p className="section-intro">
              The goal is not novelty. The goal is fewer missed leads, fewer stale
              follow-ups, less admin drag, and a clearer view of what needs your attention.
            </p>
          </div>
          <div className="timeline">
            {dayTimeline.map((item) => (
              <article className="timeline-item" key={`${item.time}-${item.title}`}>
                <span className="timeline-time">{item.time}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section split-section" id="process">
          <div className="section-heading">
            <p className="eyebrow">How It Works</p>
            <h2>A compact process that gets teams operational quickly.</h2>
          </div>
          <ol className="step-list">
            {steps.map((step, index) => (
              <li className="step-item" key={step}>
                <span className="step-number">0{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section intake-section" id="intake">
          <div className="section-heading wide">
            <p className="eyebrow">Client Intake</p>
            <h2>Tell us where AI could help first.</h2>
            <p className="section-intro">
              Share the workflow, tools, constraints, and timeline. Stonebridge AI
              will use this to recommend the right next step: workflow audit,
              implementation scope, or a quick discovery call.
            </p>
          </div>

          <form className="intake-form" onSubmit={handleIntakeSubmit}>
            <div className="form-grid two-column">
              <label>
                <span>Name *</span>
                <input
                  name="name"
                  type="text"
                  value={intakeForm.name}
                  onChange={updateField}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                <span>Email *</span>
                <input
                  name="email"
                  type="email"
                  value={intakeForm.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                <span>Company *</span>
                <input
                  name="company"
                  type="text"
                  value={intakeForm.company}
                  onChange={updateField}
                  autoComplete="organization"
                  required
                />
              </label>
              <label>
                <span>Website</span>
                <input
                  name="website"
                  type="url"
                  value={intakeForm.website}
                  onChange={updateField}
                  placeholder="https://example.com"
                />
              </label>
            </div>

            <label>
              <span>What does your company do? *</span>
              <textarea
                name="business"
                value={intakeForm.business}
                onChange={updateField}
                rows="3"
                required
              />
            </label>

            <label>
              <span>What workflow do you most want to improve with AI? *</span>
              <textarea
                name="workflow"
                value={intakeForm.workflow}
                onChange={updateField}
                rows="3"
                required
              />
            </label>

            <fieldset className="checkbox-fieldset">
              <legend>What tools does your team use today?</legend>
              <div className="checkbox-grid">
                {toolOptions.map((tool) => (
                  <label className="checkbox-option" key={tool}>
                    <input
                      type="checkbox"
                      value={tool}
                      checked={intakeForm.tools.includes(tool)}
                      onChange={updateToolSelection}
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
              <label className="other-tools">
                <span>Other tools</span>
                <input
                  name="otherTools"
                  type="text"
                  value={intakeForm.otherTools}
                  onChange={updateField}
                />
              </label>
            </fieldset>

            <label>
              <span>Where does work get stuck or repetitive? *</span>
              <textarea
                name="bottlenecks"
                value={intakeForm.bottlenecks}
                onChange={updateField}
                rows="3"
                required
              />
            </label>

            <label>
              <span>What sensitive data or access concerns should we know about?</span>
              <textarea
                name="sensitiveData"
                value={intakeForm.sensitiveData}
                onChange={updateField}
                rows="3"
                placeholder="Customer data, financial data, regulated data, proprietary technical data, systems we should not access directly, etc."
              />
            </label>

            <div className="form-grid three-column">
              <label>
                <span>What are you interested in? *</span>
                <select name="interest" value={intakeForm.interest} onChange={updateField} required>
                  <option value="">Select one</option>
                  {interestOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Budget range</span>
                <select name="budget" value={intakeForm.budget} onChange={updateField}>
                  <option value="">Select one</option>
                  {budgetOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Timeline</span>
                <select name="timeline" value={intakeForm.timeline} onChange={updateField}>
                  <option value="">Select one</option>
                  {timelineOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span>Anything else?</span>
              <textarea
                name="notes"
                value={intakeForm.notes}
                onChange={updateField}
                rows="3"
              />
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={formStatus.state === 'submitting'}>
                {formStatus.state === 'submitting' ? 'Sending...' : 'Submit Intake'}
              </button>
            </div>

            {formStatus.message && (
              <p className={`form-status ${formStatus.state}`}>{formStatus.message}</p>
            )}
          </form>
        </section>

        <section className="section cta-section" id="contact">
          <div className="cta-card contact-card">
            <div className="contact-copy">
              <p className="eyebrow">Contact</p>
              <h2>Start with an AI workflow audit.</h2>
              <p>
                If you want to see where an AI workforce could save time, capture
                missed opportunities, or reduce admin load, Stonebridge AI can
                map the first useful workflow, rank the opportunities, and build
                from a clear implementation roadmap.
              </p>
              <p className="contact-note">Contact Kris Stone at Stonebridge AI.</p>
              <p className="contact-location">Los Angeles, CA</p>
              <div className="contact-actions">
                <a className="button button-primary" href="tel:+18883688306">
                  Call the AI receptionist: (888) 368-8306
                </a>
                <a className="button button-secondary" href="mailto:stonebridgeai@agentmail.to">
                  stonebridgeai@agentmail.to
                </a>
                <a
                  className="button button-secondary"
                  href="https://www.linkedin.com/in/kristofer-stone-40054b89/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BEcNpRbD6QBKjVcwwNzKu4w%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                >
                  Connect on LinkedIn
                </a>
              </div>
            </div>

            <aside className="founder-card" aria-label="About Kris Stone">
              <img src="/kris-stone.jpg" alt="Kristofer Stone with a returned spacecraft capsule" />
              <div>
                <p className="eyebrow">About Kris Stone</p>
                <h3>NewSpace operator building practical AI systems.</h3>
                <p>
                  I have been in the NewSpace startup industry for 7+ years,
                  working on complex projects ranging from mission-critical
                  avionics designs to managing high consequence test programs.
                  Data handling, security, and execution speed are core to what I do.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/ai-receptionist-lead-qualification') {
    return <AiReceptionistPage />;
  }

  return <HomePage />;
}

export default App;
