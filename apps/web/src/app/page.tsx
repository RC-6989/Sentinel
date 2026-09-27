import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { ToolCallExample } from "@/components/marketing/tool-call-example";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

const workflow = [
  { title: "Route the tool call", body: "Your agent sends a tool request to Sentinel before it reaches the underlying API. Only calls routed through Sentinel are in scope." },
  { title: "Check your rules", body: "The planned policy engine checks the tool, its arguments, and the environment against rules your team defines." },
  { title: "Decide before execution", body: "Allow the request, deny it, or hold it for human review. The planned audit trail records the decision and its reason." },
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
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-marker" aria-hidden="true" /> AI agent tool governance</p>
            <h1 id="hero-title">Give your agents<br />clear limits.</h1>
            <p className="hero-description">Sentinel is being built to check AI agents’ tool calls against your rules, block disallowed actions, and hold sensitive requests for human approval.</p>
            <div className="hero-actions">
              <a href="#waitlist" className="marketing-button">Join the waitlist <ArrowUpRight size={18} aria-hidden="true" /></a>
              <a href="#how-it-works" className="text-link">Explore the workflow <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className="hero-availability">In development. Tool-call enforcement is not available yet.</p>
          </div>
          <ToolCallExample />
        </section>

        <div className="marketing-container architecture" aria-label="Planned architecture">
          <p className="eyebrow">The intended path of a tool call</p>
          <ol className="architecture-path">
            <li><span>Your agent</span><small>Proposes an action</small></li>
            <li className="architecture-gate"><span>Sentinel</span><small>Checks rules · returns a decision</small></li>
            <li><span>Your tool or API</span><small>Runs an allowed action</small></li>
          </ol>
        </div>

        <section id="how-it-works" className="marketing-container editorial-section" aria-labelledby="workflow-title">
          <div className="section-intro">
            <p className="eyebrow">01 / The workflow</p>
            <h2 id="workflow-title">A checkpoint before<br />the API call.</h2>
            <p>A refund, an email, a database write. Each tool call is a concrete action with consequences. Sentinel’s planned gateway puts your rules at that boundary.</p>
            <span className="plain-status">Planned functionality</span>
          </div>
          <ol className="workflow-list">
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
            <div className="section-intro">
              <p className="eyebrow">02 / Build status</p>
              <h2 id="status-title">What’s here.<br />What’s next.</h2>
              <p>Sentinel is in early development. The public site is a waitlist; the working foundation is available in local development.</p>
            </div>
            <div className="build-list">
              <div className="build-row"><span className="build-label available">Available locally</span><div><h3>Agent and access management</h3><p>Accounts, organizations, projects, agent registration, and scoped API keys with rotation and revocation. Tool registration and input validation are also available locally.</p></div></div>
              <div className="build-row"><span className="build-label">Next</span><div><h3>Execution gateway</h3><p>Route tool calls through Sentinel before they reach an API.</p></div></div>
              <div className="build-row"><span className="build-label">Planned</span><div><h3>Policies, approvals, and audit</h3><p>Rule evaluation, human review, risk assessment, and a searchable history of tool-call decisions.</p></div></div>
              <div className="build-row"><span className="build-label">Planned</span><div><h3>SDKs and detection</h3><p>TypeScript and Python integrations, suspicious-content checks, and behavioral monitoring.</p></div></div>
            </div>
          </div>
        </section>

        <section className="marketing-container editorial-section questions-section" aria-labelledby="questions-title">
          <div className="section-intro">
            <p className="eyebrow">03 / Before you integrate</p>
            <h2 id="questions-title">Know the boundary.</h2>
          </div>
          <div className="question-list">
            <details open><summary>Where would Sentinel sit in my stack?</summary><p>Between your agent runtime and the tools it calls. You would need to route those requests through the gateway. Calls made directly to an API would remain outside Sentinel’s control.</p></details>
            <details><summary>Does it need an LLM to make decisions?</summary><p>The planned core uses deterministic rules, so policy decisions would not require a paid LLM API. Optional model-based detection is planned separately and would be disabled by default.</p></details>
            <details><summary>Can I use it to protect production agents today?</summary><p>No. The execution gateway, policy enforcement, and human approval workflow are not implemented yet. The examples on this page illustrate the intended behavior.</p></details>
            <details><summary>Will it catch every unsafe action?</summary><p>No. Sentinel is intended to be one layer of protection. It would still depend on the rules you configure and the tool calls you route through it. Tool permissions and application-level validation remain necessary.</p></details>
          </div>
        </section>

        <section id="waitlist" className="waitlist-section" aria-labelledby="waitlist-title">
          <div className="marketing-container waitlist-inner">
            <div><p className="eyebrow">Follow the build</p><h2 id="waitlist-title">Building agents that<br />take real actions?</h2><p>Join the waitlist for updates on early access to Sentinel.</p></div>
            <div className="waitlist-form-wrap"><WaitlistForm size="lg" /><p className="waitlist-note">Joining the list does not create an account or grant product access.</p></div>
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
