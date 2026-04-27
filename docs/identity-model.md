# Identity Model

> *This is the foundational spec for the Ripped platform. Every schema, every permission check, every privacy decision traces back to this document. If the code ever drifts from this doc, **this doc is the source of truth** — bring the code back in line, or add an ADR explaining why the doc should change.*

## 1. Purpose

Define, exhaustively, **who exists in the system**, **what data we hold about them**, and **why** each field earns its place. Fields that cannot justify themselves here do not exist.

## 2. Principles

These are the non-negotiables that shape every decision below.

- **Privacy-minimized by default.** The platform asks for as little as possible. Each field must earn its spot.
- **Purpose-bound data.** Data collected for one reason is not used for another without the user's knowledge.
- **The smallest viable truth.** If we can know "what country" without knowing "what street," we know "what country."
- **Opt-in, not opt-out.** Anything beyond the minimum is a user-initiated choice.
- **Staff are collaborators.** Their full info is collected because they are contractors or employees — not users of the product.
- **No private admin notes.** We do not keep backchannel journals on users.

---

## 3. The people in the system

The system has **five core roles** and **two orthogonal flags** that can be added on top of any role.

### Roles (one per account)

### 3.1 Standard user

- The default on sign-up.
- Free subscription tier.
- Can vote on audience-facing polls (paper selection, challenge selection, save/rip overrides).
- Can earn contribution points through participation. Points never decrease.

### 3.2 Premium user

- Same as standard, plus an active paid subscription tier.
- Unlocks voting results visibility and the **Architect's Vault** (deep per-paper technical reports, ICC profiles, custom media types, power-user settings).
- Can still earn contribution points — the two axes are independent and strictly non-mingling (paying premium does **not** grant points; earning points does **not** unlock premium content).

### 3.3 Content creator (staff)

- Invited only. Added via staff-invitation flow.
- Full contact information is stored — they are contractors/collaborators.
- Can sign into the **admin site** (admin subdomain).
- Can create votes, close votes, and publish blog posts via the CMS.
- Cannot manage other users. Cannot invite other staff.
- Can vote in audience polls like any user.

### 3.4 Admin (staff)

- Invited by the super-admin.
- Full contact information.
- All content creator abilities (create votes, close votes, publish blog posts), plus:
  - Manage standard/premium users (promote tier, demote tier, ban, unban).
  - Invite new content creators.
  - Approve or reject custom challenge submissions in the review queue.
  - Grant or revoke B.A.R. member and Planning Committee member flags (see §3.6).
- **Cannot** edit, demote, or remove other admins — that is super-admin-only.
- Can vote in audience polls.

### 3.5 Super-admin (The Architect)

- Exactly one: Dean.
- All admin and content creator abilities, plus:
  - **Invite, edit, demote, and remove admins.**
  - Access system-level controls (defined as they arise).
- The super-admin's admin-site view surfaces admin-management controls hidden from every other role.
- **Cannot vote on the show's polls.** The Architect is the one being judged — he is at the mercy of the public. Hard rule enforced in code.

### Flags (orthogonal — can stack on any role except super-admin's voting exclusion)

### 3.6 B.A.R. member (panelist flag)

- A user flagged as a member of the **Board of Aesthetic Review** — the panel that judges each episode's finished print. The panel is always an **odd number** of members so no verdict can tie.
- Flag is granted and revoked by admins (and super-admin).
- **The B.A.R.'s verdict scoring happens off-platform** (physical cards, hidden ballots, read at the end of each video). This flag does not grant access to any on-platform voting surface beyond what a standard or premium user already has.
- Purpose of the flag on the platform: **public identity** on "The Panel" page (bios, photos), and eligibility signaling for future features (e.g., Planning Committee invitations).
- B.A.R. members cast regular audience votes (paper, challenge) like any other user.

### 3.7 Planning Committee member (community flag)

- A user flagged as a member of the rotating **Planning Committee** — the group that drafts candidate papers and challenges.
- Flag is granted and revoked by admins (and super-admin).
- Initially this will be Dean alone (assisted by AI). Over time, trusted community members (and often B.A.R. members) will hold this flag.
- Does **not** change any other permission. Like the B.A.R. flag, it's orthogonal.
- Grants access to the **drafting surface** where a member can author candidate papers and challenges. Drafts are not public.
- **Publishing a draft to audience voting requires an admin or super-admin action** — committee members cannot publish their own drafts. This gate enforces consistency of what reaches the audience.

---

## 4. Fields — the minimum viable record

### 4.0 Sign-up data-collection notice

Because the sign-up form asks for country and city — which can feel out-of-place on first look — the form must display a short, plainly written notice near those fields. Example copy:

> *"We ask where you're watching from so the show's creators know where their audience is. We **don't** collect full names, addresses, or identifying details unless you choose to share them later. Your email stays private."*

This notice is a platform-level commitment. If the notice ever disappears from the sign-up form, the sign-up form is in violation of this document.

### 4.1 Standard user fields

The fields below are the *complete* set stored for a standard user. No other fields are added without an ADR.

| Field | Type | Required | Displayed publicly | Source of truth | Why we have it |
|---|---|---|---|---|---|
| `id` | UUID | yes | no | Postgres (primary key) | Internal identifier. Never exposed in URLs. |
| `clerk_user_id` | string | yes | no | Clerk → mirrored to Postgres | The auth provider's ID. Lets us replace Clerk later without remapping humans. |
| `email` | string | yes | no | Clerk → mirrored to Postgres | Login. Account recovery. Receipts if they ever purchase. Never displayed. |
| `display_name` | string (**unique**, citext) | yes | yes | Postgres | Public-facing name. Also serves as the voter handle shown next to votes. Enforced unique case-insensitively across all users. |
| `country_code` | ISO 3166-1 alpha-2 | yes | only on public profile | Postgres | Audience geography at country level. Structured so dashboards are trivial. Collected at sign-up with an explanatory note (see §4.0). |
| `city_name` | text | yes | only on public profile | Postgres | City display name from Google Places Autocomplete, e.g. "Dallas". Collected at sign-up with an explanatory note (see §4.0). See ADR-0025. |
| `city_state` | text (nullable) | no | only on public profile | Postgres | State/province from Google Places, e.g. "Texas". Null for countries without states. |
| `google_place_id` | text | yes | no | Postgres | Google Places unique identifier. Enables deduplication and future map features. |
| `timezone` | IANA TZ string | yes | no | Postgres | Lets us schedule/analyze in the user's local time. |
| `subscription_tier` | enum: `free`, `premium` | yes | no | Postgres | Gates premium content. Changed by purchase or admin action. |
| `contribution_points` | integer (≥ 0, monotonic) | yes | yes (as a badge / derived level) | Postgres | Earned rank. Accrues on meaningful user interactions (vote cast, download, etc.). **Only ever increases** — no loss, no demotion. Affects voting power and per-feature point guards. **Does not affect content unlocks** — those are tier-gated only. |
| `public_profile` | boolean | yes | n/a | Postgres | Whether optional fields are shown on profile page. Defaults to `false`. |
| `created_at` | timestamp | yes | no | Postgres | Audit. |
| `updated_at` | timestamp | yes | no | Postgres | Audit. |
| `banned_at` | timestamp nullable | no | no | Postgres | If set, user cannot sign in. Soft-delete preserves record. |

### 4.2 Optional profile fields (only visible if `public_profile = true`)

These fields are **never required**. A user on a public profile may fill in zero, some, or all of them. They exist because some viewers want to be known by their real name in the community.

| Field | Type | Required | Displayed publicly | Source of truth | Why we have it |
|---|---|---|---|---|---|
| `first_name` | string | no | only on public profile | Postgres | Optional real-name disclosure. |
| `last_name` | string | no | only on public profile | Postgres | Optional real-name disclosure. |
| `bio` | string (short) | no | only on public profile | Postgres | A sentence or two the user writes about themselves. |
| `avatar_url` | string | no | yes (always, if set) | Postgres | Small image. Uploaded to our storage; we store the URL. |

### 4.3 Payment-triggered fields (only populated at purchase)

These fields are **never collected at sign-up** and exist only after a purchase. They are used for the purchase and for legal record-keeping. They are not displayed publicly, not used for marketing, and not used for analytics.

| Field | Type | Required at purchase | Displayed publicly | Source of truth | Why we have it |
|---|---|---|---|---|---|
| `billing_name` | string | yes | no | Postgres | Legal receipt requirement. |
| `billing_address` | structured | yes | no | Postgres | Tax and fulfillment compliance. |
| `phone` | string | no | no | Postgres | Optional order-support contact. |
| `stripe_customer_id` | string | yes | no | Postgres | Reference into Stripe; not the card data itself. |

Payment card data is **never** stored by us. Stripe holds it; we hold a reference only.

### 4.4 Staff-only fields (content creator, admin, super-admin)

Collected during the staff-invitation flow. Staff accept being contractors/collaborators when they accept the invite.

| Field | Type | Required | Displayed publicly | Source of truth | Why we have it |
|---|---|---|---|---|---|
| `staff_role` | enum: `content_creator`, `admin`, `super_admin`, `null` | yes | no | Postgres | Drives admin-surface permissions. `null` when a user has never been staff or has been removed from staff. |
| `legal_name` | string | yes | no | Postgres | Contracting and payment. Retained for attribution even after staff removal. |
| `contact_email` | string | yes (may equal `email`) | no | Postgres | May differ from login email for staff who use a personal account. |
| `contact_phone` | string | yes | no | Postgres | Operations contact. |
| `invited_by_user_id` | FK → `users` | yes | no | Postgres | Audit trail of who added whom. |
| `invited_at` | timestamp | yes | no | Postgres | Audit. |
| `accepted_at` | timestamp nullable | no | no | Postgres | Null until the invitee completes onboarding. |
| `removed_at` | timestamp nullable | no | no | Postgres | Set when a staff role is revoked. User reverts to standard/premium user but record stays for content attribution. |

### 4.5 Panel and committee flags

Two orthogonal flags that grant access to show-specific surfaces without changing the role hierarchy. Either flag can be set on any user (standard, premium, or staff). Neither flag is set at sign-up.

| Field | Type | Required | Displayed publicly | Source of truth | Why we have it |
|---|---|---|---|---|---|
| `is_bar_member` | boolean | yes | yes (on "The Panel" page) | Postgres | Publicly identifies the user as a judge. The B.A.R.'s verdict scoring is off-platform; this flag does not grant a voting surface. |
| `is_planning_committee` | boolean | yes | yes (on committee page) | Postgres | Grants access to the drafting surface for authoring candidate papers and challenges. Publishing drafts to audience voting requires an admin or super-admin. |
| `bar_granted_at` | timestamp nullable | no | no | Postgres | When the flag was last granted. |
| `planning_committee_granted_at` | timestamp nullable | no | no | Postgres | When the flag was last granted. |

Flag grants and revocations are admin-level actions and are audit-logged.

---

## 5. Where things live

| Data | Store | Why |
|---|---|---|
| All fields above | **Postgres** | Users, roles, tiers, payments — all integrity-critical. |
| Avatar image blobs | Object storage (S3-compatible) | Not a database concern. DB only stores the URL. |
| Activity feed (user cast vote X on challenge Y at time Z) | **MongoDB** | Document-shaped, append-mostly, no referential integrity needs beyond a user-id string. |
| Session state | Clerk | Clerk manages sessions; we do not replicate them. |

---

## 6. Identity lifecycle

The full set of state transitions a user record can undergo. Every transition is **audit-logged** with actor, timestamp, and reason (where applicable).

```
           ┌──────────────┐
  sign up →│   standard   │← ─ ─ tier downgrade (admin action)
           └──────┬───────┘
                  │ purchase OR admin promote
                  ▼
           ┌──────────────┐
           │   premium    │
           └──────┬───────┘
                  │ ban (admin action)
                  ▼
           ┌──────────────┐
           │   banned     │← any active state
           └──────────────┘
```

Staff have their own lifecycle, parallel to the above:

```
  super-admin invites      invitee accepts            super-admin removes
          │                       │                            │
          ▼                       ▼                            ▼
    [pending admin] ────────▶ [admin] ─────────────▶ [standard user, with
                                                      staff fields retained
                                                      for attribution]
```

Content creators follow the same shape, invited by an admin instead of the super-admin.

Panel/committee flags have their own simple lifecycle:

```
  admin grants flag         admin revokes flag
         │                          │
         ▼                          ▼
  [flag = true]  ─────────▶  [flag = false]
```

### 6.1 Transition rules

- **sign-up → standard:** any successful Clerk sign-up creates a standard user, immediately, via a Clerk webhook that inserts into our `users` table.
- **standard → premium:** triggered by a successful Stripe payment (later phase) OR manual admin promotion.
- **premium → standard:** subscription expiry OR manual admin demotion.
- **any → banned:** admin action with a reason (reason is stored; not displayed to the user).
- **banned → standard/premium:** admin un-ban action.
- **standard/premium → content_creator/admin:** only by invitation. Involves the staff-fields form. An existing user being promoted to staff has staff fields added; they are the same row, not a new account.
- **admin → standard (staff removal):** super-admin-only. There is no intermediate "demote to content creator" step — an admin is either an admin or not. Staff fields (`legal_name`, `contact_email`, etc.) are retained so prior CMS content remains attributed.
- **content_creator → standard (staff removal):** admin or super-admin. Same retention rule as above.
- **super-admin:** never transitions. There is exactly one, and it is set at system initialization.
- **B.A.R. / Planning Committee flag on/off:** admin or super-admin action. Does not affect the user's role.

### 6.2 Retention after removal

When a staff member is removed (content creator or admin), their user record is preserved and they revert to being a standard user. Anything they authored (blog posts, approved challenges, CMS records) remains attributed to their display name. This is deliberate: the show's ethos is "no coverups, mistakes make it" — we do not rewrite history when someone leaves.

The only way a name is removed from prior content is through **account deletion** — which is the user's own choice, not a staff action.

---

## 7. Privacy commitments

These are user-facing promises we will enforce in code and in the privacy policy.

1. **We do not display your email anywhere.** It is for login and important account messages only.
2. **Your display name is your public identity.** You can change it at any time.
3. **We do not collect your real name unless you choose to share it.** Even on a public profile, first/last name are optional.
4. **Your country and city exist so the show's creators know where their audience is.** They are not sold, not shared, and not used to target you individually.
5. **Payment information is collected at the point of purchase.** It is used for that purchase, for receipts, and for legal record-keeping. It is not used for anything else.
6. **We do not keep private notes about you.** What you see on your profile is what we hold about you.
7. **You can request deletion of your account.** When you do, everywhere your display name previously appeared — comments on approved challenges, blog authorship attribution, panelist listings, vote lists — is replaced with **"user deleted."** Your votes remain counted (they shaped real decisions on the show) but are unlinked from you. All identifying fields in your record are erased.

---

## 8. Open questions — for future ADRs

Things we've consciously not decided yet. Each will need an ADR before it's implemented.

- **Point-earning action catalog.** Which specific actions earn a point, and is there a rate-limit per action (e.g., one point per action type per 24 hours)? (→ `roles-and-ranks.md`)
- **Voting power formula.** How do contribution points convert to vote weight? Linear? Logarithmic? Bucketed? (→ `roles-and-ranks.md`)
- **Per-feature point guards.** The minimum-points threshold is decided per-feature, not globally. A registry of guards lives in `roles-and-ranks.md` once features exist.
- **Audience poll tie-breaking.** Audience polls could tie when voter counts are low. Need a deterministic rule — probably: earliest-published option wins, or admin manually breaks.
- **Deletion self-serve vs admin-processed.** The end state is defined (§7.7). The flow is not.

## 9. Change control

This document is version-controlled in Git. Any change requires:

1. A PR that modifies this file.
2. A corresponding ADR in `docs/decision-log.md` if the change alters an invariant.
3. Dean's review and approval.

If the code ever contradicts this document, the code is wrong — either fix the code or write the ADR.
