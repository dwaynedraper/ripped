# Ripped Platform — Build Plan

> *This document is the **master execution plan** for building the Ripped platform. It is written to be followed by any Claude model (including the faster Sonnet) without requiring architectural judgment. Every decision has been made. Every file path is specified. Every validation step is explicit.*
>
> *If you (the executing model) find yourself needing to make an architectural decision not documented here or in one of the referenced `/docs` files, **stop and ask the user** — do not invent. This plan is the contract.*

---

## 0. How to use this document

### Read these docs first (in this order)

Before executing any task in any phase, you **must** have read:

1. [`AGENTS.md`](../AGENTS.md) — project orientation, hard invariants, collaboration norms
2. [`docs/show-premise.md`](./show-premise.md) — what the show is
3. [`docs/identity-model.md`](./identity-model.md) — who exists; what data they have
4. [`docs/roles-and-ranks.md`](./roles-and-ranks.md) — what they can do; point math
5. [`docs/decision-log.md`](./decision-log.md) — why we chose what we chose (23 ADRs)
6. [`docs/glossary.md`](./glossary.md) — canonical terms
7. [`docs/testing-strategy.md`](./testing-strategy.md) — what to test, when

These docs are the source of truth. **If this plan ever contradicts one of them, the doc wins.** Flag the contradiction to the user; do not silently resolve it.

### Next.js 16 warning

This project is on Next.js 16.2.4 with React 19.2.4. Next.js 16 has breaking changes from Next.js 15, including the rename `middleware.ts` → `proxy.ts`. **Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/01-app/`.** Do not rely on training data — it is likely wrong.

### Sources to reference during execution

| What you need | Where it lives |
|---|---|
| Next.js 16 API / conventions | `node_modules/next/dist/docs/01-app/` |
| Clerk 7 exports | `node_modules/@clerk/nextjs/dist/types/` |
| Drizzle schema helpers | Project uses `drizzle-orm@0.45` with `@neondatabase/serverless` |
| Our Zod env contract | [`src/env.ts`](../src/env.ts) |
| Our DB schema (source of truth) | [`src/db/schema/`](../src/db/schema/) |

---

## 1. Working agreements

These rules override any default behavior. Violating them is a bug.

### 1.1 Docs-first

New features start with a spec in `/docs`, then code. If a task forces a design decision that isn't already documented:

1. **Stop coding.**
2. Ask the user for the decision.
3. Add or update the relevant `/docs` file.
4. Write an ADR if the decision changes an invariant.
5. Then implement.

### 1.2 Test-first for critical paths

**Always write a failing test before the implementation** for:

- Authentication and session handling
- Permission checks (role × action)
- Voting logic (cast, tally, weight snapshot)
- Contribution point accrual (rate limits, monotonicity)
- Clerk webhook handlers
- Payment (when that phase arrives)

For everything else (UI, CMS admin forms, content pages), tests are still required but can be written after implementation.

### 1.3 Commit discipline

- **One step = one commit.** When a step in a multi-step task is complete and verified (type-check, tests, build green), generate a commit title and description for the user to review. The user runs the actual commit. **Do not bundle multiple unrelated steps into one commit** — small, focused commits are easier to review, revert, and debug.
- **Never** commit with `--no-verify`.
- **Never** amend a committed commit unless explicitly asked.
- Commit messages: short title in imperative mood, body explains *why* (not *what* — the diff shows the what).
- If a pre-commit hook fails, **fix the underlying issue**. Do not skip.
- Co-author line on every commit per the project convention. Use the actual model attribution (e.g., `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`).

### 1.4 When to write an ADR

Write an ADR in [`docs/decision-log.md`](./decision-log.md) when:

- You resolve a decision that affects how data is stored, who can do what, or how money flows
- You change or supersede an existing ADR
- A user confirms a non-obvious choice (validate via the decision log, not memory)

Follow the ADR template at the bottom of the decision log.

### 1.5 Never assume — verify

If a memory or recollection says "X exists," verify before recommending:

- Named file path → check it exists
- Named function/flag → grep for it
- "User already decided X" → look in `docs/decision-log.md`

### 1.6 Typography and prose style

User-facing prose (UI copy, emails, docs) follows the project's **varied typography** rule:

- Bullets, bold, italic callouts
- No wall-of-text
- Short, voiced sentences
- No emojis unless explicitly requested

### 1.7 Environment variables

- Never reference `process.env.X` scattered through the code.
- Import the validated `env` object from [`src/env.ts`](../src/env.ts) for server-side vars.
- Client Components use `process.env.NEXT_PUBLIC_X` directly (they can't import `env` — it's `server-only`).
- If a new env var is needed: add it to `src/env.ts` schema, `.env.example`, and `.env.local`, plus the test in `src/__tests__/env.test.ts`.

### 1.8 Ask when uncertain

This plan covers known decisions. When a situation arises that the plan does not cover (a subtle UI question, an edge case in voting, a payment flow detail), **ask the user**. Do not guess. The user is available and prefers one question now to five bugs later.

### 1.9 The mandatory test registry

This is the **exhaustive list of tests the project must have before v1 ships.** Not a thousand tests — roughly 30. Every one guards a failure mode that would be catastrophic (auth bypass, data corruption, vote manipulation, point fraud).

The executing model must write these tests **in the phase where the feature is built,** test-first where marked with 🔴 (TDD: red → green). Tests marked ✅ already exist.

#### Auth & permissions (~10 tests) — Phase 3

**File:** `src/__tests__/lib/onboarding.test.ts` *(written in Phase 2 — see Task 2.3 file inventory)*

```typescript
import { describe, it, expect } from "vitest";
import { isProfileComplete } from "@/lib/onboarding";

const base = {
  displayName: "TestUser",
  countryCode: "US",
  cityName: "New York",
  timezone: "America/New_York",
};

describe("isProfileComplete", () => {
  it("returns true when all four fields are set", () => {
    expect(isProfileComplete(base)).toBe(true);
  });
  it("returns false when displayName is null", () => {
    expect(isProfileComplete({ ...base, displayName: null })).toBe(false);
  });
  it("returns false when countryCode is null", () => {
    expect(isProfileComplete({ ...base, countryCode: null })).toBe(false);
  });
  it("returns false when cityName is null", () => {
    expect(isProfileComplete({ ...base, cityName: null })).toBe(false);
  });
  it("returns false when timezone is null", () => {
    expect(isProfileComplete({ ...base, timezone: null })).toBe(false);
  });
  it("returns false when all four are null", () => {
    expect(
      isProfileComplete({ displayName: null, countryCode: null, cityName: null, timezone: null })
    ).toBe(false);
  });
  // Empty-string defense (added beyond §1.9 minimum — see ADR-0023 rationale)
  it("returns false when displayName is empty string", () => {
    expect(isProfileComplete({ ...base, displayName: "" })).toBe(false);
  });
});
```

> *Field names updated post-ADR-0025 (the schema now stores `cityName` text, not `cityId` FK). The auth.test.ts file is deferred to Phase 3 and will cover the actual `requireRole` / `currentStaffUser` helpers — those don't exist yet.*

**File:** `src/__tests__/lib/permissions.test.ts`

This file tests the **negative cases** — the ones that prevent security breaches.

```typescript
import { describe, it, expect } from "vitest";

// We test the permission logic as a pure function.
// The actual requireRole() calls auth() which hits Clerk — we can't unit test that.
// Instead, extract the decision logic into a testable helper:

type RoleCheck = {
  staffRole: string | null;
  allowedRoles: string[];
};

function isRoleAllowed({ staffRole, allowedRoles }: RoleCheck): boolean {
  if (!staffRole) return false;
  return allowedRoles.includes(staffRole);
}

describe("permission checks — NEGATIVE cases (these prevent breaches)", () => {
  it("rejects null staffRole for admin routes", () => {
    expect(isRoleAllowed({ staffRole: null, allowedRoles: ["admin", "super_admin"] })).toBe(false);
  });

  it("rejects content_creator from admin routes", () => {
    expect(isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["admin", "super_admin"] })).toBe(false);
  });

  it("rejects admin from super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "admin", allowedRoles: ["super_admin"] })).toBe(false);
  });

  it("rejects content_creator from super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["super_admin"] })).toBe(false);
  });
});

describe("permission checks — POSITIVE cases", () => {
  it("allows admin for admin routes", () => {
    expect(isRoleAllowed({ staffRole: "admin", allowedRoles: ["admin", "super_admin"] })).toBe(true);
  });

  it("allows super_admin for admin routes", () => {
    expect(isRoleAllowed({ staffRole: "super_admin", allowedRoles: ["admin", "super_admin"] })).toBe(true);
  });

  it("allows super_admin for super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "super_admin", allowedRoles: ["super_admin"] })).toBe(true);
  });

  it("allows content_creator for staff routes", () => {
    expect(
      isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["content_creator", "admin", "super_admin"] })
    ).toBe(true);
  });
});
```

> **Implementation note:** Extract `isRoleAllowed` into `src/lib/auth.ts` as a pure helper that `requireRole` calls internally. This makes the critical decision logic testable without mocking Clerk.

#### Webhook handler (~4 tests) — Phase 3

**File:** `src/__tests__/webhooks/clerk.test.ts`

These are integration tests that verify the webhook handler puts the database in the correct state. They require a test database.

| # | Test name | What it proves |
|---|---|---|
| 1 | `user.created inserts row with clerk_user_id and email` | Happy path — the most basic contract |
| 2 | `user.created with SUPER_ADMIN_EMAIL bootstraps super_admin` | The bootstrap mechanism works |
| 3 | `user.created with invitation metadata sets staff_role` | Invitation flow correctly promotes |
| 4 | `user.deleted anonymizes but preserves the row` | Privacy compliance — row exists but PII is gone |

These are marked 🔴 TDD — write them before modifying the webhook handler in Phase 3.

#### Voting logic (~10 tests) — Phase 4

**File:** `src/__tests__/lib/voting.test.ts` (unit, TDD 🔴)

| # | Test name | What it proves |
|---|---|---|
| 1 | `computeVotingPower returns 1 for 0 points` | Floor bracket |
| 2 | `computeVotingPower returns 1 for 9 points` | Upper boundary of bracket 1 |
| 3 | `computeVotingPower returns 2 for 10 points` | Lower boundary of bracket 2 |
| 4 | `computeVotingPower returns 3 for 30 points` | Bracket 3 |
| 5 | `computeVotingPower returns 4 for 60 points` | Bracket 4 |
| 6 | `computeVotingPower returns 5 for 100 points` | Bracket 5 |
| 7 | `computeVotingPower returns 5 for 999 points` | Ceiling — never exceeds 5 |

**File:** `src/__tests__/lib/voting.integration.test.ts` (integration, TDD 🔴)

| # | Test name | What it proves |
|---|---|---|
| 8 | `castVote as super_admin throws 403` | **Axiom 2: The Architect cannot vote** |
| 9 | `castVote on closed poll throws 400` | Temporal integrity |
| 10 | `castVote duplicate on same poll throws 409` | One vote per user per poll |

#### Points system (~4 tests) — Phase 4

**File:** `src/__tests__/lib/points.test.ts` (integration, TDD 🔴)

| # | Test name | What it proves |
|---|---|---|
| 1 | `awardPoint increments contribution_points by 1` | Basic contract |
| 2 | `awardPoint returns false on duplicate (rate-limited)` | Rate limiting works |
| 3 | `duplicate awardPoint does NOT increment contribution_points` | Monotonicity isn't cheatable |
| 4 | `contribution_points can never go below zero (CHECK constraint)` | DB-level safety net |

#### Env validation (~8 tests) — Phase 0 ✅ ALREADY EXISTS

**File:** `src/__tests__/env.test.ts` — 8 tests, all passing. No additions needed.

#### Total: ~32 tests across 6 files

That's it. No bloat. Every test guards a real catastrophe.

---

## 2. Current state (as of 2026-04-24)

### Completed

- ✅ All six `/docs` foundation files written
- ✅ 23 ADRs recorded
- ✅ Typed env module (`src/env.ts`) with Zod validation + `server-only`
- ✅ Vitest unit tests (8 tests, all green)
- ✅ Playwright config scaffolded (no E2E tests yet)
- ✅ Husky pre-commit: type-check + lint + unit tests
- ✅ Neon Postgres provisioned (project: `ripped`, region: US East 1, PG 17)
- ✅ MongoDB Atlas provisioned (`ripped` database)
- ✅ Drizzle schema for users, cities, audit_events
- ✅ Two migrations applied to Neon (`0000_dear_rattler`, `0001_chilly_kabuki`)
- ✅ Clerk 7 SDK installed
- ✅ `ClerkProvider` wraps the app
- ✅ Clerk proxy (`src/proxy.ts`) gating non-public routes
- ✅ Clerk webhook route stub (`src/app/api/webhooks/clerk/route.ts`)
- ✅ `npm run build` succeeds with zero warnings

### Known-good commands

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # Production build
npm run type-check   # tsc --noEmit
npm run test:unit    # Vitest once
npm run test:unit:watch  # Vitest watch
npm run test:e2e     # Playwright (requires build + start first — see playwright.config.ts)
npm run db:generate  # Generate migration SQL from schema diff
npm run db:migrate   # Apply migrations to Neon
npm run db:studio    # Browse Neon data in a UI
```

### Pending env var values (user must provide before Phase 2)

`.env.local` currently has placeholder values for:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_test_replace_me`)
- `CLERK_SECRET_KEY` (`sk_test_replace_me`)
- `CLERK_WEBHOOK_SECRET` (`whsec_replace_me`)

These must be replaced with real values from the Clerk dashboard in Phase 1.

### Known debt (to clean up when convenient, not blocking)

- `vite-tsconfig-paths` is in `devDependencies` but unused (we switched to native Vite tsconfig paths). Remove with `npm uninstall vite-tsconfig-paths` when touching package.json next.

---

## 3. Phase 1 — Vercel deployment + Clerk dashboard setup

### 3.1 Objective

Get a **live HTTPS URL** for the app so Clerk can POST webhook events to it. The app at this URL will be mostly empty (just the Next.js default landing page + the `/api/webhooks/clerk` route), but that is enough to validate the full deployment + webhook pipeline end-to-end.

### 3.2 Prerequisites

- Current `main` branch builds (verified).
- User has a Vercel account and can connect GitHub.
- User has a Clerk account (sign up at [clerk.com](https://clerk.com) if not).
- The project is a git repo locally (confirmed — already committed as "Initial commit from Create Next App"). User must push to GitHub before Vercel can connect.

### 3.3 Task list

#### Task 1.1 — Push to GitHub

Guide the user to:

1. Create a new **private** GitHub repo named `ripped` (owner: their choice).
2. Locally: `git remote add origin git@github.com:<owner>/ripped.git` (adjust syntax for HTTPS if user prefers).
3. Commit anything pending with a message like `feat: foundation — docs, schema, clerk stub`.
4. `git push -u origin main`.

**Acceptance:** the repo is visible on GitHub with the current code state.

**If the user objects to GitHub** (private/solo preference): they can use GitLab or Bitbucket instead — Vercel supports both. Default to GitHub; ask before switching.

#### Task 1.2 — Create the Clerk application

Guide the user through the Clerk dashboard:

1. [clerk.com](https://clerk.com) → sign in / sign up.
2. Create application → name it `Ripped` (or `Ripped or Stamped`).
3. **Sign-in options:** enable **Email + Password** and **Google OAuth**. Disable everything else for v1 (we can add social providers later).
4. **API Keys** panel → copy both `Publishable key` and `Secret key`.
5. Paste these into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
   - `CLERK_SECRET_KEY=sk_test_...`

**Acceptance:** `npm run dev` starts; visit `http://localhost:3000` — the homepage renders (no Clerk errors in the terminal).

> *Leave the `CLERK_WEBHOOK_SECRET` placeholder for now — we populate it after deploying to Vercel.*

#### Task 1.3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → select the `ripped` repo from GitHub.
2. Framework: **Next.js** (Vercel auto-detects).
3. Before clicking **Deploy**, expand **Environment Variables** and add every variable from `.env.local` **except** `NODE_ENV` (Vercel sets this itself to `production`). Specifically:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `MONGODB_URI`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET` (leave placeholder for now — we'll update it after Task 1.5)
   - `NEXT_PUBLIC_APP_URL` (leave the `http://localhost:3000` value for now — we'll update it after deploy gives us a real URL)
4. Click **Deploy**. Wait ~2 minutes.
5. Once deployed, Vercel gives a URL like `https://ripped-<hash>.vercel.app`. Copy it.

**Acceptance:** visiting the Vercel URL loads the Next.js default landing page without errors.

#### Task 1.4 — Update `NEXT_PUBLIC_APP_URL` to the real deployment URL

1. In the Vercel project → **Settings → Environment Variables**, update `NEXT_PUBLIC_APP_URL` to the Vercel URL (e.g., `https://ripped-<hash>.vercel.app`).
2. Also update `.env.local` locally to match (so `npm run dev` behaves consistently).
3. Trigger a redeploy: Vercel dashboard → **Deployments** → three-dot menu on latest → **Redeploy**.

**Acceptance:** the new deployment uses the correct `NEXT_PUBLIC_APP_URL`.

#### Task 1.5 — Create the Clerk webhook endpoint

1. Clerk dashboard → **Configure → Webhooks → Add Endpoint**.
2. Endpoint URL: `https://<vercel-url>/api/webhooks/clerk` (use the real URL).
3. **Subscribe to events:** check `user.created`, `user.updated`, `user.deleted`. Do not enable others.
4. Save. Clerk generates a **Signing Secret** — copy it.
5. Update `CLERK_WEBHOOK_SECRET` in **both** Vercel env vars and `.env.local`.
6. Redeploy on Vercel so the webhook route has the real secret.

**Acceptance (full end-to-end verification):**

1. In Clerk dashboard → **Users** → click your webhook → **Testing** tab → send a test `user.created` event.
2. Check Vercel logs for the deployment: you should see a 200 response from `/api/webhooks/clerk`.
3. Go to Neon (via `npm run db:studio` locally) → `users` table → confirm a row was inserted.
4. Delete that test row (`DELETE FROM users WHERE clerk_user_id = '<test-id>';`) to keep the table clean.

**If the webhook fails verification** (returns 400): double-check that `CLERK_WEBHOOK_SECRET` in Vercel matches what Clerk gave you, and that it was redeployed after setting the var.

#### Task 1.6 — Optional: set up custom domain

Skip this if the user does not have a domain yet. If they do:

1. Vercel **Settings → Domains** → add the domain.
2. Configure DNS records per Vercel's instructions.
3. Once active, update `NEXT_PUBLIC_APP_URL` to the custom domain.
4. Update the Clerk webhook endpoint URL to the new domain.
5. Redeploy.

**For the admin subdomain (e.g., `admin.yourdomain.com`):** Phase 3 will handle the routing logic. Just register the DNS record now if convenient, or defer to Phase 3.

### 3.4 Definition of done for Phase 1

- [ ] Repo on GitHub; `main` is pushed.
- [ ] Clerk application created with Email + Password and Google OAuth enabled.
- [ ] App is live on Vercel with a working URL.
- [ ] `NEXT_PUBLIC_APP_URL` in Vercel matches the deployment URL.
- [ ] Clerk webhook endpoint registered; `CLERK_WEBHOOK_SECRET` matches the Clerk dashboard value in both Vercel and `.env.local`.
- [ ] Test `user.created` event from Clerk → verified a row is inserted in Neon.
- [ ] Test row deleted.

---

## 4. Phase 2 — Sign-up and onboarding

### 4.1 Objective

Complete the two-phase sign-up flow (per ADR-0023):

1. User signs up with Clerk (email + password or Google) at `/sign-up`.
2. Webhook inserts a minimal `users` row (already works from Phase 1).
3. User is redirected to `/onboarding` → fills in `display_name`, `country_code`, `city_name`, `timezone`.
4. Server Action persists these and marks the record complete.
5. Proxy gate: authenticated users with an incomplete profile are redirected to `/onboarding` on every route except `/onboarding` itself, `/sign-out`, and the webhook endpoint.

### 4.2 Prerequisites

- Phase 1 complete.
- User has a working Clerk account with dashboard access.

### 4.3 Design decisions (fixed — do not reopen)

- **Sign-in / sign-up UI:** use Clerk's hosted `<SignIn />` and `<SignUp />` components. Do not build custom forms for auth.
- **Onboarding UI:** custom form built by us (React Hook Form + Zod for validation).
- **Form fields at onboarding** (all required except city_state):
  - Display name (text; unique; 3–30 chars; alphanumeric + underscore + hyphen + space)
  - Country (select from ISO 3166-1 alpha-2 list; USA is default; rest alphabetical by name)
  - City (Google Places Autocomplete, restricted to `(cities)` type, biased toward selected country — see ADR-0025)
  - Timezone (searchable select from IANA timezone list, with a suggested default based on the user's browser locale)
- **Data-collection notice on onboarding form:** mandatory per identity-model.md §4.0. Display the exact copy from that section near the country/city fields.
- **Timezone default:** populate from `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client. User can override.
- **Profile completeness check:** a user row is "complete" when `displayName`, `countryCode`, `cityName`, `googlePlaceId`, and `timezone` are all non-null. This is the check the proxy uses.

### 4.4 File inventory

#### Create

| Path | Purpose |
|---|---|
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Hosts Clerk `<SignIn />` |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Hosts Clerk `<SignUp />` |
| `src/app/onboarding/page.tsx` | Onboarding form (client component using server action) |
| `src/app/onboarding/actions.ts` | Server action that validates + writes the onboarding data |
| `src/app/onboarding/form.tsx` | Client Component containing the form (separates client concerns) |
| `src/components/city-autocomplete.tsx` | Google Places Autocomplete for city selection |
| `src/lib/countries.ts` | Static list of ISO country codes + display names (USA first) |
| `src/lib/timezones.ts` | Static list of IANA timezones |
| `src/lib/onboarding.ts` | Helper: `isProfileComplete(user: User): boolean` |
| `src/__tests__/onboarding/actions.test.ts` | Unit test for the server action's validation |
| `tests/e2e/onboarding.spec.ts` | Playwright E2E: sign in as test user → fill onboarding → assert home redirect + cookie |

#### Delete

| Path | Reason |
|---|---|
| `src/db/schema/cities.ts` | Replaced by Google Places — see ADR-0025 |

#### Modify

| Path | Change |
|---|---|
| `src/db/schema/users.ts` | Drop `city_id`, add `city_name`, `city_state`, `google_place_id` |
| `src/db/schema/index.ts` | Remove `export * from "./cities"` |
| `src/proxy.ts` | Add onboarding-completion check → redirect incomplete users to `/onboarding` |
| `src/app/page.tsx` | Temporary home page that shows sign-in state (for Phase 2 validation — will be replaced in later phases) |
| `.env.example` | Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; add `SUPER_ADMIN_EMAIL` (used in Phase 3) |

### 4.5 Tasks

#### Task 2.1 — Add Clerk sign-in / sign-up pages

1. Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
   ```tsx
   import { SignIn } from "@clerk/nextjs";

   export default function SignInPage() {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <SignIn />
       </div>
     );
   }
   ```
2. Create `src/app/sign-up/[[...sign-up]]/page.tsx` — identical structure with `<SignUp />`.
3. In the Clerk dashboard → **Customization → Paths** set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-up: `/onboarding`
   - After sign-in: `/` (home)

**Acceptance:** visit `/sign-in` locally — Clerk's hosted UI renders. Create a test account — you are redirected to `/onboarding` (which doesn't exist yet — 404 is expected here, fix in Task 2.3).

#### Task 2.2 — Google Places Autocomplete setup + schema migration

**Supersedes the old Task 2.2 (cities seed). See ADR-0025.**

1. **Install:** `npm install @googlemaps/js-api-loader` (runtime dep; types come from `@types/google.maps` as dev dep).
2. **User provides:** a Google Cloud API key with Places API (New) enabled.
3. **Add to `.env.local` and `.env.example`:**
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```
4. **Schema change — `src/db/schema/users.ts`:**
   - Drop `cityId` (integer FK → cities)
   - Add `cityName` (text), `cityState` (text), `googlePlaceId` (text)
   - Remove the `cities` import
5. **Delete `src/db/schema/cities.ts`.**
6. **Update `src/db/schema/index.ts`** — remove `export * from "./cities"`.
7. **Run `npm run db:generate`** — creates migration SQL to drop the cities table and alter users.
8. **Review the generated SQL.** It should:
   - `DROP TABLE cities;`
   - `ALTER TABLE users DROP COLUMN city_id;`
   - `ALTER TABLE users ADD COLUMN city_name text;`
   - `ALTER TABLE users ADD COLUMN city_state text;`
   - `ALTER TABLE users ADD COLUMN google_place_id text;`
9. **Run `npm run db:migrate`** — applies to Neon.
10. **Create `src/components/city-autocomplete.tsx`** — a Client Component that:
    - Loads Google Places via `@googlemaps/js-api-loader`
    - Restricts to `(cities)` type
    - Uses `componentRestrictions` to bias toward the selected country
    - On selection: extracts `cityName`, `cityState`, `countryCode`, `googlePlaceId` from `address_components`
    - Passes structured data to the parent form via an `onSelect` callback
11. **Create `src/lib/countries.ts`** — static list of ISO 3166-1 alpha-2 countries. USA first, then alphabetical by display name.

**Acceptance:** The city-autocomplete component renders, loads Google Places, shows suggestions as you type, and returns structured city data on selection.

#### Task 2.3 — Build the onboarding form

1. `src/lib/timezones.ts`: export `timezones: string[]` — use `Intl.supportedValuesOf('timeZone')` at runtime, but precompute at build time for SSR. Simplest: hardcode a list of common IANA timezones (~60 entries for major cities). Can use `Intl.supportedValuesOf('timeZone')` if it simplifies.
2. `src/app/onboarding/form.tsx` — Client Component:
   - React Hook Form + Zod resolver
   - Fields: `displayName`, `countryCode` (select, USA default), city (via `<CityAutocomplete />`), `timezone`
   - Country select: biases city autocomplete results (when country changes, the autocomplete reloads with the new country restriction)
   - Timezone select: default from `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Submit: calls server action from `actions.ts`
   - Displays the identity-model.md §4.0 data-collection notice near country/city fields
3. `src/app/onboarding/actions.ts` — Server Action `completeOnboarding`:
   - Zod validate input (displayName, countryCode, cityName, cityState, googlePlaceId, timezone)
   - Get `clerk_user_id` from Clerk's `auth()`
   - Update the `users` row with the onboarding fields
   - Insert an `audit_events` row with `event_type: 'profile.onboarded'`
   - Redirect to `/` on success
4. `src/app/onboarding/page.tsx` — Server Component:
   - Auth check via `auth()` — redirect to `/sign-in` if not authenticated
   - Fetch user row; if already complete, redirect to `/`
   - Render the `<OnboardingForm />`

**Acceptance:** signing up via Clerk redirects to `/onboarding`; submitting the form populates the fields in Neon and redirects to `/`.

#### Task 2.4 — Proxy: gate incomplete profiles

Update `src/proxy.ts` to:

1. Keep existing public route matcher (`/`, `/sign-in`, `/sign-up`, `/api/webhooks/*`).
2. Add a matcher for onboarding-exempt routes (routes the proxy must NOT redirect to `/onboarding` from): `/onboarding(.*)`, `/sign-out`, and Clerk's internal endpoints.
3. For authenticated users not on an exempt route: fetch the user row (by `clerkUserId`) and check `isProfileComplete(user)`. If false, redirect to `/onboarding`.
4. **Optimization:** do not query Postgres on every request for profile completeness. Cache the "profile complete" state in a signed cookie (set on successful onboarding, cleared on sign-out). The cookie is an optimistic check; authoritative check happens on the onboarding server action itself.

**Acceptance:** an authenticated user with an incomplete profile visiting any non-exempt route is redirected to `/onboarding`.

#### Task 2.5 — Update home page temporarily

Replace `src/app/page.tsx` contents with a simple welcome that shows sign-in state using Clerk's `<SignedIn>` and `<SignedOut>` components. Include links to `/sign-in` and `/sign-up` for signed-out users, and the user's display name for signed-in users.

This is a throwaway page — a future phase replaces it with the real landing experience.

**Acceptance:** home page renders correctly in both signed-in and signed-out states.

### 4.6 Tests to write

Follow the test pyramid in [`docs/testing-strategy.md`](./testing-strategy.md).

- **Unit** — `src/__tests__/onboarding/actions.test.ts`: Zod schema validation (valid input passes; missing field rejects; invalid country code rejects; display name uniqueness logic).
- **Unit** — `src/__tests__/lib/onboarding.test.ts`: `isProfileComplete` returns correct boolean for each field combination.
- **E2E** — `tests/e2e/onboarding.spec.ts`: Playwright test using the `onboardingPage` fixture (dedicated test user, E2E test mode bypass, DB reset before each run). Fills the form, asserts redirect to `/` and `ripped_onboarded` cookie.

### 4.7 ADRs to write during this phase

- **ADR-0024 — Onboarding form uses React Hook Form + Zod.** Record the choice vs. alternatives (uncontrolled HTML form + Server Action only, Formik, etc.). Reason: RHF is well-documented, Zod integrates with our validation patterns, and the form has enough client-side logic (dependent city dropdown) to warrant it.
- **ADR-0025 — City selection via Google Places Autocomplete.** Documents the decision to use Google Places instead of a curated cities table. See `decision-log.md`.

### 4.8 Definition of done for Phase 2

- ✅ `/sign-in` and `/sign-up` render Clerk's hosted UI.
- ✅ Google Places Autocomplete works in the onboarding form — typing shows city suggestions.
- ✅ `/onboarding` collects display name, country, city (via Google Places), and timezone with the data-collection notice visible.
- ✅ Server action persists the fields; `audit_events` row written for each completion.
- ✅ Proxy redirects incomplete profiles to `/onboarding`.
- ✅ Unit tests passing. E2E onboarding test wired up (`tests/e2e/onboarding.spec.ts`).
- ✅ A test user can complete the flow: sign up → onboard → access home.

---

## 5. Phase 3 — Admin surface + staff management

### 5.1 Objective

Stand up the admin surface at `admin.<domain>`, bootstrap Dean as the super-admin, and build the staff-invitation flow. By the end of this phase:

- Dean can sign into the admin site.
- Dean can invite admins.
- Admins can invite content creators.
- Every role/tier transition is written to `audit_events`.

### 5.2 Prerequisites

- Phase 2 complete and deployed.
- User owns a domain with DNS access (required for the `admin.` subdomain). If not, defer Phase 3 and do Phase 4 first using path-based routing (`/admin`) as an interim measure; document this as a temporary deviation in an ADR.

### 5.3 Design decisions (fixed)

- **Admin routing:** subdomain-based. `admin.<domain>` serves an alternate root layout showing the admin dashboard. Same Next.js app, same Vercel deployment. Routed via a root layout check on the `host` header, or via Next.js [multi-zones](https://nextjs.org/docs/app/guides/multi-zones) if subdomain routing within one app gets awkward.
- **Super-admin bootstrap:** a new env var `SUPER_ADMIN_EMAIL` (set in Vercel). On every Clerk webhook `user.created`, the webhook handler checks: if email matches `SUPER_ADMIN_EMAIL` AND no super-admin exists yet, set `staff_role = 'super_admin'` for that user. This happens exactly once in the lifetime of the system.
- **Staff invitation:** sent via Clerk's [invitation API](https://clerk.com/docs/users/invitations) — Clerk emails the invitee with a magic link. On acceptance, Clerk creates the user; our webhook handler sees a metadata flag `invitedAsStaff` and populates the staff fields. Invitation payload from Clerk metadata carries `staffRole`, `invitedByUserId`, etc.
- **Staff fields form:** collected at acceptance time (on `/onboarding` but with a "staff info" section added when the user is marked as staff-pending).
- **Permission enforcement:** server-side only. Every admin route and server action must check `user.staffRole` before executing. Use a shared helper `requireRole(role)` that throws `403` if unauthorized.
- **Dashboard layout:** the admin site has a different root layout from the public site. Super-admin view includes admin management controls; admin view does not; content creator view is CMS-only.

### 5.4 File inventory

#### Create

| Path | Purpose |
|---|---|
| `src/app/admin/layout.tsx` | Admin root layout (conditionally renders based on `host`) |
| `src/app/admin/page.tsx` | Admin dashboard home |
| `src/app/admin/users/page.tsx` | User management (admin+) |
| `src/app/admin/admins/page.tsx` | Admin management (super-admin only) |
| `src/app/admin/invites/new/page.tsx` | Invite content creator / admin |
| `src/app/admin/invites/new/actions.ts` | Server action: create Clerk invitation with metadata |
| `src/lib/auth.ts` | `requireRole(role)`, `currentUser()`, permission helpers |
| `src/lib/audit.ts` | `logEvent({ eventType, actorUserId, targetUserId, payload })` — inserts audit_events row |
| `src/__tests__/lib/auth.test.ts` | Permission helper tests |
| `src/__tests__/lib/audit.test.ts` | Audit helper tests |

#### Modify

| Path | Change |
|---|---|
| `src/proxy.ts` | Subdomain routing: if `host === 'admin.*'`, require staff role; block non-staff |
| `src/app/api/webhooks/clerk/route.ts` | On `user.created`: if email matches `SUPER_ADMIN_EMAIL` and no super-admin exists, set `staff_role='super_admin'`. If invitation metadata contains staff fields, apply them. |
| `src/env.ts` | Add `SUPER_ADMIN_EMAIL` to schema |
| `.env.example`, `.env.local` | Document and set `SUPER_ADMIN_EMAIL` |

### 5.5 Tasks

#### Task 3.1 — Decide routing: path-based `/admin/*` first, subdomain later

**Decision (pre-made — do not re-open):** The user does not yet have a custom domain. Vercel's `.vercel.app` domains do not support arbitrary subdomains. Therefore:

1. **Now:** use path-based routing (`/admin/*`) with a server-side layout gate (`requireStaff()`).
2. **Later (when domain is purchased):** add a proxy-level host check to redirect `admin.<domain>` to the `/admin` route group. This is a one-line proxy change + DNS config.

**Write ADR-0027** documenting this temporary deviation:

```markdown
## ADR-0027 — Admin routing via /admin/* paths (subdomain deferred)

- **Date:** <today>
- **Status:** accepted

**Context.** ADR-0003 specifies subdomain-based admin routing (`admin.<domain>`).
The project does not yet have a custom domain; Vercel's `.vercel.app` domains do
not support arbitrary subdomains.

**Decision.** Use path-based routing (`/admin/*`) with a server-side layout gate
(`requireStaff()`) for now. When a custom domain is purchased, add a proxy-level
host check to redirect `admin.<domain>` to the `/admin` route group. This ADR
will be superseded at that time.

**Consequences.**
- (+) Unblocks Phase 3 without waiting on DNS.
- (+) The route group structure (`src/app/admin/`) is identical either way.
- (−) The clean URL separation of ADR-0003 is deferred.

**Alternatives considered.**
- **Wait for domain** — blocks progress on the entire admin surface.
```

**Files to modify:** `src/proxy.ts` — add `/admin(.*)` to the authenticated-only routes (already covered by the default `auth.protect()` gate — verify).

**Acceptance:** `/admin` requires authentication. No subdomain configuration needed.

#### Task 3.2 — Add `SUPER_ADMIN_EMAIL` env var

**Files to modify:**

1. `src/env.ts` — add to the schema:
   ```typescript
   SUPER_ADMIN_EMAIL: z.string().email(),
   ```

2. `.env.example` — add:
   ```
   # The email that will be bootstrapped as super-admin on first sign-up
   SUPER_ADMIN_EMAIL=dean@example.com
   ```

3. `.env.local` — set to Dean's real email address.

4. `src/__tests__/env.test.ts` — add `SUPER_ADMIN_EMAIL: "dean@test.com"` to the `validServer` object and add it to the `serverSchema`.

**Acceptance:** `npm run test:unit` passes; `npm run build` passes.

#### Task 3.3 — Super-admin bootstrap in webhook handler

**File to modify:** `src/app/api/webhooks/clerk/route.ts`

After the existing `db.insert(users).values(...)` in the `user.created` branch, add the bootstrap check:

```typescript
// Super-admin bootstrap (runs once ever — see ADR-0028)
if (primaryEmail.email_address === env.SUPER_ADMIN_EMAIL) {
  const [existingSuperAdmin] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.staffRole, "super_admin"));

  if (existingSuperAdmin.count === 0) {
    await db
      .update(users)
      .set({ staffRole: "super_admin" })
      .where(eq(users.clerkUserId, data.id));

    // Find the newly created user's internal ID for the audit log
    const [newUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, data.id));

    if (newUser) {
      await db.insert(auditEvents).values({
        eventType: "staff.super_admin_bootstrapped",
        targetUserId: newUser.id,
        payload: { email: primaryEmail.email_address },
      });
    }
  }
}
```

Add imports: `import { count } from "drizzle-orm";` and `import { auditEvents } from "@/db/schema";`

**Write ADR-0028** (super-admin bootstrap via env var):

```markdown
## ADR-0028 — Super-admin bootstrap via SUPER_ADMIN_EMAIL env var

- **Date:** <today>
- **Status:** accepted

**Context.** The system needs exactly one super-admin. The first sign-up matching
a known email address should be automatically promoted.

**Decision.** A new env var `SUPER_ADMIN_EMAIL` is checked on every `user.created`
webhook. If the email matches AND no super-admin exists yet, the user is promoted
to `staff_role = 'super_admin'`. This happens exactly once in the lifetime of the
system.

**Consequences.**
- (+) No manual DB surgery needed to bootstrap.
- (+) Runs only once; idempotent after that.
- (−) The env var is a secret that, if changed, could theoretically bootstrap a
  second super-admin. Mitigated by the "no super-admin exists" check.

**Alternatives considered.**
- **Manual SQL** — error-prone, undocumented.
- **Seed script** — requires the Clerk user to exist first; chicken-and-egg.
```

**Acceptance:**
1. Sign up with the `SUPER_ADMIN_EMAIL` → `users` row has `staff_role = 'super_admin'`.
2. `audit_events` has a row with `event_type = 'staff.super_admin_bootstrapped'`.
3. Sign up a second user → they are NOT promoted.

#### Task 3.4 — Build auth helpers

**File to create:** `src/lib/auth.ts`

```typescript
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { User } from "@/db/schema";

/**
 * Get the full user record for the currently authenticated Clerk user.
 * Returns null if not authenticated or if the user row doesn't exist yet
 * (between Clerk sign-up and webhook processing).
 */
export async function currentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId));

  return user ?? null;
}

/**
 * Throw a Response with the appropriate status if the current user
 * doesn't have one of the allowed staff roles.
 */
export async function requireRole(
  ...allowedRoles: Array<"content_creator" | "admin" | "super_admin">
): Promise<User> {
  const user = await currentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (!user.staffRole || !allowedRoles.includes(user.staffRole)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function requireStaff(): Promise<User> {
  return requireRole("content_creator", "admin", "super_admin");
}

export async function requireAdmin(): Promise<User> {
  return requireRole("admin", "super_admin");
}

export async function requireSuperAdmin(): Promise<User> {
  return requireRole("super_admin");
}

```

> **Note:** Do NOT add `isProfileComplete` to `src/lib/auth.ts`. It already lives in `src/lib/onboarding.ts` (written in Phase 2, post-ADR-0025) and checks `cityName` (text field), not `cityId` (FK — removed). Its tests already exist and pass in `src/__tests__/lib/onboarding.test.ts`. No separate `auth.test.ts` for profile-completeness is needed.

**Acceptance:** `npm run test:unit` passes with the new tests.

#### Task 3.5 — Build audit helper

**File to create:** `src/lib/audit.ts`

```typescript
import "server-only";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";

type LogEventParams = {
  eventType: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Insert an audit event. Call this in the same transaction as the state change
 * it records — see ADR-0014.
 */
export async function logEvent({
  eventType,
  actorUserId = null,
  targetUserId = null,
  payload = {},
}: LogEventParams) {
  await db.insert(auditEvents).values({
    eventType,
    actorUserId,
    targetUserId,
    payload,
  });
}
```

**Acceptance:** function exists; used by Task 3.3's bootstrap logic. A unit test can mock `db.insert` and verify the shape of the values object.

#### Task 3.6 — Build the admin layout and dashboard shell

**File to create:** `src/app/admin/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // Not authenticated at all
  if (!user) redirect("/sign-in");

  // Authenticated but not staff
  if (!user.staffRole) {
    // Return 403 via notFound or a custom error page
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">403 — Forbidden</h1>
        <p>You do not have access to the admin area.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — role-conditional items will be built out in sub-tasks */}
      <aside className="w-64 bg-zinc-900 text-white p-6">
        <h2 className="text-lg font-bold mb-6">Admin</h2>
        <nav className="flex flex-col gap-2">
          <a href="/admin" className="hover:underline">Dashboard</a>
          {(user.staffRole === "admin" || user.staffRole === "super_admin") && (
            <a href="/admin/users" className="hover:underline">Users</a>
          )}
          {user.staffRole === "super_admin" && (
            <a href="/admin/admins" className="hover:underline">Admin Management</a>
          )}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

**File to create:** `src/app/admin/page.tsx`

```tsx
import { requireStaff } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireStaff();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-zinc-600">
        Signed in as <strong>{user.displayName ?? user.email}</strong>
        {" "}({user.staffRole})
      </p>
      {/* Dashboard tiles will be expanded as features are built */}
    </div>
  );
}
```

**Acceptance:** A user with `staff_role = 'super_admin'` can access `/admin`. A non-staff user sees the 403 message.

#### Task 3.7 — Build the invitation flow

**File to create:** `src/app/admin/invites/new/page.tsx`

A form with fields:
- Email address (text input)
- Role to invite as (select: `content_creator` or `admin`)
  - Content creators can only be invited by admins+
  - Admins can only be invited by super-admin
  - The role selector should only show options the current user can invite

**File to create:** `src/app/admin/invites/new/actions.ts`

Server action `sendInvitation`:
1. Validate current user has permission (admin can invite content_creator; super_admin can invite admin or content_creator)
2. Call Clerk's Invitation API:
   ```typescript
   import { clerkClient } from "@clerk/nextjs/server";

   const invitation = await clerkClient().invitations.createInvitation({
     emailAddress: email,
     publicMetadata: {
       staffRole: role,
       invitedByUserId: currentUser.id,
     },
   });
   ```
3. Log the invitation in `audit_events` via `logEvent`
4. Return success

**Modify:** `src/app/api/webhooks/clerk/route.ts`

In the `user.created` handler, after the initial insert, add a check for staff invitation metadata:

```typescript
// Check if this user was invited as staff
const metadata = data.public_metadata as {
  staffRole?: string;
  invitedByUserId?: string;
} | undefined;

if (metadata?.staffRole && metadata?.invitedByUserId) {
  const [inviter] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, metadata.invitedByUserId));

  if (inviter) {
    await db
      .update(users)
      .set({
        staffRole: metadata.staffRole as "content_creator" | "admin",
        invitedByUserId: inviter.id,
        invitedAt: new Date(),
      })
      .where(eq(users.clerkUserId, data.id));
  }
}
```

**Write ADR-0029** (staff invitations via Clerk API with metadata).

**Acceptance:**
1. Dean (super-admin) visits `/admin/invites/new`, enters an email and selects "admin" → Clerk sends an invite email.
2. The invitee signs up via the Clerk link → their `users` row has `staff_role = 'admin'`, `invited_by_user_id` set, and `invited_at` set.
3. `audit_events` has rows for both the invitation and the acceptance.

#### Task 3.8 — Write mandatory tests for auth, permissions, and webhooks

This is the most important task in Phase 3. These tests guard against security breaches and data corruption. **Write them before the implementation they test (TDD 🔴).**

Refer to §1.9 (the mandatory test registry) for the exact test code and specifications. The files to create:

1. `src/__tests__/lib/auth.test.ts` — 6 tests for `isProfileComplete` (code provided in §1.9)
2. `src/__tests__/lib/permissions.test.ts` — 8 tests for role-checking logic (code provided in §1.9)
3. `src/__tests__/webhooks/clerk.test.ts` — 4 integration tests for the webhook handler (specs in §1.9)

**Implementation detail:** Extract the role-checking decision from `requireRole` into a pure helper `isRoleAllowed({ staffRole, allowedRoles })` so it can be unit tested without mocking Clerk. The `requireRole` function calls `isRoleAllowed` internally.

**Acceptance:**
1. All 18 tests pass (`npm run test:unit`).
2. Every negative case (unauthorized access attempt) is explicitly covered.
3. The webhook tests prove the DB ends in the right state for each event type.

### 5.6 ADRs to write

- **ADR-0027 — Admin routing via /admin/* paths (subdomain deferred).** Path-based routing now; subdomain when domain is purchased.
- **ADR-0028 — Super-admin bootstrap via SUPER_ADMIN_EMAIL env var.** Fixed at system init; intentional single-use mechanism.
- **ADR-0029 — Staff invitations use Clerk's invitation API with metadata.** Document why (no parallel invitation system; staff fields captured during normal onboarding with a staff section).

### 5.7 Definition of done for Phase 3

- [ ] `SUPER_ADMIN_EMAIL` env var added to schema, example, and local.
- [ ] Webhook handler bootstraps super-admin on first matching sign-up.
- [ ] Auth helpers (`requireRole`, `requireStaff`, etc.) exist and are tested.
- [ ] **`isRoleAllowed` extracted as a pure helper and unit-tested (8 tests).**
- [ ] **Webhook handler integration-tested (4 tests) — see §1.9.**
- [ ] Audit helper (`logEvent`) exists.
- [ ] `/admin` layout gates non-staff users with a 403.
- [ ] Admin dashboard shows role-conditional content.
- [ ] Dean is super-admin and can access `/admin`.
- [ ] Dean can invite an admin via `/admin/invites/new`; the invite email arrives; the invitee can sign up and gets `staff_role = 'admin'`.
- [ ] Admins can invite content creators.
- [ ] `audit_events` has rows for every role transition and invitation.
- [ ] Unit tests passing for `isProfileComplete` and auth helpers.
- [ ] **All 18 Phase 3 tests passing.**
- [ ] ADRs 0026, 0027, 0028 written.

---

## 6. Phase 4 — Voting (the core mechanic)

### 6.1 Objective

Implement the full voting pipeline: Episodes, Papers, Challenges, Polls, Votes, and point accrual. By the end of this phase, the platform can run a real episode's paper selection and challenge selection votes end-to-end.

### 6.2 Prerequisites

- Phase 3 complete.
- Dean is a working super-admin who can publish proposals.

### 6.3 Design decisions (fixed — traceable to `/docs`)

- **Postgres tables:** `episodes`, `papers`, `challenges`, `polls`, `poll_options`, `votes`, `point_awards`.
- **Mongo collections:** `proposals` (committee drafts — lifecycle: `draft → submitted → published → rejected`).
- **Episode state machine** (from show-premise.md §7): `paper_selected → challenge_selected → in_production → bar_reviewed → verdict_cast → archived`. State transitions are admin-triggered and audit-logged.
- **Proposal lifecycle:** Planning Committee authors drafts (in Mongo); admin publishes a draft → creates a `paper` or `challenge` row in Postgres + a `poll` for audience voting.
- **Vote storage:** one row per cast vote in `votes` with `user_id`, `poll_option_id`, and `weight` (snapshot of the user's voting-power bracket at cast time — per roles-and-ranks.md §6).
- **Point awards:** one row per awarded point in `point_awards` with `user_id`, `action_id` (enum from the catalog), `target_id` (nullable; e.g., the poll option they voted for), and `awarded_at`. The user's `contribution_points` integer is updated in the same transaction via `UPDATE users SET contribution_points = contribution_points + 1 WHERE id = ?`.
- **Monotonicity enforcement:** in application code (never write negative deltas); the CHECK constraint (`contribution_points >= 0`) is a safety net.
- **Rate limits** per roles-and-ranks.md §4 are enforced by a uniqueness constraint on `(user_id, action_id, target_id)` in `point_awards`. Duplicate award attempts → `ON CONFLICT DO NOTHING`.
- **Voting power bracket** is computed server-side at vote time from the user's current `contribution_points`. The result is stored in `votes.weight` and never recomputed.
- **Dean cannot vote** — enforced in the `castVote` server action via `requireNotSuperAdmin`. Hard-coded, not configuration-driven.
- **Tie-breaking:** per ADR-0022 — earliest publication wins. `poll_options.created_at` is the tiebreak key.

### 6.4 Task list

#### Task 4.1 — Drizzle schemas for voting entities

**New files to create in `src/db/schema/`:**

`src/db/schema/episodes.ts`:
```typescript
import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const episodeStatusEnum = pgEnum("episode_status", [
  "paper_selected",
  "challenge_selected",
  "in_production",
  "bar_reviewed",
  "verdict_cast",
  "archived",
]);

export const verdictEnum = pgEnum("verdict", ["stamped", "ripped"]);

export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number").notNull().unique(),
  status: episodeStatusEnum("status").notNull().default("paper_selected"),
  verdict: verdictEnum("verdict"),
  selectedPaperId: uuid("selected_paper_id"),
  selectedChallengeId: uuid("selected_challenge_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;
```

`src/db/schema/papers.ts`:
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const papers = pgTable("papers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  description: text("description"),
  episodeId: uuid("episode_id").references(() => episodes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Paper = typeof papers.$inferSelect;
```

`src/db/schema/challenges.ts`:
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  benchmarkText: text("benchmark_text").notNull(),
  trapText: text("trap_text").notNull(),
  episodeId: uuid("episode_id").references(() => episodes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Challenge = typeof challenges.$inferSelect;
```

`src/db/schema/polls.ts`:
```typescript
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const pollTypeEnum = pgEnum("poll_type", [
  "paper_selection",
  "challenge_selection",
]);

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id),
  pollType: pollTypeEnum("poll_type").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(() => polls.id),
  optionReferenceId: uuid("option_reference_id").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
```

`src/db/schema/votes.ts`:
```typescript
import { integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { pollOptions } from "./polls";

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  pollOptionId: uuid("poll_option_id").notNull().references(() => pollOptions.id),
  weight: integer("weight").notNull(),
  castedAt: timestamp("casted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // One vote per user per poll option
  unique("votes_user_poll_option_unique").on(t.userId, t.pollOptionId),
]);

export type Vote = typeof votes.$inferSelect;
```

> **Important:** The unique constraint above is per poll_option, not per poll. To enforce one-vote-per-poll (not one-vote-per-option), the `castVote` function must check: "does this user already have a vote on ANY option in this poll?" This is an application-level check, not a DB constraint, because the `votes` table doesn't have a direct `poll_id` column.

`src/db/schema/point_awards.ts`:
```typescript
import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const pointAwards = pgTable("point_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  actionId: text("action_id").notNull(),
  targetId: text("target_id"),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Rate limit: one award per user per action per target
  unique("point_awards_rate_limit").on(t.userId, t.actionId, t.targetId),
]);

export type PointAward = typeof pointAwards.$inferSelect;
```

**Modify `src/db/schema/index.ts`** — add exports for all new schema files:
```typescript
export * from "./enums";
export * from "./cities";
export * from "./users";
export * from "./audit";
export * from "./episodes";
export * from "./papers";
export * from "./challenges";
export * from "./polls";
export * from "./votes";
export * from "./point_awards";
```

**Run:**
1. `npm run db:generate` — creates the migration SQL
2. Review the generated SQL in `drizzle/` for correctness
3. `npm run db:migrate` — applies to Neon

**Acceptance:** Migration applies cleanly; `npm run db:studio` shows all new tables.

#### Task 4.2 — MongoDB client and proposal schema

**Install:** `npm install mongodb`

**File to create:** `src/db/mongo.ts`

```typescript
import "server-only";
import { MongoClient } from "mongodb";

// Use process.env directly here (same pattern as db/index.ts — see build-plan §11 note)
const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export async function getMongoDb() {
  const c = await clientPromise;
  return c.db("ripped");
}
```

**File to create:** `src/db/mongo/proposals.ts`

```typescript
import { z } from "zod";
import { getMongoDb } from "../mongo";

export const proposalStatusEnum = z.enum(["draft", "submitted", "published", "rejected"]);
export const proposalTypeEnum = z.enum(["paper", "challenge"]);

export const proposalSchema = z.object({
  type: proposalTypeEnum,
  status: proposalStatusEnum,
  authorUserId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(5000),
  // Paper-specific
  paperName: z.string().optional(),
  manufacturer: z.string().optional(),
  // Challenge-specific
  benchmarkText: z.string().optional(),
  trapText: z.string().optional(),
  // Lifecycle timestamps
  submittedAt: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  publishedByUserId: z.string().uuid().nullable().optional(),
  rejectedAt: z.date().nullable().optional(),
  rejectedByUserId: z.string().uuid().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Proposal = z.infer<typeof proposalSchema>;

export async function getProposalsCollection() {
  const db = await getMongoDb();
  return db.collection<Proposal>("proposals");
}
```

**Write ADR-0030** — Mongo proposal schema shape. Document the decision to use Mongo for proposals (document-shaped, no referential integrity needed until publication, at which point the data migrates to Postgres as a `paper` or `challenge` row).

**Acceptance:** MongoDB client connects; proposal schema validates correctly.

#### Task 4.3 — Voting logic (TDD — write tests FIRST)

**Test file to create FIRST:** `src/__tests__/lib/voting.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { computeVotingPower } from "@/lib/voting";

describe("computeVotingPower", () => {
  it("returns 1 for 0 points", () => {
    expect(computeVotingPower(0)).toBe(1);
  });
  it("returns 1 for 9 points", () => {
    expect(computeVotingPower(9)).toBe(1);
  });
  it("returns 2 for 10 points", () => {
    expect(computeVotingPower(10)).toBe(2);
  });
  it("returns 2 for 29 points", () => {
    expect(computeVotingPower(29)).toBe(2);
  });
  it("returns 3 for 30 points", () => {
    expect(computeVotingPower(30)).toBe(3);
  });
  it("returns 3 for 59 points", () => {
    expect(computeVotingPower(59)).toBe(3);
  });
  it("returns 4 for 60 points", () => {
    expect(computeVotingPower(60)).toBe(4);
  });
  it("returns 4 for 99 points", () => {
    expect(computeVotingPower(99)).toBe(4);
  });
  it("returns 5 for 100 points", () => {
    expect(computeVotingPower(100)).toBe(5);
  });
  it("returns 5 for 999 points", () => {
    expect(computeVotingPower(999)).toBe(5);
  });
});
```

Run tests — they should **fail** (Red).

**File to create:** `src/lib/voting.ts`

```typescript
/**
 * Compute the vote weight for a user based on their contribution points.
 * Brackets per ADR-0021 and roles-and-ranks.md §6.
 */
export function computeVotingPower(contributionPoints: number): number {
  if (contributionPoints >= 100) return 5;
  if (contributionPoints >= 60) return 4;
  if (contributionPoints >= 30) return 3;
  if (contributionPoints >= 10) return 2;
  return 1;
}
```

Run tests — they should **pass** (Green).

Then add the remaining functions (these require DB access and are harder to unit test — write integration tests or test with mocked DB):

```typescript
import "server-only";
import { and, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, votes, polls, pollOptions } from "@/db/schema";
import { awardPoint } from "@/lib/points";

/**
 * Cast a vote. Validates eligibility, computes weight, inserts vote, awards point.
 * Returns the created vote row.
 *
 * Throws:
 * - 403 if the user is super-admin (Axiom 2)
 * - 409 if the user already voted in this poll
 * - 400 if the poll is not currently open
 */
export async function castVote(userId: string, pollOptionId: string) {
  // 1. Fetch user
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Response("User not found", { status: 404 });

  // 2. Axiom 2: super-admin cannot vote
  if (user.staffRole === "super_admin") {
    throw new Response("The Architect cannot vote", { status: 403 });
  }

  // 3. Fetch the poll option and its poll
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.id, pollOptionId));
  if (!option) throw new Response("Poll option not found", { status: 404 });

  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, option.pollId));
  if (!poll) throw new Response("Poll not found", { status: 404 });

  // 4. Check poll is open
  const now = new Date();
  if (now < poll.opensAt || now > poll.closesAt || poll.closedAt) {
    throw new Response("Poll is not open", { status: 400 });
  }

  // 5. Check user hasn't already voted on ANY option in this poll
  const existingVote = await db
    .select({ id: votes.id })
    .from(votes)
    .innerJoin(pollOptions, eq(votes.pollOptionId, pollOptions.id))
    .where(
      and(
        eq(votes.userId, userId),
        eq(pollOptions.pollId, poll.id)
      )
    )
    .limit(1);

  if (existingVote.length > 0) {
    throw new Response("Already voted in this poll", { status: 409 });
  }

  // 6. Compute weight
  const weight = computeVotingPower(user.contributionPoints);

  // 7. Insert vote
  const [vote] = await db.insert(votes).values({
    userId,
    pollOptionId,
    weight,
  }).returning();

  // 8. Award contribution point
  const actionId = poll.pollType === "paper_selection"
    ? "vote.paper_selection"
    : "vote.challenge_selection";
  await awardPoint(userId, actionId, poll.id);

  return vote;
}

/**
 * Tally a poll's results. Returns options sorted by weighted vote count (desc).
 * On tie, sorts by earliest createdAt (per ADR-0022).
 */
export async function tallyPoll(pollId: string) {
  const options = await db
    .select({
      optionId: pollOptions.id,
      label: pollOptions.label,
      createdAt: pollOptions.createdAt,
      weightedTotal: sql<number>`COALESCE(SUM(${votes.weight}), 0)`.as("weighted_total"),
      voteCount: sql<number>`COUNT(${votes.id})`.as("vote_count"),
    })
    .from(pollOptions)
    .leftJoin(votes, eq(votes.pollOptionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id, pollOptions.label, pollOptions.createdAt)
    .orderBy(
      sql`COALESCE(SUM(${votes.weight}), 0) DESC`,
      sql`${pollOptions.createdAt} ASC`  // tiebreak: earliest published
    );

  return options;
}

/**
 * Close a poll. Sets closedAt to now. Determines the winner.
 */
export async function closePoll(pollId: string, actorUserId: string) {
  await db
    .update(polls)
    .set({ closedAt: new Date() })
    .where(eq(polls.id, pollId));

  const results = await tallyPoll(pollId);
  const winner = results[0]; // First after sort = winner (tiebreak built in)

  return { results, winner };
}
```

**Acceptance:** `computeVotingPower` tests pass. Integration tests for `castVote` and `tallyPoll` should be written once the DB is available.

#### Task 4.4 — Points system (TDD)

**Test file to create FIRST:** `src/__tests__/lib/points.test.ts`

Test the pure logic of point awarding. Since `awardPoint` hits the DB, mock the DB layer or write as an integration test.

**File to create:** `src/lib/points.ts`

```typescript
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pointAwards, users } from "@/db/schema";

/**
 * Award a single contribution point to a user for a specific action on a target.
 * Uses INSERT ... ON CONFLICT DO NOTHING for rate limiting (one point per
 * user × action × target). If the point was already awarded, this is a no-op.
 *
 * Returns true if the point was awarded, false if it was a duplicate.
 */
export async function awardPoint(
  userId: string,
  actionId: string,
  targetId: string | null
): Promise<boolean> {
  // Attempt to insert — if the unique constraint (userId, actionId, targetId)
  // is violated, this returns 0 rows.
  const result = await db
    .insert(pointAwards)
    .values({ userId, actionId, targetId })
    .onConflictDoNothing({
      target: [pointAwards.userId, pointAwards.actionId, pointAwards.targetId],
    })
    .returning({ id: pointAwards.id });

  if (result.length === 0) {
    // Duplicate — rate-limited
    return false;
  }

  // Point was awarded — increment the user's contribution_points
  await db
    .update(users)
    .set({
      contributionPoints: sql`${users.contributionPoints} + 1`,
    })
    .where(eq(users.id, userId));

  return true;
}
```

**Acceptance:** `awardPoint` inserts a `point_awards` row and increments `contribution_points` on first call; returns `false` on duplicate.

#### Task 4.5 — Admin UI for episodes and polls

**Files to create:**

| Path | Purpose |
|---|---|
| `src/app/admin/episodes/page.tsx` | List all episodes with status badges |
| `src/app/admin/episodes/new/page.tsx` | Create episode form (title, episode number) |
| `src/app/admin/episodes/new/actions.ts` | Server action: insert episode + audit log |
| `src/app/admin/episodes/[id]/page.tsx` | Episode detail — status controls, linked polls |
| `src/app/admin/episodes/[id]/actions.ts` | Server action: advance episode status |
| `src/app/admin/polls/new/page.tsx` | Create poll for an episode (type, open/close times, add options) |
| `src/app/admin/polls/new/actions.ts` | Server action: insert poll + options |
| `src/app/admin/polls/[id]/page.tsx` | Poll detail — live tally, close button |
| `src/app/admin/polls/[id]/actions.ts` | Server action: close poll, determine winner |

Each admin page:
- Uses `requireAdmin()` at the top for permission gating
- Logs state transitions via `logEvent()`
- Shows appropriate feedback on success/error

**Acceptance:** Admin can create an episode → create a poll for it → add options → see the poll live.

#### Task 4.6 — Public voting UI

**Files to create:**

| Path | Purpose |
|---|---|
| `src/app/vote/page.tsx` | List active (open) polls |
| `src/app/vote/[pollId]/page.tsx` | Vote on a specific poll |
| `src/app/vote/[pollId]/actions.ts` | Server action: calls `castVote()` |
| `src/app/vote/[pollId]/results/page.tsx` | Poll results (premium-gated) |

**Vote page behavior:**
- Show poll question and options
- User clicks an option → server action calls `castVote()`
- On success: show confirmation, disable voting buttons
- If already voted: show which option they voted for, disable buttons
- If poll closed: show "Poll closed" message + link to results

**Results page behavior:**
- Premium users: see full tally with weighted totals and vote counts
- Free users: see "UNLOCK" affordance with upgrade prompt
- Staff: always see results (implicit premium access per permission matrix §2.2)

**Acceptance:** A test user can visit `/vote`, see an open poll, cast a vote, and see their vote confirmed.

#### Task 4.7 — Write comprehensive tests

This is a critical path — TDD is mandatory per working agreement §1.2.

**Tests to write:**

| File | What it tests | Type |
|---|---|---|
| `src/__tests__/lib/voting.test.ts` | `computeVotingPower` bracket boundaries | Unit |
| `src/__tests__/lib/voting.integration.test.ts` | `castVote` — happy path, super-admin block, duplicate vote, closed poll | Integration |
| `src/__tests__/lib/points.test.ts` | `awardPoint` — first award, duplicate (rate-limited) | Integration |
| `src/__tests__/voting/tally.test.ts` | `tallyPoll` — weighted totals, tiebreak by createdAt | Integration |
| `tests/e2e/voting.spec.ts` | Full flow: admin creates poll → user votes → admin closes → results shown | E2E |

**Target: ≥90% branch coverage on `src/lib/voting.ts` and `src/lib/points.ts`.**

### 6.5 ADRs to write

- **ADR-0030 — Mongo proposal schema.** Document the schema shape, why Mongo (document-shaped, no FK needed until publication), and the publication flow (Mongo draft → Postgres paper/challenge row).
- **ADR-0030 — Episode state machine enforced in application code.** The `episodes.status` enum constrains valid states; the application code enforces valid transitions. No DB-level trigger. Reason: simpler to test and debug.
- **ADR-0031 — Rate limiting via unique constraint on point_awards.** `ON CONFLICT DO NOTHING` handles duplicates; no Redis/Upstash needed for v1's small action catalog.
- **ADR-0032 — One vote per poll enforced at application level.** The DB has a unique constraint per (user, poll_option), but the "one vote per poll across all options" check is done in application code because `votes` doesn't have a direct `poll_id` column. Document why this is acceptable (the join check is fast and well-tested).

### 6.6 Definition of done for Phase 4

- [ ] All 6 new Drizzle schemas created and migrated to Neon.
- [ ] MongoDB client and proposal schema created.
- [ ] `computeVotingPower` unit-tested at every bracket boundary.
- [ ] `castVote` integration-tested: happy path, super-admin block (403), duplicate vote (409), closed poll (400).
- [ ] `awardPoint` integration-tested: first award (true), duplicate (false), user's `contribution_points` incremented.
- [ ] `tallyPoll` integration-tested: weighted totals correct, tiebreak by `createdAt`.
- [ ] Admin can create episodes, create polls, add options, close polls.
- [ ] Public users can vote on open polls.
- [ ] Premium users can see results; free users see "UNLOCK."
- [ ] Dean cannot vote (403).
- [ ] End-to-end: create poll → vote → close → tally → point awarded.
- [ ] Test coverage ≥90% on `src/lib/voting.ts` and `src/lib/points.ts`.
- [ ] ADRs 0029–0032 written.

---

## 7. Phase 5 — Architect's Vault + CMS content

### 7.1 Objective

Implement the premium-tier content system. The Architect's Vault is the real product of the paid tier (per show-premise.md § Artifacts). Content lives in Mongo.

### 7.2 Prerequisites

- Phase 4 complete (we need episodes to attach Vault entries to).
- Phase 3 complete (we need staff to author the content via CMS).

### 7.3 Design decisions (to be resolved early in this phase; ask user)

- Rich content format: Markdown + MDX? WYSIWYG? Plain Markdown?
- File attachments (ICC profiles, etc.): stored in S3-compatible storage; DB just holds URLs.

### 7.4 Scope

- CMS UI: create/edit Vault entries (linked to a Blueprint or Episode)
- Public view: indexed list, individual entry view (gated by `subscription_tier === 'premium'`)
- "UNLOCK" affordance for free users
- Blueprint library view (Stamped prints + their Vault entry)
- The Locker view (ripped prints / demolitions)

---

## 8. Phase 6 — Panel flags + Planning Committee drafting surface

### 8.1 Objective

Implement the two orthogonal flags (`is_bar_member`, `is_planning_committee`) and the committee drafting surface where members author candidate papers and challenges.

### 8.2 Scope (per roles-and-ranks.md §3 + §4)

- Admin UI: grant/revoke `is_bar_member` (with odd-count warning on revocations)
- Admin UI: grant/revoke `is_planning_committee`
- Committee drafting surface: authenticated committee members can CRUD their drafts in Mongo
- Admin review queue (consumes Mongo proposals; publishes to Postgres via Phase 4's publishing mechanism)
- Public "The Panel" page: bios of B.A.R. members
- Public committee page: list of active committee members

---

## 9. Phase 7 — Premium subscription (Stripe)

### 9.1 Objective

Connect Stripe for premium subscription payments. Tier transitions (`free ↔ premium`) are now driven by Stripe webhooks in addition to manual admin changes.

### 9.2 Deferred — intentionally after Phases 2–6

Per the identity model (ADR-0006): "Payment is a later phase — after core site is rigorously tested." Phase 7 should not begin until Phases 2–6 are shipped and stable.

### 9.3 Scope

- Stripe product and price setup
- Checkout flow (Stripe Checkout hosted page for v1; custom UI can come later)
- Webhook handler for `customer.subscription.*` events
- Tier transitions → users.subscription_tier update + audit log
- Dunning: failed payments → grace period → demotion

---

## 10. Later (out of scope for shipping v1)

Things we have explicitly scoped out of v1 but will need to think about eventually:

- **Comments / UGC** — ADR-0004 bars this from v1.
- **Custom challenge submissions from non-committee users** — ADR-0020 bars this.
- **Save-or-Rip audience override** — ADR-0016 moves this off-platform.
- **B.A.R. verdict voting on the platform** — ADR-0016 keeps this off-platform.
- **Mobile apps** — responsive web only for v1.
- **Internationalization** — English only for v1.
- **Public API** — none for v1.
- **Notifications (push/email beyond invites)** — consider after v1 ship.

---

## 11. Cross-cutting concerns

### 11.1 Observability

Add before Phase 4 (voting is where silent bugs are most dangerous):

- Vercel's built-in logs + Analytics (free tier is fine)
- Pick one: Axiom, BetterStack, Sentry — for structured error + request logging
- Alert on any 5xx from `/api/*` routes
- Log every audit event with a request ID

### 11.2 Rate limiting

Add before Phase 4:

- Use Upstash Ratelimit (free tier) or Vercel's built-in rate limiting
- Per-IP limits on `/api/webhooks/*` (defense in depth; signature verification is primary)
- Per-user limits on vote casting (additional to the per-poll unique constraint)

### 11.3 Content Security Policy

Enable in Phase 2 or 3 via Clerk middleware's `contentSecurityPolicy` option (see Clerk `ClerkMiddlewareOptions` type). Configure for Clerk's CDN domains + our own.

### 11.4 Backups

Neon has point-in-time restore up to 7 days on the free tier. For production: upgrade to a paid Neon plan before Phase 7 ships, and configure automated logical dumps to object storage.

### 11.5 Secrets rotation

Any time a secret is exposed (pasted in chat, committed accidentally, etc.): rotate immediately. Rotate the Neon password, the Clerk secret key, and any Stripe keys on the schedule of your choosing (at minimum: yearly for production).

---

## 12. Handoff checklist (Opus → executing model)

This plan is designed to be followed by any capable model (Sonnet, Gemini Pro, etc.) without requiring architectural judgment. Every decision has been made. Every file path is specified. Every validation step is explicit.

### Before starting execution, the model must:

- [ ] Read `AGENTS.md` (the orientation file)
- [ ] Read all seven docs listed in §0 (show-premise, identity-model, roles-and-ranks, decision-log, glossary, testing-strategy, build-plan)
- [ ] Run `npm run build` to confirm a clean starting state
- [ ] Run `npm run test:unit` to confirm all 8 tests pass
- [ ] Confirm with the user where in the plan to start (Phase 1 is the expected entry point)

### Exact prompt to paste when switching models:

> Read `AGENTS.md`, all 7 docs in `/docs/` (especially `docs/build-plan.md` — this is the master execution plan), and confirm the project builds and tests pass. Then start executing from Phase 1. Follow the build plan task by task, commit after each task with a descriptive message. If you encounter a decision not covered by the plan or the docs, stop and ask me — do not guess.

### Rules for the executing model:

1. **Follow the plan.** Do not improvise architecture. The plan has been validated by Opus against the actual codebase and all 7 foundation docs.
2. **One task at a time.** Complete a task, verify its acceptance criteria, commit, then move to the next.
3. **Read Next.js 16 docs before writing Next.js code.** The docs live in `node_modules/next/dist/docs/01-app/`. Training data is likely wrong.
4. **Write ADRs as specified.** The plan tells you when and what to write. Follow the template at the bottom of `docs/decision-log.md`.
5. **TDD for critical paths.** Write the test first; see it fail; then write the implementation. This is non-negotiable for voting, points, and permissions.
6. **When uncertain, ask.** One question now saves five bugs later.

### If any `npm` command fails on the clean starting state:

**Stop and ask the user before proceeding.** A broken starting state means something changed after this plan was written. Do not attempt to "fix" it without understanding what happened.

---

*Last updated 2026-04-24. Update this plan at the end of every phase to reflect actual decisions made. Supersede sections with new ADRs where appropriate.*
