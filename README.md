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

## Layout

```
skills/
  <skill-name>/
    SKILL.md            # name + description frontmatter, then instructions
    references/ …       # loaded on demand
    assets/ …           # templates/files (never enter context unless read)
```

Each folder is a standalone skill. Add a new one by dropping a `skills/<name>/SKILL.md` and pushing; machines pick it up on the next `npx skills add … --skill '*'` (or `npx skills update`).
