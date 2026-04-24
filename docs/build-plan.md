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

- **Never** commit with `--no-verify`.
- **Never** amend a committed commit unless explicitly asked.
- Commit messages: one short sentence, present tense, explaining *why*.
- If a pre-commit hook fails, **fix the underlying issue**. Do not skip.
- Co-author line on every commit per the project convention.

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
3. User is redirected to `/onboarding` → fills in `display_name`, `country_code`, `city_id`, `timezone`.
4. Server Action persists these and marks the record complete.
5. Proxy gate: authenticated users with an incomplete profile are redirected to `/onboarding` on every route except `/onboarding` itself, `/sign-out`, and the webhook endpoint.

### 4.2 Prerequisites

- Phase 1 complete.
- User has a working Clerk account with dashboard access.

### 4.3 Design decisions (fixed — do not reopen)

- **Sign-in / sign-up UI:** use Clerk's hosted `<SignIn />` and `<SignUp />` components. Do not build custom forms for auth.
- **Onboarding UI:** custom form built by us (React Hook Form + Zod for validation).
- **Form fields at onboarding** (all required):
  - Display name (text; unique; 3–30 chars; alphanumeric + underscore + hyphen + space)
  - Country (searchable select from ISO 3166-1 alpha-2 list)
  - City (searchable select filtered by country; pulls from the `cities` table)
  - Timezone (searchable select from IANA timezone list, with a suggested default based on the user's browser locale)
- **Data-collection notice on onboarding form:** mandatory per identity-model.md §4.0. Display the exact copy from that section near the country/city fields.
- **What if the user's city isn't listed?** v1: a small "my city isn't listed" link that opens a mailto or feedback form. Do not allow free-text cities.
- **Cities seed:** start with ~300 cities — the largest cities in countries where the audience is likely to live (US, Canada, UK, Australia, New Zealand, Germany, France, Japan, rest: capital cities only). Source: [simplemaps.com world cities basic free](https://simplemaps.com/data/world-cities) (license allows free use with attribution). Seed script runs once via `npm run db:seed`.
- **Timezone default:** populate from `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client. User can override.
- **Profile completeness check:** a user row is "complete" when all four onboarding fields are non-null. This is the check the proxy uses.

### 4.4 File inventory

#### Create

| Path | Purpose |
|---|---|
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Hosts Clerk `<SignIn />` |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Hosts Clerk `<SignUp />` |
| `src/app/onboarding/page.tsx` | Onboarding form (client component using server action) |
| `src/app/onboarding/actions.ts` | Server action that validates + writes the onboarding data |
| `src/app/onboarding/form.tsx` | Client Component containing the form (separates client concerns) |
| `src/lib/countries.ts` | Static list of ISO country codes + display names |
| `src/lib/timezones.ts` | Static list of IANA timezones |
| `src/lib/onboarding.ts` | Helper: `isProfileComplete(user: User): boolean` |
| `scripts/seed-cities.ts` | One-time cities seed script |
| `src/__tests__/onboarding/actions.test.ts` | Unit test for the server action's validation |
| `tests/e2e/sign-up.spec.ts` | Playwright E2E: sign up → onboarding → app |

#### Modify

| Path | Change |
|---|---|
| `src/proxy.ts` | Add onboarding-completion check → redirect incomplete users to `/onboarding` |
| `src/app/page.tsx` | Temporary home page that shows sign-in state (for Phase 2 validation — will be replaced in later phases) |
| `package.json` | Add `db:seed` script |
| `.env.example` | Document `SUPER_ADMIN_EMAIL` env var (used in Phase 3 — add now so the pattern is set) |

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

#### Task 2.2 — Seed the cities table

1. Download the world-cities CSV from simplemaps.com (free/basic tier). Filter to ~300 cities as described in §4.3.
2. Place the curated CSV at `scripts/data/cities.csv`. Columns: `name,country_code`.
3. Create `scripts/seed-cities.ts`:
   - Loads env via `@next/env`
   - Reads the CSV
   - Inserts rows via Drizzle using `onConflictDoNothing()` on `name + country_code` (add a unique composite index in a migration if needed — check first, probably fine without since we only seed once)
4. Add to `package.json`: `"db:seed": "tsx scripts/seed-cities.ts"`
5. Install tsx as dev dep if not present: `npm install -D tsx`.
6. Run `npm run db:seed` — verify `SELECT COUNT(*) FROM cities;` returns ~300.

**Acceptance:** cities table populated; running the script a second time is idempotent.

#### Task 2.3 — Build the onboarding form

1. `src/lib/countries.ts`: export `countries: { code: string; name: string }[]` — use the ISO 3166-1 alpha-2 list (can hardcode or use a small npm package like `i18n-iso-countries`; hardcoding is fine for v1).
2. `src/lib/timezones.ts`: export `timezones: string[]` — use `Intl.supportedValuesOf('timeZone')` at runtime, but precompute at build time for SSR. Simplest: hardcode a list of common IANA timezones (~60 entries for major cities). Can use `Intl.supportedValuesOf('timeZone')` if it simplifies.
3. `src/app/onboarding/form.tsx` — Client Component:
   - React Hook Form + Zod resolver
   - Fields: `displayName`, `countryCode`, `cityId`, `timezone`
   - Country select: filters cities dropdown
   - City select: populated from an API route `/api/cities?country=XX` OR passed in as props after Server Component fetches them (prefer the latter — less client state)
   - Timezone select: default from `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Submit: calls server action from `actions.ts`
   - Displays the identity-model.md §4.0 data-collection notice near country/city fields
4. `src/app/onboarding/actions.ts` — Server Action `completeOnboarding`:
   - Zod validate input
   - Get `clerk_user_id` from Clerk's `auth()`
   - Update the `users` row with the four fields
   - Insert an `audit_events` row with `event_type: 'profile.onboarded'`
   - Redirect to `/` on success
5. `src/app/onboarding/page.tsx` — Server Component:
   - Auth check via `auth()` — redirect to `/sign-in` if not authenticated
   - Fetch user row; if already complete, redirect to `/`
   - Fetch cities (all, filterable on client) — pass as props to `<OnboardingForm />`
   - Render form

**Acceptance:** signing up via Clerk redirects to `/onboarding`; submitting the form populates the four fields in Neon and redirects to `/`.

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
- **E2E** — `tests/e2e/sign-up.spec.ts`: Playwright test that signs up a fresh user, fills out onboarding, lands on home page. Use a throwaway Clerk test user.

### 4.7 ADRs to write during this phase

- **ADR-0024 — Onboarding form uses React Hook Form + Zod.** Record the choice vs. alternatives (uncontrolled HTML form + Server Action only, Formik, etc.). Reason: RHF is well-documented, Zod integrates with our validation patterns, and the form has enough client-side logic (dependent city dropdown) to warrant it.
- **ADR-0025 — City list is curated (~300 cities), not user-submittable.** Confirms ADR-0013's "curated city list, not free text." Adds the seed source and update process.

### 4.8 Definition of done for Phase 2

- [ ] `/sign-in` and `/sign-up` render Clerk's hosted UI.
- [ ] Cities table seeded with ~300 rows.
- [ ] `/onboarding` collects the four fields with the data-collection notice visible.
- [ ] Server action persists the fields; `audit_events` row written for each completion.
- [ ] Proxy redirects incomplete profiles to `/onboarding`.
- [ ] Unit tests passing. E2E sign-up test passing against the deployed URL.
- [ ] A test user can complete the flow: sign up → onboard → access home.

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

Detailed tasks follow the same shape as Phase 2 (numbered, with acceptance criteria). The key tasks are:

1. **Task 3.1 — Add subdomain routing.** Read Next.js docs on [multi-zones](https://nextjs.org/docs/app/guides/multi-zones) or implement a host-header check in proxy. Ask the user which approach they prefer before starting.
2. **Task 3.2 — Add `SUPER_ADMIN_EMAIL` env var + bootstrap logic.** Update webhook, add ADR-0026 to document the bootstrap mechanism.
3. **Task 3.3 — Build auth helpers.** `requireRole`, `requireStaff`, `requireSuperAdmin`.
4. **Task 3.4 — Build audit helper.** `logEvent(...)` wrapper. Write an integration test that actually hits Neon.
5. **Task 3.5 — Build the admin dashboard shell.** Empty pages with role-conditional content.
6. **Task 3.6 — Build the invitation flow.** Staff invites → Clerk API → webhook handler → `/onboarding` with staff fields section.

### 5.6 ADRs to write

- **ADR-0026 — Super-admin bootstrap via SUPER_ADMIN_EMAIL env var.** Fixed at system init; intentional single-use mechanism.
- **ADR-0027 — Subdomain routing approach.** Whichever approach is chosen after Task 3.1.
- **ADR-0028 — Staff invitations use Clerk's invitation API with metadata.** Document why (no parallel invitation system; staff fields captured during normal onboarding with a staff section).

### 5.7 Definition of done for Phase 3

- [ ] `admin.<domain>` serves the admin dashboard; non-staff get a 403.
- [ ] Dean is super-admin and can sign in at `admin.<domain>`.
- [ ] Dean can invite an admin; the invite email arrives; the invitee can accept and complete onboarding with staff fields.
- [ ] Admins can invite content creators.
- [ ] `audit_events` has rows for every role transition and invitation.
- [ ] Unit + integration tests passing for `requireRole` and `logEvent`.

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

### 6.4 Files to create (outline; full list in this phase's expanded plan)

- `src/db/schema/episodes.ts`, `papers.ts`, `challenges.ts`, `polls.ts`, `votes.ts`, `point_awards.ts`
- `src/db/mongo.ts` — MongoDB client (if not already created)
- `src/db/mongo/proposals.ts` — proposal collection schema (Zod) + repository functions
- `src/lib/voting.ts` — `castVote`, `computeVotingPower`, `tallyPoll`, `closePoll`
- `src/lib/points.ts` — `awardPoint` (transactional: insert point_award + increment users.contribution_points)
- Admin UI for creating episodes, publishing proposals, closing polls
- Public UI for the active poll (list options, vote button, show result when poll closed)
- Vast test suite — this is a critical path, so TDD it rigorously

### 6.5 ADRs to write

Expected (specifics will emerge during implementation):

- ADR for the Mongo proposal schema (we have not yet pinned the Mongo schema; that happens here)
- ADR for episode lifecycle enforcement (state machine in DB vs. in code)
- ADR for the rate-limit uniqueness mechanism

### 6.6 Definition of done for Phase 4

- [ ] End-to-end: Dean publishes a paper selection poll → a test user votes → tally reflects the vote with correct weight → user earns one contribution point.
- [ ] Dean cannot cast a vote (attempt returns 403).
- [ ] Duplicate vote attempts return 409 (or idempotent — pick one, ADR it).
- [ ] Polls close on their end time; results are viewable by premium users; free users see "UNLOCK" affordance.
- [ ] Test coverage ≥90% on `src/lib/voting.ts` and `src/lib/points.ts`.

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

## 12. Handoff checklist (Opus → Sonnet)

Before Sonnet begins executing this plan, it must:

- [ ] Read all seven docs listed in §0.
- [ ] Read this full plan.
- [ ] Run `npm run build` to confirm a clean starting state.
- [ ] Run `npm run test:unit` to confirm all tests pass.
- [ ] Confirm with the user where in the plan to start (Phase 1 is the expected entry point).

**If any `npm` command fails on the clean starting state, stop and ask the user before proceeding.** A broken starting state means the plan was captured against a different state than exists — investigate before "fixing."

---

*Last updated 2026-04-24. Update this plan at the end of every phase to reflect actual decisions made. Supersede sections with new ADRs where appropriate.*
