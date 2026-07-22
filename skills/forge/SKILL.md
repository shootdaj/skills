---
name: forge
description: "Scaffold and configure projects with spec-driven TDD, GSD, Superpowers, CI/CD, and enforced expertise tracking"
author: anshul
---

# Forge

Your personal project framework. Detects your stack, scaffolds the structure, wires up CI/CD, configures spec-driven TDD, and enforces expertise tracking — so every project starts exactly how you work.

## Usage

```
/forge cli                 # New CLI tool (Bun, GitHub Releases)
/forge web                 # New web app (Vite, Vercel)
/forge desktop             # New Electron app (Vite + Electron, GitHub Releases)
/forge mobile              # New Flutter app (GitHub Releases → stores)
/forge monorepo            # Multi-platform (combines above)
/forge                     # Auto-detect from existing project files
```

### Presets (optional second argument)

```
/forge web full            # GSD + Superpowers + spec TDD (default)
/forge cli gsd-only        # GSD + spec TDD, no Superpowers
/forge web minimal         # Spec TDD only, no GSD or Superpowers
```

## What Forge Does

1. Detects or accepts the app type
2. Scaffolds directory structure (if dirs don't exist)
3. Generates CLAUDE.md with your workflow rules
4. Creates GitHub Actions CI/CD workflows
5. Seeds expert files for the domain
6. Configures test runner and spec format
7. Reports what was created

## Workflow

### Step 1: Parse Arguments

Read `$ARGUMENTS` to determine:
- **App type**: First word — `cli`, `web`, `desktop`, `mobile`, `monorepo`, or empty (auto-detect)
- **Preset**: Second word — `full` (default), `gsd-only`, `minimal`

**Auto-detection** (if no app type given): Scan the current directory:
- `electron/` or `electron-builder.json` → desktop
- `pubspec.yaml` → mobile
- `packages/` or `apps/` with multiple sub-projects → monorepo
- `bin` field in package.json or `src/cli.ts` → cli
- `vite.config.*` or React/Vue/Svelte in deps → web
- If ambiguous, ask the user

### Step 2: Check Prerequisites

**Based on preset, check for required plugins:**

For `full`:
1. **GSD**: `~/.claude/get-shit-done/` or `~/.claude/commands/gsd/` exists
2. **Superpowers/Brainstorming**: `~/.claude/skills/brainstorming/` exists

For `gsd-only`:
1. **GSD**: Same as above

For `minimal`:
- No plugins required

**If missing**, show:
```
## Missing Prerequisites

The "{preset}" preset needs:

{if GSD missing:}
- GSD (Get Stuff Done): https://github.com/get-shit-done/gsd

{if Brainstorming missing:}
- Superpowers: https://github.com/obra/superpowers

Options:
1. Continue anyway — CLAUDE.md sections activate once installed
2. Switch preset — use what you have
3. Cancel — install first
```

### Step 3: Scaffold Directory Structure

Create directories that don't already exist. Never overwrite existing files.

<HARD-GATE>
NEVER overwrite existing files. Only create files and directories that don't exist.
If a file exists, skip it and note it in the report.
</HARD-GATE>

#### CLI Template
```
src/
├── index.ts
├── cli.ts
├── commands/
├── core/
├── utils/
└── test-fixtures/
experts/
├── _template.md
.github/workflows/
```

#### Web Template
```
src/
├── main.ts
├── App.tsx
├── components/
├── pages/
├── hooks/
├── utils/
├── styles/
└── test-fixtures/
public/
e2e/
experts/
├── _template.md
.github/workflows/
```

#### Desktop Template
```
src/
├── main.ts
├── App.tsx
├── components/
├── hooks/
├── utils/
└── test-fixtures/
electron/
├── main.ts
├── preload.ts
e2e/
experts/
├── _template.md
.github/workflows/
```

#### Mobile Template
```
lib/
├── main.dart
├── screens/
├── widgets/
├── services/
├── models/
├── utils/
test/
integration_test/
experts/
├── _template.md
.github/workflows/
```

#### Monorepo Template
```
packages/
├── desktop/
│   ├── src/
│   └── electron/
├── mobile/
│   └── lib/
├── web/
│   └── src/
├── shared/
│   └── src/
experts/
├── _template.md
.github/workflows/
```

### Step 4: Create CI/CD Workflows

Generate `.github/workflows/ci.yml` and `.github/workflows/release.yml` based on app type.

**All templates share ci.yml pattern:**
```yaml
name: CI
on:
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # {app-type-specific setup and test steps}
```

#### CLI CI/CD
- **ci.yml**: `bun install` → `bun test` → `bun run typecheck`
- **release.yml**: On push to main → bump version → `bun build --compile` → upload binary to GitHub Release
- No semantic-release (Bun compile needs custom versioning)

#### Web CI/CD
- **ci.yml**: `bun install` → `bun run test` → `bun run typecheck`
- **release.yml**: On push to main → semantic-release → Vercel auto-deploys from main
- Include `vercel.json` with `{ "buildCommand": "bun run build", "outputDirectory": "dist" }`

#### Desktop CI/CD
- **ci.yml**: `bun install` → `bun run test` → `bun run typecheck`
- **release.yml**: On push to main → semantic-release → parallel builds (macOS/Windows/Linux) → upload to GitHub Release
- Matrix strategy: `os: [macos-latest, ubuntu-latest, windows-latest]`

#### Mobile CI/CD
- **ci.yml**: Setup Flutter → `flutter test` → `flutter analyze`
- **release.yml**: On push to main → semantic-release → `flutter build apk` → upload to GitHub Release
- Include proguard-rules.pro for Android release builds

#### Monorepo CI/CD
- **ci.yml**: Test all packages in parallel (matrix strategy per package)
- **release.yml**: semantic-release at root → trigger parallel build jobs per platform
- Single version across all packages

### Step 5: Seed Expert Files

Create starter expert files based on app type. These are NOT empty templates — they contain the key sections pre-filled with domain-specific prompts so Claude knows what to track.

#### CLI Experts
- `experts/cli-architecture.md` — Command structure, argument parsing, output formatting
- `experts/_template.md`

#### Web Experts
- `experts/frontend.md` — Component patterns, state management, routing
- `experts/_template.md`

#### Desktop Experts
- `experts/electron-ipc.md` — Main/renderer communication, preload scripts
- `experts/_template.md`

#### Mobile Experts
- `experts/mobile-platform.md` — Native bridges, platform-specific behavior, build signing
- `experts/_template.md`

#### Monorepo Experts
- `experts/monorepo-sync.md` — Cross-package dependencies, shared code, versioning
- `experts/_template.md`

**Expert template format (for _template.md):**
```markdown
# {Domain} Expert

> Mental model for {domain}
> **Last Updated**: {date}
> **Expertise Level**: beginner

## Quick Reference

| Key Files | Purpose |
|-----------|---------|
| | |

## Architecture Overview

{Describe how components relate}

## Patterns & Conventions

### {Pattern Name}
- **Purpose**: Why this pattern exists
- **When to Use**: Conditions for applying it
- **Example**:
```
{code}
```

## Gotchas & Edge Cases

- {Known issue and workaround}

## Change Log

- {date}: Initial creation
```

### Step 6: Generate CLAUDE.md

Build the project CLAUDE.md with sections based on preset and app type.

<HARD-GATE>
The spec format MUST match the detected/selected test framework.
Do NOT write generic examples — use the actual test runner, patterns, and syntax for this project's stack.
All code examples must use the correct language and framework.
</HARD-GATE>

#### Section: Project Header (ALL)

```markdown
# {Project Name}

{One-line description — ask user if not obvious from package.json/pubspec.yaml}
```

#### Section: Global Rules (ALL)

```markdown
## Rules

- Never use `rm` to delete files. Use `mv <file> ~/.Trash/` instead.
- When unsure about commands or implementation, search the web first.
- Never use libraries with zero or very low GitHub stars.
- Create repos with `gh repo create` then clone. Never use `git init`.
```

#### Section: Stack (ALL)

```markdown
## Stack

- **Language**: {TypeScript/Dart/etc.}
- **Runtime**: {Bun/Node/Flutter}
- **Test Runner**: {bun:test/vitest/pytest/flutter test}
- **CI/CD**: GitHub Actions
- **Deploy**: {Vercel/GitHub Releases/App Stores}
- **Versioning**: {semantic-release/custom}
```

#### Section: Branching Strategy (ALL)

```markdown
## Git Workflow

- **Strategy**: GitHub Flow
- **Main branch**: `main` (always releasable)
- **Feature branches**: `feature/{short-description}`
- **Commit format**: `{type}: {description}` or `{type}({scope}): {description}`
  - `feat:` → minor version bump
  - `fix:` → patch version bump
  - `test:`, `docs:`, `chore:` → no version bump
- **PRs required**: All changes go through pull requests
- **CI must pass**: Never merge with failing tests
- **No force pushes**: Never force push to main
- **No manual releases**: Versioning is fully automated
```

#### Section: Testing — Spec-Driven TDD (ALL)

Use the correct format for the app type:

**For CLI/Web/Desktop (TypeScript — bun:test or vitest):**
```markdown
## Testing — Spec-Driven TDD

Write specs that describe **user-observable behaviors**, not internal implementation.

### Principles
- Every test describes something a user or caller can observe
- Name tests as behaviors: "applies discount to order total", not "test_calculate_discount"
- Prefer real dependencies over mocks — only mock external services and I/O boundaries
- If you can't describe the test as a user behavior, reconsider what you're testing

### RED-GREEN-REFACTOR
1. **RED**: Write a failing spec describing the desired behavior
2. **GREEN**: Write the minimum code to make it pass
3. **REFACTOR**: Clean up while all specs stay green

### Spec Format
{For bun:test:}
` ` `typescript
import { describe, test, expect } from "bun:test";

describe("checkout flow", () => {
  test("applies discount code to order total", () => {
    // Arrange: set up the scenario
    // Act: perform the user action
    // Assert: verify the observable outcome
  });
});
` ` `

{For vitest:}
` ` `typescript
import { describe, it, expect } from "vitest";

describe("checkout flow", () => {
  it("applies discount code to order total", () => {
    // Arrange, Act, Assert
  });
});
` ` `

### Running Specs
- Unit: `bun test` (or `npx vitest run`)
- Watch: `bun test --watch`
- Coverage: `bun test --coverage`

### Test Organization
- Co-located: `module.ts` → `module.test.ts` (same directory)
- E2E separate: `e2e/*.e2e.test.ts` or `e2e/*.spec.ts`
- Fixtures: `test-fixtures/` or `src/test-fixtures/`
- One spec file per module
```

**For Mobile (Flutter/Dart):**
```markdown
## Testing — Spec-Driven TDD

### Spec Format
` ` `dart
void main() {
  group('checkout flow', () {
    testWidgets('applies discount code to order total', (tester) async {
      // Arrange: pump the widget
      // Act: tap, enter text, etc.
      // Assert: expect to find the result
    });
  });
}
` ` `

### Running Specs
- Unit: `flutter test`
- Integration: `flutter test integration_test/`

### Test Organization
- Unit: `test/` (mirrors `lib/` structure)
- Integration: `integration_test/`
```

#### Section: GSD Integration (presets: `full`, `gsd-only`)

```markdown
## GSD Workflow

### Spec-Driven TDD in GSD Plans
- Plans with `type: tdd` use spec-driven TDD, not unit test TDD
- Success criteria from ROADMAP.md map 1:1 to spec descriptions
- Each plan's `must_haves.truths` should be verifiable by running the spec suite

### Commit Order for TDD Plans
1. `test({phase}-{plan}): add failing spec` — RED
2. `feat({phase}-{plan}): implement to pass spec` — GREEN
3. `refactor({phase}-{plan}): clean up` — REFACTOR (optional)

### During Execution
- Before implementing any feature task, write a failing spec first
- After completing a plan, run the full spec suite
- Specs are the definition of done
```

#### Section: Superpowers Integration (preset: `full`)

```markdown
## Superpowers Integration

### When to Brainstorm
- Before creating new components, services, or architectural elements
- Before any task involving 3+ files or non-obvious design decisions
- Skip for config changes, renames, simple additions

### When to Code Review
- After completing each GSD plan execution
- Before marking a phase as complete

### Combined Flow
1. GSD plans the work (phases, plans, waves)
2. Superpowers brainstorms the approach (design decisions)
3. Spec-driven TDD implements (RED → GREEN → REFACTOR)
4. Superpowers reviews the result
```

#### Section: Expert Tracking (ALL)

```markdown
## Expertise Tracking

This project uses `experts/{domain}.md` to capture working knowledge.

### Rules
- After modifying code, update the relevant expert file with what you learned
- New file locations, patterns used, gotchas encountered, corrections to outdated info
- Update the Change Log section with the date and what changed
- If no relevant expert file exists for the domain you changed, create one from `experts/_template.md`
- The codebase is the source of truth — validate expert files against actual code

### When to Update
- After every code change that teaches you something about the domain
- After discovering a gotcha or edge case
- After creating new files or changing project structure
- After fixing a bug (document the root cause)
```

### Step 7: Write Files

Write all generated files to the project. For each file:
- If it doesn't exist → create it
- If it exists → skip and note in report

**Special case for CLAUDE.md:**
- If it exists, ask: merge (append new sections) or replace (backup to CLAUDE.md.bak)?

### Step 8: Report

```markdown
## Forged

**App Type**: {type}
**Preset**: {preset}
**Stack**: {language} / {runtime} / {test runner}

### Created
- [x] CLAUDE.md — {list of sections written}
- [x] .github/workflows/ci.yml
- [x] .github/workflows/release.yml
{if web:}
- [x] vercel.json
- [x] Directory structure: {list of dirs created}
- [x] experts/_template.md
- [x] experts/{seeded-expert}.md

### Skipped (already existed)
- {list of files/dirs that were skipped}

### Next Steps
1. Run specs: `{test command}`
{if gsd-only or full:}
2. Plan the project: `/gsd:new-project`
{if full:}
3. Brainstorm first feature: `/brainstorming`
4. Commit the scaffold: `/commit`
```
