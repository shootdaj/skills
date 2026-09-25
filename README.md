# skills

My portable [agent skills](https://skills.sh) for **Claude Code**, **Codex**, **Cursor**, and **Hermes** — one source of truth, synced across every machine (laptop, work box, remote servers).

Each shared skill is symlinked into all four harnesses so an edit + `git pull` propagates everywhere.

## Bootstrap Claude Code + Codex (one command, per machine)

```bash
npx skills add shootdaj/skills --skill '*' -g -a claude-code -a codex
```

- `--skill '*'` — all skills in this repo
- `-g` — global (user-level: `~/.claude/skills/`, `~/.codex/skills/`)
- `-a claude-code -a codex` — install into both agents

Just one? `npx skills add shootdaj/skills --skill report-publisher -g -a claude-code -a codex`

When creating or updating a reusable skill, use `create-skill-ccch`. It maintains
the shared source and installs symlinks for Claude Code, Codex, Cursor, and Hermes.

## Update (after `git push` from any machine)

```bash
npx skills update -g
```

## Skills

| Skill | What it does |
|-------|--------------|
| **dj-show-prep** | Overnight DJ gig prep, end to end: one question round (source, similar-songs engine, track count, analysis, library, report, run mode), a plan the user confirms, then source → Soulseek → verify → Mixed In Key → harmonic set → `.m3u8` for rekordbox (Lexicon opt-in) → playable vibe-check page. Composes the five `dj-*` skills below. |
| **dj-source-tracks** | Tracklist → download CSV from Spotify web (scraper that checks its count against the page header), a screenshot/photo the agent transcribes itself, pasted text, Lexicon/rekordbox playlists; expand with Spotify mixes, artist fan-out, or the user's own crates; skips owned tracks, remix-aware. |
| **dj-soulseek-download** | sockseek batch downloads, ffmpeg full-decode verification, re-fetch of rejects, Mixed In Key headless tagging, aubio BPM fallback. |
| **dj-set-builder** | Phased set order by Camelot walk with rising energy/BPM, blend partners, waveform peaks, `.m3u8` export. |
| **dj-lexicon-playlists** | Lexicon Local API playlists with verified counts, NFC-safe file matching, safe Lexicon → rekordbox sync (Modified, never Full), USB export notes. |
| **dj-vibe-report** | The "am I good for tonight" page: playable playlists with key/BPM/energy, transitions, waveforms, blend preview, checklist; published to here.now. |
| **report-publisher** | Build and publish polished HTML reports. Includes the image-led `visual-product-shortlist` template, which is the default for shopping and product comparisons. |
| **lazada-shopping** | Research Lazada Thailand in the user's logged-in browser, compare live listings and cart items, and publish a scored visual shortlist with photos and direct links. |
| **recap** | Fast "catch me up / where are we" status when returning to a project after time away. |
| **capcut-draft-builder** | Generate a working CapCut desktop draft from a timeline/EDL so an exact edit can be recreated in CapCut. |
| **gopy** | (Codex) Go ↔ Python workflow helper. |
| **ui-ux-pro-max** | UI/UX design intelligence — styles, palettes, font pairings, component/stack guidance for building and reviewing interfaces. |
| **frontend-design** | Create distinctive, production-grade frontend interfaces with high design quality (avoids generic AI-template look). |
| **forge** | Scaffold and configure projects with spec-driven TDD, GSD, Superpowers, CI/CD, and enforced expertise tracking. |
| **graphify** | Turn any input (code, docs, papers, images) into a knowledge graph → clustered communities → HTML + JSON + audit report. |
| **caveman** | Ultra-compressed "caveman" communication mode — cuts token usage while keeping technical accuracy. |
| **grillme** | Deep-interview mode (RU) — asks probing questions to fully scope a topic before work begins. |
| **clean-my-ai-harness-codex** | (Codex) Map the harness Codex can see and prepare a safe cleanup plan after model/instruction changes. |
| **use-claude** | (Codex) Delegate implementation or frontend work to real Claude Code from Codex. |
| **create-skill-ccch** | Create, validate, globally install, and publish one shared skill for Claude Code, Codex, Cursor, and Hermes. |
| **design-flow** | Design engine: infers what it can, asks the rest at one of three levels (quick, medium, detailed), shows three looks on a swatch board, builds, verifies with Playwright, publishes per the calling door's profile. |
| **anshul-design** | Personal door on top of design-flow: sets the personal profile. Copy it to make your own flavour. The Aya flavour (`helix-design-anshul`) lives in AyaHelix/skills. |
| **anshul-ui-standards-v2** | House mechanics the engine applies. Same rules as `anshul-ui-standards` minus the fixed Material chassis and report palette. v1 stays for older work. |
| **azure-static-publish** | Publish or redeploy a static folder to Azure Static Web Apps behind SSO, with owner-suffixed names, owner tags and a sandbox subscription. Ships with a one-command script; pairs with the `azure-publisher` Claude Code subagent. |
| **anshul-ui-standards** | Apply Anshul’s Material-grade UI house rules for structure, theming, interaction, data visualization, motion, and screenshot verification. |
| **apple-design** | Apply Apple’s fluid-interface principles to web UI: interruptible springs, direct manipulation, momentum, materials, typography, and accessibility. |

> The last several are vendored copies of third-party skills for portability across my machines; they carry their upstream authors' credit and licenses.

## Layout

```
skills/
  <skill-name>/
    SKILL.md            # name + description frontmatter, then instructions
    references/ …       # loaded on demand
    assets/ …           # templates/files (never enter context unless read)
```

Each folder is a standalone skill. Add a new one by dropping a `skills/<name>/SKILL.md` and pushing; machines pick it up on the next `npx skills add … --skill '*'` (or `npx skills update`).
