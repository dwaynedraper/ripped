"use client";

import { useMemo } from "react";
import {
  customAccents,
  densityOptions,
  fillOptions,
  neutralsOptions,
  secondaryAccentOptions,
  shapeOptions,
  typographyOptions,
  voices,
  wordmarkOptions,
  type DesignSelections,
  type Mode,
} from "./design-tokens";
import { contrastRatio, formatRatio, gradeContrast } from "./contrast";

type Setters = {
  selections: DesignSelections;
  update: <K extends keyof DesignSelections>(key: K, value: DesignSelections[K]) => void;
  selectVoice: (id: DesignSelections["voice"]) => void;
  setMode: (mode: Mode) => void;
};

// ── Generic Panel wrapper ────────────────────────────────────────────────────

function Panel({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel-heading">
        <span className="panel-title">{title}</span>
        <span className="panel-step">{String(step).padStart(2, "0")}</span>
      </header>
      {children}
    </section>
  );
}

// ── Mode toggle (shared, lives at the top) ───────────────────────────────────

export function ModeToggle({ selections, setMode }: Pick<Setters, "selections" | "setMode">) {
  return (
    <div className="mode-toggle" role="group" aria-label="Color mode">
      <button
        type="button"
        aria-pressed={selections.mode === "light"}
        onClick={() => setMode("light")}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={selections.mode === "dark"}
        onClick={() => setMode("dark")}
      >
        Dark
      </button>
    </div>
  );
}

// ── 1. Voice ─────────────────────────────────────────────────────────────────

export function VoicePanel({ selections, selectVoice }: Setters) {
  return (
    <Panel step={1} title="Voice">
      <div className="option-grid" style={{ gridTemplateColumns: "1fr" }}>
        {voices.map((v) => (
          <button
            key={v.id}
            type="button"
            className="option"
            data-selected={selections.voice === v.id}
            onClick={() => selectVoice(v.id)}
          >
            <span className="option-name">{v.name}</span>
            <span className="option-desc">{v.description}</span>
          </button>
        ))}
      </div>
      <p className="option-desc" style={{ marginTop: "0.75rem", color: "#525252" }}>
        Picking a voice presets typography, neutrals, shape, fill, and density.
        Override any of them below.
      </p>
    </Panel>
  );
}

// ── 2. Typography ────────────────────────────────────────────────────────────

export function TypographyPanel({ selections, update }: Setters) {
  return (
    <Panel step={2} title="Typography">
      <div className="option-grid">
        {typographyOptions.map((t) => (
          <button
            key={t.id}
            type="button"
            className="option"
            data-selected={selections.typography === t.id}
            onClick={() => update("typography", t.id)}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="option-name" style={{ fontFamily: t.display, fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                The verdict is coming.
              </span>
            </div>
            <span className="option-desc" style={{ fontFamily: t.body }}>
              {t.name} — {t.description}
            </span>
            <span style={{ fontFamily: t.mono, fontSize: "0.75rem", color: "#737373" }}>
              const verdict = stamped;
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ── 3. Neutrals ──────────────────────────────────────────────────────────────

export function NeutralsPanel({ selections, update }: Setters) {
  return (
    <Panel step={3} title="Neutrals">
      <div className="option-grid">
        {neutralsOptions.map((n) => {
          const palette = selections.mode === "dark" ? n.dark : n.light;
          return (
            <button
              key={n.id}
              type="button"
              className="option"
              data-selected={selections.neutrals === n.id}
              onClick={() => update("neutrals", n.id)}
            >
              <span className="option-name">{n.name}</span>
              <div className="swatch-stack">
                <div style={{ background: palette.bgBase }} />
                <div style={{ background: palette.bgElevated }} />
                <div style={{ background: palette.bgOverlay }} />
                <div style={{ background: palette.borderSubtle }} />
                <div style={{ background: palette.borderStrong }} />
                <div style={{ background: palette.textMuted }} />
                <div style={{ background: palette.textSecondary }} />
                <div style={{ background: palette.textPrimary }} />
              </div>
              <span className="option-desc">{n.description}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

// ── 4. Secondary accent ──────────────────────────────────────────────────────

export function SecondaryAccentPanel({ selections, update }: Setters) {
  return (
    <Panel step={4} title="Secondary accent">
      <div className="option-grid">
        {secondaryAccentOptions.map((a) => {
          const value = selections.mode === "dark" ? a.dark : a.light;
          return (
            <button
              key={a.id}
              type="button"
              className="option"
              data-selected={selections.secondaryAccent === a.id}
              onClick={() => update("secondaryAccent", a.id)}
            >
              <div className="flex items-center gap-3">
                {value ? (
                  <div className="swatch" style={{ background: value, width: "32px", height: "32px", borderRadius: "4px", flexShrink: 0 }} />
                ) : (
                  <div className="swatch" style={{ background: "transparent", border: "1px dashed #525252", width: "32px", height: "32px", borderRadius: "4px", flexShrink: 0 }} />
                )}
                <div>
                  <div className="option-name">{a.name}</div>
                  <div className="option-desc">{a.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

// ── 5. Custom accent ─────────────────────────────────────────────────────────

export function CustomAccentPanel({ selections, update }: Setters) {
  const filtered = useMemo(
    () => customAccents.filter((a) => a.mode === selections.mode),
    [selections.mode],
  );

  // Need the current bg + text from the chosen neutral palette to compute contrast
  const neutral = neutralsOptions.find((n) => n.id === selections.neutrals);
  const palette = neutral
    ? (selections.mode === "dark" ? neutral.dark : neutral.light)
    : null;

  return (
    <Panel step={5} title={`Custom accent — ${selections.mode} mode`}>
      <div className="option-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {filtered.map((a) => {
          const onBg = palette ? contrastRatio(a.base, palette.bgBase) : 0;
          const onText = contrastRatio(a.foreground, a.base);
          const grade = gradeContrast(onBg);
          const fgGrade = gradeContrast(onText);
          return (
            <button
              key={a.id}
              type="button"
              className="option"
              data-selected={selections.customAccent === a.id}
              onClick={() => update("customAccent", a.id)}
            >
              <div className="swatch" style={{ background: a.base, height: "44px", borderRadius: "4px" }} />
              <div className="option-name" style={{ marginTop: "0.5rem" }}>{a.name}</div>
              <div className="flex flex-wrap gap-1" style={{ marginTop: "0.25rem" }}>
                <ContrastBadge ratio={onBg} grade={grade} label="bg" />
                <ContrastBadge ratio={onText} grade={fgGrade} label="fg" />
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  background: a.base,
                  color: a.foreground,
                  padding: "0.4rem 0.7rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textAlign: "center",
                  fontFamily: "var(--font-geist-sans), system-ui",
                }}
              >
                Cast vote
              </div>
            </button>
          );
        })}
      </div>
      <p className="option-desc" style={{ marginTop: "0.75rem", color: "#525252" }}>
        <strong style={{ color: "#a3a3a3" }}>bg</strong> = accent against page background.{" "}
        <strong style={{ color: "#a3a3a3" }}>fg</strong> = button text against accent.
        Both should be AA or better.
      </p>
    </Panel>
  );
}

function ContrastBadge({
  ratio,
  grade,
  label,
}: {
  ratio: number;
  grade: ReturnType<typeof gradeContrast>;
  label: string;
}) {
  const cls =
    grade === "AAA"
      ? "contrast-badge contrast-aaa"
      : grade === "AA"
        ? "contrast-badge contrast-aa"
        : grade === "AA-large"
          ? "contrast-badge contrast-aa-large"
          : "contrast-badge contrast-fail";
  return (
    <span className={cls}>
      {label} {formatRatio(ratio)} {grade}
    </span>
  );
}

// ── 6. Shape ─────────────────────────────────────────────────────────────────

export function ShapePanel({ selections, update }: Setters) {
  return (
    <Panel step={6} title="Shape">
      <div className="option-grid">
        {shapeOptions.map((s) => (
          <button
            key={s.id}
            type="button"
            className="option"
            data-selected={selections.shape === s.id}
            onClick={() => update("shape", s.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="option-name">{s.name}</div>
                <div className="option-desc">{s.description}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <div
                  style={{
                    background: "#fafafa",
                    color: "#0a0a0a",
                    fontSize: "0.7rem",
                    padding: "0.4rem 0.7rem",
                    borderRadius: s.radiusMd,
                    fontWeight: 600,
                  }}
                >
                  Btn
                </div>
                <div
                  style={{
                    background: "transparent",
                    border: "1px solid #404040",
                    width: "28px",
                    height: "28px",
                    borderRadius: s.radiusMd,
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ── 7. Fill ──────────────────────────────────────────────────────────────────

export function FillPanel({ selections, update }: Setters) {
  return (
    <Panel step={7} title="Fill">
      <div className="option-grid">
        {fillOptions.map((f) => (
          <button
            key={f.id}
            type="button"
            className="option"
            data-selected={selections.fill === f.id}
            onClick={() => update("fill", f.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="option-name">{f.name}</div>
                <div className="option-desc">{f.description}</div>
              </div>
              <FillPreview kind={f.id} />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function FillPreview({ kind }: { kind: "filled" | "outlined" | "ghost" }) {
  const accent = "var(--color-accent)";
  const fg = "var(--color-accent-foreground)";
  if (kind === "filled") {
    return (
      <div
        style={{
          background: accent,
          color: fg,
          fontSize: "0.7rem",
          padding: "0.4rem 0.7rem",
          borderRadius: "4px",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Btn
      </div>
    );
  }
  if (kind === "outlined") {
    return (
      <div
        style={{
          background: "transparent",
          color: accent,
          border: `1px solid ${accent}`,
          fontSize: "0.7rem",
          padding: "0.4rem 0.7rem",
          borderRadius: "4px",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Btn
      </div>
    );
  }
  return (
    <div
      style={{
        background: "transparent",
        color: accent,
        fontSize: "0.7rem",
        padding: "0.4rem 0.7rem",
        borderRadius: "4px",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      Btn
    </div>
  );
}

// ── 8. Density ───────────────────────────────────────────────────────────────

export function DensityPanel({ selections, update }: Setters) {
  return (
    <Panel step={8} title="Density">
      <div className="option-grid">
        {densityOptions.map((d) => (
          <button
            key={d.id}
            type="button"
            className="option"
            data-selected={selections.density === d.id}
            onClick={() => update("density", d.id)}
          >
            <div className="option-name">{d.name}</div>
            <div className="option-desc">{d.description}</div>
            <div
              style={{
                display: "flex",
                gap: d.spaceTight,
                marginTop: "0.5rem",
              }}
            >
              <div style={{ width: "20%", height: "8px", background: "#404040", borderRadius: "2px" }} />
              <div style={{ width: "30%", height: "8px", background: "#404040", borderRadius: "2px" }} />
              <div style={{ width: "25%", height: "8px", background: "#404040", borderRadius: "2px" }} />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ── 9. Wordmark ──────────────────────────────────────────────────────────────

export function WordmarkPanel({ selections, update }: Setters) {
  const typo = typographyOptions.find((t) => t.id === selections.typography);
  const fontFamily = typo?.display ?? "var(--font-geist-sans)";

  return (
    <Panel step={9} title="Wordmark">
      <div className="option-grid">
        {wordmarkOptions.map((w) => (
          <button
            key={w.id}
            type="button"
            className="option"
            data-selected={selections.wordmark === w.id}
            onClick={() => update("wordmark", w.id)}
          >
            <div className="option-name">{w.name}</div>
            <div className="option-desc">{w.description}</div>
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.85rem 1rem",
                background: "#0a0a0a",
                border: "1px solid #262626",
                borderRadius: "4px",
                color: "#fafafa",
              }}
            >
              <WordmarkSample variant={w.id} fontFamily={fontFamily} />
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function WordmarkSample({
  variant,
  fontFamily,
}: {
  variant: "plain" | "gesture" | "with-mark" | "initialism";
  fontFamily: string;
}) {
  const baseStyle = {
    fontFamily,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    fontSize: "1rem",
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
      <div className="flex items-center" style={{ gap: "0.55em" }}>
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <rect x="1.5" y="1.5" width="19" height="19" rx="2" stroke="#fafafa" strokeWidth="2" />
          <rect x="6" y="6" width="10" height="10" fill="var(--color-accent)" />
        </svg>
        <div style={baseStyle}>Ripped or Stamped</div>
      </div>
    );
  }
  return (
    <div style={{ ...baseStyle, fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.04em" }}>
      <span>R</span>
      <span style={{ color: "var(--color-accent)", margin: "0 0.1em" }}>/</span>
      <span>S</span>
    </div>
  );
}

// ── Export panel ─────────────────────────────────────────────────────────────

export function ExportPanel({
  selections,
  reset,
}: {
  selections: DesignSelections;
  reset: () => void;
}) {
  const handleExport = () => {
    const json = JSON.stringify(selections, null, 2);

    // Copy to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
    }

    // Trigger download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-selections.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Panel step={10} title="Export">
      <div className="option-grid">
        <button
          type="button"
          className="option"
          onClick={handleExport}
          style={{ borderColor: "#fafafa" }}
        >
          <div className="option-name">Export selections</div>
          <div className="option-desc">
            Downloads a JSON file and copies it to your clipboard. Paste it back to
            me to lock in the design language.
          </div>
        </button>
        <button type="button" className="option" onClick={reset}>
          <div className="option-name" style={{ color: "#f87171" }}>Reset all</div>
          <div className="option-desc">Restore the starting selections.</div>
        </button>
      </div>
      <pre
        style={{
          marginTop: "1rem",
          padding: "0.875rem",
          background: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: "6px",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.7rem",
          color: "#a3a3a3",
          overflow: "auto",
          maxHeight: "200px",
        }}
      >
        {JSON.stringify(selections, null, 2)}
      </pre>
    </Panel>
  );
}
