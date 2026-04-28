import { test, expect } from '@playwright/test';

test.describe('Sign-up and Onboarding', () => {
  // FIXME: This test drives Clerk's hosted UI directly. That approach fights
  // Clerk's bot protection, breaks when Clerk changes selectors, and depends
  // on Google Places Autocomplete being reachable. Clerk's own docs recommend
  // testing via @clerk/testing's testing token to start the test as an
  // already-authenticated user, jumping straight to /onboarding.
  //
  // Pending rewrite as a dedicated step. Until then this is .fixme() so it
  // shows up in the report as known-broken instead of silently passing or
  // hard-failing.
  test.fixme('signs up a fresh user, fills out onboarding, lands on home page', async ({ page }) => {
    // 1. Navigate to the sign-up page
    await page.goto('/sign-up');
    
    // 2. Fill out Clerk's sign-up form
    // Using +clerk_test bypasses some bot protections in testing environments
    const email = `test.user+clerk_test${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    await page.waitForSelector('input[name="emailAddress"]');
    // Using pressSequentially simulates actual human keystrokes which is required by Clerk's 
    // internal React state validators that often ignore instant page.fill() actions.
    await page.locator('input[name="emailAddress"]').pressSequentially(email, { delay: 50 });
    await page.locator('input[name="password"]').pressSequentially(password, { delay: 50 });
    
    // Click the primary form button once
    const submitButton = page.locator('button.cl-formButtonPrimary').first();
    await submitButton.click();
    
    // Wait for the network request to finish and either show OTP or redirect.
    // We use toPass here without clicking again, so we just poll the DOM/URL.
    await expect(async () => {
      const isOtpVisible = await page.locator('input[name*="code"]').isVisible();
      const isRedirected = page.url().includes('/onboarding');
      expect(isOtpVisible || isRedirected).toBeTruthy();
    }).toPass({ timeout: 10000 });
    
    // In development mode, Clerk usually sends an OTP. We use the dev bypass code '424242'
    // Clerk 7 uses an input named "code" or "code-0"
    try {
      const otpInput = await page.waitForSelector('input[name*="code"]', { timeout: 5000 });
      if (otpInput) {
        await otpInput.click(); // Focus the input before typing
        await page.keyboard.type('424242');
        // Wait a bit for the auto-submit to happen
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // If the UI is different or OTP is disabled, we continue
    }

    // 3. We should be redirected to /onboarding after successful sign-up
    try {
      await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
    } catch (err) {
      console.log("=== PAGE TEXT CONTENT AT FAILURE ===");
      console.log(await page.locator('body').innerText());
      throw err;
    }
    
    // 4. Fill out our custom onboarding form
    const displayName = `Tester_${Date.now()}`;
    await page.fill('input[name="displayName"]', displayName);
    
    // The countryCode defaults to 'US' in our form.
    
    // The cityName field uses Google Places Autocomplete.
    // We type a city name and wait for the Google Places suggestions to appear.
    // (Note: the input name might differ depending on React Hook Form setup, assuming "cityName" for now)
    await page.fill('input[name="cityName"]', 'New York');
    
    // Wait for Google's `.pac-item` dropdown suggestion and click the first one
    await page.waitForSelector('.pac-item');
    await page.click('.pac-item:first-child');
    
    // Submit the onboarding form
    await page.click('button[type="submit"]');
    
    // 5. Should redirect to the home page upon successful onboarding
    await expect(page).toHaveURL(/\//);
    
    // 6. The home page should render the authenticated state (Welcome back message)
    await expect(page.locator(`text=Welcome back, ${displayName}`)).toBeVisible();
  });
});
