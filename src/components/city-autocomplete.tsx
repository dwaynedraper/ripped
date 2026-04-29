"use client";

import { useCallback, useEffect, useRef } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const isE2ETestMode =
  process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";

export type CityResult = {
  cityName: string;
  cityState: string | null;
  countryCode: string;
  googlePlaceId: string;
};

type CityAutocompleteProps = {
  /** ISO 3166-1 alpha-2 country code to bias results toward */
  countryCode: string;
  /** Called when the user selects a city from the suggestions */
  onSelect: (result: CityResult) => void;
  /** Optional initial value for the input */
  defaultValue?: string;
  /** Optional error message to display */
  error?: string;
};

/**
 * Google Places Autocomplete for city selection.
 * Restricted to `(cities)` type — only cities appear, not addresses or businesses.
 * Results are biased toward the selected country.
 *
 * See ADR-0025 for the decision to use Google Places over a curated city list.
 */
export function CityAutocomplete({
  countryCode,
  onSelect,
  defaultValue,
  error,
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const placeContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components || !place.place_id) return;

    let cityName = "";
    let cityState: string | null = null;
    let placeCountryCode = "";

    for (const component of place.address_components) {
      const types = component.types;
      if (types.includes("locality")) {
        cityName = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        cityState = component.long_name;
      }
      if (types.includes("country")) {
        placeCountryCode = component.short_name;
      }
    }

    // Fallback: if no "locality" was found, use the formatted name
    if (!cityName && place.name) {
      cityName = place.name;
    }

    // Update the DOM value directly — Google Places already owns the input DOM,
    // so we match that pattern rather than fighting it with React state.
    if (inputRef.current) {
      inputRef.current.value = [cityName, cityState].filter(Boolean).join(", ");
    }

    onSelect({
      cityName,
      cityState,
      countryCode: placeCountryCode || countryCode,
      googlePlaceId: place.place_id,
    });
  }, [countryCode, onSelect]);

  useEffect(() => {
    if (isE2ETestMode) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let cleanup: (() => void) | undefined;

    setOptions({
      key: apiKey,
      v: "weekly",
    });

    importLibrary("places").then(async () => {
      const placesNs = google.maps.places as unknown as {
        PlaceAutocompleteElement?: new (options?: unknown) => HTMLElement;
      };
      const PlaceAutocompleteElementCtor = placesNs.PlaceAutocompleteElement;

      if (PlaceAutocompleteElementCtor && placeContainerRef.current) {
        placeContainerRef.current.innerHTML = "";

        const placeAutocomplete = new PlaceAutocompleteElementCtor({
          includedRegionCodes: [countryCode.toLowerCase()],
          includedPrimaryTypes: ["(cities)"],
        }) as HTMLElement;

        placeContainerRef.current.appendChild(placeAutocomplete);

        const onPlaceSelect = async (event: Event) => {
          const e = event as Event & {
            place?: unknown;
            detail?: {
              place?: unknown;
              placePrediction?: { toPlace?: () => unknown };
            };
          };

          const toPlace =
            e.detail?.placePrediction?.toPlace?.() ??
            e.detail?.place ??
            e.place;
          if (!toPlace) return;

          const place = toPlace as {
            fetchFields?: (args: { fields: string[] }) => Promise<void>;
            addressComponents?: Array<{
              longText?: string;
              shortText?: string;
              types?: string[];
            }>;
            id?: string;
            placeId?: string;
            name?: string;
            displayName?: { text?: string };
          };

          await place.fetchFields?.({
            fields: ["addressComponents", "id", "displayName", "name"],
          });

          let cityName = "";
          let cityState: string | null = null;
          let placeCountryCode = "";

          for (const component of place.addressComponents ?? []) {
            const types = component.types ?? [];
            if (types.includes("locality")) {
              cityName = component.longText ?? "";
            }
            if (types.includes("administrative_area_level_1")) {
              cityState = component.longText ?? null;
            }
            if (types.includes("country")) {
              placeCountryCode = component.shortText ?? "";
            }
          }

          const fallbackName = place.displayName?.text ?? place.name ?? "";
          if (!cityName && fallbackName) {
            cityName = fallbackName;
          }

          const placeId = place.id ?? place.placeId;
          if (!cityName || !placeId) return;

          onSelect({
            cityName,
            cityState,
            countryCode: placeCountryCode || countryCode,
            googlePlaceId: placeId,
          });
        };

        placeAutocomplete.addEventListener("gmp-select", onPlaceSelect);
        cleanup = () => {
          placeAutocomplete.removeEventListener("gmp-select", onPlaceSelect);
          placeContainerRef.current?.replaceChildren();
        };
        return;
      }

      if (!inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"],
        componentRestrictions: { country: countryCode.toLowerCase() },
        fields: ["address_components", "place_id", "name"],
      });

      autocomplete.addListener("place_changed", handlePlaceSelect);
      autocompleteRef.current = autocomplete;

      cleanup = () => {
        google.maps.event.clearInstanceListeners(autocomplete);
      };
    });

    return () => {
      cleanup?.();
    };
  }, [countryCode, handlePlaceSelect, onSelect]);

  const handleTestModeSelect = useCallback(() => {
    onSelect({
      cityName: inputRef.current?.value ?? "",
      cityState: null,
      countryCode,
      googlePlaceId: "test-place-id",
    });
  }, [countryCode, onSelect]);

  return (
    <div>
      <label
        htmlFor="city-autocomplete"
        className="block text-sm font-medium text-zinc-300 mb-1"
      >
        City
      </label>
      <div className={isE2ETestMode ? "flex gap-2" : undefined}>
        {isE2ETestMode ? (
          <input
            ref={inputRef}
            id="city-autocomplete"
            type="text"
            defaultValue={defaultValue ?? ""}
            placeholder="Start typing your city..."
            autoComplete="off"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <div
            id="city-autocomplete"
            ref={placeContainerRef}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
        )}
        {isE2ETestMode && (
          <button
            type="button"
            data-testid="city-use-this"
            onClick={handleTestModeSelect}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Use this city
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
