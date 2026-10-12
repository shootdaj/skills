# Direction: House report

## Contents
- When this direction applies
- Palette and type
- Structure: pyramid, not journey
- Layout
- Charts
- Metadata strip

For reports, audits, analyses, benchmarks, post-mortems, and findings writeups. Documents that get **read and forwarded**, not operated.

Reports are not control surfaces. They do not get an app bar, a navigation rail, or a FAB.

## When this direction applies

- Test reports, design reports, security reviews, research writeups
- Anything whose job is to deliver a verdict and let a motivated reader verify it

## Palette and type

Dark-first, with a light theme still provided through tokens.

| Token | Value |
| --- | --- |
| Background | `#0B0F17` |
| Cyan (primary accent) | `#3DC5FF` |
| Green (positive) | `#3DDC97` |
| Amber (caution) | `#FFC24B` |

- Display: **Sora**
- Body: **Schibsted Grotesk**
- Data and metadata: **JetBrains Mono**, `tabular-nums` wherever digits align

One accent. Green and amber are semantic status, not second and third accents.

## Structure: pyramid, not journey

The reader is deciding whether to keep reading. Give them the answer first.

The first screen must carry:

1. **The verdict** in one line. The single most important sentence.
2. **Headline metrics** or one summary visual. The 3-6 numbers that frame everything.
3. **Key takeaways.** Each self-contained. Never "as discussed below".

Everything after that is support, not suspense. Heavy material goes into collapsible `<details>` sections so the page is short when skimmed and long when interrogated.

## Layout

- Left-rail navigation, persistent, for jumping between sections.
- Collapsible `<details>` sections, one consistent component, for evidence and detail.
- Prose column near 65 characters. Wide content (tables, code, diagrams) gets its own `overflow-x: auto` container so the body never scrolls sideways.

## Charts

Charts must earn their ink. A chart restating two numbers is noise; a distribution, trend, or comparison across many items is worth drawing. Default to a clean table or stat tiles otherwise. Recipes: [dataviz-motion.md](dataviz-motion.md).

## Metadata strip

Small and tasteful, so the report is self-locating: date, author, subject (repo, URL, dataset), scope, version or commit.

## Honesty

State limits explicitly. If a finding is uncertain, say so in the report rather than in the covering message. If part of the scope was skipped, name it and say why.
