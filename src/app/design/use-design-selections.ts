"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  customAccents,
  densityOptions,
  defaultSelections,
  neutralsOptions,
  secondaryAccentOptions,
  shapeOptions,
  typographyOptions,
  voices,
  type DesignSelections,
} from "./design-tokens";

const STORAGE_KEY = "ripped-design-v1";

export function useDesignSelections() {
  const [selections, setSelections] = useState<DesignSelections>(defaultSelections);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DesignSelections>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelections({ ...defaultSelections, ...parsed });
      }
    } catch {
      // ignore — corrupt JSON or no localStorage
    }
    setHydrated(true);
  }, []);

  // Persist whenever selections change (post-hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch {
      // ignore
    }
  }, [selections, hydrated]);

  const update = useCallback(
    <K extends keyof DesignSelections>(key: K, value: DesignSelections[K]) => {
      setSelections((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setSelections(defaultSelections);
  }, []);

  // When voice changes, cascade its preset defaults across dependent dimensions.
  const selectVoice = useCallback((voiceId: DesignSelections["voice"]) => {
    setSelections((prev) => {
      if (!voiceId) return { ...prev, voice: null };
      const voice = voices.find((v) => v.id === voiceId);
      if (!voice) return { ...prev, voice: voiceId };
      return {
        ...prev,
        voice: voiceId,
        typography: voice.defaults.typography,
        neutrals: voice.defaults.neutrals,
        secondaryAccent: voice.defaults.secondaryAccent,
        shape: voice.defaults.shape,
        fill: voice.defaults.fill,
        density: voice.defaults.density,
      };
    });
  }, []);

  // When mode changes, switch the custom accent to one valid for the new mode.
  const setMode = useCallback((mode: DesignSelections["mode"]) => {
    setSelections((prev) => {
      const currentAccent = customAccents.find((a) => a.id === prev.customAccent);
      if (currentAccent && currentAccent.mode === mode) {
        return { ...prev, mode };
      }
      const firstForMode = customAccents.find((a) => a.mode === mode);
      return { ...prev, mode, customAccent: firstForMode?.id ?? null };
    });
  }, []);

  // Derive the inline style object — applied to the design root wrapper.
  // CSS cascade carries it down to all descendants.
  const cssVars = useMemo(() => selectionsToCssVars(selections), [selections]);

  return {
    selections,
    hydrated,
    cssVars,
    update,
    reset,
    selectVoice,
    setMode,
  };
}

// ── Convert selections into a style object of CSS custom properties ──────────

export function selectionsToCssVars(s: DesignSelections): CSSProperties {
  const vars: Record<string, string> = {};

  const type = typographyOptions.find((t) => t.id === s.typography);
  if (type) {
    vars["--font-display"] = type.display;
    vars["--font-body"] = type.body;
    vars["--font-mono"] = type.mono;
  }

  const neutrals = neutralsOptions.find((n) => n.id === s.neutrals);
  if (neutrals) {
    const palette = s.mode === "dark" ? neutrals.dark : neutrals.light;
    vars["--color-bg-base"] = palette.bgBase;
    vars["--color-bg-elevated"] = palette.bgElevated;
    vars["--color-bg-overlay"] = palette.bgOverlay;
    vars["--color-text-primary"] = palette.textPrimary;
    vars["--color-text-secondary"] = palette.textSecondary;
    vars["--color-text-muted"] = palette.textMuted;
    vars["--color-border-subtle"] = palette.borderSubtle;
    vars["--color-border-strong"] = palette.borderStrong;
  }

  const secondary = secondaryAccentOptions.find((a) => a.id === s.secondaryAccent);
  if (secondary) {
    const value = s.mode === "dark" ? secondary.dark : secondary.light;
    vars["--color-secondary-accent"] = value ?? (neutrals
      ? (s.mode === "dark" ? neutrals.dark.textSecondary : neutrals.light.textSecondary)
      : "#64748b");
  }

  const accent = customAccents.find((a) => a.id === s.customAccent);
  if (accent) {
    vars["--color-accent"] = accent.base;
    vars["--color-accent-hover"] = accent.hover;
    vars["--color-accent-foreground"] = accent.foreground;
  }

  const shape = shapeOptions.find((sh) => sh.id === s.shape);
  if (shape) {
    vars["--radius-xs"] = shape.radiusXs;
    vars["--radius-sm"] = shape.radiusSm;
    vars["--radius-md"] = shape.radiusMd;
    vars["--radius-lg"] = shape.radiusLg;
  }

  const density = densityOptions.find((d) => d.id === s.density);
  if (density) {
    vars["--space-tight"] = density.spaceTight;
    vars["--space-base"] = density.spaceBase;
    vars["--space-loose"] = density.spaceLoose;
  }

  return vars as CSSProperties;
}
