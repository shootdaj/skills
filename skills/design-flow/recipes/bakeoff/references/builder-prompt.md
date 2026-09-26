# Builder prompt

One Fable subagent per variant. Run them in parallel with the Agent tool, `subagent_type: general-purpose`, `model: fable`. Give each the full text below with the placeholders filled. Keep the brief in a file and point at it, so every builder reads the same words.

```
You are building design variant {{ID}} "{{NAME}}" of the {{PROJECT}} page.

Read in this order, fully:
1. {{DESIGNS_DIR}}/BRIEF.md (content, pyramid order, hard constraints, verification, vote widget)
2. {{DESIGNS_DIR}}/BRIEF-2.md if it exists (forms already used; do not repeat them)
3. {{DESIGNS_DIR}}/VIZ-PACK.md if it exists (diagram data and the text-to-diagram map)
4. {{SOURCE_PAGE}} (the fixed content and data blocks)
5. {{HUMANIZER_SKILL}} (every visible string follows it; when the brief names no skill, follow the plain-English rules in BRIEF.md)

Your direction:
- Mood: {{MOOD}}
- Palette: {{PALETTE}}
- Type: {{TYPE}}
- Signature motion: {{MOTION}}
- Component forms: {{FORMS}}
- 3D: {{THREE_D}}
- Do not use: {{EXCLUSIONS}}

Output: {{DESIGNS_DIR}}/{{ID}}-{{SLUG}}/index.html plus shots/. Verify exactly as BRIEF.md says and look at your own PNGs before you report.
Report back in the brief's format: path, one paragraph on what makes it distinctive, the motion moments and interactive elements, one line per content block naming the form you used, screenshot paths, console status, anything you could not achieve.
```

## While they run

- Poll the designs folder. When an `index.html` and its first shot exist, open the page in Chrome and tell the user in one line what to look at.
- Do not edit a builder's file while it is still running. Send follow-ups through the same agent with SendMessage.
- When a builder reports, check its PNGs yourself before you relay anything. Builders overstate.

## Round two message

Same prompt, plus: "Round one already used these forms and motion signatures: {{USED_LIST}}. Your forms must differ from all of them. Pick from the alternatives in BRIEF-2.md."

## Final build message

Point at FINAL-BRIEF.md instead of a direction. Name every element to port with its source file and figure id, and tell the builder to keep the mechanics and restyle to the final tokens. Ask for a `parts/` split with a `build.sh` so the page can be edited in pieces later.
