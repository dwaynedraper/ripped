# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sign-up.spec.ts >> Sign-up and Onboarding >> signs up a fresh user, fills out onboarding, lands on home page
- Location: tests/e2e/sign-up.spec.ts:4:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - heading "Create your account" [level=1] [ref=e8]
        - paragraph [ref=e9]: Welcome! Please fill in the details to get started.
      - generic [ref=e10]:
        - generic [ref=e12]:
          - button "Sign in with Apple" [disabled]:
            - generic "Sign in with Apple"
          - button "Sign in with Discord" [disabled]:
            - generic "Sign in with Discord"
          - button "Sign in with Google" [disabled]:
            - generic "Sign in with Google"
        - paragraph [ref=e15]: or
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e21]:
              - generic [ref=e22]:
                - generic: Email address
              - textbox "Email address" [disabled]:
                - /placeholder: Enter your email address
                - text: test.user+clerk_test1777359652969@example.com
            - generic [ref=e25]:
              - generic [ref=e26]:
                - generic [ref=e27]:
                  - generic: Password
                - generic [ref=e28]:
                  - textbox "Password" [disabled]:
                    - /placeholder: Create a password
                    - text: TestPassword123!
                  - button "Show password" [ref=e29] [cursor=pointer]:
                    - img [ref=e30]
              - generic [ref=e33]: Your password meets all the necessary requirements.
              - paragraph [ref=e35]:
                - img [ref=e36]
                - text: Your password meets all the necessary requirements.
          - generic [ref=e41]:
            - button "Loading" [disabled]:
              - generic:
                - generic "Loading"
    - generic [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]: Already have an account?
        - link "Sign in" [ref=e45] [cursor=pointer]:
          - /url: http://localhost:3000/sign-in
      - generic [ref=e47]:
        - generic [ref=e49]:
          - paragraph [ref=e50]: Secured by
          - link "Clerk logo" [ref=e51] [cursor=pointer]:
            - /url: https://go.clerk.com/components
            - img [ref=e52]
        - paragraph [ref=e57]: Development mode
  - button "Open Next.js Dev Tools" [ref=e63] [cursor=pointer]:
    - img [ref=e64]
  - alert [ref=e67]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Sign-up and Onboarding', () => {
  4  |   test('signs up a fresh user, fills out onboarding, lands on home page', async ({ page }) => {
  5  |     // 1. Navigate to the sign-up page
  6  |     await page.goto('/sign-up');
  7  |     
  8  |     // 2. Fill out Clerk's sign-up form
  9  |     // Using +clerk_test bypasses some bot protections in testing environments
  10 |     const email = `test.user+clerk_test${Date.now()}@example.com`;
  11 |     const password = 'TestPassword123!';
  12 |     
  13 |     await page.waitForSelector('input[name="emailAddress"]');
  14 |     // Using pressSequentially simulates actual human keystrokes which is required by Clerk's 
  15 |     // internal React state validators that often ignore instant page.fill() actions.
  16 |     await page.locator('input[name="emailAddress"]').pressSequentially(email, { delay: 50 });
  17 |     await page.locator('input[name="password"]').pressSequentially(password, { delay: 50 });
  18 |     
  19 |     // Click the primary form button once
  20 |     const submitButton = page.locator('button.cl-formButtonPrimary').first();
  21 |     await submitButton.click();
  22 |     
  23 |     // Wait for the network request to finish and either show OTP or redirect.
  24 |     // We use toPass here without clicking again, so we just poll the DOM/URL.
  25 |     await expect(async () => {
  26 |       const isOtpVisible = await page.locator('input[name*="code"]').isVisible();
  27 |       const isRedirected = page.url().includes('/onboarding');
  28 |       expect(isOtpVisible || isRedirected).toBeTruthy();
> 29 |     }).toPass({ timeout: 10000 });
     |        ^ Error: expect(received).toBeTruthy()
  30 |     
  31 |     // In development mode, Clerk usually sends an OTP. We use the dev bypass code '424242'
  32 |     // Clerk 7 uses an input named "code" or "code-0"
  33 |     try {
  34 |       const otpInput = await page.waitForSelector('input[name*="code"]', { timeout: 5000 });
  35 |       if (otpInput) {
  36 |         await otpInput.click(); // Focus the input before typing
  37 |         await page.keyboard.type('424242');
  38 |         // Wait a bit for the auto-submit to happen
  39 |         await page.waitForTimeout(2000);
  40 |       }
  41 |     } catch (e) {
  42 |       // If the UI is different or OTP is disabled, we continue
  43 |     }
  44 | 
  45 |     // 3. We should be redirected to /onboarding after successful sign-up
  46 |     try {
  47 |       await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
  48 |     } catch (err) {
  49 |       console.log("=== PAGE TEXT CONTENT AT FAILURE ===");
  50 |       console.log(await page.locator('body').innerText());
  51 |       throw err;
  52 |     }
  53 |     
  54 |     // 4. Fill out our custom onboarding form
  55 |     const displayName = `Tester_${Date.now()}`;
  56 |     await page.fill('input[name="displayName"]', displayName);
  57 |     
  58 |     // The countryCode defaults to 'US' in our form.
  59 |     
  60 |     // The cityName field uses Google Places Autocomplete.
  61 |     // We type a city name and wait for the Google Places suggestions to appear.
  62 |     // (Note: the input name might differ depending on React Hook Form setup, assuming "cityName" for now)
  63 |     await page.fill('input[name="cityName"]', 'New York');
  64 |     
  65 |     // Wait for Google's `.pac-item` dropdown suggestion and click the first one
  66 |     await page.waitForSelector('.pac-item');
  67 |     await page.click('.pac-item:first-child');
  68 |     
  69 |     // Submit the onboarding form
  70 |     await page.click('button[type="submit"]');
  71 |     
  72 |     // 5. Should redirect to the home page upon successful onboarding
  73 |     await expect(page).toHaveURL(/\//);
  74 |     
  75 |     // 6. The home page should render the authenticated state (Welcome back message)
  76 |     await expect(page.locator(`text=Welcome back, ${displayName}`)).toBeVisible();
  77 |   });
  78 | });
  79 | 
```