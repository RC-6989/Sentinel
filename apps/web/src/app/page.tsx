import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Braces, KeyRound, ShieldCheck } from "lucide-react";
import { ToolCallExample } from "@/components/marketing/tool-call-example";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

const workflow = [
  { title: "Route the tool call", body: "Your agent sends a tool request to Sentinel before it reaches the underlying API. Only calls routed through Sentinel are in scope." },
  { title: "Check your rules", body: "The local policy engine checks the tool, its arguments, and the environment against rules your team defines." },
  { title: "Decide before execution", body: "Allow or deny the request before dispatch. An approval requirement currently stops execution; the human review workflow is planned." },
];

export default function HomePage() {
  return (
    <div className="marketing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="marketing-container header-inner">
          <Link href="/" className="wordmark" aria-label="Sentinel home">
            <span className="brand-mark" aria-hidden="true">s</span>
            Sentinel
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#build-status">Build status</a>
            <a href="#waitlist" className="nav-cta">Join the waitlist <ArrowUpRight size={15} aria-hidden="true" /></a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="marketing-container hero" aria-labelledby="hero-title">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow"><span className="status-marker" aria-hidden="true" /> For teams shipping AI agents</p>
            <h1 id="hero-title"><span className="hero-line"><span>Set the rules</span></span><span className="hero-line"><span>before agents act.</span></span></h1>
            <p className="hero-description">Sentinel is building a checkpoint between AI agents and the tools they use. Decide which calls can proceed, which should stop, and which need a person’s approval before they reach your API.</p>
            <div className="hero-actions">
              <a href="#waitlist" className="marketing-button button-magnetic">Join the waitlist <ArrowUpRight size={18} aria-hidden="true" /></a>
              <a href="#how-it-works" className="text-link">Explore the workflow <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className="hero-availability"><span aria-hidden="true">●</span> In development. Hosted enforcement and human approvals are not live yet.</p>
          </div>
          <div data-reveal data-reveal-delay="120"><ToolCallExample /></div>
        </section>

        <div className="marketing-container architecture" aria-label="Planned architecture" data-reveal>
          <p className="eyebrow">The intended path of a tool call</p>
          <ol className="architecture-path">
            <li><span>Your agent</span><small>Proposes an action</small></li>
            <li className="architecture-gate"><span>Sentinel</span><small>Checks rules · returns a decision</small></li>
            <li><span>Your tool or API</span><small>Runs an allowed action</small></li>
          </ol>
        </div>

        <section className="control-plane-section" aria-labelledby="control-plane-title">
          <div className="marketing-container">
            <div className="control-section-header" data-reveal>
              <div>
                <p className="eyebrow">A control plane for agent actions</p>
                <h2 id="control-plane-title">See the decision,<br />before the consequence.</h2>
              </div>
              <p>Every allowed call should have an identity, a bounded tool contract, and an explicit rule. Sentinel is built to make that boundary visible.</p>
            </div>
            <div className="control-grid" data-reveal-stagger>
              <article className="control-card control-trace-card">
                <div className="control-card-top"><span>Decision trace</span><span className="control-live"><i aria-hidden="true" /> evaluating</span></div>
                <div className="trace-request">
                  <div><span>Agent</span><strong>support-agent</strong></div>
                  <div><span>Tool</span><strong>issue_refund</strong></div>
                  <div><span>Environment</span><strong>production</strong></div>
                </div>
                <div className="trace-line" aria-hidden="true"><span /></div>
                <ol className="trace-checks">
                  <li><span>01</span><div><strong>Identity verified</strong><small>Active agent · scoped key</small></div><b>pass</b></li>
                  <li><span>02</span><div><strong>Input contract valid</strong><small>Amount and destination checked</small></div><b>pass</b></li>
                  <li><span>03</span><div><strong>Policy matched</strong><small>refund-limit-production</small></div><b>hold</b></li>
                </ol>
                <div className="trace-decision"><ShieldCheck size={18} aria-hidden="true" /><div><span>Decision</span><strong>Require approval</strong></div><small>Tool not dispatched</small></div>
              </article>

              <article className="control-card control-mini-card">
                <KeyRound size={19} aria-hidden="true" />
                <div><span className="control-card-index">01 / Identity</span><h3>Know which agent is acting.</h3><p>Agent-bound keys create a clear caller boundary before a request reaches policy.</p></div>
                <small>Available locally</small>
              </article>

              <article className="control-card control-mini-card">
                <Braces size={19} aria-hidden="true" />
                <div><span className="control-card-index">02 / Contract</span><h3>Constrain the shape of the call.</h3><p>Tool schemas validate arguments before an enabled destination can receive them.</p></div>
                <small>Available locally</small>
              </article>

              <article className="control-card control-rule-card">
                <span className="control-card-index">03 / Deterministic policy</span>
                <p><code>deny</code> overrides <code>approval</code>, which overrides <code>allow</code>.</p>
                <div><span>No matching allow rule</span><strong>DENY</strong></div>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="marketing-container editorial-section" aria-labelledby="workflow-title">
          <div className="section-intro" data-reveal>
            <p className="eyebrow">01 / Why this boundary matters</p>
            <h2 id="workflow-title">An instruction isn’t<br />a permission check.</h2>
            <p>A prompt can tell a support agent to keep refunds under $50. It cannot enforce that limit when the agent asks to issue $129. Sentinel is designed to check the request before the refund API runs.</p>
            <span className="plain-status">Local policy checks · human review planned</span>
          </div>
          <ol className="workflow-list" data-reveal-stagger>
            {workflow.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">0{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="build-status" className="status-section" aria-labelledby="status-title">
          <div className="marketing-container editorial-section">
            <div className="section-intro" data-reveal>
              <p className="eyebrow">02 / Build status</p>
              <h2 id="status-title">What’s here.<br />What’s next.</h2>
              <p>Sentinel is in early development. The public site is a waitlist; the working foundation is available in local development.</p>
            </div>
            <div className="build-list" data-reveal-stagger>
              <div className="build-row"><span className="build-label available">Available locally</span><div><h3>Agent and access management</h3><p>Accounts, organizations, projects, agent registration, and scoped API keys with rotation and revocation.</p></div></div>
              <div className="build-row"><span className="build-label available">Available locally</span><div><h3>Tool setup and input checks</h3><p>Register a tool, define its input schema, and validate sample arguments.</p></div></div>
              <div className="build-row"><span className="build-label available">Available locally</span><div><h3>Limited execution gateway</h3><p>Opted-in, allowlisted tools can receive authenticated calls after input validation and an explicit allow policy.</p></div></div>
              <div className="build-row"><span className="build-label available">Available locally</span><div><h3>Deterministic policy checks</h3><p>Project rules can allow, deny, or require approval. Approval requirements currently block execution; no reviewer workflow runs yet.</p></div></div>
              <div className="build-row"><span className="build-label">Planned</span><div><h3>Human review and decision history</h3><p>A reviewer approval workflow, risk assessment, and a searchable history of tool-call decisions.</p></div></div>
              <div className="build-row"><span className="build-label">Planned</span><div><h3>SDKs and detection</h3><p>TypeScript and Python integrations, suspicious-content checks, and behavioral monitoring.</p></div></div>
            </div>
          </div>
        </section>

        <section className="marketing-container editorial-section questions-section" aria-labelledby="questions-title">
          <div className="section-intro" data-reveal>
            <p className="eyebrow">03 / Before you integrate</p>
            <h2 id="questions-title">Know the boundary.</h2>
          </div>
          <div className="question-list" data-reveal-stagger>
            <details open><summary>Where would Sentinel sit in my stack?</summary><p>Between your agent runtime and the tools it calls. You would need to route those requests through the gateway. Calls made directly to an API would remain outside Sentinel’s control.</p></details>
            <details><summary>Does it need an LLM to make decisions?</summary><p>No. The local policy engine uses deterministic rules without an LLM API. Optional model-based detection is planned separately and would be disabled by default.</p></details>
            <details><summary>Can I use it to protect production agents today?</summary><p>No. Gateway execution and policy checks run locally. A deployed gateway and human approval workflow are not available. The approval example above illustrates the intended review flow.</p></details>
            <details><summary>Will it catch every unsafe action?</summary><p>No. Sentinel is intended to be one layer of protection. It would still depend on the rules you configure and the tool calls you route through it. Tool permissions and application-level validation remain necessary.</p></details>
          </div>
        </section>

        <section id="waitlist" className="waitlist-section" aria-labelledby="waitlist-title">
          <div className="marketing-container waitlist-inner">
            <div data-reveal><p className="eyebrow">Follow the build</p><h2 id="waitlist-title">Building agents that<br />take real actions?</h2><p>Join the waitlist to hear when Sentinel opens for early access.</p></div>
            <div className="waitlist-form-wrap" data-reveal data-reveal-delay="100"><WaitlistForm size="lg" /><p className="waitlist-note">Joining the list does not create an account or grant product access.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer marketing-container">
        <Link href="/" className="wordmark">Sentinel</Link>
        <p>Tool governance for AI agents. In development.</p>
        <a className="text-link" href="#build-status">Build status <ArrowRight size={15} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
