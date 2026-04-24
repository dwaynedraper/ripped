# Ripped or Stamped — Show Premise (condensed)

> *This is the engineering-facing summary of the YouTube series this platform exists to serve. It is a compressed distillation of the show's source documents, kept short on purpose. If a detail here contradicts a signed-off platform decision, the platform decision wins — but flag the contradiction so the show's owner can reconcile.*

## One-line premise

A radical-reality print-photography show where every episode ends in a **binary verdict**: the print is **STAMPED** (archived as a Blueprint) or **RIPPED** (physically destroyed on camera and filed as a failure artifact). No reshoots. No coverups. The print is the final judge.

## Why the platform exists

Audience participation is engineered into the show's structure, not bolted on. The platform *is* the audience — and the audience casts the votes that select each episode's paper, its challenge, and (rarely) overrides the judges' verdict. Premium members also unlock the show's deepest technical content.

## Core values

- **The architect theme.** Dean (the Architect) researches the *paper* first, then designs the shoot around it. Form follows function; the function is physical. This is not "take photos, then pick paper."
- **Consequence is the product.** If the print fails, it is destroyed on camera. If staff votes accidentally killed a print, so be it. The system is honest on camera.
- **Standards, not encouragement.** Judges' job is to protect the stamp, not to be kind.

## The seven chapters (the ritual each episode follows)

1. **The Planning Committee** — select the paper and the challenge. Output: one-page Build Brief.
2. **Research and Advice** — paper strategy. What rewards it, what punishes it, the plan to control risk.
3. **Groundbreaking** — the shoot, under the locked constraint. Unscripted.
4. **Structural Analysis** — edit for the paper (soft-proofing, black rolloff, highlight shoulders, test strips).
5. **The B.A.R.** — pre-print critique. Judges predict where it will fail.
6. **Final Inspection** — the physical print is revealed under real light. No test-strip shortcuts.
7. **The Verdict** — STAMPED or RIPPED. Binary. No "almost."

The ritual is the product. It must be consistent episode to episode.

## The verdict rubric — the B.A.R.'s three pillars

Every finished print is scored across three pillars:

1. **Structural Integrity (the Substrate)** — physical perfection. No cockling, head strikes, feed errors. **Zero-tolerance gate:** if this pillar fails, the print is an **automatic RIP** regardless of the other two.
2. **The Constraint (the Challenge)** — did the Architect obey the Planning Committee's trap?
3. **Aesthetic Value (the Soul)** — is the image museum-quality and worthy of the final exhibition?

Decision logic:

- **3/3 passes → STAMPED.**
- **0/3 or 1/3 passes → RIPPED.**
- **2/3 passes (must include Pillar 1) → Judge's Call.** The B.A.R. deliberates.
  - *Substrate + Challenge, but ugly:* does technical effort save it?
  - *Substrate + Aesthetic, but the trap was missed:* is the art so good the rule doesn't matter?

## Actors in the show

| Actor | Who they are | What they do on the platform |
|---|---|---|
| **The Architect** (Dean) | Lead builder; subject of judgment | Cannot vote. Everything else is happening *to* him. |
| **The B.A.R.** | 15-member judging panel (photographers, printers, designers, guests). Always an odd number so there is no tie. | Publicly displayed on "The Panel" page. **Their verdict scoring is off-platform** — panelists score on physical cards with pens, Survivor-style hidden ballots, read at the end of the video. The platform does *not* host verdict voting. |
| **The Planning Committee** | Smaller working group | Draft candidate papers and challenges. Drafts are reviewed and **published by Dean or an admin** before audience voting. Initially Dean alone (with AI assist); grows into trusted community members and B.A.R. members over time. |
| **The Audience** | The community | Vote on paper selection and challenge selection for each episode. |

## Voting structure

The platform hosts exactly two poll types per episode. The B.A.R.'s verdict is **off-platform** (see Actors table).

| Poll type | Who votes | When it opens | What it decides |
|---|---|---|---|
| **Paper selection** | All users except the Architect | Stage 1 of each episode | Which paper the episode will use, from candidates drafted by the Planning Committee and published by an admin |
| **Challenge selection** | All users except the Architect | Stage 2 of each episode (after paper is chosen) | Which challenge the episode will run, from drafts published the same way |

> *Formerly-considered "Save or Rip" audience override is **out of scope for the platform**. If it ever happens, it's an in-person filming moment, not a site feature — keeping it off-platform protects the stamp.*

**Constraint format** (what the challenge's "Trap" looks like):

- One enforceable sentence. The Planning Committee **may not** choose the subject or the location.
- Enforceability is the standard — no loopholes. Examples: *"Every frame must be shot using only a single candle as the light source."* / *"The camera must never leave ground level."*
- Challenges also carry a **Benchmark** (Part A): a technical or emotional outcome the final print must clear.

## Artifacts (first-class entities in the platform)

| Artifact | What it is | Lifecycle |
|---|---|---|
| **Blueprint** | A stamped print + full documented recipe (lighting intent, capture decisions, edit decisions, print settings, handling notes, failure warnings) | Created on STAMPED verdict. Public. Permanent. |
| **Demolition** | A ripped print, archived as failure evidence | Created on RIPPED verdict. Permanent. |
| **Specimen Bag** | The sealed physical container for a ripped print | Physical object; the platform stores a reference (ID, date, episode, paper, reason) |
| **The Locker** | The physical archive of Specimen Bags | Represented on the platform as a browsable failure gallery |
| **Unpermitted piece** | A print that survived fabrication but did not earn approval | Can be judged, but does not become a Blueprint |
| **The Architect's Vault** | Premium-gated library of deep technical reports, one per paper (ICC profiles, custom media types, power-user settings) | Created at or after the episode. Gated to premium subscribers. |

## Show-wide concepts

- **The Beast** — the Canon PRO-1100 printer on which every print is produced.
- **The New Standard** — the five-paper set that will eventually be locked in as Sharp Sighted Studio's deliverable standard. Papers earn their place through repeated wins under constraints.
- **Final Exhibition** — the culminating event (ticketed, auction-ready) at the end of the 50+ episode arc, featuring the surviving stamped work.
- **Brand pillars** (used in copy, not code): *Stay Sharp. Stay Seen. Stay Human.*

## Hard rules the platform must support

These are non-negotiable. They exist in code because they're what makes the show's standard mean something.

- **The Architect cannot vote on his own show.** Hard-coded at the voting layer for the super-admin.
- **No secret reprints.** Once an episode's print is produced, a re-do requires a new episode.
- **B.A.R. verdicts are final** unless a Save-or-Rip override is explicitly run.
- **Every episode ends in a binary verdict.** No "partial" state.
- **Paper comes before image.** The platform's episode model enforces chapter order: paper selected → challenge selected → shoot → edit → verdict.

## What this means for platform engineering

The high-leverage implications:

- An **Episode** is a first-class entity with a strict state machine (paper_selected → challenge_selected → in_production → bar_reviewed → verdict_cast → archived).
- **Papers, Challenges, Blueprints, and Demolitions** are first-class entities, each tied to episodes.
- The **voting system** must support multiple poll types with per-type eligibility rules. This is more than a single "polls" table.
- The **Architect's Vault** is a real product, not a marketing afterthought. Its content lives in Mongo (document-shaped technical reports with embedded images, downloadable files, metadata).
- The **B.A.R. verdict** is a specialized vote with a three-pillar structure — model it separately from audience polls.

## What this does *not* change

- The identity model (`identity-model.md`) stands. The only role-relevant additions from the show premise are the **B.A.R. member** and **Planning Committee member** flags (ADR-0015).
- The database split (`decision-log.md` ADR-0002) stands: Postgres for episodes, verdicts, tier gates, vote tallies; Mongo for Vault reports, blog content, proposal drafts.
- The "no free-text UGC in v1" decision (ADR-0004) stands: the audience expresses itself through structured votes, not comments. Save-or-Rip overrides are also structured votes.

---

*Last updated 2026-04-23. When the show's format evolves (new chapter, new poll type, new artifact), update this file in the same PR that updates the code.*
