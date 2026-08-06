---
name: report-publisher
description: >
  Build a polished, professional report as a single self-contained HTML page and
  publish it permanently to here.now, returning a shareable live URL. The report
  leads with the big picture (key takeaways, headline metrics, verdict) and pushes
  supporting detail into collapsible sections, using charts, tables, and diagrams
  only where they carry real information. Dark-mode by default, sharp modern design
  with CDN libraries (D3, Three.js, Framer Motion) pulled in when they add value.
  Use this whenever the user wants to publish, host, share, or put a report online —
  a security review, audit, research writeup, analysis, findings summary, status
  report, benchmark, post-mortem, competitive teardown, or "turn this into a
  shareable report / write this up / make a report page / publish this to here.now."
  Trigger even when the user says "write up my findings," "make this presentable,"
  or "share this as a link," as long as the deliverable is a hosted report page.
---

# Report Publisher

Turn analysis, findings, or research into a **single polished HTML report** and
**publish it permanently to here.now**, then hand the user a live URL.

The job has two halves that matter equally: the report must be genuinely good to
read (structured, digestible, honest), and it must actually land online as a
permanent link. Getting the writeup right but leaving it as a local file, or
publishing something that expires in 24 hours, both count as failing the task.

## Choose the report template

Read `assets/templates/INDEX.md` before structuring the report. Offer the user a
short template choice unless they already named a template or their requested
format makes the choice explicit:

- **Standard Pyramid** — verdict, headline metrics, takeaways, persistent
  navigation, and collapsible evidence. Best for audits, research, benchmarks,
  status reports, post-mortems, and findings-heavy work.
- **Visual Product Shortlist** — the default for shopping and product-comparison
  reports; the validated **Material 3 Standard Feed (Template A)** with a real app
  bar, functional filter chips, and a responsive ranked, image-led card grid.
  Cards carry scores, decision/cart badges, price/value, concise facts, verdict,
  and direct links. Best for shopping research, recommendations, vendor/venue
  shortlists, and other discrete visual choices.

Make this a **non-blocking choice**. State the recommended template and say that
you will use it if the user does not answer. When the environment supports a
timed or auto-resolving input, allow about 60 seconds; otherwise present the two
options in commentary and continue with the recommendation. Do not stall a report
because the user ignored template selection.

Choose the default from the content:

- Default to **Visual Product Shortlist** for shopping, buying research, product
  comparisons, wishlists/cart reviews, and recommendation reports. Also use it
  when there are 4–12 comparable items with real images and direct action links,
  or when the user asks for a highly visual report with minimal text.
- Default to **Standard Pyramid** for analytical or evidence-heavy reports.
- If the fit is ambiguous, use **Standard Pyramid** as the fallback default.

## Required frontend ownership

Real Claude Code using the **Fable model** owns report creation and frontend
design, and must use the `frontend-design` skill for the visual build.

- In Claude Code, stay on Fable and read and follow `frontend-design` directly.
- In Codex, read and follow `use-claude`; invoke real Claude Code explicitly with
  `--model fable`, send it the verified report data, selected template, and exact
  links, and instruct it to use `frontend-design`.
- In Cursor or Hermes, use the configured Claude delegation route. If none is
  available, report the blocker instead of silently designing the frontend with
  another model.

Codex may prepare and verify data, orchestrate the task, publish the finished
HTML, and inspect the live result. It must not substitute for Claude on the
report frontend.

## The one rule that governs everything: pyramid, not journey

A report reader is a busy person deciding whether to keep reading. Give them the
answer first. The top of the page must let someone who reads only the first
screen walk away knowing the verdict, the numbers that matter, and what to do
about them. Everything below exists to let a motivated reader verify and go
deeper — it is support, not suspense.

In the Standard Pyramid template, this is why detail lives in **collapsible
sections**: the page should be short when skimmed and long when interrogated. In
the Visual Product Shortlist template, the same principle is expressed through a
decision strip followed immediately by concise image cards; there is no separate
methodology or long-form body to collapse.

Concretely, every Standard Pyramid report opens with:
- **A one-line verdict / thesis** — the single most important sentence.
- **Headline metrics or a summary visual** — the 3–6 numbers or one chart that
  frame the whole thing (counts, severity breakdown, pass rate, deltas).
- **Key takeaways** — a tight bulleted or tabular list of what matters, each
  point self-contained (no "as discussed below").

Then, and only then, the body — with the heavy material folded away. A Visual
Product Shortlist instead opens with a compact Material app bar and immediately
useful filter chips, then moves directly into the ranked card grid. The #1 card
must make the top recommendation obvious without adding an editorial preamble.

## Workflow

1. **Gather the substance.** Pull the real content from the conversation, files,
   or prior work. If findings came from earlier in the session (a review, an
   audit, research), use those actual results — never invent or pad. If the
   source material is thin, say so rather than inflating it with filler.

2. **Select and structure the template.** Offer the non-blocking choice above,
   then proceed with the recommendation if the user does not answer. For Standard
   Pyramid, decide the verdict, headline metrics, and 3–6 takeaways, then group
   detail into collapsible sections. For Visual Product Shortlist, decide the
   primary buy/keep/skip actions, rank the candidates, and reduce each item to one
   image, score, price/value, up to three facts, one-line verdict, and one CTA.
   Use the validated Template A app-bar, filter-chip, and card-grid structure.

3. **Decide what genuinely needs a visual.** Read `references/design-system.md`
   → "Charts: earn the ink" before adding any chart. A chart that just restates
   two numbers is noise; a severity distribution, a trend, a comparison across
   many items, or a relationship is worth drawing. Default to a clean table or
   stat tiles unless a graph reveals something text can't.

4. **Have Claude build the HTML through the `frontend-design` skill, using the
   selected template correctly.** Check `assets/templates/INDEX.md` for whether the asset
   is a style reference or a layout template. For a style reference such as
   `material-dark.html`, **lift its visual system** — theme tokens, tonal
   surfaces, Material components (pill buttons, tiles, collapsible panels with the
   icon-button + ripple, the persistent nav, the D3 recipe), and interaction rules
   — and **build the structure around the actual report.** Do NOT copy the file and
   swap words: a benchmark, a research writeup, and a security review each need a
   different structure (different sections, maybe no severity tiles, a different or
   no chart). Design that structure for the content, then dress it in the reference's
   style so it stays consistent with your other reports. For a layout template
   such as `visual-product-shortlist.html`, preserve its card-led information
   structure while replacing all example data, photos, links, labels, and accent
   semantics with verified content. Always
   invoke the `frontend-design` skill for the visual build. It's the purpose-built skill for
   distinctive, production-grade UI and exists precisely to avoid the generic
   AI-template look a report should never have. Do not hand-roll the visual layer
   from scratch when that skill is available — a report is a frontend artifact and
   deserves the same craft. Feed it the structure and constraints from this skill
   (dark mode, pyramid, TOC, one consistent collapsible-panel component, charts
   that earn their ink, metadata strip) and let it drive typography, layout,
   color, motion, and polish. `references/design-system.md` is the constraint
   sheet that keeps `frontend-design`'s output on-spec — read it in full for the
   dark theme tokens, layout, collapsible pattern, metadata block, and the library
   menu (when to reach for D3 / Three.js / Framer Motion / plain CSS, and how to
   borrow patterns from 21st.dev and Mobbin). Produce one self-contained
   `index.html` in a fresh directory.

5. **Publish permanently and verify.** Read `references/publishing.md` and follow
   it exactly — permanence requires a saved here.now API key, so a plain publish
   is not enough. Confirm the returned URL resolves before reporting done.

6. **Report the outcome.** Give the user the live URL, state plainly that it's
   permanent (or flag if you could only get an anonymous 24h link), and briefly
   note what's in the report.

## Non-negotiables (from hard experience)

- **Dark mode by default.** Professional dark palette, easy on the eyes, no
  bright-white glare. The Visual Product Shortlist also carries Template A's
  deliberate persistent light/dark toggle; dark remains the initial presentation.
- **Minimize fluff and redundancy.** Say a thing once, in the right place. Cut
  throat-clearing intros, restated section summaries, and hedge words. Density is
  a feature; padding insults the reader.
- **Professional register.** This is a document someone forwards to their boss or
  a client. Confident, precise, plain. No emoji sprinkled as decoration, no
  marketing tone, no cutesy asides.
- **Self-contained and sharp.** One HTML file. Libraries via CDN `<script>`/`<link>`
  (here.now hosts real sites, so external CDNs load fine — unlike sandboxed
  artifacts). Inline your own CSS/JS. It must look deliberate and modern, not like
  a default template.
- **Show meta info when it applies.** A small, tasteful metadata strip — date,
  author/reviewer, subject (repo/URL/dataset), scope, version/commit — so the
  report is self-locating. Read the metadata guidance in the design reference.
- **Libraries and design refs earn their place.** Three.js because a 3D view
  clarifies something, not for a spinning cube. Framer Motion for a purposeful
  reveal, not motion everywhere. Pull a component pattern from 21st.dev or a
  layout cue from Mobbin when it genuinely sharpens the design — skip them when
  plain HTML already reads well.
- **Template rules are intentional.** Standard Pyramid uses the persistent nav
  and collapsible-detail system. Visual Product Shortlist uses the validated
  Material 3 Standard Feed (Template A): app bar, working filter chips, responsive
  ranked cards, large photos, decision/cart chips, and direct CTAs. It deliberately
  omits report navigation, collapsibles, charts, methodology, and comparison tables.

## When to read the references

- `assets/templates/INDEX.md` — before structuring the report. Template names,
  types, selection guidance, and which structure to preserve.
- `references/design-system.md` — before writing any HTML. Dark theme tokens,
  the pyramid layout, collapsible/`<details>` pattern, metadata strip, chart
  decision guide + D3 recipes, the animation/3D library menu, and how to use
  21st.dev / Mobbin. This is the craft core of the skill.
- `references/publishing.md` — before publishing. How to publish to here.now
  **permanently** (API-key check, the email sign-in flow if absent), how to
  verify, and exactly what to tell the user.
