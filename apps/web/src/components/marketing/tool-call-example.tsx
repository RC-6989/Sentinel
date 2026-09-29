"use client";

import { useState } from "react";
import { Check, Pause, X } from "lucide-react";

// Illustrative data only. These examples do not call the policy-engine stub.
const examples = [
  { label: "$25 refund", amount: "$25.00", environment: "production", decision: "Allow", tone: "allow", Icon: Check, rule: "Refunds below $50 are allowed.", result: "The request could proceed to the refund API." },
  { label: "$129 refund", amount: "$129.00", environment: "production", decision: "Require approval", tone: "approval", Icon: Pause, rule: "Refunds of $50 or more need human approval.", result: "The request would wait for a reviewer’s decision." },
  { label: "Test environment", amount: "$129.00", environment: "staging", decision: "Deny", tone: "deny", Icon: X, rule: "Refunds from staging are denied, regardless of amount.", result: "The refund API would not receive this request." },
] as const;

export function ToolCallExample() {
  const [selected, setSelected] = useState(1);
  const example = examples[selected];
  const Icon = example.Icon;

  return (
    <figure className="tool-example" aria-labelledby="example-title" data-tilt>
      <figcaption className="example-caption"><span id="example-title">One tool. Three decisions.</span><span className="example-label"><span className="example-live-dot" aria-hidden="true" /> Policy simulation</span></figcaption>
      <div className="example-options" role="group" aria-label="Choose an illustrative tool call">
        {examples.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.label}</button>)}
      </div>
      <div className="example-flow" key={selected}>
      <div className="example-request">
        <div className="example-kicker"><span>Incoming request</span><span>01</span></div>
        <h2>issue_refund</h2>
        <dl><div><dt>Agent</dt><dd>support-agent</dd></div><div><dt>Amount</dt><dd>{example.amount}</dd></div><div><dt>Environment</dt><dd>{example.environment}</dd></div></dl>
      </div>
      <div className="example-rule"><div className="example-kicker"><span>Matching rule</span><span>02</span></div><p>{example.rule}</p></div>
      <div className={`example-decision ${example.tone}`} role="status" aria-live="polite" aria-atomic="true">
        <Icon size={20} aria-hidden="true" /><div><h3>{example.decision}</h3><p>{example.result}</p></div>
      </div>
      </div>
      <p className="example-footnote">Select a request to explore the planned behavior. No tools run.</p>
    </figure>
  );
}
