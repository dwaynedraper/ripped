# Testing Strategy

> *This is a **teaching manual** as much as it is a specification. If you've tried TDD before and it didn't stick, that's normal — TDD fails when people try to test the wrong things, or skip the "red" step. This document explains what to test, when to test it, and how to write the test that makes you confident.*

## Philosophy

We write tests for **three reasons**, in order of importance:

1. **To verify correctness of high-stakes logic.** Bugs in auth, permissions, and voting are expensive. Tests pay for themselves the first time they catch a regression.
2. **To design better code.** Writing a test first forces you to state the contract — "given X, return Y" — before you write the thing. That act alone produces simpler code.
3. **To protect refactoring.** Once a behavior is covered, you can rewrite the underlying code without fear. Tests make the codebase *malleable*.

We **do not** write tests:

- To hit an arbitrary coverage number.
- To duplicate what TypeScript already catches at compile time.
- To test trivial glue (a one-line function with no branches).
- To test pixel-perfect UI (that's what Playwright + your eyes are for).

---

## What TDD actually is

**Test-Driven Development** is a three-step loop:

1. **Red.** Write a test for behavior that doesn't exist yet. Run it. It **must** fail. *(If it passes, you wrote the test wrong — or the behavior already exists. Stop and investigate.)*
2. **Green.** Write the simplest, ugliest possible code that makes the test pass. Do not refactor yet. Do not add extra features.
3. **Refactor.** Now clean up. Your test is the safety net: if any change breaks the behavior, the test will catch it.

> *Why "red" matters: a test that's never been red is a test you can't trust. You haven't verified that it actually detects the failure it claims to detect. Always see it fail once.*

### Example — the permission check

Here's what a TDD session looks like for a tiny piece of permission logic.

**Red:**

```ts
// tests/permissions.test.ts
import { describe, it, expect } from "vitest";
import { canApproveChallenge } from "@/permissions";

describe("canApproveChallenge", () => {
  it("allows admins", () => {
    expect(canApproveChallenge({ role: "admin" })).toBe(true);
  });
  it("rejects standard users", () => {
    expect(canApproveChallenge({ role: "standard" })).toBe(false);
  });
  it("rejects content creators", () => {
    expect(canApproveChallenge({ role: "content_creator" })).toBe(false);
  });
});
```

Running this **fails** because `canApproveChallenge` doesn't exist yet. Good. That's the point.

**Green:**

```ts
// src/permissions.ts
export function canApproveChallenge(user: { role: string }) {
  return user.role === "admin" || user.role === "super_admin";
}
```

Tests pass. Notice the `super_admin` case wasn't in the test yet — we can add that test next and iterate.

**Refactor:** maybe we extract a `STAFF_ROLES_WITH_REVIEW = new Set([...])` constant for readability. The test doesn't change; the behavior doesn't change; only the structure improves.

---

## The four tiers

| Tier | Tool | What it tests | Speed | When it runs |
|---|---|---|---|---|
| **Unit** | Vitest | Pure functions — permissions, rank math, voting logic, validators | <100ms each | Watch mode while coding; pre-commit |
| **Integration** | Vitest + real test DB | API routes, DB queries, webhook handlers | seconds | Pre-commit; every CI push |
| **E2E** | Playwright | Whole user flows through a real browser | minutes | Pre-deploy; nightly |
| **Security** | Vitest (targeted) | Permission boundaries, auth edge cases, input sanitization | seconds | Pre-commit; nightly |

### Unit tests — the bread and butter

- **Goal:** verify a pure function's contract.
- **Rule:** no network, no database, no filesystem. If your unit test needs any of those, it's an integration test.
- **Speed goal:** entire suite runs in under 2 seconds.
- **When you run them:** constantly. `npm run test:watch` in a terminal while coding.

### Integration tests — the confidence builders

- **Goal:** verify that multiple pieces (API + DB + auth) work together.
- **Rule:** use a real Postgres and Mongo, not mocks. Spin up an isolated test DB per test run.
- **Speed goal:** entire suite runs in under 60 seconds.
- **When you run them:** pre-commit, and on every CI push. You want to know *before* merging that the new code didn't break the DB schema.

### E2E tests — the reality checks

- **Goal:** a real browser clicking real buttons on real pages, against a real backend.
- **Rule:** don't try to cover everything. Cover the **golden paths**: sign-up → verify email → sign-in → cast vote → see vote recorded. If those work, most things work.
- **Speed goal:** under 5 minutes for the full suite.
- **When you run them:** before any deploy, and nightly on `main` to catch external-service changes.

### Security tests — the non-negotiables

- **Goal:** explicitly verify that unauthorized requests are rejected. For every permission rule, write a test that a user *without* permission is *denied*.
- **Rule:** test the **negative** case. "Admin can do X" is good; "standard user **cannot** do X" is the one that prevents breaches.
- **When you run them:** pre-commit + nightly.

---

## Critical paths we TDD (non-negotiable)

Anything on this list is written test-first.

- **Permission checks** — every `can*` function gets red-green-refactor before it exists.
- **Vote casting** — the code path from user click to DB row gets integration-tested end-to-end.
- **Vote power calculation** — pure function; unit test every tier × level combination.
- **Contribution level accrual** — the function that decides "does this action level up this user?"
- **Rank transitions** — promote, demote, ban. Every transition has a test.
- **Subscription tier gating** — "free user sees UNLOCK, premium sees content" as a unit of permission logic.
- **Payment flows** (when we build them).
- **Clerk webhook handlers** — every event type Clerk sends us has a test proving the DB ends in the right state.

## Things we test, but not strictly TDD

- Next.js server components and route handlers — integration tests, written alongside or after.
- Forms — a minimal "submit happy path" integration test each.
- Third-party integrations — one integration test per external call.

## Things we don't write automated tests for

- Page layouts, spacing, typography — manual + Playwright screenshot diffs if needed later.
- Loading states and animations — manual verification.
- Things where the contract is "display this string" with no logic.

---

## Tooling

### Vitest — the unit & integration runner

- Chosen because: fast, first-class TypeScript support, familiar Jest-compatible API, pairs beautifully with Vite/Next.
- Runs in watch mode (`vitest`) and one-shot mode (`vitest run`).
- Use `vitest --ui` for a visual test dashboard when debugging.

### Playwright — the E2E runner

- Chosen because: real browsers (Chromium, Firefox, WebKit), great debugging tools, handles auth flows well.
- Slower than unit tests — run on a schedule, not on every save.

### Test database strategy

- **Test Postgres:** Docker container or a local test DB, migrations applied before each test run, reset between test runs.
- **Test Mongo:** same approach — separate DB, wiped between runs.
- Never run tests against a production-adjacent database.

---

## Commands (to be wired up in Stage 0)

```bash
# Watch mode — keep this running while coding
npm run test:watch

# Run all unit tests once
npm run test:unit

# Run integration tests (requires test DBs running)
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run everything (CI uses this)
npm run test:ci

# Run tests that match a pattern
npm run test:watch -- permissions
```

---

## Pre-commit hook

A git pre-commit hook (via **Husky**) will run:

1. Type-check (`tsc --noEmit`).
2. Lint (`eslint`).
3. Unit tests (`test:unit`).
4. Security tests (`test:security`).

Integration and E2E are **not** in the pre-commit hook — too slow. Those run in CI.

> *Teaching beat on hooks: the line between "pre-commit" and "pre-push" matters. Pre-commit runs before every commit and must be fast (<10s), or you'll disable it. Pre-push runs once per push and can be slower. Don't shove everything into pre-commit "to be safe" — you'll just train yourself to `--no-verify`.*

---

## Cadence summary — what runs when

| Trigger | What runs |
|---|---|
| File save (watch mode) | Unit tests touching changed files |
| `git commit` | Type-check, lint, unit tests, security tests |
| `git push` / CI | All of the above + integration tests |
| Deploy trigger | All of the above + E2E tests |
| Nightly cron | E2E + security (against staging) |

## Your TDD starter routine

When you sit down to implement a new behavior, do this:

1. **Open two terminals.** Left: `npm run test:watch`. Right: editor.
2. **Write the test first.** It fails. Red.
3. **Write the simplest code to pass.** It passes. Green.
4. **Look at the code with fresh eyes.** Clean it up. Tests still pass. Refactor done.
5. **Commit.** Your pre-commit hook runs type-check + unit + security. If they pass, you're good.

Do this ten times in a row on one Saturday morning and TDD stops feeling weird. That's the secret — it's a habit, not a framework.
