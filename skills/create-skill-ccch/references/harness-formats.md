# Harness Formats

Use this reference to keep one skill compatible with Claude Code, Codex,
Cursor, and Hermes.

## Compatibility matrix

| Harness | Global root | Required package entry | Target notes |
|---|---|---|---|
| Claude Code | `~/.claude/skills/` | `SKILL.md` | Use the portable workflow and standard frontmatter. |
| OpenAI Codex | `~/.codex/skills/` | `SKILL.md` | Add `agents/openai.yaml` for UI metadata. |
| Cursor | `~/.cursor/skills/` | `SKILL.md` | Add a Cursor adapter only when invocation or tool mapping differs. |
| Hermes | `~/.hermes/skills/` | `SKILL.md` | Minimal shared frontmatter is preferred; add Hermes metadata only in a verified dedicated variant. |

## Shared frontmatter

Use the smallest form accepted everywhere:

```yaml
---
name: skill-name
description: What the skill does and the concrete requests or contexts that should trigger it.
---
```

Keep target-specific metadata out of shared frontmatter. Codex UI metadata
belongs in `agents/openai.yaml`.

## Codex UI metadata

```yaml
interface:
  display_name: "Readable Skill Name"
  short_description: "Short description between 25 and 64 chars"
  default_prompt: "Use $skill-name to perform a representative task."
```

Quote all string values. The default prompt must explicitly contain the skill
name prefixed with `$`.

## Adapter decision

Use one portable `SKILL.md` by default.

Add a target adapter only when at least one of these is true:

- the harness exposes a different tool name for the same operation;
- invocation arguments require translation;
- interactive prompts require a harness-specific mechanism;
- the target cannot parse a required shared metadata field.

Keep adapter sections short. They translate the shared workflow; they do not
repeat it.

Suggested labels:

```xml
<claude_skill_adapter>
Target-specific translation only.
</claude_skill_adapter>

<codex_skill_adapter>
Target-specific translation only.
</codex_skill_adapter>

<cursor_skill_adapter>
Target-specific translation only.
</cursor_skill_adapter>

<hermes_skill_adapter>
Target-specific translation only.
</hermes_skill_adapter>
```

If a target would execute another target's adapter incorrectly, create a
dedicated variant instead of combining the adapters.

## Safe global installation

Let `SOURCE` be the absolute path to `skills/<skill-name>` in the publishing
checkout. For each target root:

1. Create the root if missing.
2. Inspect `DEST=<root>/<skill-name>`.
3. If `DEST` is already a link to `SOURCE`, leave it unchanged.
4. If `DEST` exists and differs, stop and show the conflict.
5. Otherwise create a relative or absolute symbolic link to `SOURCE`.

Typical destinations:

```text
~/.claude/skills/<skill-name>
~/.codex/skills/<skill-name>
~/.cursor/skills/<skill-name>
~/.hermes/skills/<skill-name>
```

Verify with `readlink`, `test -r <destination>/SKILL.md`, and a dangling-link
check. Do not silently convert an existing copied skill into a link.

## Validation checklist

- Folder and frontmatter names match.
- Name uses lowercase letters, digits, and hyphens and is under 64 characters.
- Description contains purpose and triggering contexts.
- `SKILL.md` has no unfinished markers or scaffold text.
- References are linked directly from `SKILL.md`.
- Bundled scripts execute successfully.
- `agents/openai.yaml` matches the skill.
- All installed destinations resolve to the primary package.
- The Git diff contains only intended files.
- The remote branch or pull request exists after publishing.
