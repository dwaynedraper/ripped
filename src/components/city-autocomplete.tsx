"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue ?? "");

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

    const displayParts = [cityName, cityState].filter(Boolean);
    setInputValue(displayParts.join(", "));

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
    if (!apiKey || !inputRef.current) return;

    let cleanup: (() => void) | undefined;

    setOptions({
      key: apiKey,
      v: "weekly",
    });

    importLibrary("places").then(() => {
      if (!inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: countryCode.toLowerCase() },
          fields: ["address_components", "place_id", "name"],
        },
      );

      autocomplete.addListener("place_changed", handlePlaceSelect);
      autocompleteRef.current = autocomplete;

      cleanup = () => {
        google.maps.event.clearInstanceListeners(autocomplete);
      };
    });

    return () => {
      cleanup?.();
    };
  }, [countryCode, handlePlaceSelect]);

  const handleTestModeSelect = useCallback(() => {
    onSelect({
      cityName: inputValue,
      cityState: null,
      countryCode,
      googlePlaceId: "test-place-id",
    });
  }, [inputValue, countryCode, onSelect]);

  return (
    <div>
      <label
        htmlFor="city-autocomplete"
        className="block text-sm font-medium text-zinc-300 mb-1"
      >
        City
      </label>
      <div className={isE2ETestMode ? "flex gap-2" : undefined}>
        <input
          ref={inputRef}
          id="city-autocomplete"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Start typing your city..."
          autoComplete="off"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
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
