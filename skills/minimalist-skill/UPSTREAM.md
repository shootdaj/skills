# Upstream provenance

| Field | Value |
|---|---|
| Source | https://github.com/leonxlnx/taste-skill |
| Path | `skills/minimalist-skill/` |
| Commit | `72e299530e2eb31ed8da06181bc19f6c18a00821` |
| Vendored | 2026-08-23 |
| License | MIT |

Vendored as a **static copy**. This is not a fork and does not track upstream
automatically. Upstream's `skills/` directory takes roughly five commits a year,
so re-syncing is a deliberate, occasional act.

## Local modifications

One line, in `SKILL.md` frontmatter:

```
-name: minimalist-ui
+name: minimalist-skill
```

Required because the cross-harness packaging checklist demands the folder name
and the frontmatter name match. The prose body is byte-identical to upstream.

## Re-syncing

```bash
git clone https://github.com/leonxlnx/taste-skill /tmp/ts
diff <(sed '1,6s/^name: .*/name: X/' /tmp/ts/skills/minimalist-skill/SKILL.md) \
     <(sed '1,6s/^name: .*/name: X/' skills/minimalist-skill/SKILL.md)
```

Empty output means you are current. Read any diff before applying it: these
files are aesthetic opinions, not library code.
