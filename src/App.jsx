import React from 'react';


const auditDeliverables = [
  'Workflow and systems map',
  'AI opportunity register ranked by value, effort, and risk',
  'Top 3 recommended initiatives with implementation outlines',
  'Data, security, and human-approval guardrails',
  '30/60/90 day implementation roadmap',
];

const auditBestFor = [
  'Owners who know AI matters but are not sure where to start',
  'Teams stuck in email, spreadsheets, CRMs, ticket queues, or manual reporting',
  'Operations-heavy businesses that need useful automation, not novelty demos',
];

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
    title: 'Private AI Infrastructure Setup',
    description:
      'Install and configure secure, repeatable agent workspaces with the right local tooling, project structure, and operating conventions.',
  },
  {
    title: 'Agent Workflow Design',
    description:
      'Map high-value business tasks into clear human-plus-agent workflows with scoped responsibilities, guardrails, and handoff points.',
  },
  {
    title: 'Operational Hardening',
    description:
      'Improve reliability through environment standards, documentation, memory patterns, review loops, and rollout support for internal teams.',
  },
];

const steps = [
  'Assess the operating context, existing tools, and the work that should be delegated to agents.',
  'Stand up private AI infrastructure with practical defaults for local development and team usage.',
  'Define workflows, prompts, safety rules, and review checkpoints so the system is useful on day one.',
  'Train the team on usage patterns, then refine based on real work rather than abstract demos.',
];

const outcomes = [
  'Faster setup for agent-enabled delivery',
  'More consistent execution across projects',
  'Clearer guardrails for internal adoption',
  'Less time lost to tool friction and rework',
];

const audiences = [
  'Small teams building internal AI operations',
  'Founders who need an agent workflow that actually ships work',
  'Engineering groups standardizing local AI tooling',
  'Consultancies adding repeatable agent capabilities for clients',
];

function App() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            AS
          </span>
          <span>Stonebridge AI</span>
        </a>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#readiness-audit">Readiness Audit</a>
          <a href="#ai-workforce">AI Workforce</a>
          <a href="#process">How It Works</a>
          <a href="#outcomes">Outcomes</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">Los Angeles, California</p>
            <h1>Practical setup for private AI infrastructure.</h1>
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
              <h2>Start with an AI Integration Readiness Audit.</h2>
              <p className="section-intro">
                Stop guessing where AI belongs in the business. Stonebridge AI
                maps your real workflows, identifies high-leverage automation
                opportunities, and gives you a practical roadmap grounded in
                your tools, data, and risk profile.
              </p>
            </div>

            <div className="audit-layout">
              <div className="audit-summary">
                <p>
                  The audit is a focused entry engagement for companies that want
                  practical AI integration but are not ready to commit to a full
                  build. It separates quick wins from architecture-heavy work and
                  gives leadership a clear next step.
                </p>
                <div className="audit-price">
                  <span>Recommended starting point</span>
                  <strong>$3,500 fixed-price standard audit</strong>
                  <p>Creditable toward an approved implementation project.</p>
                </div>
                <a className="button button-primary" href="#contact">
                  Request a Readiness Audit
                </a>
              </div>

              <div className="audit-list-panel">
                <h3>What you get</h3>
                <ul>
                  {auditDeliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="audit-list-panel muted-panel">
                <h3>Best for</h3>
                <ul>
                  {auditBestFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2>Support built around implementation, not theory.</h2>
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
            <h2>Your business keeps moving while you run the business.</h2>
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

        <section className="section comparison-section" id="not-a-chatbot">
          <div className="comparison-card">
            <div className="section-heading narrow">
              <p className="eyebrow">Not Just A Chatbot</p>
              <h2>Answers are useful. Action is better.</h2>
            </div>
            <div className="comparison-grid">
              <div className="comparison-column muted-panel">
                <h3>Traditional chatbot</h3>
                <ul>
                  <li>Waits for someone to click and ask a question</li>
                  <li>Mostly answers from a fixed knowledge base</li>
                  <li>Often leaves follow-up work to the owner</li>
                </ul>
              </div>
              <div className="comparison-column accent-panel">
                <h3>AI workforce</h3>
                <ul>
                  <li>Monitors the workflows that matter</li>
                  <li>Updates tools, drafts responses, and completes routine tasks</li>
                  <li>Escalates decisions with context instead of creating more noise</li>
                </ul>
              </div>
            </div>
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

        <section className="section" id="outcomes">
          <div className="section-heading">
            <p className="eyebrow">Outcomes</p>
            <h2>What clients should expect after the setup is complete.</h2>
          </div>
          <div className="outcome-grid">
            {outcomes.map((outcome) => (
              <div className="outcome-item" key={outcome}>
                <span className="outcome-dot" aria-hidden="true" />
                <p>{outcome}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section split-panel" id="audience">
          <div className="section-heading narrow">
            <p className="eyebrow">Who It&apos;s For</p>
            <h2>Best suited to teams that need working systems, not experiments.</h2>
          </div>
          <div className="audience-list">
            {audiences.map((audience) => (
              <div className="audience-item" key={audience}>
                {audience}
              </div>
            ))}
          </div>
        </section>

        <section className="section cta-section" id="contact">
          <div className="cta-card">
            <p className="eyebrow">Call To Action</p>
            <h2>Start with an AI Integration Readiness Audit.</h2>
            <p>
              If you want to see where an AI workforce could save time, capture
              missed opportunities, or reduce admin load, Stonebridge AI can
              map the first useful workflow, rank the opportunities, and build
              from a clear implementation roadmap.
            </p>
            <p className="contact-note">Contact Kris Stone at Stonebridge AI.</p>
            <a className="button button-primary" href="mailto:stonebridgeai@agentmail.to">
              stonebridgeai@agentmail.to
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
