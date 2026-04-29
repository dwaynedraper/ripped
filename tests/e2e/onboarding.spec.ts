import { test, expect } from "./fixtures";

test.describe("Onboarding", () => {
  test("fills the form and redirects home with the onboarded cookie", async ({
    onboardingPage: page,
  }) => {
    await page.fill("#displayName", "E2ETestUser");

    // Country defaults to US — leave it.

    // E2E test mode skips the Google Places loader. Type a city name then
    // click the bypass button to call onSelect with stub data.
    await page.fill("#city-autocomplete", "Austin");
    await page.click('[data-testid="city-use-this"]');

    // Timezone is auto-filled client-side via Intl — leave it.

    await page.click('button[type="submit"]');

    // completeOnboarding() redirects to / on success.
    await expect(page).toHaveURL("/");

    // The proxy reads this cookie on subsequent requests to skip the DB check.
    const cookies = await page.context().cookies();
    const onboardedCookie = cookies.find((c) => c.name === "ripped_onboarded");
    expect(onboardedCookie).toBeDefined();
  });
});
