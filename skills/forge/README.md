# Forge

A Claude Code skill that scaffolds and configures projects with your full development workflow: spec-driven TDD, GSD planning, Superpowers code review, GitHub Actions CI/CD, and enforced expertise tracking.

Run `/forge` in any project and it sets up everything — directory structure, CLAUDE.md, CI/CD workflows, expert files — so every project starts exactly how you work.

## Usage

```
/forge cli                 # CLI tool (Bun, bun:test, GitHub Releases)
/forge web                 # Web app (Vite, vitest, Vercel)
/forge desktop             # Electron app (Vite + Electron, GitHub Releases)
/forge mobile              # Flutter app (flutter test, GitHub Releases)
/forge monorepo            # Multi-platform (combines above)
/forge                     # Auto-detect from existing project files
```

### Presets

```
/forge web full            # GSD + Superpowers + spec TDD (default)
/forge cli gsd-only        # GSD + spec TDD, no Superpowers
/forge web minimal         # Spec TDD only
```

## What It Creates

| File/Dir | Purpose |
|----------|---------|
| `CLAUDE.md` | Workflow rules: spec TDD, git flow, GSD config, expert enforcement |
| `.github/workflows/ci.yml` | Test on PR (bun test / flutter test) |
| `.github/workflows/release.yml` | Auto-release (semantic-release or custom) |
| `experts/_template.md` | Expert file template |
| `experts/{domain}.md` | Seeded expert file for the app type |
| `src/` or `lib/` | Directory scaffold matching app type |
| `vercel.json` | Vercel config (web apps only) |

## Templates

### CLI (`/forge cli`)
- **Runtime**: Bun
- **Tests**: bun:test, co-located `*.test.ts`, E2E with `*.e2e.test.ts`
- **CI/CD**: GitHub Actions → Bun compile → GitHub Releases
- **Structure**: `src/commands/`, `src/core/`, `src/utils/`, `test-fixtures/`
- **Expert**: `cli-architecture.md`

### Web (`/forge web`)
- **Runtime**: Bun + Vite
- **Tests**: vitest, Playwright for E2E
- **CI/CD**: GitHub Actions → semantic-release → Vercel auto-deploy
- **Structure**: `src/components/`, `src/pages/`, `src/hooks/`, `e2e/`
- **Expert**: `frontend.md`

### Desktop (`/forge desktop`)
- **Runtime**: Bun + Vite + Electron
- **Tests**: vitest, Playwright for E2E
- **CI/CD**: GitHub Actions → semantic-release → multi-platform build → GitHub Releases
- **Structure**: `src/`, `electron/main.ts`, `electron/preload.ts`, `e2e/`
- **Expert**: `electron-ipc.md`

### Mobile (`/forge mobile`)
- **Runtime**: Flutter/Dart
- **Tests**: flutter test, integration_test/
- **CI/CD**: GitHub Actions → semantic-release → flutter build apk → GitHub Releases
- **Structure**: `lib/screens/`, `lib/widgets/`, `lib/services/`, `test/`
- **Expert**: `mobile-platform.md`

### Monorepo (`/forge monorepo`)
- **Runtime**: Mixed (Bun + Flutter)
- **Tests**: Per-package test runners
- **CI/CD**: semantic-release at root → parallel platform builds
- **Structure**: `packages/desktop/`, `packages/mobile/`, `packages/web/`, `packages/shared/`
- **Expert**: `monorepo-sync.md`

## Workflow Configured

The generated CLAUDE.md enforces this workflow:

```
/forge {type}          → Project scaffolded with all config
/gsd:new-project       → Requirements + roadmap
/gsd:plan-phase N      → Plans use spec-driven TDD
/gsd:execute-phase N   → For each plan:
                           1. Brainstorm (Superpowers, if complex)
                           2. Write failing spec (RED)
                           3. Implement (GREEN)
                           4. Refactor
                           5. Code review (Superpowers)
                           6. Update expert file
```

## CLAUDE.md Sections Generated

- **Rules**: No rm (use Trash), no git init (use gh), search before guessing, no low-star libs
- **Stack**: Language, runtime, test runner, CI/CD, deploy target
- **Git Workflow**: GitHub Flow, feature branches, semantic commit format, no force pushes
- **Testing**: Spec-driven TDD with RED-GREEN-REFACTOR, stack-specific spec format
- **GSD Workflow**: TDD plans use specs, commit order, spec suite as definition of done
- **Superpowers**: Brainstorm before complex work, review after each plan
- **Expertise Tracking**: Enforced expert file updates after code changes

## Prerequisites

| Preset | Requires |
|--------|----------|
| `full` | [GSD](https://github.com/get-shit-done/gsd) + [Superpowers](https://github.com/obra/superpowers) |
| `gsd-only` | GSD |
| `minimal` | Nothing extra |

The skill checks for missing prerequisites and offers to continue anyway, switch preset, or cancel.

## Installation

```bash
# Copy to your Claude Code skills directory
cp -r forge ~/.claude/skills/

# Or symlink
ln -s /path/to/forge ~/.claude/skills/forge
```

## License

CC BY-NC-SA 4.0
