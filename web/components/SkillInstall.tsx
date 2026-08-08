import { CodeBlock } from "./CodeBlock";
import { SKILL_INSTALL_PROMPT, SKILL_URL } from "@/lib/configs";

const USE_CASES = [
  "Implementation plans",
  "PR & design reviews",
  "Architecture maps",
  "Comparisons",
  "Dashboards",
  "Structured reports",
];

export function SkillInstall() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 border-b border-border p-7 sm:p-9 lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-2" />
            Recommended
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight">
            Teach your agent when to go visual.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The MCP server hosts pages. The Htmly skill adds the judgment:
            when a live visual is more useful than another wall of Markdown,
            what format fits the work, and how to deliver it safely.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {USE_CASES.map((useCase) => (
              <span
                key={useCase}
                className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs text-ink/80"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 bg-bg-soft/45 p-7 sm:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-mono text-sm font-bold text-[#07070b]">
              1
            </span>
            <div>
              <p className="font-semibold">Paste this into Codex</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Codex will install the skill from its public source. Restart
                Codex afterward so it appears in new tasks.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <CodeBlock
              code={SKILL_INSTALL_PROMPT}
              language="text"
              filename="Codex prompt"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>Open Agent Skills format · MCP dependency included</span>
            <a
              href={SKILL_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-2 transition hover:text-ink"
            >
              Inspect the skill source →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
