# Sentinel frontend audit

Reviewed 2026-09-27 against the application code, package stubs, project specification, and the sources below. This is a design review, not a user study or a security certification.

## What the site must communicate

Sentinel is being built to govern AI agent tool calls at the boundary between an agent and an API. The intended workflow is to evaluate configured rules, allow or deny requests, hold selected requests for human review, and record decisions. Enforcement requires routing calls through Sentinel. It does not automatically cover every action an agent takes.

The public site is a waitlist. Accounts, organizations, projects, agents, scoped API keys, and the newly added tool registry/input validation work locally. The execution gateway, policy enforcement, approvals, risk scoring, tool-call audit stream, detection, and usable execution SDKs remain planned. Tool registration is not tool execution. Administrative audit records already exist; that does not mean a tool-call audit stream exists.

## Findings and corrections

| Finding | Evidence | Correction |
| --- | --- | --- |
| Present-tense enforcement and risk claims implied a working gateway | `worker/src/index.ts` returns 501 outside health; `packages/policy-engine/src/index.ts` is a scaffolding evaluator | Describe intended behavior and display availability next to the hero and in a build-status section |
| `sentinel.protect()` was presented as usable integration code | `packages/sdk-typescript/src/index.ts` exports `Sentinel`; `execute()` throws by design | Remove the invalid snippet; explain where integration will sit without promising a settled API |
| Repeating event feed and exact risk scores resembled telemetry | Hard-coded marketing scenes and ticker data | Remove both; use selectable, explicitly illustrative requests with reasons instead of invented measurements |
| Approval and plan buttons were decorative spans | `agent-elements-showcase.tsx` was not wired to any action; plan approval was not a specified current feature | Remove fake controls and unsupported plan-management claims |
| Auth screen claimed “policy engine online,” “Live decisions,” and approvals “on” | Hard-coded auth panel | Replace with actual local capabilities and planned feature status |
| Zero incidents and “That’s good” implied observation had occurred | Hard-coded dashboard KPI values | Show an em dash with an explanation that the subsystem is unavailable |
| Generic visual decoration competed with the explanation | Background grid, radial washes, shimmer, rotating words, auto-advancing pipeline | Replace with static hierarchy, section rules, limited color, and interaction initiated by the visitor |
| Waitlist used a placeholder/ARIA label with no visible label | `waitlist-form.tsx` | Add a visible associated label, input/error association, pending state, and explicit saved-email confirmation |
| An unconfigured production waitlist exposed an environment variable instruction | `lib/waitlist.ts` | Return a visitor-facing temporary-unavailability message |
| Font theme variables referenced themselves | `globals.css` and layout font variables | Give loaded fonts separate variable names and map the theme to those names |

The concurrent local tool-registry implementation was preserved and is represented as available locally. Do not infer that this frontend work implemented it.

## Research and design decisions

“Vibe-coded” is not a measurable design category. Here it means observable weaknesses: interchangeable slogans, ornamental effects, repetitive feature cards, invented product evidence, and controls that only look functional. The remedy is a coherent design built around the actual product and the visitor’s questions.

### Purpose and hierarchy

[NN/g: Homepage Design — 5 Fundamental Principles](https://www.nngroup.com/articles/homepage-design-principles/) recommends making the organization’s purpose immediately understandable, giving important actions priority, and keeping the page simple. Applied here: a stable headline, a concrete explanation above the fold, one waitlist action, and visible navigation to workflow and status. The user should not need to wait for a rotating word to learn what the product does.

[NN/g: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) explains how scale, contrast, and grouping direct attention. Applied here: larger product statement, a dark example panel as the main visual evidence, restrained section headings, and whitespace/row dividers in place of a grid of equally weighted cards. Olive and charcoal are aesthetic choices, not research-backed requirements. Their job is to support a consistent hierarchy.

### Credibility and content

[NN/g: About Us Information on Corporate Websites](https://www.nngroup.com/articles/about-us-information-on-websites/) reports the importance of explaining a company’s purpose and using honest, straightforward language. Applied here: no customer logos, performance numbers, uptime claims, or security guarantees without evidence. Separate what works locally from what is planned. Show integration boundaries where a prospective user would look for them.

[GOV.UK: Writing to GOV.UK standards](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/) organizes content work around user needs and clear, helpful writing. Applied here: answer “What does this check?”, “Where does it sit?”, “What exists today?”, and “What happens when I join?” Avoid empty language such as “unlock,” “seamless,” or “enterprise-grade” in place of an explanation.

### Interaction and motion

[NN/g: The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/) discusses purposeful motion in interaction. [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) explains control requirements for automatically moving or updating information. Applied here: no timers, marquees, blinking status lights, delayed headings, or automatic scene changes. Visitors select examples explicitly; the result is announced as a polite status update. Native disclosures handle secondary questions.

### Accessibility

[W3C: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) specifies 4.5:1 for ordinary text and 3:1 for qualifying large text. Use readable foreground/background pairs and reserve lighter tones for supporting content that still meets contrast requirements. Decision states have words and icons as well as color.

[W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) explains minimum target size and spacing. The example selectors and principal actions have at least 44px height, exceeding the 24px minimum dimension. Use real anchors for navigation and buttons for actions; do not nest buttons inside links.

[W3C: User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) covers understandable, accessible feedback. Applied here: a visible email label, associated error, pending button text, and a success status. The form must only report success after persistence succeeds. A missing integration is an error, not a successful signup.

### Performance and implementation

[Google: Web Vitals](https://web.dev/articles/vitals) distinguishes loading, responsiveness, and visual stability. Applied here: use server-rendered content, keep client state limited to the example selector and form, retain local font loading, and remove timer-driven decorative components. Do not claim a performance score without measuring it. A local browser check cannot establish real-user Core Web Vitals.

## Maintenance rules

- Recheck public claims against working code whenever a phase changes.
- Keep illustrative examples labeled even after the gateway ships; an example is not production telemetry.
- Publish integration code only once the exported API and end-to-end path work.
- A missing metric is unavailable, not zero. A paused agent is not proof that external API calls are blocked.
- Preserve the distinction between local availability and public deployment.
- Validate responsive layouts, keyboard access, and success/error states when changing forms or interaction.

## Verification

Lint, workspace typechecking, existing service/security tests, production build, and browser smoke checks are performed for this change. The final delivery reports outcomes and any unverified areas; this document does not claim a formal accessibility audit or user testing.
