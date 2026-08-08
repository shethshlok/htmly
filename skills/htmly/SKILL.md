---
name: htmly
description: Turn substantial agent work into a polished, hosted HTML page with the Htmly MCP tool. Use for visual or interactive deliverables such as implementation plans, project roadmaps, code and architecture walkthroughs, PR or design reviews, annotated findings, comparisons, decision briefs, diagrams, dashboards, reports, timelines, and structured explanations where layout makes relationships easier to understand. Also use when the user asks to visualize, render, show, diagram, make interactive, or provide a shareable page. Prefer a normal text response for simple facts, short answers, or tasks whose value would not improve with a visual artifact.
---

# Htmly

Create the useful artifact first; treat hosting as the final delivery step. Preserve the depth and accuracy of the underlying work—HTML presentation must clarify the analysis, not replace it.

## Workflow

1. Choose the smallest visual format that fits the material:
   - Plans: phases, milestones, dependencies, owners, risks, and next actions.
   - Reviews: prioritized findings, evidence, affected areas, and recommended fixes.
   - Code or system explanations: component maps, request/data flows, boundaries, and key files.
   - Diffs or PRs: change summary, impact map, behavioral before/after, risks, and test coverage.
   - Comparisons: shared criteria, tradeoffs, recommendation, and unresolved questions.
   - Dashboards or reports: headline metrics, trends, filters only when useful, and an accessible data view.
2. Build a responsive, self-contained `index.html`. Inline CSS and small JavaScript by default; split files only when that materially improves maintainability. Avoid external packages and network dependencies unless the artifact requires them.
3. Give the page a clear reading order: title and context, executive summary, primary visualization or content, supporting detail, then next actions. Use semantic HTML, keyboard-accessible controls, sufficient contrast, and layouts that remain usable on mobile.
4. Add interaction only when it improves comprehension: filtering, tabs, expandable detail, linked navigation, or focused inspection. Do not add decorative controls, fake data, or interaction that obscures the answer.
5. Call the MCP tool named `htmly` with the complete file bundle and `entryPoint: "index.html"`. Prefer one complete call over iterative partial uploads.
6. Return the hosted URL prominently with a one-sentence description. Do not paste the generated source into the response unless the user asks for it.

## Visual quality

- Establish deliberate typography, spacing, color, and hierarchy suited to the subject.
- Prefer diagrams, tables, timelines, cards, or annotated regions when they reveal relationships faster than prose.
- Keep prose concise inside the page, but retain concrete evidence, labels, and decisions.
- Use real content from the task. Clearly label assumptions and unknowns; never invent supporting facts.
- Make dense pages scannable with a summary layer and progressive detail.

## Tool and safety constraints

- The tool accepts `files` as `{ name, content }[]` and an optional `entryPoint`; use root-level file names.
- Hosted pages expire after 24 hours. Present them as temporary previews, not durable documentation.
- Treat the URL as unlisted, not access-controlled. Never upload credentials, secrets, tokens, private keys, or unnecessarily sensitive data. Redact or summarize sensitive inputs before rendering.
- If the `htmly` tool is unavailable, ask the user to connect `https://html.shloksheth.tech/mcp`; do not claim the page was hosted.
