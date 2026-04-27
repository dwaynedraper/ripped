"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  CityAutocomplete,
  type CityResult,
} from "@/components/city-autocomplete";
import { countries } from "@/lib/countries";
import { isKnownTimezone, timezones } from "@/lib/timezones";
import { completeOnboarding } from "./actions";
import {
  type OnboardingFieldErrors,
  onboardingSchema,
  type OnboardingInput,
} from "./schema";

/**
 * Onboarding form (Phase 2 of sign-up — see ADR-0023).
 *
 * Client Component. RHF + Zod resolver share the schema with the server
 * action so client-side validation matches what the action enforces server-
 * side. On submit the action either redirects (success — we never see the
 * branch) or returns field-keyed errors that we render inline.
 */
export function OnboardingForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      countryCode: "US",
      cityName: "",
      cityState: null,
      googlePlaceId: "",
      // Server-deterministic default — overwritten on the client below to
      // avoid a hydration mismatch.
      timezone: "UTC",
    },
  });

  // Detect the user's timezone client-side after hydration.
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (isKnownTimezone(detected)) {
        form.setValue("timezone", detected);
      }
    } catch {
      // Intl unavailable or returned something exotic — keep UTC default.
    }
  }, [form]);

  const countryCode = form.watch("countryCode");

  const handleCitySelect = (result: CityResult) => {
    form.setValue("cityName", result.cityName, { shouldValidate: true });
    form.setValue("cityState", result.cityState, { shouldValidate: false });
    form.setValue("googlePlaceId", result.googlePlaceId, {
      shouldValidate: true,
    });
    // Google Places sometimes corrects the country (e.g., user picks "Paris"
    // but it's Paris, Texas). Trust Google's value over the form's.
    if (result.countryCode) {
      form.setValue("countryCode", result.countryCode, {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (!result.success) {
        applyServerErrors(result.errors);
      }
      // Success path: the action redirects; this branch never runs.
    });
  });

  const applyServerErrors = (errors: OnboardingFieldErrors) => {
    if (errors._form) {
      setFormError(errors._form);
    }
    for (const [key, message] of Object.entries(errors)) {
      if (!message || key === "_form") continue;
      form.setError(key as keyof OnboardingInput, {
        type: "server",
        message,
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* ── Display name ────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="username"
          aria-invalid={!!form.formState.errors.displayName}
          {...form.register("displayName")}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-zinc-500">
          This is the name shown next to your votes. You can change it later.
        </p>
        {form.formState.errors.displayName && (
          <p className="mt-1 text-sm text-red-400">
            {form.formState.errors.displayName.message}
          </p>
        )}
      </div>

      {/* ── Country ─────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="countryCode"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Country
        </label>
        <select
          id="countryCode"
          aria-invalid={!!form.formState.errors.countryCode}
          {...form.register("countryCode")}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {form.formState.errors.countryCode && (
          <p className="mt-1 text-sm text-red-400">
            {form.formState.errors.countryCode.message}
          </p>
        )}
      </div>

      {/* ── Data-collection notice (verbatim from identity-model.md §4.0) ── */}
      <p className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-sm italic text-zinc-400">
        We ask where you&rsquo;re watching from so the show&rsquo;s creators
        know where their audience is. We <strong>don&rsquo;t</strong> collect
        full names, addresses, or identifying details unless you choose to
        share them later. Your email stays private.
      </p>

      {/* ── City (Google Places) ────────────────────────────────────────── */}
      <CityAutocomplete
        countryCode={countryCode}
        onSelect={handleCitySelect}
        error={
          form.formState.errors.googlePlaceId?.message ??
          form.formState.errors.cityName?.message
        }
      />

      {/* ── Timezone ────────────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Timezone
        </label>
        <select
          id="timezone"
          aria-invalid={!!form.formState.errors.timezone}
          {...form.register("timezone")}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          We&rsquo;ll guess from your browser, but feel free to change it.
        </p>
        {form.formState.errors.timezone && (
          <p className="mt-1 text-sm text-red-400">
            {form.formState.errors.timezone.message}
          </p>
        )}
      </div>

      {/* ── Form-level error ────────────────────────────────────────────── */}
      {formError && (
        <div className="rounded-md border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
          {formError}
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Setting up your account…" : "Continue"}
      </button>
    </form>
  );
}
