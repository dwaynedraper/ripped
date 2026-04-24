# Glossary

> *Terms of art used throughout the Ripped project. When any word in this list appears in docs or code, it means exactly what is written here — nothing more, nothing less. If a definition here is wrong or drifts from reality, update this file.*

## The product

**Ripped or Stamped**
: The YouTube series this platform exists to serve. A radical-reality print-photography show where every episode ends in a **binary verdict**: STAMPED (archived as a Blueprint) or RIPPED (physically destroyed on camera, sealed in a Specimen Bag, filed in The Locker). Users of the platform are its audience — voters, viewers, and members of its community. See `show-premise.md` for the full premise.

**The Architect**
: Dean. The lead builder and the subject of each episode's judgment. Cannot vote on the show's polls — he is the one being judged, not a participant in the judgment. Also the super-admin of the platform.

**The platform / the site**
: This software — the database, public site, and admin site collectively.

**Sharp Sighted Studio**
: Dean's photography business. It *funds and produces* the Ripped or Stamped series but is not the subject of this platform. Do not confuse platform users with photography clients.

## Surfaces

**Public site**
: Main domain. The surface where viewers, voters, and premium members live. Open sign-up.

**Admin site**
: Subdomain (`admin.<domain>`). The surface where staff work. Invite-only. Contains the admin dashboard + CMS.

**Admin dashboard**
: An admin's default/home view on the admin site. High-visual, graphic-design-forward controls for managing users, approving challenges, and accessing the CMS. The exact tiles and tools shown vary by staff role:

  - **Super-admin view** additionally surfaces admin-management controls (invite admin, edit admin, demote admin, remove admin) and any system-level settings.
  - **Admin view** shows user management, challenge review queue, content creator invitation, and full CMS access (create/close votes, write blog posts).
  - **Content creator view** shows CMS-only controls (create/close votes, write blog posts). No user-management or invitation tiles.

**CMS**
: Content management portion of the admin dashboard. Where content creators publish blog posts and admins create votes/set options.

## People

**User**
: Umbrella term for anyone with an account on the public site. Specialize by rank (see below).

**Standard user**
: A user on the free subscription tier. The default state of any new sign-up.

**Premium user**
: A user on a paid subscription tier. Unlocks voting-results visibility and **the Architect's Vault** — deep per-paper technical reports (ICC profiles, custom media types, power-user printer settings). Future premium content will also be gated at this tier.

**The Architect's Vault**
: The premium-gated library of deep technical reports, one per paper. Each vault entry contains the episode's ICC profile, custom media type settings, Total Ink Limit cap, dry-time-per-pass, platen gap, and any other power-user settings used on "The Beast." Downloadable. This is the primary product of the paid tier.

**Staff**
: Umbrella term for super-admin, admin, and content creator. Invite-only. Has a full contact record because they are collaborators or contractors.

**Super-admin**
: Dean. Exactly one person. Has every ability in the system. Only role that can **create, edit, demote, or remove admins**. Has all admin and content creator abilities in addition to admin management.

**Admin**
: Staff member who can manage users (promote/demote/ban), approve challenge submissions, and invite content creators. **Inherits every content creator ability** — can create votes, close votes, write blog posts, and do anything a content creator can do. Cannot edit or remove other admins; that is super-admin-only.

**Content creator**
: Staff member with CMS posting rights. Can create votes, close votes, and publish blog posts. Cannot manage users and cannot invite other staff.

**B.A.R. (Board of Aesthetic Review)**
: The show's judging panel — photographers, printers, designers, and special guests. Always an **odd number** (default 15) so no verdict can tie. Their job is to **protect the stamp**. They score each episode's finished print on the three pillars to produce the verdict. **The scoring happens off-platform** — panelists score on physical cards with pens, cast Survivor-style hidden ballots, and the result is read at the end of the video. The platform does not host verdict voting.

**B.A.R. member**
: A user flagged as a panelist on the B.A.R. The flag is orthogonal to role (any role can hold it). Its purpose on the platform is **public identity** on "The Panel" page. It does not grant a voting surface — verdict scoring is off-platform.

**Planning Committee**
: The working group that proposes candidate papers and drafts candidate challenges for audience voting. Initially Dean alone (with AI assistance). Over time, rotates to include trusted community members and often overlaps with the B.A.R.

**Planning Committee member**
: A user flagged as a committee member. Like the B.A.R. flag, orthogonal to role. Grants access to the proposal surface.

**The three pillars**
: The B.A.R.'s scoring rubric for each print:
  1. **Structural Integrity** — the substrate. Physical perfection: no cockling, head strikes, feed errors. Zero-tolerance gate — if this pillar fails, it's an automatic RIP regardless of the other two.
  2. **The Constraint** — did the Architect obey the Planning Committee's trap?
  3. **Aesthetic Value** — the soul. Is the image museum-quality and worthy of the final exhibition?

**Verdict**
: The binary outcome of each episode. **STAMPED** if all three pillars pass. **RIPPED** if zero or one pass. If exactly two pass (Structural Integrity plus one other), it's a **Judge's Call** — the B.A.R. deliberates.

**Stamped**
: Verdict meaning the print is approved. It becomes a **Blueprint** for its paper and is archived in the Blueprint Library.

**Ripped**
: Verdict meaning the print is destroyed on camera, sealed in a **Specimen Bag**, and filed in **The Locker** (the physical archive of failures).

**Blueprint**
: An archived stamped print with a full documented recipe — lighting intent, capture decisions, editing decisions, print settings, handling notes, failure warnings. Blueprints are the show's process IP and the foundation of the eventual five-paper "New Standard."

**Demolition**
: A ripped print, archived as failure evidence.

**Unpermitted piece**
: A print that survived fabrication but did not earn approval. May still be judged; does not become a Blueprint.

**The Locker**
: The physical archive of Specimen Bags (ripped prints). Used for education, storytelling, and credibility.

**The Beast**
: The show's printer — a Canon PRO-1100.

**Episode**
: One run through the seven chapters of the show (Planning Committee → Research & Advice → Groundbreaking → Structural Analysis → The B.A.R. → Final Inspection → The Verdict). Each episode is tied to exactly one paper, one challenge, and one verdict.

**Paper selection vote**
: Stage 1 of audience voting each episode. The Planning Committee proposes a few candidate papers; the audience votes to select one.

**Challenge selection vote**
: Stage 2 of audience voting each episode. Once a paper is chosen, the Planning Committee drafts a few candidate challenges; the audience votes to select one.

**Save or Rip override**
: A rare, high-impact audience mechanism considered early in scoping. **Out of scope for the platform.** If it ever happens, it will happen in person during filming, not on the site — this protects the stamp from online override campaigns.

**Challenge (revised)**
: A prompt the community votes on. In show context, a challenge has two parts:
  - **Part A — the Benchmark (outcome):** one of several technical or emotional hurdles the final print must clear.
  - **Part B — the Trap (constraint):** one enforceable sentence limiting how the Architect may shoot. May not dictate the subject or the location.
  Challenges come from the Planning Committee (via drafted proposals) or, eventually, from high-contribution users through the custom-challenge review queue.

## Identity fields

**Email**
: Used for login only. Never publicly displayed. Required for all accounts.

**Display name**
: The user's public-facing name. Same field as the voter handle that appears when they vote. Free-form within reason; a user picks it at sign-up and can change it.

**Public profile**
: An opt-in toggle that makes a user's extra info (e.g., first/last name, if provided) visible on their profile page. Off by default. First/last name remain optional even when public profile is on.

**Country / city**
: Structured (ISO country code + curated city list). Collected at sign-up for "where are my audience" geography.

**Timezone**
: IANA timezone string. Used for scheduling and "when is my audience active" analytics.

## Rank system

**Subscription tier**
: The *paid* axis. v1 tiers: `free`, `premium`. Gates content — the Architect's Vault and voting-results visibility. **Does not affect voting power.**

**Contribution points**
: The *earned* axis. An integer count that only ever increases (no loss, no demotion). Accrued on meaningful interactions (cast a vote, download a guide, etc.). Determines voting power and acts as the input to per-feature point guards. **Does not unlock premium content.**

**Contribution level**
: A display-only bucket derived from `contribution_points` (e.g., a badge the user sees on their profile). Not a stored field. The source of truth is `contribution_points`.

**Voting power**
: How much a user's vote counts in audience polls. A function of `contribution_points` **only**. The subscription tier has no effect on voting power.

**Point guard**
: A per-feature check of the form "requires at least N points." Used to limit or block an interaction for users below the threshold (e.g., "voting on the paper selection requires 10 points"). Each feature picks its own N; there is no global level → feature mapping.

**Unlock**
: An affordance shown to a user whose subscription tier doesn't cover gated content, prompting them to upgrade. **Contribution points never unlock content** — unlocks are purely a tier concern.

## Voting

**Vote**
: A cast choice on a poll. The platform hosts several poll *types* — paper selection, challenge selection, save-or-rip override, and B.A.R. verdict — each with different eligibility and counting rules.

**Proposal**
: A draft paper or challenge authored by a Planning Committee member. Drafts are not public; an admin or super-admin publishes a draft, at which point it becomes a candidate in an audience vote. Non-committee users do not propose directly.

**Draft queue**
: The admin-facing list of committee-authored proposals awaiting publication (or revision / rejection).

## Data stores

**Postgres**
: The integrity-critical store. Home of users, roles, tiers, contribution levels, vote tallies, payments, and anything with referential integrity requirements.

**MongoDB / Mongo**
: The document store. Home of CMS blog posts, challenge proposals (pre-approval), activity feed items, and media metadata.

## Processes

**Invite**
: The mechanism by which a staff member is added. Super-admin invites admins; admins invite content creators. Invites are sent by email or phone and require the invitee to verify and set up an account.

**Promote / demote**
: Changing a user's role (e.g., admin → content creator) or tier (e.g., free → premium). Always performed by someone with sufficient permissions; always audit-logged.

**Ban**
: Revoking a user's ability to sign in while preserving their data for record-keeping. Reversible.
