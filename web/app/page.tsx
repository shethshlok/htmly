import { Hero } from "@/components/Hero";
import { InstallTabs } from "@/components/InstallTabs";
import { SkillInstall } from "@/components/SkillInstall";
import { Faq } from "@/components/Faq";
import { CopyButton } from "@/components/CodeBlock";
import { ICONS } from "@/components/icons";
import { FEATURES, STEPS, MCP_URL, FAQS, SITE_URL } from "@/lib/configs";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Htmly",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (MCP client)",
      description:
        "An MCP server and agent skill that turn plans, reviews, diagrams, and other complex answers into polished live HTML pages.",
      url: SITE_URL,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Person", name: "Shlok Sheth" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ---------- Nav (sticky — kept outside the overflow wrapper so it stays pinned) ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 font-mono text-sm text-[#07070b]">
              &lt;/&gt;
            </span>
            Htmly
          </a>
          <div className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#skill" className="transition hover:text-ink">Skill</a>
            <a href="#install" className="transition hover:text-ink">MCP server</a>
            <a href="#faq" className="transition hover:text-ink">FAQ</a>
          </div>
          <a
            href="#skill"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-[#07070b] transition hover:opacity-90"
          >
            Install the skill
          </a>
        </nav>
      </header>

      <main className="relative overflow-x-hidden">
      {/* ---------- Hero ---------- */}
      <Hero />

      {/* ---------- Social proof / trust bar ---------- */}
      <section className="border-y border-border bg-bg-soft/40">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 text-center text-sm text-muted">
          <span>Works with</span>
          {["Claude Desktop", "Claude Code", "Cursor", "VS Code", "Any MCP client"].map((c) => (
            <span key={c} className="font-medium text-ink/80">{c}</span>
          ))}
        </div>
      </section>

      {/* ---------- What is it (simple words) ---------- */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand">
          In simple words
        </h2>
        <p className="mt-5 text-2xl font-medium leading-snug tracking-tight md:text-3xl">
          Your AI agent doesn&apos;t just describe changes — it{" "}
          <span className="text-brand-2">builds a hosted page</span> you can
          open in your browser. No local files, no clutter — just a live link
          with everything laid out visually.
        </p>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = ICONS[f.icon];
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-brand/50"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-2/20 text-brand-2">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="border-t border-border bg-bg-soft/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Three steps from connecting the server to a live page.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-7">
                <span className="font-mono text-3xl font-bold text-brand/30">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Skill install ---------- */}
      <section id="skill" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-brand-2">
            Step 1 · Add the judgment layer
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Install the Htmly skill
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            A compact playbook that teaches your agent when HTML is the better
            answer—and how to turn plans, reviews, diagrams, comparisons, and
            reports into clear, interactive pages.
          </p>
        </div>
        <div className="mt-12">
          <SkillInstall />
        </div>
      </section>

      {/* ---------- Install (multiple ways) ---------- */}
      <section id="install" className="border-t border-border bg-bg-soft/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-brand-2">
              Step 2 · Connect the renderer
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Add the MCP server your way
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Same one-line endpoint, five different clients. Pick yours, copy the
              config, and you&apos;re connected.
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-brand/20 bg-brand/[0.04] px-5 py-4">
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">Or just tell your agent:</span>
              </p>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-brand-2">
                &ldquo;Add <span className="text-ink">{MCP_URL}</span>{" "}
                as an MCP server&rdquo;
              </p>
            </div>
          </div>
          <div className="mt-12">
            <InstallTabs />
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="border-t border-border bg-bg-soft/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            Frequently asked
          </h2>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="relative overflow-hidden">
        <div className="glow pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Give your AI a place to render.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted">
            Copy the endpoint, drop it into your client, and your next prompt can
            come back as a live web page.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <code className="rounded-full border border-border bg-card px-5 py-3 font-mono text-sm text-brand-2">
              {MCP_URL}
            </code>
            <CopyButton text={MCP_URL} className="px-5 py-3 text-sm" />
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-2 font-mono text-xs text-[#07070b]">
              &lt;/&gt;
            </span>
            <span>Htmly — HTML visualization for AI agents</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={SITE_URL} className="transition hover:text-ink">Live server</a>
            <a href="https://github.com/shethshlok" target="_blank" rel="noreferrer" className="transition hover:text-ink">
              GitHub
            </a>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}
