# skills

My portable [agent skills](https://skills.sh) for **Claude Code** and **Codex** — one source of truth, synced across every machine (laptop, work box, remote servers).

Installed with the [`skills`](https://github.com/vercel-labs/skills) CLI, which symlinks each skill into both agents so an edit + `git pull` propagates everywhere.

## Install everything (one command, per machine)

```bash
npx skills add shootdaj/skills --skill '*' -g -a claude-code -a codex
```

- `--skill '*'` — all skills in this repo
- `-g` — global (user-level: `~/.claude/skills/`, `~/.codex/skills/`)
- `-a claude-code -a codex` — install into both agents

Just one? `npx skills add shootdaj/skills --skill report-publisher -g -a claude-code -a codex`

## Update (after `git push` from any machine)

```bash
npx skills update -g
```

## Skills

| Skill | What it does |
|-------|--------------|
| **report-publisher** | Build a polished, professional report as a single self-contained HTML page and publish it permanently to here.now. Big-picture-first, collapsible sections, Material dark, charts only where they earn ink. Ships a `security-dossier` template. |
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
