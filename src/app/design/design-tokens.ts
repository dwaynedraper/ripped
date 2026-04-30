// Every design option resolves to a set of CSS custom property values.
// The hook applies these to :root when a selection changes.

// ── Voice ────────────────────────────────────────────────────────────────────

export type VoiceId = "architectural-tech" | "considered-minimal" | "quiet-luxe";

export const voices: Array<{
  id: VoiceId;
  name: string;
  description: string;
  // Each voice presets some defaults across other dimensions.
  defaults: {
    typography: TypographyId;
    neutrals: NeutralsId;
    secondaryAccent: SecondaryAccentId;
    shape: ShapeId;
    fill: FillId;
    density: DensityId;
  };
}> = [
  {
    id: "architectural-tech",
    name: "Architectural Tech",
    description: "Vercel-leaning. Sharp geometry, monochrome neutrals, accent as voltage.",
    defaults: {
      typography: "geist",
      neutrals: "true",
      secondaryAccent: "none",
      shape: 4,
      fill: "filled",
      density: "balanced",
    },
  },
  {
    id: "considered-minimal",
    name: "Considered Minimal",
    description: "Apple-leaning. Soft whitespace, subtle warmth, accent appears with intent.",
    defaults: {
      typography: "inter",
      neutrals: "warm",
      secondaryAccent: "champagne",
      shape: 12,
      fill: "filled",
      density: "airy",
    },
  },
  {
    id: "quiet-luxe",
    name: "Quiet Luxe",
    description: "Refined middle path. Modern restraint with weight. Linear meets Stripe.",
    defaults: {
      typography: "space-grotesk",
      neutrals: "cool",
      secondaryAccent: "slate",
      shape: 8,
      fill: "filled",
      density: "balanced",
    },
  },
];

// ── Typography ───────────────────────────────────────────────────────────────

export type TypographyId = "geist" | "inter" | "space-grotesk";

export const typographyOptions: Array<{
  id: TypographyId;
  name: string;
  description: string;
  display: string; // CSS font-family value
  body: string;
  mono: string;
}> = [
  {
    id: "geist",
    name: "Geist",
    description: "Vercel's house family. Pure geometric, sharpest tech voice.",
    display: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  {
    id: "inter",
    name: "Inter + JetBrains Mono",
    description: "Refined, neutral, Linear-like. Slight humanist reserve.",
    display: "var(--font-inter)",
    body: "var(--font-inter)",
    mono: "var(--font-jetbrains-mono)",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk + Geist Mono",
    description: "Modern with character. Geometric grotesque, distinctive without shouting.",
    display: "var(--font-space-grotesk)",
    body: "var(--font-space-grotesk)",
    mono: "var(--font-geist-mono)",
  },
];

// ── Neutrals ─────────────────────────────────────────────────────────────────

export type NeutralsId = "true" | "warm" | "cool";
export type Mode = "light" | "dark";

type NeutralPalette = {
  bgBase: string;
  bgElevated: string;
  bgOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderStrong: string;
};

export const neutralsOptions: Array<{
  id: NeutralsId;
  name: string;
  description: string;
  light: NeutralPalette;
  dark: NeutralPalette;
}> = [
  {
    id: "true",
    name: "True Neutral",
    description: "Pure grayscale. Vercel direction. Maximum contrast extremes.",
    light: {
      bgBase: "#ffffff",
      bgElevated: "#fafafa",
      bgOverlay: "#ffffff",
      textPrimary: "#0a0a0a",
      textSecondary: "#525252",
      textMuted: "#a3a3a3",
      borderSubtle: "#e5e5e5",
      borderStrong: "#d4d4d4",
    },
    dark: {
      bgBase: "#0a0a0a",
      bgElevated: "#141414",
      bgOverlay: "#1a1a1a",
      textPrimary: "#fafafa",
      textSecondary: "#a3a3a3",
      textMuted: "#737373",
      borderSubtle: "#262626",
      borderStrong: "#404040",
    },
  },
  {
    id: "warm",
    name: "Warm Neutral",
    description: "Faint warmth in the whites and charcoals. Apple direction. Inviting.",
    light: {
      bgBase: "#fdfcfb",
      bgElevated: "#f7f5f3",
      bgOverlay: "#ffffff",
      textPrimary: "#1c1917",
      textSecondary: "#57534e",
      textMuted: "#a8a29e",
      borderSubtle: "#e7e5e4",
      borderStrong: "#d6d3d1",
    },
    dark: {
      bgBase: "#0c0a09",
      bgElevated: "#1c1917",
      bgOverlay: "#292524",
      textPrimary: "#fafaf9",
      textSecondary: "#a8a29e",
      textMuted: "#78716c",
      borderSubtle: "#292524",
      borderStrong: "#44403c",
    },
  },
  {
    id: "cool",
    name: "Cool Neutral",
    description: "Faint blue undertone. Modern-tech feel. Subtle and architectural.",
    light: {
      bgBase: "#fafbfc",
      bgElevated: "#f4f6f8",
      bgOverlay: "#ffffff",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      borderSubtle: "#e2e8f0",
      borderStrong: "#cbd5e1",
    },
    dark: {
      bgBase: "#080a0f",
      bgElevated: "#0f1419",
      bgOverlay: "#161b23",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
      textMuted: "#64748b",
      borderSubtle: "#1e293b",
      borderStrong: "#334155",
    },
  },
];

// ── Secondary accent ─────────────────────────────────────────────────────────

export type SecondaryAccentId = "none" | "slate" | "champagne" | "mono";

export const secondaryAccentOptions: Array<{
  id: SecondaryAccentId;
  name: string;
  description: string;
  light: string | null;
  dark: string | null;
}> = [
  {
    id: "none",
    name: "None",
    description: "Custom accent is the only accent. Neutrals carry everything else.",
    light: null,
    dark: null,
  },
  {
    id: "slate",
    name: "Architectural Slate",
    description: "Desaturated blue-gray. Quiet structural support.",
    light: "#64748b",
    dark: "#94a3b8",
  },
  {
    id: "champagne",
    name: "Champagne Gold",
    description: "Barely-saturated cream-gold. For premium moments (Vault).",
    light: "#a08968",
    dark: "#d4b896",
  },
  {
    id: "mono",
    name: "Mono Stamp",
    description: "Pure black or white as a structural second mark.",
    light: "#0a0a0a",
    dark: "#fafafa",
  },
];

// ── Custom accents ───────────────────────────────────────────────────────────

export type CustomAccentId =
  // Light mode
  | "electric-green"
  | "magenta-surge"
  | "voltaic-blue"
  | "tangerine-pulse"
  | "dusky-rose"
  | "iris-bloom"
  // Dark mode
  | "orange-gemstone"
  | "plasma-pink"
  | "icy-cobalt"
  | "acid-lime"
  | "heliotrope-dusk"
  | "mercury-teal";

type CustomAccentDef = {
  id: CustomAccentId;
  name: string;
  mode: Mode;
  // Engineered against the chosen neutrals — but the values are picked to
  // hold WCAG AA contrast against MOST neutral backgrounds in their mode.
  base: string;
  hover: string;
  // Foreground (button text on this accent). Picked to be WCAG AA against base.
  foreground: string;
};

export const customAccents: CustomAccentDef[] = [
  // Light-mode accents — saturated, hold against light backgrounds
  {
    id: "electric-green",
    name: "Electric Green",
    mode: "light",
    base: "#0d8a3f",
    hover: "#0a7335",
    foreground: "#ffffff",
  },
  {
    id: "magenta-surge",
    name: "Magenta Surge",
    mode: "light",
    base: "#c2185b",
    hover: "#a31550",
    foreground: "#ffffff",
  },
  {
    id: "voltaic-blue",
    name: "Voltaic Blue",
    mode: "light",
    base: "#1d4ed8",
    hover: "#1e40af",
    foreground: "#ffffff",
  },
  {
    id: "tangerine-pulse",
    name: "Tangerine Pulse",
    mode: "light",
    base: "#c2410c",
    hover: "#9a3412",
    foreground: "#ffffff",
  },
  {
    id: "dusky-rose",
    name: "Dusky Rose",
    mode: "light",
    base: "#9f1239",
    hover: "#881337",
    foreground: "#ffffff",
  },
  {
    id: "iris-bloom",
    name: "Iris Bloom",
    mode: "light",
    base: "#6d28d9",
    hover: "#5b21b6",
    foreground: "#ffffff",
  },
  // Dark-mode accents — high-luminance glow against dark backgrounds
  {
    id: "orange-gemstone",
    name: "Orange Gemstone",
    mode: "dark",
    base: "#fb923c",
    hover: "#fdba74",
    foreground: "#1c0f00",
  },
  {
    id: "plasma-pink",
    name: "Plasma Pink",
    mode: "dark",
    base: "#f472b6",
    hover: "#f9a8d4",
    foreground: "#1f0816",
  },
  {
    id: "icy-cobalt",
    name: "Icy Cobalt",
    mode: "dark",
    base: "#60a5fa",
    hover: "#93c5fd",
    foreground: "#0a1628",
  },
  {
    id: "acid-lime",
    name: "Acid Lime",
    mode: "dark",
    base: "#a3e635",
    hover: "#bef264",
    foreground: "#1a2306",
  },
  {
    id: "heliotrope-dusk",
    name: "Heliotrope Dusk",
    mode: "dark",
    base: "#c084fc",
    hover: "#d8b4fe",
    foreground: "#1f0a36",
  },
  {
    id: "mercury-teal",
    name: "Mercury Teal",
    mode: "dark",
    base: "#2dd4bf",
    hover: "#5eead4",
    foreground: "#022019",
  },
];

// ── Shape ────────────────────────────────────────────────────────────────────

export type ShapeId = 0 | 4 | 8 | 12 | 999;

export const shapeOptions: Array<{
  id: ShapeId;
  name: string;
  description: string;
  radiusXs: string; // inputs
  radiusSm: string; // small buttons, chips
  radiusMd: string; // cards, primary buttons
  radiusLg: string; // sheets, modals
}> = [
  {
    id: 0,
    name: "Sharp",
    description: "0px. Industrial. Architectural. Vercel-aligned.",
    radiusXs: "0px",
    radiusSm: "0px",
    radiusMd: "0px",
    radiusLg: "0px",
  },
  {
    id: 4,
    name: "Soft Sharp",
    description: "4px. Almost crisp. Modern but not aggressive.",
    radiusXs: "2px",
    radiusSm: "4px",
    radiusMd: "4px",
    radiusLg: "6px",
  },
  {
    id: 8,
    name: "Gentle",
    description: "8px. Balanced and current. Linear / Notion territory.",
    radiusXs: "4px",
    radiusSm: "6px",
    radiusMd: "8px",
    radiusLg: "12px",
  },
  {
    id: 12,
    name: "Friendly",
    description: "12px. Approachable. Apple territory.",
    radiusXs: "6px",
    radiusSm: "8px",
    radiusMd: "12px",
    radiusLg: "16px",
  },
  {
    id: 999,
    name: "Pill",
    description: "Pill on buttons, generous on cards. Most expressive option.",
    radiusXs: "6px",
    radiusSm: "9999px",
    radiusMd: "9999px",
    radiusLg: "20px",
  },
];

// ── Fill ─────────────────────────────────────────────────────────────────────

export type FillId = "filled" | "outlined" | "ghost";

export const fillOptions: Array<{ id: FillId; name: string; description: string }> = [
  {
    id: "filled",
    name: "Filled",
    description: "Solid accent. Loudest, most clickable. Default for primary CTAs.",
  },
  {
    id: "outlined",
    name: "Outlined",
    description: "Border + accent text. Lighter on the page. More restrained.",
  },
  {
    id: "ghost",
    name: "Ghost",
    description: "No border, accent text, hover surface. Most subtle.",
  },
];

// ── Density ──────────────────────────────────────────────────────────────────

export type DensityId = "tight" | "balanced" | "airy";

export const densityOptions: Array<{
  id: DensityId;
  name: string;
  description: string;
  spaceTight: string;
  spaceBase: string;
  spaceLoose: string;
}> = [
  {
    id: "tight",
    name: "Tight",
    description: "Information-dense. Best for voting lists and dashboards.",
    spaceTight: "0.375rem",
    spaceBase: "0.75rem",
    spaceLoose: "1.25rem",
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Modern default. Comfortable across content types.",
    spaceTight: "0.5rem",
    spaceBase: "1rem",
    spaceLoose: "1.75rem",
  },
  {
    id: "airy",
    name: "Airy",
    description: "Generous whitespace. Premium feel. Apple territory.",
    spaceTight: "0.75rem",
    spaceBase: "1.5rem",
    spaceLoose: "2.5rem",
  },
];

// ── Wordmark ─────────────────────────────────────────────────────────────────

export type WordmarkId = "plain" | "gesture" | "with-mark" | "initialism";

export const wordmarkOptions: Array<{
  id: WordmarkId;
  name: string;
  description: string;
}> = [
  {
    id: "plain",
    name: "Plain Wordmark",
    description: "Ripped or Stamped. No flourish. Trust the type.",
  },
  {
    id: "gesture",
    name: "Wordmark with Gesture",
    description: "Letter-spacing play, weight contrast. Subtle authorial touch.",
  },
  {
    id: "with-mark",
    name: "Wordmark + Stamp",
    description: "Geometric mark beside the wordmark. Most editorial.",
  },
  {
    id: "initialism",
    name: "R / S Initialism",
    description: "The slash as a structural element. Most modern.",
  },
];

// ── The full selection shape ─────────────────────────────────────────────────

export type DesignSelections = {
  voice: VoiceId | null;
  typography: TypographyId | null;
  neutrals: NeutralsId | null;
  secondaryAccent: SecondaryAccentId | null;
  mode: Mode;
  customAccent: CustomAccentId | null;
  shape: ShapeId | null;
  fill: FillId | null;
  density: DensityId | null;
  wordmark: WordmarkId | null;
};

export const defaultSelections: DesignSelections = {
  voice: "architectural-tech",
  typography: "geist",
  neutrals: "true",
  secondaryAccent: "none",
  mode: "dark",
  customAccent: "icy-cobalt",
  shape: 4,
  fill: "filled",
  density: "balanced",
  wordmark: "plain",
};
