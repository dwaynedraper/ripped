# Decision Log

> *An **ADR** (Architecture Decision Record) is a short, append-only note: what did we decide, when, and why. The point is not to re-argue old choices — it's to give future-us (or a new collaborator) the reasoning behind the state of the world so they can change it responsibly.*
>
> *Each decision is numbered, dated, and has a status. **Never edit a decision in place** — if we change our minds, add a new entry that supersedes the old one, and mark the old one `superseded`. This is how we preserve the history of the project's thinking.*

---

## How to read an ADR

Each entry has five fields:

- **Status** — `proposed`, `accepted`, `superseded`, or `deprecated`.
- **Context** — what situation created the need for a decision.
- **Decision** — what we chose.
- **Consequences** — what changed as a result, both good and bad. (The honest listing of the *bad* is the hallmark of a real ADR. Every decision has costs; pretending otherwise is how you end up surprised.)
- **Alternatives considered** — what else was on the table and why we didn't pick it.

---

## ADR-0001 — Use Clerk as the authentication provider

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** We need authentication (sign-up, sign-in, session management, MFA, password reset, OAuth). Options considered: Clerk, NextAuth/Auth.js, Supabase Auth, Better-Auth, DIY.

**Decision.** Use Clerk as the auth provider. Mirror Clerk's user records into our own Postgres `users` table keyed by `clerk_user_id`, and treat Clerk as replaceable infrastructure.

**Consequences.**
- (+) Best-in-class DX and drop-in UI for a solo developer rebuilding practice.
- (+) Organizations and role features out of the box.
- (+) Excellent Next.js integration.
- (−) Paid beyond the free tier — ongoing cost as user count grows.
- (−) Vendor-owned identity; if Clerk raises prices or changes terms, migration of *identities* is painful. Mitigated by our mirror table: the *data we care about* lives in our Postgres, not Clerk.

**Alternatives considered.**
- **NextAuth/Auth.js** — free and data-resident, but we'd build significant UI and session plumbing ourselves.
- **Supabase Auth** — bundles with Postgres, but couples us to Supabase as a DB host, which we don't want.
- **Better-Auth** — promising but less battle-tested.
- **DIY** — a time sink with serious security risk. Not on the table.

---

## ADR-0002 — Dual data store: Postgres + MongoDB with an explicit responsibility rule

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** Dean has an explicit preference for MongoDB where it can reasonably apply, but also an explicit preference for security and speed over any aesthetic choice. A single-store architecture would be simpler, but would either miss the Mongo preference or risk using Mongo for data where integrity matters.

**Decision.** Use **both** Postgres and MongoDB, with a clear rule of responsibility:

- **Postgres is the system of record for anything integrity-critical**: auth-mirror `users`, roles, subscription tiers, contribution levels, permissions, vote tallies, payment records, and anything with foreign keys between entities we care about.
- **MongoDB holds document-shaped content**: CMS blog posts, challenge proposals (pre-approval), activity feed items, media metadata.

When designing a new entity, the spec must name which database it lives in and the one-line reason.

**Consequences.**
- (+) Honors Dean's explicit preference while keeping integrity-critical data on the right engine.
- (+) Cleaner modeling for flexible content (blog posts, proposals) than forcing them into a rigid relational schema.
- (−) Two migration systems, two backup strategies, two connection pools. Operational overhead for a single operator.
- (−) Risk of consistency drift between stores for data that *should* agree (mitigated by keeping cross-store references minimal and always pointing from Mongo → Postgres IDs, never the reverse).

**Alternatives considered.**
- **Postgres only** — simpler ops; ignores Dean's preference.
- **Mongo only** — would put auth/roles/payment data in a non-transactional store; unacceptable for security invariants.

---

## ADR-0003 — Two surfaces (public + admin) on one backend, split by subdomain

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** Staff (admins, content creators) need a different experience than viewers. The question: one app with role-based routing, or two apps?

**Decision.** One Next.js application with two routing contexts split by subdomain:
- `<domain>` — public site.
- `admin.<domain>` — admin site, gated at the middleware layer by staff roles.

Both surfaces share one backend, one database layer, one `users` table. The surface a request is served from is determined by hostname; access is enforced by role.

**Consequences.**
- (+) One deployment, one codebase, one auth system.
- (+) Staff use the same account as any other user, reducing account-confusion.
- (+) Clean URL semantics — `admin.` is recognizable as a separate space.
- (−) Must carefully prevent leakage of admin UI or data onto the public surface (middleware discipline).
- (−) Local development needs a small amount of hostname configuration (e.g., `admin.localhost` or a local DNS alias).

**Alternatives considered.**
- **Two separate apps** — duplicates everything; migration between them is expensive.
- **Role-based routes in one surface (`/admin/*`)** — works but lacks the clean separation; easier to accidentally expose admin routes publicly.

---

## ADR-0004 — No free-text user-generated content in v1

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** Community features (comments, DMs, posts) carry a large, permanent moderation cost. The v1 community experience is voting and viewing — the audience for a YouTube series, not a forum.

**Decision.** v1 ships with **no public free-text input** from standard users. The only structured inputs are:
- Votes (multiple-choice, no moderation risk).
- Display name (profanity-filtered at save time).
- Custom challenge submissions from high-contribution users, which go through an **admin review queue** before becoming live challenges.

Comments, replies, DMs, and free-form posts are explicitly out of scope for v1 and will require a separate ADR to introduce later.

**Consequences.**
- (+) Zero ongoing moderation queue for standard user content.
- (+) Clear, cheap-to-defend product surface.
- (−) Community feel is thinner — limited to "watching and voting together."
- (−) Custom challenges require admin attention on an ongoing basis (acceptable because volume will be low and the gate is high).

**Alternatives considered.**
- **Comments with post-hoc reporting** — requires building reporting UI + admin queue anyway, and invites abuse.
- **Comments with pre-moderation on everything** — unsustainable workload for one admin.

---

## ADR-0005 — Two orthogonal axes of rank: subscription tier × contribution level

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** Ranks in the product have to serve two different jobs: gating paid content (business model) and rewarding participation (community health). Collapsing them into one axis (e.g., "level 5 = premium") would mean paying users can skip earning their way in, or earning users are limited without paying.

**Decision.** Two independent axes, stored as separate fields on the user:

- **`subscription_tier`** — paid axis: `free`, `premium`. Changed via payment (later phase) or manual admin action. Gates paid content.
- **`contribution_level`** — earned axis: an integer level accrued through participation (votes cast, approved custom challenges, etc.). Cannot be purchased. Affects voting power and unlocks like custom challenge submission.

Voting power is computed as a function of *both* axes.

**Consequences.**
- (+) Each axis serves its intended job cleanly.
- (+) We can tune the gameplay (contribution) and the business (tiers) independently.
- (−) More fields, more permission-check logic.
- (−) UI has to surface *two* progressions to users without overwhelming them.

**Alternatives considered.**
- **Single axis** — simpler but collapses two unrelated ideas; leads to "I paid, why is my vote still small?" confusion or "I earned, why can't I see the results?" frustration.

---

## ADR-0006 — Privacy-minimized user profile by default

- **Date:** 2026-04-22
- **Status:** accepted

**Context.** The platform wants to know *where* its audience is (for the show's strategy) without forcing anyone to disclose identifying details. Dean is explicit: "general information only" unless a user opts into a premium account or makes a purchase.

**Decision.** The default standard user profile contains only:
- Email (login; never displayed).
- Display name (public; also serves as voter handle).
- Country (ISO code) and city (from a curated list).
- Timezone.

Real name, phone number, address, and other identifying data are collected *only* when either:
1. The user explicitly opts into a "public profile" (real-name fields remain optional even then), or
2. The user makes a purchase (payment info is collected solely for that purchase and is not used elsewhere).

No private admin notes are stored about users.

**Consequences.**
- (+) Minimized data-breach surface.
- (+) Low compliance burden (even before we reach any jurisdiction that cares).
- (+) User trust — the platform feels respectful.
- (−) Certain analytics (e.g., user-level cohort analysis) require opting-in signals we won't have. We take that trade.

**Alternatives considered.**
- **Collect it all** — easy, disrespectful, liability.
- **Collect it all but lock it down with ACLs** — still creates the breach risk; the right data-protection strategy is to not have the data.

---

## ADR-0007 — Typed env vars validated at boot (Zod)

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Using `process.env.X` directly across the codebase produces `string | undefined` types, silent typos, and production-time failures for missing or malformed values.

**Decision.** Central `src/env.ts` (or equivalent) defines a Zod schema for all required environment variables and parses `process.env` at module load. All other code imports the validated, typed `env` object — never `process.env` directly.

**Consequences.**
- (+) Missing or malformed env vars fail the app at boot with a clear message.
- (+) Fully typed; no `| undefined` and no typos.
- (+) The schema file *is* the documentation of "what does this app need to run?".
- (−) One extra dependency (Zod) — already justified for broader validation use.

**Alternatives considered.**
- **t3-env** — a popular wrapper around Zod for env vars. We can adopt this later as a thin convenience; the underlying principle is identical.

---

## ADR-0008 — Display names must be globally unique

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** The display name is the user's public identity and their voter handle. If two users can have the same display name, vote lists become ambiguous ("Anna voted Ripped" — which Anna?) and impersonation becomes trivial.

**Decision.** Display names are unique across the entire `users` table, enforced case-insensitively at the database level via a `citext` column and unique index.

**Consequences.**
- (+) No ambiguity in vote lists, panelist listings, or comment attribution.
- (+) Impersonation requires account takeover, not name collision.
- (−) A user who wants a common name (e.g., "Anna") may find it taken and have to pick a variation.
- (−) On deletion, the name is released back into the pool — a future user could claim it. Acceptable: deleted users show as "user deleted" in history, so attribution is not confused.

**Alternatives considered.**
- **Unique `@handle` + free-form display name** — adds UI complexity (two names per user). Not worth it at this scale.

---

## ADR-0009 — Staff vote normally; the Architect (super-admin) cannot vote

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Staff (content creators and admins) are also fans of the show. Excluding their votes would be artificial given the team is small (2–3 people) and the audience is the far larger force. But the Architect is the one being judged; his voting on his own show is a structural conflict.

**Decision.**
- **Staff (content creator, admin) vote like any other user.** Their votes count normally and their voting power is computed the same way as any other user's.
- **The super-admin (Dean, the Architect) cannot vote** on any show poll — paper selection, challenge selection, save/rip, B.A.R. verdict. Enforced in code at the voting layer.

**Consequences.**
- (+) The Architect is genuinely at the mercy of the public and the B.A.R., which is what the show's premise requires.
- (+) Staff participation feels natural; no artificial separation of "operators" from "audience."
- (−) A future super-admin transition (if it ever happens) needs a conscious decision about whether they inherit the non-voting rule. We'll cross that bridge if it arises.

**Alternatives considered.**
- **Staff cannot vote** — too restrictive for a small team.
- **Staff votes shown separately** — unnecessary overhead for so few voters.

---

## ADR-0010 — Admin removal is a full step back to standard user, with attribution retained

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** What happens when an admin is removed? Options: delete the account, demote to content creator, revert to standard user.

**Decision.** Admin removal reverts the user to a standard user. Their staff fields (`legal_name`, `contact_email`, etc.) are **retained** so any CMS content they authored remains attributed to them. No intermediate "demote to content creator" step. The user may continue to sign in as a standard user; they may separately choose to delete their account.

**Consequences.**
- (+) Past contributions remain attributed — aligned with the show's "no coverups, mistakes make it" ethos.
- (+) No special "former staff" state to model — they're just a standard user with a retained staff record marked `removed_at`.
- (−) A staff member's contact info lives in our DB after they've left. Acceptable — it's retained for attribution, not for contact.

**Alternatives considered.**
- **Delete the account** — rewrites history, contradicts show ethos.
- **Demote to content creator** — introduces an extra state with little practical use.

---

## ADR-0011 — Account deletion replaces the user's name with "user deleted" everywhere

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Account deletion must satisfy both the user's right to leave and the platform's integrity of historical votes and attributions.

**Decision.** On account deletion:
- Every public place the user's display name appeared — vote lists, panelist listings, comment attribution, blog author bylines, etc. — is replaced with the literal label **"user deleted."**
- The user's votes remain counted (they shaped the real outcome of real episodes) but are unlinked from them.
- All identifying fields in their record (`email`, `display_name`, `first_name`, `last_name`, staff contact fields, billing fields) are erased.
- The user's `id` and a `deleted_at` timestamp remain, so referential integrity is preserved.

**Consequences.**
- (+) Respects the user's right to leave.
- (+) Preserves the historical record of the show — the verdict was cast, it doesn't retroactively change.
- (−) "user deleted" is a blunt label; if many users delete, the vote list reads oddly. Acceptable.

**Alternatives considered.**
- **Retroactively remove the user's votes from tallies** — rewrites show history.
- **Keep the display name but flag the user as deleted** — leaks identifying info to people browsing the site.

---

## ADR-0012 — Public profile is a flag on the user record, not a separate identity shape

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** An earlier draft of `identity-model.md` treated "public profile user" as a distinct identity shape. On review it's really a *display toggle* on an existing user — no separate permission, no separate lifecycle.

**Decision.** Public profile is modeled as a boolean flag (`public_profile`) on the user record. Toggling it on shows the user's optional fields (real name, bio) on their profile page. Toggling it off hides them. The user is otherwise unchanged.

**Consequences.**
- (+) Simpler mental model: roles are about permissions; flags are about visibility.
- (+) No migration or state-transition logic needed for the toggle.
- (−) None identified.

**Alternatives considered.**
- **Treat "public profile" as a role** — adds a role dimension with no corresponding permission change. Noise, not signal.

---

## ADR-0013 — Country and city collected at sign-up, with an explanatory notice

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** The show's creators want geographic data on the audience. Collecting it at sign-up is operationally cleanest but can feel intrusive on an initial form, especially on a platform that loudly promises privacy-minimization.

**Decision.** Country (ISO code) and city (from a curated list) are required at sign-up. The form displays an inline notice in plain language explaining *why* we ask and what we don't collect. The notice is a documented platform commitment (see `identity-model.md` §4.0).

**Consequences.**
- (+) Complete geographic data on every user — trivial dashboards.
- (+) Trust signal: the platform says "we're asking for this *because*, and we're not asking for more."
- (−) A small number of users will still bounce off the question. Acceptable — it's a show for committed viewers, not anonymous passers-by.

**Alternatives considered.**
- **Free-text city** — messy, hard to aggregate.
- **Collect post-signup as an optional field** — incomplete data, samples self-select.

---

## ADR-0014 — Audit log as an append-only Postgres table

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Identity and role transitions (promotions, demotions, bans, invitations, flag grants) need an immutable record for investigation, compliance, and post-mortem. A fuzzy memory of "who banned whom" is not acceptable for integrity-critical state.

**Decision.**
- **Storage:** a single Postgres table, `audit_events`, keyed by UUID, append-only (no updates, no deletes from application code).
- **Schema:** `id`, `actor_user_id` (nullable for system events), `action` (string like `user.tier_promoted`), `target_type`, `target_id`, `metadata` (JSONB for per-action detail), `reason` (string, nullable), `created_at`.
- **What we log:** tier changes, role changes (invite, accept, remove), ban/unban, B.A.R. / Planning Committee flag grants and revocations, challenge approvals and rejections, account deletion requests, admin vote corrections (if ever needed).
- **What we don't log:** login events (Clerk owns those), standard votes (the votes table *is* the record), page views (that's analytics, not audit).
- **Retention:** forever by default. Storage is cheap; audit data is irreplaceable. If scale ever demands, we archive the oldest tier to cold storage rather than delete.
- **Access:** admin-readable via the admin dashboard; never exposed on the public site.
- **Writes:** every transition is written in the same Postgres transaction as the underlying state change, so the log cannot be "forgotten" on a happy-path bug.

**Consequences.**
- (+) Postgres transactional guarantees: if the state change commits, the log entry commits.
- (+) Queryable and joinable with the rest of the data for investigations.
- (+) Append-only semantics protect against tampering by application bugs.
- (−) Requires one more table and a disciplined write pattern at every mutation site. Mitigated by an audit helper utility that's easy to call.

**Alternatives considered.**
- **Mongo collection** — document shape is a fit, but loses transactional consistency with Postgres entities. Integrity beats preference here.
- **Application logs only** — not durable, not queryable, easy to lose on rotation.

---

## ADR-0015 — B.A.R. and Planning Committee are orthogonal flags, not staff roles

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** The show has two panel-style groups: the B.A.R. (judges the verdict) and the Planning Committee (drafts papers/challenges for audience vote). These groups overlap with the community — B.A.R. members are often guests or community members, not staff. Modeling them as staff roles would force us to collect contractor contact info from panelists we don't actually contract with.

**Decision.**
- **B.A.R. member** and **Planning Committee member** are each a boolean flag on the user record, grantable by admins (and the super-admin).
- Neither flag changes any other permission. A flagged user keeps their existing role (standard, premium, or staff).
- The B.A.R. flag grants access to the **verdict-voting surface** (three-pillar scoring).
- The Planning Committee flag grants access to the **proposal surface** (drafting candidate papers and challenges).
- Both flags are publicly visible when set (on "The Panel" and committee pages).
- Flag grants/revocations are audit-logged.

**Consequences.**
- (+) Privacy-minimized: panelists don't have to supply contractor info to judge.
- (+) Flexible: a user can go from audience → panelist → committee → audience again without role churn.
- (+) Clean separation of permission (role) from capability (flag).
- (−) Two additional permission gates in the code. Manageable.

**Alternatives considered.**
- **Panel roles as staff roles** — wrong fit; panelists aren't contractors.
- **One flag for both** — conflates two different capabilities.

---

## ADR-0016 — B.A.R. verdict voting and Save-or-Rip override are off-platform

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Early scoping assumed the platform would host (a) B.A.R. verdict voting on the three-pillar rubric, and (b) a rare "Save or Rip" audience override. On review, neither belongs on the platform.

**Decision.**
- **B.A.R. verdict voting is off-platform.** Panelists score each print on physical cards with pens, cast Survivor-style hidden ballots, and the result is read at the end of each video. The platform does not model verdict scoring, does not provide a panelist voting surface, and does not compute the verdict.
- **Save or Rip audience override is off-platform and likely dropped entirely.** If it ever happens, it will happen in person during filming — never via a site mechanic. Keeping it off-platform protects the stamp from online override campaigns.
- **The panel always has an odd number of members.** Tie-breaking rules are therefore unnecessary for the verdict.

**Consequences.**
- (+) Massive reduction in platform scope — no panelist UI, no verdict state machine, no tie-breaker logic.
- (+) Verdict integrity preserved: the show's ritual (physical cards, hidden ballots) stays intact.
- (+) The B.A.R. flag's purpose simplifies to public identity on "The Panel" page.
- (−) The platform does not store the verdict as structured data — only as an outcome attached to the episode record (STAMPED or RIPPED). That's fine; the narrative is what matters publicly.

**Alternatives considered.**
- **Host verdict voting on the platform** — would require a dedicated panelist surface, and would compromise the off-camera, in-person ritual that gives the stamp its value.

---

## ADR-0017 — Proposals are authored by the Planning Committee and published by an admin

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Who authors, and who publishes, the candidate papers and challenges that the audience votes on?

**Decision.** A two-step workflow:

1. **Draft.** A Planning Committee member (holds `is_planning_committee = true`) authors a candidate paper or challenge via the drafting surface. Drafts are private.
2. **Publish.** An admin or super-admin reviews the draft and publishes it, which makes it eligible for audience voting.

Committee members **cannot publish their own drafts**. This gate exists to ensure consistency across what the audience sees — the show's tone, the constraint format (one enforceable sentence), and the match between paper and challenge.

**Consequences.**
- (+) A consistent audience-facing voice is enforced structurally.
- (+) Separation of concerns: committee supplies creativity; admin supplies editorial judgment.
- (−) Publishing is a bottleneck on admins. Acceptable at current scale; revisit if the committee grows large.

**Alternatives considered.**
- **Committee members publish their own drafts** — loses the editorial gate.
- **All proposals go through an open review queue** — blurs the line between committee and non-committee path. Kept simple for now.

---

## ADR-0018 — Contribution is a monotonic point count accrued from interactions

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** We need a simple, intuitive model for rewarding participation without introducing complex rules or punishing inactivity.

**Decision.**
- Every user has a `contribution_points` integer field. It starts at 0 on sign-up.
- Meaningful interactions (cast a vote, download a guide, etc.) each add points. The specific per-action rules live in `roles-and-ranks.md`.
- Points **only increase.** There is no point loss, no decay, no demotion. A user's number is their permanent credit for participating.
- A derived UI concept ("Level 1, Level 2, …") can be displayed, but the stored truth is the raw point count.
- Display-facing levels, voting-power formula, and per-action point rules are deferred to `roles-and-ranks.md`.

**Consequences.**
- (+) Simple mental model. A user sees a number go up.
- (+) No punishment-for-inactivity dynamic, which is a common community anti-pattern.
- (+) "Users who come weekly get more voting power" emerges naturally — if you show up and interact often, your number grows faster.
- (−) Point-farming risk: if "any interaction" literally earns a point, a user could game it with refresh spam. Mitigated by defining a **bounded catalog of point-earning actions** (not "any request") and, where needed, **per-action rate limits** (e.g., one point per action type per 24 hours). Specifics in `roles-and-ranks.md`.

**Alternatives considered.**
- **Points with decay.** Rewards recency, punishes life happening. Rejected by Dean.
- **Tiered levels stored in the DB.** Adds a derived-state sync problem. Keep levels as display-only.

---

## ADR-0019 — Strict non-mingling of the two rank axes

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** ADR-0005 established two orthogonal axes (subscription tier, contribution level). This ADR sharpens the orthogonality: the axes do not merely *exist* independently — they **never cross paths** in permission checks.

**Decision.**
- **Contribution points** affect **voting power** and **per-feature point guards** only. They do **not** unlock content.
- **Subscription tier** affects **content unlocks** only (Architect's Vault, voting-results visibility, any future tier-gated content). It does **not** contribute to voting power.
- A user with high contribution points but no subscription still sees "UNLOCK" affordances on premium content. A premium user with no contribution points has the vote weight of a brand-new user.
- Any permission check that combines both axes requires an ADR. There are none today and we expect none.

**Consequences.**
- (+) Clean code: two independent predicates, each with one input. No combined thresholds to tune.
- (+) Clean user mental model: "paying unlocks things; showing up gives me louder votes."
- (+) Protects the business model: premium is bought, not earned.
- (+) Protects the community model: influence is earned, not bought.
- (−) Occasionally feels harsh — e.g., a loyal non-paying user with 1,000 points still can't see premium content. Intended and accepted.

**Alternatives considered.**
- **Allow points to occasionally unlock premium content as a loyalty reward.** Rejected: mingles axes; dilutes the value of premium.

---

## ADR-0020 — Proposals come only from the Planning Committee; no non-committee submission path

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** An earlier open question was whether high-contribution non-committee users could submit their own paper/challenge proposals (routed through a review queue). ADR-0017 established that committee members draft and admins publish. This ADR closes the question of whether non-committee submissions exist at all.

**Decision.** Paper and challenge proposals come exclusively from Planning Committee members. There is no non-committee submission path and no review queue for outside submissions. A high-contribution user who wants to shape the show's proposals is invited *to* the Planning Committee by an admin — that invitation is the mechanism.

**Consequences.**
- (+) Simpler permission model: only one proposal authorship path.
- (+) Consistency of audience-facing proposals is structurally enforced through a small, curated committee.
- (+) Aligns with ADR-0019: contribution points don't unlock features; they give voting power. If a user wants to propose, the path is social (get invited to the committee), not mechanical (hit a threshold).
- (−) Non-committee users lose a hypothetical way to contribute content. Acceptable — they still have voting power, which is the designed contribution path.

**Alternatives considered.**
- **Threshold-gated submission** — mingles the axes; contradicts ADR-0019.
- **Open submission with admin queue** — adds moderation cost without clear benefit at this scale.

---

## ADR-0021 — Voting power uses a stepped bracket multiplier keyed to contribution points

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** ADR-0019 established that `contribution_points` drive voting power. This ADR specifies the conversion formula: how many points → how much weight.

**Decision.** Use a five-level stepped multiplier. The brackets align with the contribution level display buckets in `roles-and-ranks.md §5`:

| Points | Vote weight |
|---|:---:|
| 0–9 | 1 |
| 10–29 | 2 |
| 30–59 | 3 |
| 60–99 | 4 |
| 100+ | 5 |

Store the `weight` snapshot on the `votes` row at cast time so historical tallies remain accurate if the formula ever changes.

**Consequences.**
- (+) Transparent — users can see exactly what their current weight is.
- (+) Bounded — maximum 5× differential; new voters are never irrelevant.
- (+) Aligns with expected lifetime ceiling (~130 points from voting + Vault downloads), so levels feel achievable.
- (−) Any formula change invalidates prior users' mental model; communicate changes clearly.
- (−) Storing weight per vote adds a column; acceptable trade-off for historical accuracy.

**Alternatives considered.**
- **Logarithmic formula** — smooth and elegant, but hard to explain to users and hard to communicate as a "level."
- **No weighting (weight = 1 always)** — simplest, but undercuts the point-earning motivation for regular voters.

---

## ADR-0022 — Audience poll ties broken by earliest publication date

- **Date:** 2026-04-23
- **Status:** accepted

**Context.** Audience polls (paper selection, challenge selection) can tie when voter turnout is low in early episodes. We need a deterministic rule that requires no human judgment at poll close.

**Decision.** When two or more options are tied at poll close, the option with the **earliest publication timestamp** wins. If an admin believes a technical error produced the tie, they may close and re-run the poll as a new poll (audit-logged with a reason).

**Consequences.**
- (+) Deterministic — no admin decision required to close a poll.
- (+) Knowable in advance — options have timestamps; the tiebreaker is not secret.
- (+) Fair — rewards options the community had the most time to see.
- (−) Slightly favors whichever option an admin happened to publish first. Mitigation: publish competing options close together.

**Alternatives considered.**
- **Random selection** — truly fair but not reproducible or explainable.
- **Admin manual decision** — requires human availability at an exact moment; creates delay and perceived bias.
- **Re-run the poll** — consistent, but adds a delay to episode production.

---

## ADR-0023 — Sign-up is two-phase; onboarding fields are nullable at the DB level

- **Date:** 2026-04-24
- **Status:** accepted

**Context.** The identity model requires `display_name`, `country_code`, `city_id`, and `timezone` at sign-up. But Clerk — our auth provider — handles account creation and has no concept of these fields. A Clerk webhook fires the moment the auth account is created, before the user has seen our onboarding screen.

**Decision.** Sign-up is split into two phases:
1. Clerk creates the auth account (email + password). The `user.created` webhook fires and inserts a minimal row (`clerk_user_id` + `email`).
2. The user is redirected to `/onboarding`, which collects `display_name`, `country_code`, `city_id`, and `timezone`. The onboarding Server Action sets these fields and marks the record complete.

The four onboarding fields are **nullable in Postgres** to allow the partial row to exist between phases. Completeness is enforced by middleware: any authenticated user whose row is missing these fields is redirected to `/onboarding` and cannot access the main app until they finish.

**Consequences.**
- (+) Leverages Clerk's hosted sign-up UI (MFA, email verification, OAuth) without building a custom auth form.
- (+) The identity model's "required at sign-up" promise is kept — users cannot use the platform without completing onboarding.
- (−) The DB schema technically allows partial rows. Tooling (Drizzle, direct queries) will not enforce onboarding completeness — only the middleware does.
- (−) If the middleware gate ever has a bug, partial rows can reach the app. Mitigated by thorough integration tests on the gate.

**Alternatives considered.**
- **Custom sign-up form (collect everything at once)** — Keeps DB constraints but requires building and maintaining auth UI. Loses Clerk's MFA, OAuth, and email-verification out of the box.
- **Store onboarding fields in Clerk metadata, only write to DB on completion** — No partial rows, but two sources of truth and a race condition if the user closes the browser mid-flow.

---

## ADR-0025 — City selection via Google Places Autocomplete (replaces curated cities table)

- **Date:** 2026-04-25
- **Status:** accepted
- **Amends:** ADR-0013 (the "curated list" aspect — the data-collection notice requirement remains)

**Context.** The original plan called for a curated `cities` table (~300 cities) seeded from a CSV. During Phase 2 implementation, the user determined that 300 cities is too limiting for a global audience. The city field exists for audience geography analytics — restricting users to a small list harms data quality and user experience.

**Decision.** Use Google Places Autocomplete (restricted to `(cities)` type) for city selection during onboarding. The country select biases autocomplete results. On selection, we store `city_name` (text), `city_state` (text, nullable), and `google_place_id` (text) directly on the `users` table. The `cities` table and `city_id` FK are dropped.

**Schema change:**
- Dropped: `cities` table, `users.city_id` FK
- Added: `users.city_name`, `users.city_state`, `users.google_place_id`

**Consequences.**
- (+) Every city on Earth is available — no user is excluded.
- (+) Fuzzy matching handles typos and partial input.
- (+) `google_place_id` enables future deduplication and map visualizations.
- (+) Simpler schema — no FK join needed for display.
- (−) External API dependency at onboarding time. If Google Places is down, the field is unusable. Acceptable — outages are rare and short-lived.
- (−) Requires a Google Cloud API key and has a cost ceiling ($200/month free credit ≈ ~28,500 requests). At current projected volume, cost is effectively zero.

**Alternatives considered.**
- **Curated cities table (~300 cities from CSV)** — Too limiting. Users from unlisted cities either pick the wrong city or bounce.
- **GeoNames dataset (~25,000 cities loaded into Postgres)** — Good quality, free, but less fuzzy matching and no typo tolerance. Would require maintaining the dataset.
- **Mapbox Geocoding API** — Good quality, 100k free requests/month, but slightly less polished for city-only searches than Google Places.

---

## Template for new ADRs


```markdown
## ADR-00NN — <title>

- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | superseded | deprecated

**Context.** <what situation required a decision>

**Decision.** <what we chose>

**Consequences.**
- (+) <positive>
- (−) <negative — be honest>

**Alternatives considered.**
- **<option>** — <why not>.
```
