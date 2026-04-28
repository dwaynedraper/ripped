import { test, expect } from '@playwright/test';

test.describe('Sign-up and Onboarding', () => {
  test('signs up a fresh user, fills out onboarding, lands on home page', async ({ page }) => {
    // 1. Navigate to the sign-up page
    await page.goto('/sign-up');
    
    // 2. Fill out Clerk's sign-up form
    const email = `test.user.${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    await page.waitForSelector('input[name="emailAddress"]');
    await page.fill('input[name="emailAddress"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Continue")');
    
    // In development mode, Clerk usually sends an OTP. We use the dev bypass code '424242'
    // It might take a moment for the verification UI to appear.
    try {
      // Wait for the first OTP input box (Clerk renders multiple inputs for the code)
      await page.waitForSelector('input[name="code-0"]', { timeout: 5000 });
      await page.keyboard.type('424242');
    } catch (e) {
      // If the UI is different or OTP is disabled, we continue
    }

    // 3. We should be redirected to /onboarding after successful sign-up
    await expect(page).toHaveURL(/\/onboarding/);
    
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
