---
name: create-skill-ccch
description: Create or update a reusable AI-agent skill for Claude Code, OpenAI Codex, Cursor, and Hermes. Use when the user asks to create, package, port, validate, globally install, synchronize, or publish a skill for one or more of these harnesses, especially when they want one shared source instead of drifting copies.
---

# Create Skill CCCH

Create one well-tested skill that works across Claude Code, Codex, Cursor, and
Hermes. Keep one shared source whenever possible and add target-specific
instructions only when a real harness difference requires them.

Read [references/harness-formats.md](references/harness-formats.md) before
creating or installing a skill.

## Defaults

- Target all four harnesses unless the user narrows the request.
- Use `shootdaj/skills` as the publishing repository.
- Put the primary package at `skills/<skill-name>/` in a local checkout whose
  `origin` points to `shootdaj/skills`.
- Install the same package globally by linking it into each harness skill root.
- Keep only `name` and `description` in shared `SKILL.md` frontmatter.
- Add `agents/openai.yaml` for Codex UI metadata.
- Work on a branch and open a pull request. Do not push directly to the default
  branch.
- Do not ask questions when the request and examples already define the skill.

## 1. Define the skill

Extract these facts from the request and current conversation:

1. The user-visible skill name.
2. Concrete prompts that should trigger it.
3. The output or action expected from each prompt.
4. Required tools, files, integrations, or permissions.
5. Whether the skill should only prepare work or may also perform changes,
   installs, commits, pushes, sends, purchases, or other consequential actions.

Generate a lowercase hyphenated name under 64 characters when the user does not
provide one. Ask one focused question only when a missing answer would
materially change behavior or safety.

If the user asks to see the design first, stop after showing:

- the proposed name and trigger description;
- the package tree;
- the core workflow;
- any target-specific behavior;
- install and publish behavior.

Do not create files until the user approves or corrects that preview.

## 2. Inspect before creating

Locate the publishing checkout by checking Git remotes rather than assuming a
path. Inspect the repository layout, current branch, worktree status, existing
skills with similar scope, and all intended global destinations.

If `skills/<skill-name>` already exists, treat the task as an update. Read it
before editing and preserve unrelated user changes.

If a global destination already exists:

- continue when it is already a link to the intended source;
- compare it when it is a different link, file, or directory;
- stop and show the conflict before replacing or deleting anything.

## 3. Design one portable package

Prefer this structure:

```text
skills/<skill-name>/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/     # only when detailed guidance is needed
├── scripts/        # only for repeated deterministic operations
└── assets/         # only for files used in generated output
```

Use the native `skill-creator` scaffold and validator when available. Otherwise
create the same minimal structure directly.

Write `SKILL.md` for a capable agent:

- Put all trigger conditions in the frontmatter description.
- Use imperative workflow instructions.
- Include non-obvious constraints, decision rules, and verification steps.
- Keep the main file concise and under 500 lines.
- Move detailed target notes into `references/`.
- Do not add a README, changelog, installation guide, or duplicate summary.

Use a single portable workflow when all harnesses can perform the same job.
Add clearly labeled target adapter sections only when invocation, prompting, or
tool names truly differ. Do not invent tools. State the shared behavioral
contract once and keep adapters limited to translation.

## 4. Build target metadata

Create `agents/openai.yaml` with:

- a human-readable display name;
- a 25-64 character short description;
- a one-sentence default prompt that explicitly mentions `$<skill-name>`.

Do not add icons, brand colors, MCP dependencies, or product metadata unless the
skill actually needs them.

Keep shared frontmatter portable. Add Hermes-only metadata or a Cursor-specific
adapter only when verified behavior requires a dedicated target variant.

## 5. Validate before installation

Run the strongest available checks:

1. Run the native `quick_validate.py` against the package.
2. Confirm folder name and frontmatter name match.
3. Confirm the trigger description says both what the skill does and when it
   should activate.
4. Search for placeholders, absolute machine-specific paths, unsupported tool
   names, and duplicated instructions.
5. Run every bundled script on a representative input.
6. Run `git diff --check`.
7. Forward-test a non-trivial skill with a fresh agent when that can be done
   without modifying production systems or requiring extra approvals.

Fix failures before calling the skill complete.

## 6. Install globally

Use the target roots in the harness reference. Create missing root directories,
then link each `<root>/<skill-name>` to the primary repository package.

After installation, verify all four destinations:

- exist;
- resolve to the intended source;
- expose a readable `SKILL.md`;
- contain no dangling links.

Do not replace an existing non-matching destination without explicit approval.

## 7. Publish when requested

Before publishing:

1. Pull or fetch current remote state.
2. Review the diff and exclude unrelated changes, secrets, generated artifacts,
   and large binaries.
3. Commit the new skill and any relevant repository index update on a branch.
4. Push the branch and open a pull request.
5. Report the repository URL, branch, pull request, validation commands, and
   global installation paths.

Publishing is not complete until the remote branch or pull request is verified
on GitHub.

## Completion contract

Report separately:

- **Created:** primary package path and files.
- **Installed:** each verified global destination.
- **Validated:** checks and forward-test result.
- **Published:** commit, branch, and pull-request URL.
- **Not done:** anything blocked, skipped, or awaiting approval.
