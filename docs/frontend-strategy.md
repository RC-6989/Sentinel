# Sentinel public-site strategy

Decision date: 2026-09-27. This is a positioning and page-design decision for the current waitlist stage, not a claim of product traction or a substitute for user interviews.

## Inputs

- Working code: local account, organization, project, agent, API-key, tool-registry, input validation, a limited local HTTP execution gateway, and deterministic project policies. The internal D1 account/session store is being prepared separately. The deployed Worker gateway, human review workflow, risk engine, and searchable decision stream are not operational. See `PROJECT.md`, `apps/web/src/lib/gateway.ts`, `worker/src/index.ts`, and `packages/policy-engine/src/index.ts`.
- [YC, Practical Design: Messaging](https://www.ycombinator.com/blog/practical-design-messaging/): separate customer value from delivery mechanism; answer value, delivery, workflow, and present action clearly.
- [YC, Guide to Demo Day Presentations](https://www.ycombinator.com/blog/guide-to-demo-day-pitches/): say what the company does and for whom early. A narrow, concrete story is easier to remember than a catalog of features.
- [Launch HN instructions](https://news.ycombinator.com/yli.html): technical readers expect factual language, technical detail, and an honest path to try the product. A waitlist alone is too early for a Launch HN announcement. This site should not imply Sentinel has launched or is YC-backed.
- [NN/g, Homepage Design: 5 Fundamental Principles](https://www.nngroup.com/articles/homepage-design-principles/): make purpose and the main action easy to find; reduce distracting motion.
- [NN/g, B2B Usability](https://www.nngroup.com/articles/b2b-usability/): a vendor's site is an early credibility check; availability and product information matter.
- [OWASP, AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html): least privilege, independent checks for tool actions, approvals for sensitive operations, and auditability are genuine security needs. We must not promise complete protection.
- Current vendor positioning: [Cerbos](https://www.cerbos.dev/ecosystem/langchain), [Permit.io](https://www.permit.io/), [Amazon Bedrock AgentCore Policy](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html), and [Check Point AI Security](https://docs.lakera.ai/guard). Policy checks and approvals are not unique to Sentinel. We will describe Sentinel's intended workflow and avoid “first,” “only,” “most secure,” or unsupported speed claims.

## Buyer and job

The primary reader is an engineer or technical founder who is about to let an AI agent call tools with real side effects, such as issuing refunds, sending messages, or writing data. They need to answer: who can call which tool, with which arguments, and when does a person need to approve? An engineering or security lead evaluating the design is a secondary reader. A generic “all AI security” pitch would obscure this specific job.

## Message choices considered

| Direction | Strength | Weakness | Decision |
| --- | --- | --- | --- |
| “Give your agents clear limits.” | Short and human | “Limits” is generic and the tool-call boundary is hidden in the supporting copy | Replace |
| “Control what your AI agents can do.” | Accurate mission from `PROJECT.md` | Broad; could describe dozens of products | Keep as mission in docs, not the sole homepage headline |
| “Decide what agents can do before they do it.” | States customer value and timing; connects naturally to allow, deny, and approval | Too long to scan quickly in the available hero width | Do not use |
| “Set the rules before agents act.” | Short, direct value proposition with the timing built in | Needs a second line to identify tool calls and current status | Choose |
| “The security control plane for agents.” | Familiar category to technical buyers | Category jargon asks visitors to infer the actual behavior | Use category only as supporting context |

The supporting sentence names the boundary: Sentinel is building a checkpoint between agents and tools, where a request may proceed, stop, or wait for approval before it reaches an API. Local allow/deny policy decisions now work; the human review workflow remains an aspiration. A nearby status line states that hosted enforcement and human approvals are not live.

## What the site should teach

1. **Value:** teams retain the final decision over consequential agent actions.
2. **Mechanism:** the agent sends a tool request through Sentinel; configured rules examine the call; the gateway returns a decision before API execution. A direct API call is outside the boundary.
3. **Example:** one refund tool call can be allowed, held, or denied depending on amount and environment. The sample is user-controlled, labeled illustrative, and never presented as live telemetry.
4. **Current stage:** agent and tool registration, validation, a limited execution gateway, and deterministic policies work locally. Approval-required decisions stop execution. Hosted enforcement, human review, and a searchable decision history are upcoming.
5. **Action today:** join the waitlist for updates. No implied account creation, product access, customer logos, results, or launch date.

## Page architecture

- Header: plain brand; workflow, build status, and waitlist navigation.
- Hero: direct value headline, product sentence, one main CTA, and an illustrative decision example. Availability stays visible above the fold.
- Narrow explanation of the problem: the agent proposes a side-effecting action; the team needs a check before execution. Avoid abstract fear or threat statistics.
- Boundary diagram plus three-step explanation. Show where integration work would happen and where Sentinel stops.
- Build status, then short answers to evaluation questions. Keep planned features visibly planned.
- Waitlist with a visible email label and transparent confirmation/error handling.

## Visual system

Keep the cream, ink, and deep green palette established in the current iteration. Use a clear typographic hierarchy and spacious editorial layout for reading; reserve the dark surface for the tool-call artifact. The decision-boundary line is the visual metaphor. Avoid a glowing grid, animated feeds, floating metric cards, faux terminals, and invented performance numbers. This is a design choice based on the product's need for precision and restraint, not a universal style rule.

## Quality bar and limits

At a glance, a visitor should be able to say: “Sentinel is building a rule and approval checkpoint for agent tool calls. A limited gateway and policy checks work locally, but hosted enforcement and human review are not live.” A keyboard user must be able to operate the example, navigate the page, and understand the waitlist's result. Mobile content must retain the same story without horizontal overflow. The site has no customer evidence yet, so credibility comes from precise examples and transparent status. A credible site does not make the product or company YC-affiliated or launch-ready by itself.
