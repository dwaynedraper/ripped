"use client";

import { customAccents, type DesignSelections } from "./design-tokens";

type Props = {
  selections: DesignSelections;
};

export function Preview({ selections }: Props) {
  const fill = selections.fill ?? "filled";

  return (
    <div
      className="preview-root"
      data-fill={fill}
      style={{
        background: "var(--color-bg-base)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <BackgroundGeometry />

      <div className="relative z-10 flex flex-col" style={{ gap: "var(--space-loose)" }}>
        <PreviewHeader selections={selections} />

        <main className="px-8 sm:px-10 flex flex-col" style={{ gap: "var(--space-loose)" }}>
          <Hero />
          <DashboardTiles />
          <CardGrid />
          <PollCard />
          <div className="grid lg:grid-cols-2 gap-[var(--space-base)]">
            <VaultTile />
            <ImageStack />
          </div>
          <FormBlock />
          <ButtonGallery />
          <LinkSamples />
        </main>

        <PreviewFooter />
      </div>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function PreviewHeader({ selections }: { selections: DesignSelections }) {
  return (
    <header
      className="px-8 sm:px-10 pt-8 pb-6 flex items-center justify-between"
      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
    >
      <Wordmark variant={selections.wordmark ?? "plain"} />
      <nav className="hidden sm:flex items-center" style={{ gap: "var(--space-base)" }}>
        <a className="link-tertiary" href="#">Vote</a>
        <a className="link-tertiary" href="#">Verdicts</a>
        <a className="link-tertiary" href="#">Vault</a>
        <button className="btn btn-secondary">Sign in</button>
      </nav>
    </header>
  );
}

// ── Wordmark variants ─────────────────────────────────────────────────────────

function Wordmark({ variant }: { variant: NonNullable<DesignSelections["wordmark"]> }) {
  const baseStyle = {
    fontFamily: "var(--font-display)",
    color: "var(--color-text-primary)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    fontSize: "1.125rem",
  } as const;

  if (variant === "plain") {
    return <div style={baseStyle}>Ripped or Stamped</div>;
  }

  if (variant === "gesture") {
    return (
      <div style={baseStyle}>
        <span style={{ fontWeight: 700 }}>Ripped</span>
        <span style={{ opacity: 0.5, margin: "0 0.4em", fontWeight: 300 }}>or</span>
        <span style={{ fontWeight: 700 }}>Stamped</span>
      </div>
    );
  }

  if (variant === "with-mark") {
    return (
      <div className="flex items-center" style={{ gap: "0.6em" }}>
        <StampMark />
        <div style={baseStyle}>Ripped or Stamped</div>
      </div>
    );
  }

  // initialism
  return (
    <div
      style={{
        ...baseStyle,
        fontWeight: 700,
        fontSize: "1.25rem",
        letterSpacing: "-0.04em",
      }}
    >
      <span>R</span>
      <span style={{ color: "var(--color-accent)", margin: "0 0.1em" }}>/</span>
      <span>S</span>
    </div>
  );
}

function StampMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="19"
        height="19"
        rx="2"
        stroke="var(--color-text-primary)"
        strokeWidth="2"
      />
      <rect
        x="6"
        y="6"
        width="10"
        height="10"
        fill="var(--color-accent)"
      />
    </svg>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="pt-6"
      style={{ paddingBottom: "var(--space-base)" }}
    >
      <div
        className="text-xs uppercase tracking-widest font-medium mb-4"
        style={{ color: "var(--color-secondary-accent)", fontFamily: "var(--font-mono)" }}
      >
        Episode 014 — Now voting
      </div>
      <h1
        className="text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
      >
        The verdict is coming.
        <br />
        <span style={{ color: "var(--color-accent)" }}>Cast your weight.</span>
      </h1>
      <p
        className="mt-5 max-w-xl text-base leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        The Board of Aesthetic Review will render a binary verdict on the next paper —
        but the audience picks which paper they review. Stake your contribution. Watch
        the brackets close. Defend your taste.
      </p>
      <div className="mt-7 flex flex-wrap items-center" style={{ gap: "var(--space-base)" }}>
        <button className="btn btn-primary">Cast your vote</button>
        <button className="btn btn-secondary">Browse verdicts</button>
        <a className="link-tertiary" href="#">
          What is this? →
        </a>
      </div>
    </section>
  );
}

// ── Dashboard tiles ──────────────────────────────────────────────────────────

function DashboardTiles() {
  const tiles = [
    { label: "Active polls", value: "3", delta: "+1" },
    { label: "Your weight", value: "×2.4", delta: "+0.3" },
    { label: "Stamps cast", value: "127", delta: "" },
    { label: "Members", value: "8.4k", delta: "+412" },
  ];
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "var(--space-base)" }}>
      {tiles.map((t) => (
        <div key={t.label} className="card flex flex-col" style={{ gap: "var(--space-tight)" }}>
          <div
            className="text-[0.7rem] uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {t.label}
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className="text-3xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
            >
              {t.value}
            </div>
            {t.delta && (
              <div
                className="text-xs font-mono"
                style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
              >
                {t.delta}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

// ── Card grid ────────────────────────────────────────────────────────────────

function CardGrid() {
  const cards = [
    {
      tag: "Paper",
      title: "Hahnemühle Photo Rag Baryta",
      body: "A baryta-coated cotton rag finished for warm tonality and substantial dynamic range. Selected for episode 014's verdict round.",
    },
    {
      tag: "Challenge",
      title: "The Fluorescent Trap",
      body: "Render skin against ColorChecker's fluorescent magenta. Trap: most papers crush the highlight to pink. Benchmark: SF Pro on Hahnemühle.",
    },
    {
      tag: "Verdict",
      title: "Episode 013 — STAMPED",
      body: "The Board of Aesthetic Review affirms. Audience override could not save it; it didn't need saving. Stamped 5–2 with Architect dissent.",
    },
  ];

  return (
    <section className="grid md:grid-cols-3" style={{ gap: "var(--space-base)" }}>
      {cards.map((c) => (
        <article key={c.title} className="card flex flex-col" style={{ gap: "var(--space-base)" }}>
          <div
            className="aspect-[4/3] w-full"
            style={{
              background:
                "linear-gradient(135deg, var(--color-bg-base) 0%, var(--color-bg-elevated) 100%)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 70% 30%, var(--color-accent) 0%, transparent 60%)`,
                opacity: 0.18,
              }}
            />
            <div
              className="absolute bottom-3 left-3 text-[0.65rem] uppercase tracking-widest font-mono px-2 py-1"
              style={{
                background: "var(--color-bg-overlay)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-xs)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {c.tag}
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: "var(--space-tight)" }}>
            <h3
              className="text-lg font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
            >
              {c.title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {c.body}
            </p>
            <a className="link-primary text-sm mt-1" href="#">
              Read more →
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}

// ── Poll card (the core voting UI) ───────────────────────────────────────────

function PollCard() {
  const options = [
    { id: 1, label: "Hahnemühle Photo Rag Baryta", pct: 42, leading: true },
    { id: 2, label: "Canson Infinity Platine", pct: 31 },
    { id: 3, label: "Moab Slickrock Metallic Pearl", pct: 19 },
    { id: 4, label: "Red River Polar Pearl Metallic", pct: 8 },
  ];
  return (
    <section
      className="card"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-strong)",
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <div
            className="text-[0.65rem] uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--color-secondary-accent)", fontFamily: "var(--font-mono)" }}
          >
            Paper selection — closes in 2d 14h
          </div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
          >
            Which paper does the Board judge next?
          </h2>
        </div>
        <div
          className="text-xs font-mono px-2 py-1"
          style={{
            background: "var(--color-bg-overlay)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-xs)",
            fontFamily: "var(--font-mono)",
          }}
        >
          1,247 votes
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: "var(--space-tight)" }}>
        {options.map((o) => (
          <button
            key={o.id}
            className="text-left relative overflow-hidden"
            style={{
              padding: "var(--space-base)",
              background: "var(--color-bg-overlay)",
              border: o.leading
                ? "1px solid var(--color-accent)"
                : "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${o.pct}%`,
                background: o.leading ? "var(--color-accent)" : "var(--color-border-subtle)",
                opacity: o.leading ? 0.18 : 0.5,
              }}
            />
            <div className="relative flex items-center justify-between">
              <span
                className="font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {o.label}
              </span>
              <span
                className="font-mono text-sm"
                style={{
                  color: o.leading ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: o.leading ? 600 : 400,
                }}
              >
                {o.pct}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Vault tile (premium content) ─────────────────────────────────────────────

function VaultTile() {
  return (
    <article
      className="card relative overflow-hidden"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-strong)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-40 h-40"
        style={{
          background: `radial-gradient(circle at top right, var(--color-accent) 0%, transparent 70%)`,
          opacity: 0.12,
        }}
      />
      <div className="relative">
        <div
          className="text-[0.65rem] uppercase tracking-widest font-mono mb-3 inline-flex items-center gap-2"
          style={{ color: "var(--color-secondary-accent)", fontFamily: "var(--font-mono)" }}
        >
          <LockIcon />
          Architect&apos;s Vault
        </div>
        <h3
          className="text-xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
        >
          The Spectral Failure of OBA Brighteners
        </h3>
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Why optical brightening agents collapse under tungsten review and why
          three of last season&apos;s candidates failed the Board&apos;s second pass.
          ICC profiles, spectrophotometric measurements, and the math behind the
          verdict — for premium members only.
        </p>
        <button className="btn btn-primary">Unlock Vault</button>
      </div>
    </article>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ── Image stack ──────────────────────────────────────────────────────────────

function ImageStack() {
  return (
    <article className="card relative">
      <h3
        className="text-xl font-bold tracking-tight mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
      >
        From the archive
      </h3>
      <div className="relative h-[260px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: `${i * 18}px`,
              left: `${i * 24}px`,
              right: `${(2 - i) * 24}px`,
              bottom: `${(2 - i) * 18}px`,
              background: `linear-gradient(${135 + i * 30}deg, var(--color-bg-elevated) 0%, var(--color-bg-base) 100%)`,
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              boxShadow: i === 2 ? "0 8px 24px rgba(0,0,0,0.12)" : "0 4px 12px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${30 + i * 20}% ${50 + i * 10}%, var(--color-accent) 0%, transparent 50%)`,
                opacity: 0.15,
              }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

// ── Form block ───────────────────────────────────────────────────────────────

function FormBlock() {
  return (
    <section
      className="card"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <h3
        className="text-xl font-bold tracking-tight mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
      >
        Watch the next verdict drop.
      </h3>
      <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
        Episode notification + voting alerts. No spam. Unsubscribe anytime.
      </p>
      <form
        className="flex flex-col sm:flex-row"
        style={{ gap: "var(--space-tight)" }}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder="you@studio.com"
          className="flex-1 outline-none"
          style={{
            padding: "0.75rem 1rem",
            background: "var(--color-bg-overlay)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-xs)",
            fontFamily: "var(--font-body)",
          }}
        />
        <button type="submit" className="btn btn-primary">
          Subscribe
        </button>
      </form>
    </section>
  );
}

// ── Button gallery ───────────────────────────────────────────────────────────

function ButtonGallery() {
  return (
    <section
      className="card"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <h3
        className="text-sm uppercase tracking-widest font-medium mb-4"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Buttons
      </h3>
      <div className="flex flex-wrap items-center" style={{ gap: "var(--space-base)" }}>
        <button className="btn btn-primary">Primary action</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-tertiary">Tertiary</button>
        <button className="btn btn-primary" disabled>
          Disabled
        </button>
      </div>
    </section>
  );
}

// ── Link samples ─────────────────────────────────────────────────────────────

function LinkSamples() {
  return (
    <section
      className="card"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <h3
        className="text-sm uppercase tracking-widest font-medium mb-4"
        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
      >
        Links and inline elements
      </h3>
      <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        The Board of Aesthetic Review will render a verdict on the chosen paper —
        either <a href="#" className="link-primary">stamp it</a> with the official
        seal or <a href="#" className="link-primary">rip it</a> publicly. Reading
        about <a href="#" className="link-tertiary">previous episodes</a> tells you
        what the bar of the show actually is. Mono details look like{" "}
        <code
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--color-bg-overlay)",
            padding: "0.1em 0.4em",
            borderRadius: "var(--radius-xs)",
            fontSize: "0.9em",
            color: "var(--color-accent)",
          }}
        >
          this
        </code>
        .
      </p>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function PreviewFooter() {
  return (
    <footer
      className="px-8 sm:px-10 py-8 mt-8 flex items-center justify-between"
      style={{
        borderTop: "1px solid var(--color-border-subtle)",
        color: "var(--color-text-muted)",
        fontSize: "0.8rem",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)" }}>R/S — © 2026</div>
      <div className="flex" style={{ gap: "var(--space-base)" }}>
        <a className="link-tertiary" href="#">Privacy</a>
        <a className="link-tertiary" href="#">Terms</a>
        <a className="link-tertiary" href="#">Contact</a>
      </div>
    </footer>
  );
}

// ── Background geometry (Vercel-style subtle mesh) ──────────────────────────

function BackgroundGeometry() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute"
        style={{ top: "10%", right: "-5%", opacity: 0.08 }}
        width="500"
        height="500"
        viewBox="0 0 500 500"
        fill="none"
      >
        <circle cx="250" cy="250" r="248" stroke="var(--color-accent)" strokeWidth="1" />
        <circle cx="250" cy="250" r="200" stroke="var(--color-accent)" strokeWidth="1" />
        <circle cx="250" cy="250" r="150" stroke="var(--color-accent)" strokeWidth="1" />
        <circle cx="250" cy="250" r="100" stroke="var(--color-accent)" strokeWidth="1" />
      </svg>
      <svg
        className="absolute"
        style={{ bottom: "20%", left: "-10%", opacity: 0.06 }}
        width="600"
        height="600"
        viewBox="0 0 600 600"
        fill="none"
      >
        <path
          d="M 0 0 L 600 600 M 100 0 L 600 500 M 200 0 L 600 400 M 300 0 L 600 300 M 0 100 L 500 600 M 0 200 L 400 600 M 0 300 L 300 600 M 0 400 L 200 600 M 0 500 L 100 600"
          stroke="var(--color-text-secondary)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

// ── Note: this component depends on .btn / .link-* classes from preview.css ──
// The mode-aware filled/outlined/ghost variants are driven by the parent's
// data-fill attribute on the preview-root container.
export const _accentLookup = customAccents;
