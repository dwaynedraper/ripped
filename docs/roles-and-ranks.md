# Roles and Ranks

> *Companion to `identity-model.md`. That doc defines who exists and what data we hold. This one says what each person can **do**, how rank is earned, and how rank converts into capability. Together, these two documents are the complete access-control specification.*
>
> *If the code ever contradicts either document, the documents are right. Fix the code, or write an ADR explaining why the document should change.*

---

## 1. Guiding axioms

Two rules that override every table and formula below.

**Axiom 1 — The two axes never mingle.**

`subscription_tier` unlocks **content only** — the Architect's Vault and voting-results visibility. It does not affect voting power, point guards, or any other capability.

`contribution_points` drives **voting power and per-feature point guards only**. Earning points does not unlock premium content.

Any code path that crosses the axes (e.g., "premium users get extra votes," or "points unlock the Vault") is a bug — not a feature request, not a design question. A bug.

**Axiom 2 — The Architect cannot vote.**

The super-admin (Dean) is the subject of each episode's judgment. He must not influence audience polls. This is enforced at the voting layer independently from the permission system — no role configuration and no permission table entry can override it.

---

## 2. Permission matrix

Rows are actions. Columns are roles. Flags add to, never subtract from, a user's base role.

**Key:** ✓ allowed · ✗ not allowed · ★ super-admin only · `flag` requires the named flag

### 2.1 Voting

| Action | standard | premium | content_creator | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Cast paper selection vote | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cast challenge selection vote | ✓ | ✓ | ✓ | ✓ | ✗ |
| View live poll results (tally) | ✗ | ✓ | ✓ | ✓ | ✓ |

The super-admin's ✗ on voting is **Axiom 2** — not a permissions misconfiguration.

### 2.2 Content

| Action | standard | premium | content_creator | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Browse public blog posts | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Blueprint library | ✓ | ✓ | ✓ | ✓ | ✓ |
| Browse the Locker (failure gallery) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Architect's Vault index (titles) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Access Architect's Vault reports (full) | ✗ | ✓ | ✓ | ✓ | ✓ |
| Download Vault files (ICC profiles, etc.) | ✗ | ✓ | ✓ | ✓ | ✓ |

> *Staff (content creators, admins, super-admin) have implicit premium access for operational purposes — they need to see the product they're managing.*

### 2.3 CMS (admin site only)

| Action | standard | premium | content_creator | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Sign into the admin site | ✗ | ✗ | ✓ | ✓ | ✓ |
| Create and publish blog posts | ✗ | ✗ | ✓ | ✓ | ✓ |
| Create audience polls | ✗ | ✗ | ✓ | ✓ | ✓ |
| Close audience polls | ✗ | ✗ | ✓ | ✓ | ✓ |
| Publish draft proposals to audience voting | ✗ | ✗ | ✗ | ✓ | ✓ |
| Reject or return draft proposals | ✗ | ✗ | ✗ | ✓ | ✓ |

### 2.4 User management (admin site only)

| Action | standard | premium | content_creator | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Promote a user's subscription tier | ✗ | ✗ | ✗ | ✓ | ✓ |
| Demote a user's subscription tier | ✗ | ✗ | ✗ | ✓ | ✓ |
| Ban a user | ✗ | ✗ | ✗ | ✓ | ✓ |
| Unban a user | ✗ | ✗ | ✗ | ✓ | ✓ |
| Invite a content creator | ✗ | ✗ | ✗ | ✓ | ✓ |
| Grant the B.A.R. member flag | ✗ | ✗ | ✗ | ✓ | ✓ |
| Revoke the B.A.R. member flag | ✗ | ✗ | ✗ | ✓ | ✓ |
| Grant the Planning Committee flag | ✗ | ✗ | ✗ | ✓ | ✓ |
| Revoke the Planning Committee flag | ✗ | ✗ | ✗ | ✓ | ✓ |
| Approve custom challenge submissions | ✗ | ✗ | ✗ | ✓ | ✓ |
| Reject custom challenge submissions | ✗ | ✗ | ✗ | ✓ | ✓ |

### 2.5 Admin management (super-admin only)

| Action | standard | premium | content_creator | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Invite a new admin | ✗ | ✗ | ✗ | ✗ | ★ |
| Edit an admin's staff record | ✗ | ✗ | ✗ | ✗ | ★ |
| Demote an admin to standard user | ✗ | ✗ | ✗ | ✗ | ★ |
| Remove an admin from staff | ✗ | ✗ | ✗ | ✗ | ★ |
| Access system-level controls | ✗ | ✗ | ✗ | ✗ | ★ |

---

## 3. Flag permissions

Flags add targeted capability to any role without changing the role hierarchy.

### 3.1 `is_planning_committee`

Grants access to the **drafting surface** — the UI where a member authors candidate papers and candidate challenges for consideration.

What the flag adds:
- View the draft queue (committee-authored proposals awaiting admin review)
- Create a draft paper proposal
- Create a draft challenge proposal
- Edit your own unpublished drafts
- Withdraw (delete) your own unpublished drafts

What the flag does **not** add:
- Publishing a draft to audience voting — that is admin / super-admin only (ADR-0017)
- Any change to voting power, subscription access, or other permissions

The flag is an **admin action**, always audit-logged with actor, timestamp, and target user.

### 3.2 `is_bar_member`

Grants public identity as a panel judge. The B.A.R.'s verdict scoring is **off-platform** (physical scorecards, hidden ballot, read on camera) — see ADR-0016.

What the flag adds:
- Displayed on "The Panel" page (bio, avatar, name visible to the public)
- Eligible for Planning Committee invitations (by convention, not enforced in code)

What the flag does **not** add:
- Any on-platform voting surface beyond the user's base role
- Any content access beyond the user's base role

**Odd-count requirement:** The B.A.R. must always have an **odd** number of active members so no verdict can tie. This is a *process* constraint — enforced by the admin making flag changes, not by the database. A warning should surface in the admin UI if a revocation would leave the panel at an even count.

---

## 4. Point-earning action catalog

*Contribution points are the earned axis. This catalog is **closed** — only actions in this list earn points. New entries require an ADR.*

| Action ID | Description | Points | Rate limit |
|---|---|:---:|---|
| `vote.paper_selection` | Cast a vote on a paper selection poll | 1 | Once per poll per user |
| `vote.challenge_selection` | Cast a vote on a challenge selection poll | 1 | Once per poll per user |
| `download.vault_entry` | Download a file from the Architect's Vault | 1 | Once per Vault entry per user |

**Rate limit enforcement is server-side only.** The client never decides whether a point is earned. The server checks the rate limit before inserting the action record and awarding the point.

**Why the catalog is tight for v1:** Three well-understood actions with inherent rate limits (you can only vote once per poll; you can only first-download once). This keeps the anti-gaming surface small while the platform is new. When new actions are added, the farming risk must be analyzed and an ADR written before any code.

### Lifetime point ceiling (informational)

With the current catalog and the show's expected scope:

| Source | Max points (lifetime estimate) |
|---|---|
| Voting (2 polls × ~50 episodes) | ~100 |
| Vault downloads (~30 papers) | ~30 |
| **Rough ceiling** | **~130** |

This ceiling informs the contribution level brackets in §5 and the voting power brackets in §6.

---

## 5. Contribution level display buckets

*These are labels displayed on user profiles. They are derived from `contribution_points` at read time — **never stored**. The source of truth is always the integer point count.*

| Level label | Points required | Intended meaning |
|---|:---:|---|
| **Observer** | 0–9 | New or infrequent — voted in a handful of episodes |
| **Participant** | 10–29 | Regularly showing up and voting |
| **Contributor** | 30–59 | Consistent voter and active Vault user |
| **Advocate** | 60–99 | Engaged across most of the show's run |
| **Cornerstone** | 100+ | Here from the beginning; shaped the show |

> *The bracket boundaries are set by the lifetime ceiling in §4. The names are locked — use them verbatim in UI copy.*

---

## 6. Voting power formula

Contribution points give a user's vote more weight. The formula must be:

- **Transparent** — users can understand and anticipate their weight
- **Bounded** — the gap between a brand-new voter and a long-time member should feel fair, not alienating
- **Monotonic** — more points → more weight, always

### Proposed formula: stepped multiplier (same brackets as §5)

| Level | Points | Vote weight |
|---|:---:|:---:|
| Observer | 0–9 | 1 |
| Participant | 10–29 | 2 |
| Contributor | 30–59 | 3 |
| Advocate | 60–99 | 4 |
| Cornerstone | 100+ | 5 |

**Interpretation:** A Cornerstone member's single vote counts as five Observer votes in the raw tally. The maximum differential is 5×.

**Implementation note:** When recording a vote, store both the raw vote (one row in the `votes` table) and the `weight` snapshot at the time of casting. If the formula ever changes, historical tallies remain accurate because the weight is stored — not recomputed.

> *The multiplier values (1–5) are locked — see ADR-0021. If the differential needs tuning after launch, that requires a new ADR.*

---

## 7. Per-feature point guard registry

A point guard is a server-side check: *"this action requires at least N points."* Guards are **per-feature**, not global. Each feature picks its own threshold.

This is the living registry. It starts sparse; entries are added by ADR as features are built.

| Feature | Minimum points | Block or limit? | Notes |
|---|:---:|---|---|
| Cast paper selection vote | 0 | — | No guard; open to all. |
| Cast challenge selection vote | 0 | — | No guard; open to all. |
| Download Vault entry | 0 | — | Access is subscription-gated, not point-gated. |
| Submit a custom challenge *(future)* | TBD | Block | Proposed: 30–50 pts. ADR required before implementation. |

**Block vs. limit:** A *block* prevents the action entirely and shows an "earn more points" message. A *limit* allows a degraded version (e.g., lower priority in a queue). The distinction is set per feature.

**Subscription access is not a point guard.** If a feature is premium-gated, the check is `user.subscription_tier === 'premium'` — never a point check.

---

## 8. Audience poll tie-breaking

When vote tallies are equal between two or more options at poll close, the winning option is determined by **earliest publication date** — the option that was available to voters longer wins. This rule is:

- Deterministic (no human judgment required)
- Knowable in advance (options have timestamps)
- Fair (it rewards options the community had the most time to consider)

If an admin believes the tie result is genuinely wrong (e.g., a technical error), they may close and re-run the poll as a new poll. Re-runs are audit-logged with a reason field.

---

## 9. Open questions — for future ADRs

| Question | Where it lands |
|---|---|
| Custom challenge point guard threshold | ADR required; tentatively 30–50 pts |
| Voting power multiplier values | Locked — ADR-0021 accepted |
| Contribution level display names | Locked — Observer / Participant / Contributor / Advocate / Cornerstone |
| Whether "blog post read" or similar passive actions ever earn points | Separate ADR — not in v1 |
| B.A.R. odd-count admin UI warning | Implementation detail; no ADR required, just a design note |

---

## 10. Change control

This document is version-controlled in Git. Changes follow the same protocol as `identity-model.md`:

1. A PR that modifies this file.
2. A corresponding ADR in `docs/decision-log.md` if the change alters a permission, a formula, or a guard threshold.
3. Dean's review and approval.

The point-earning catalog is **closed** — no action earns points unless it appears in §4's table and has an ADR. This is a hard rule, not a convention.

---

*Last updated 2026-04-23.*
