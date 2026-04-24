<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent orientation

This file exists so any AI agent (or new collaborator) can get up to speed in under a minute. It is intentionally short. Depth lives in `/docs`.

## Product in one sentence

Companion platform for the YouTube series **"Ripped or Stamped"** — viewers sign in, vote on which paper and challenge each episode will tackle, watch the Board of Aesthetic Review produce a binary STAMPED-or-RIPPED verdict, and premium members unlock the Architect's Vault (deep per-paper technical reports).

## Two surfaces, one backend

- **Public site** on the main domain — viewers, voters, premium members.
- **Admin site** on `admin.<domain>` — staff (super-admin, admin, content creators). Dashboard is the admin's home view and contains the CMS (votes, blog posts, challenge review queue).

## Identity rules (hard invariants)

- **Clerk for auth.** Our own `users` table in Postgres is keyed by `clerk_user_id`.
- **Privacy-minimized by default.** Standard user fields: email, display name, country, city, timezone. Nothing else unless the user opts into a public profile or makes a purchase.
- **Display name = voter handle** (same field). Email is never displayed publicly.
- **No private admin notes** on users. By design.
- **Two rank axes:** subscription tier (paid) × contribution level (earned). Both affect access and voting power.

## Database split

- **Postgres** — integrity-critical data: users, roles, permissions, subscription tiers, contribution levels, vote tallies, payments, anything with foreign keys.
- **MongoDB** — document-shaped content: CMS blog posts, challenge proposals (pre-approval), activity feed, media metadata.
- **Rule:** when specifying a new entity, state which DB it lives in and the one-line reason. Default to Postgres when integrity matters; Mongo otherwise.

## Required reading before changes

- `docs/show-premise.md` — what the show is and how it runs. The platform exists to serve this.
- `docs/identity-model.md` — who exists and what data they have.
- `docs/roles-and-ranks.md` — what they can do: permission matrix, point catalog, voting power formula, point guards.
- `docs/decision-log.md` — why we chose what we chose.
- `docs/testing-strategy.md` — what to test, when, and how.
- `docs/glossary.md` — canonical terms used in this project.

## Collaboration norms

- **Docs first, code second.** New features start with a spec in `/docs`, reviewed and merged, *then* implemented.
- **TDD for critical paths:** auth, permissions, voting, rank math, payments. Write the failing test first.
- **Typed env vars at boot.** Never `process.env.X` scattered through the code. Import from the central, Zod-validated `env` module.
- **Varied typography in user-facing prose.** Bullets, bold, italic floating callouts. No wall-of-text.
- **"Start right, not fast."** The aesthetic bar is "a senior dev should be jealous of the cleanliness."
