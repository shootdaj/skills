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

## The one rule that governs everything: pyramid, not journey

A report reader is a busy person deciding whether to keep reading. Give them the
answer first. The top of the page must let someone who reads only the first
screen walk away knowing the verdict, the numbers that matter, and what to do
about them. Everything below exists to let a motivated reader verify and go
deeper — it is support, not suspense.

This is why detail lives in **collapsible sections**: the page should be short
when skimmed and long when interrogated. A reader chooses their own depth. Never
make someone scroll through methodology to reach the conclusion.

Concretely, every report opens with:
- **A one-line verdict / thesis** — the single most important sentence.
- **Headline metrics or a summary visual** — the 3–6 numbers or one chart that
  frame the whole thing (counts, severity breakdown, pass rate, deltas).
- **Key takeaways** — a tight bulleted or tabular list of what matters, each
  point self-contained (no "as discussed below").

Then, and only then, the body — with the heavy material folded away.

## Workflow

1. **Gather the substance.** Pull the real content from the conversation, files,
   or prior work. If findings came from earlier in the session (a review, an
   audit, research), use those actual results — never invent or pad. If the
   source material is thin, say so rather than inflating it with filler.

2. **Structure as a pyramid.** Decide the verdict, the headline metrics, and the
   3–6 takeaways before writing any HTML. Group the detail into sections that
   each collapse. Draft the information architecture first; the visual polish
   comes after the structure is right.

3. **Decide what genuinely needs a visual.** Read `references/design-system.md`
   → "Charts: earn the ink" before adding any chart. A chart that just restates
   two numbers is noise; a severity distribution, a trend, a comparison across
   many items, or a relationship is worth drawing. Default to a clean table or
   stat tiles unless a graph reveals something text can't.

4. **Build the HTML — start from a template if one fits, through the
   `frontend-design` skill.** First check `assets/templates/INDEX.md`: if a
   template matches the shape of the report (e.g. `security-dossier.html` for any
   findings/severity/audit-style report), copy it and replace the content in its
   marked slots — the shell already satisfies every design rule, so you skip
   rebuilding it and just adapt. If nothing fits, build fresh. Either way, always
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
  bright-white glare. Light mode only if the user asks.
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

## When to read the references

- `references/design-system.md` — before writing any HTML. Dark theme tokens,
  the pyramid layout, collapsible/`<details>` pattern, metadata strip, chart
  decision guide + D3 recipes, the animation/3D library menu, and how to use
  21st.dev / Mobbin. This is the craft core of the skill.
- `references/publishing.md` — before publishing. How to publish to here.now
  **permanently** (API-key check, the email sign-in flow if absent), how to
  verify, and exactly what to tell the user.
