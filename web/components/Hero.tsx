"use client";

import { motion } from "framer-motion";
import { CopyButton } from "./CodeBlock";
import { MCP_URL } from "@/lib/configs";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Splits text into words and slides each up with a staggered delay (ref: Prisma WordsPullUp). */
function WordsPullUp({
  text,
  className,
  delayOffset = 0,
}: {
  text: string;
  className?: string;
  delayOffset?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-2 -mb-2">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: delayOffset + i * 0.08, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  return (
    <section id="top" className="px-3 pt-3 sm:px-4 md:px-6 md:pt-5">
      <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-[#05050a] md:rounded-[2rem]">
        {/* Background layers */}
        <div className="cine-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="grid-bg pointer-events-none absolute inset-0 -z-10" />
        <div className="noise-overlay pointer-events-none absolute inset-0 z-0 opacity-[0.6] mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

        <div className="relative z-10 mx-auto flex min-h-[86vh] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center md:min-h-[88vh] md:py-24">
          <motion.a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noreferrer"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-cream/80 backdrop-blur-sm transition hover:border-cream/40 hover:text-cream"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-2" />
            Give your AI agent a canvas
          </motion.a>

          <h1 className="mt-8 max-w-4xl text-balance text-[2.6rem] font-bold leading-[0.98] tracking-tight text-cream sm:text-6xl md:text-7xl">
            <WordsPullUp text="AI that explains itself beautifully." />
            <br />
            <span className="font-serif text-[1.15em] font-normal italic tracking-tight text-brand-2">
              <WordsPullUp text="Hosted live. Nothing on your machine." delayOffset={0.32} />
            </span>
          </h1>

          {/* Example prompt pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {["What changed in this PR?", "Walk me through the codebase", "Explain this diff visually"].map(
              (prompt) => (
                <span
                  key={prompt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-cream/80 backdrop-blur-sm"
                >
                  <span className="text-brand-2">→</span>
                  {prompt}
                </span>
              )
            )}
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-cream/60 md:text-lg"
          >
            Your agent answers with a{" "}
            <span className="text-cream/90">live, hosted page</span> — not a
            local file, not a wall of text.{" "}
            <span className="text-brand-2">
              Diffs, diagrams, plans, dashboards
            </span>{" "}
            you can actually open, share, and revisit.
          </motion.p>


          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a
              href="#skill"
              className="group flex items-center gap-2 rounded-full bg-cream py-2 pl-6 pr-2 text-sm font-bold text-[#07070b] transition hover:gap-3"
            >
              Install the Htmly skill
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#07070b] transition group-hover:scale-110 sm:h-10 sm:w-10">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dedbc8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </a>
            <a
              href="#how"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-cream transition hover:border-cream/50"
            >
              See how it works
            </a>
          </motion.div>

          {/* Connect snippet */}
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
            className="mt-14 w-full max-w-2xl text-left"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <span className="ml-3 font-mono text-xs text-cream/50">
                  claude_desktop_config.json
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-sm leading-relaxed text-cream/90">
{`{
  "mcpServers": {
    "htmly": {
      "url": "`}
                <span className="text-brand-2">{MCP_URL}</span>
                {`"
    }
  }
}`}
              </pre>
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                <span className="font-mono text-xs text-cream/50">
                  Tool exposed: htmly
                </span>
                <CopyButton text={MCP_URL} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
