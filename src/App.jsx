import React from 'react';
const services = [
  {
    title: 'OpenClaw Environment Setup',
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
  'Stand up a clean OpenClaw-ready environment with practical defaults for local development and team usage.',
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
          <span>Agentic Solutions</span>
        </a>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#process">How It Works</a>
          <a href="#outcomes">Outcomes</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">Los Angeles, California</p>
            <h1>Practical setup for agentic systems and OpenClaw delivery.</h1>
            <p className="lead">
              Agentic Solutions helps teams launch clean, usable environments for
              agent-assisted work. The focus is straightforward: reliable setup,
              workable operating patterns, and outcomes that hold up under real
              project pressure.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">
                Book an Intro Call
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
            <h2>Start with a straightforward setup conversation.</h2>
            <p>
              If you need a clean foundation for agentic workflows, Agentic
              Solutions can help define the scope, stand up the environment, and
              make it usable for the people who will run it.
            </p>
            <a className="button button-primary" href="mailto:krisbstone@gmail.com">
              krisbstone@gmail.com
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
