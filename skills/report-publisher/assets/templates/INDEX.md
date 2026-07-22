# Report templates

Pre-built, on-spec HTML report shells. Each is a **filled worked example** — copy
the file, keep the `<style>`/nav/chart/controls, replace the content in the marked
slots (see the comment block at the top of each file). They already satisfy the
skill's design rules (dark Material, ≥12px, collapsible sections, one persistent
nav, permanent here.now publish), so starting from one saves rebuilding the shell.

Pick by shape of the content, not just topic — a benchmark writeup can use the
dossier shell if it's finding/severity-shaped.

| Template | Best for | Look |
|----------|----------|------|
| `security-dossier.html` | Findings/severity reports: security reviews, audits, risk assessments, post-mortems, QA/bug triage — anything that's a ranked list of issues with fixes, a verdict, and a remediation plan. | Material 3 dark. Signal-red critical accent + severity scale. Masthead, stat tiles, D3 severity bar, collapsible sections each holding item cards, persistent side-nav (FAB+drawer on narrow), staged remediation table. |

<!-- Add a row per new template. Keep each template a self-contained single HTML
     file with the slot-guide comment at the top. -->
