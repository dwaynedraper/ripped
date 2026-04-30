"use client";

import { Preview } from "./preview";
import {
  CustomAccentPanel,
  DensityPanel,
  ExportPanel,
  FillPanel,
  ModeToggle,
  NeutralsPanel,
  SecondaryAccentPanel,
  ShapePanel,
  TypographyPanel,
  VoicePanel,
  WordmarkPanel,
} from "./panels";
import { useDesignSelections } from "./use-design-selections";

export function DesignTool() {
  const { selections, hydrated, cssVars, update, reset, selectVoice, setMode } =
    useDesignSelections();

  // Avoid SSR/CSR style mismatch — wait for hydration before painting variable values
  if (!hydrated) {
    return (
      <div
        style={{
          background: "#0a0a0a",
          color: "#a3a3a3",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.85rem",
        }}
      >
        Loading design tool…
      </div>
    );
  }

  const setters = { selections, update, selectVoice, setMode };

  return (
    <div className="grid lg:grid-cols-[3fr_2fr] min-h-screen">
      {/* Live preview pane */}
      <div
        className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
        style={cssVars}
      >
        <Preview selections={selections} />
      </div>

      {/* Selection panels */}
      <aside className="panels-root lg:h-screen lg:overflow-y-auto">
        <header
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #262626",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "#0a0a0a",
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "0.7rem",
                color: "#525252",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Design selections
            </div>
            <div style={{ color: "#fafafa", fontWeight: 600, fontSize: "1rem" }}>
              Ripped or Stamped
            </div>
          </div>
          <ModeToggle selections={selections} setMode={setMode} />
        </header>

        <VoicePanel {...setters} />
        <TypographyPanel {...setters} />
        <NeutralsPanel {...setters} />
        <SecondaryAccentPanel {...setters} />
        <CustomAccentPanel {...setters} />
        <ShapePanel {...setters} />
        <FillPanel {...setters} />
        <DensityPanel {...setters} />
        <WordmarkPanel {...setters} />
        <ExportPanel selections={selections} reset={reset} />
      </aside>
    </div>
  );
}
