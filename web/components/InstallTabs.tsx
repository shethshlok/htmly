"use client";

import { useState } from "react";
import { INSTALL_METHODS } from "@/lib/configs";
import { CodeBlock } from "./CodeBlock";

export function InstallTabs() {
  const [active, setActive] = useState(INSTALL_METHODS[0].id);
  const method = INSTALL_METHODS.find((m) => m.id === active)!;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap justify-center gap-2">
        {INSTALL_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === m.id
                ? "bg-brand text-[#07070b]"
                : "border border-border text-muted hover:border-brand hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        <p className="mb-4 text-center text-sm leading-relaxed text-muted">
          {method.blurb}
        </p>
        <CodeBlock
          code={method.code}
          language={method.language}
          filename={method.location}
        />
      </div>
    </div>
  );
}
