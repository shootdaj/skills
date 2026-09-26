#!/usr/bin/env python3
"""Scaffold a design room from the design-flow template.

  make-room.py <dir> --project <name> --steps "id:Label,..." [--components "id:Label[:hint],..."]
               [--shots "file:Label[:component],..."] [--langs "en:EN,es:ES"] [--designs "d1:Name,..."]
               [--subtitle "{n} directions, 1 flow"] [--ui-kit kira] [--playwright /path/to/package.json] [--force]

No setup needed: the brief tells builders to load Playwright through design-flow's shared helper (assets/lib/playwright.mjs),
which finds or installs it. --playwright is an optional override for a project that already has @playwright/test.

Writes <dir>/index.html and <dir>/_vote/* (engine files, refreshed every run), and, when missing, <dir>/room.js
(the room's config), <dir>/_requests/designs.js (where builders register designs) and <dir>/BRIEF.md (the builders'
brief, a skeleton to fill in). --force rewrites room.js and BRIEF.md too. Opens nothing; prints the path.
"""
import argparse, json, os, re, shutil, sys, zlib

HERE = os.path.dirname(os.path.abspath(__file__))
REQUESTS = os.path.join(os.path.dirname(HERE), 'requests')
ENGINE = ['hub-bridge.js', 'vote.js', 'server.py', 'README.md']
FROM_REQUESTS = ['request-form.js', 'requests_api.py']
PW_HELPER = os.path.join(os.path.dirname(HERE), 'lib', 'playwright.mjs')
DEFAULT_PW = os.environ.get('PLAYWRIGHT_PACKAGE_JSON', '')


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-') or 'room'


def pairs(text, n=2):
    """'a:B:c,d:E' -> [['a','B','c'], ['d','E']] (missing parts are filled from the id)."""
    out = []
    for part in (text or '').split(','):
        part = part.strip()
        if not part:
            continue
        bits = [b.strip() for b in part.split(':')]
        while len(bits) < n:
            bits.append(bits[0] if len(bits) == 1 else '')
        out.append(bits[:max(n, len(bits))])
    return out


def default_components(steps):
    comps = [['overall', 'Overall design', ''], ['chrome', 'App frame + navigation', 'top bar, rail, progress']]
    for sid, label in steps:
        comps.append([sid, label, ''])
    comps += [['motion', 'Motion + feel', 'load, press, transitions'], ['theme', 'Theme + type', 'dark, light, fonts']]
    return comps


def default_shots(steps):
    shots, n = [], 0
    for sid, label in steps:
        n += 1
        shots.append(['%02d-%s-dark-1440' % (n, sid), label, sid])
    first_id, first_label = steps[0]
    n += 1; shots.append(['%02d-%s-light-1440' % (n, first_id), first_label + ', light', 'theme'])
    n += 1; shots.append(['%02d-%s-800' % (n, first_id), first_label + ' at 800', 'chrome'])
    n += 1; shots.append(['%02d-%s-390' % (n, first_id), first_label + ' at 390', 'chrome'])
    return shots


def write_room_js(path, cfg):
    body = json.dumps(cfg, indent=2, ensure_ascii=False)
    with open(path, 'w') as f:
        f.write('/* Design room config. JSON behind window.ROOM so the room works from file:// too. Edit and reload.\n'
                '   project, name, key, subtitle ({n} = design count), start (first design to show), flow (preview Step\n'
                '   buttons), langs (optional), shots (Compare steps: file, label, component it votes for), components\n'
                '   (Pick per element rows), designs (this room\'s own list; builders add theirs to _requests/designs.js),\n'
                '   baseline (optional card for the page as it is today: name, line, fonts, dark, light, shots, note, image),\n'
                '   fill (form values the bridge types per step), slow (steps that need a longer wait), api (vote server). */\n'
                'window.ROOM = ' + body + ';\n')


def designs_js():
    return ('/* Designs built for this room. Each builder appends one entry when its design is verified; same shape as\n'
            '   "designs" in room.js: id, name, fam, dir, line, fonts, dark [4 hex], light [4 hex], status. */\n'
            'window.EXTRA_DESIGNS = [\n];\n')


def brief(cfg, out_dir, kira, pw):
    steps = cfg['flow']
    shots = cfg['shots']
    langs = cfg.get('langs') or []
    lines = []
    A = lines.append
    A('# Shared brief: %s, one design per builder' % cfg['project'])
    A('')
    A('You are building ONE design of %s as a self-contained page in `%s/{{ID}}-{{SLUG}}/index.html`.' % (cfg['project'], out_dir))
    A('Every other builder gets this same brief and a different direction. The design room (`index.html` in the room folder)')
    A('previews, compares and votes on all of them. You never build a picker, an index page or a ballot of your own.')
    A('')
    A('## What the page is')
    A('')
    A('TODO: two or three sentences on the product, who uses it and what this page does. Point at the content pack')
    A('(`CONTENT.md`, `content.js`) if there is one. Content is fixed: do not invent facts, names or numbers.')
    A('')
    A('## Steps (the room drives these)')
    A('')
    for i, (sid, label) in enumerate(steps, 1):
        A('%d. **%s** (`data-step="%s"`): TODO what is on it and what moves the user on.' % (i, re.sub(r'^\d+\s+', '', label), sid))
    A('')
    A('Hooks the room needs, so it can drive your page from its Step, Theme%s controls:' % (' and Lang' if langs else ''))
    A('')
    A('- `[data-step="<id>"]` on each step root, one visible at a time; ids exactly as above.')
    A('- `[data-action="continue"]` and `[data-action="back"]` on the buttons that move between steps.')
    A('- `[data-theme-toggle]` on the theme switch. Dark is the default, light behind the toggle, persisted under a key ending in `-theme`.')
    if langs:
        A('- `[data-lang-toggle]` on the language switch (%s), with `<html lang>` updated.' % ' / '.join(l for _, l in langs))
    fill = cfg.get('fill') or {}
    if fill:
        A('- Form fields named as the room fills them: %s.' % ', '.join('`name="%s"`' % n for step in fill.values() for n in step))
    A('')
    A('## Direction')
    A('')
    A('TODO: the direction message for this design (palette, type, layout form, motion signature). Commit hard to it.')
    A('Both themes designed on purpose. Tactile controls. Visible motion with `prefers-reduced-motion` respected.')
    A('Plain English in every visible string: no em or en dashes, straight quotes, sentence case, active voice.')
    A('')
    A('## Hard rules')
    A('')
    if kira:
        A('- **Kira is required.** Build the design as a small React app on `@ayahelix/kira`: set it up with the `setup-kira`')
        A('  skill and follow the `kira` skill\'s rules (no `className` on kira components, kira primitives over raw HTML,')
        A('  icons from the registry, semantic tokens for colour). Build it to static files inside your folder')
        A('  (`index.html` plus its assets, relative paths) so the room can frame it from `file://` and from a static host.')
        A('  The two room scripts below go in the built `index.html`.')
    else:
        A('- Single `index.html`; CSS and JS inline; libraries and fonts from a CDN only.')
    A('- Include the two room scripts as the LAST lines before `</body>`, in this order:')
    A('')
    A('  ```html')
    A('  <script src="../_vote/hub-bridge.js"></script>')
    A('  <script src="../_vote/vote.js" data-design="{{ID}}" data-label="{{ID_UPPER}} {{NAME}}"></script>')
    A('  ```')
    A('')
    A('  Do not restyle the yellow VOTE tab. Keep nothing critical under the right-middle edge of the viewport.')
    A('- 12 px minimum for readable text. Targets at least 44 px. No horizontal scroll at 1440, 800 or 390 wide.')
    A('- Add an inline `data:` favicon so the console has no 404.')
    A('- Do not write your own picker, index page, ballot or comparison page. The room is the only place designs are compared.')
    A('')
    A('## Verify and shoot (mandatory)')
    A('')
    A('Load Playwright through the shared helper, which finds or installs it (nothing to set up):')
    A('`import { launch } from \'%s\'; const browser = await launch({ headless: true });`.' % PW_HELPER)
    if pw:
        A('(Or `createRequire(\'%s\')` and `require(\'@playwright/test\')`, the project copy.)' % pw)
    A('Open your page over `file://`,')
    A('collect console errors (must be zero), assert `document.documentElement.scrollWidth <= clientWidth` at every width,')
    A('scan for text under 12 px, and save these PNGs to `shots/` next to your index.html, with exactly these names:')
    A('')
    for f, label, *_ in shots:
        A('- `%s.png`: %s' % (f, label))
    A('')
    A('Look at every PNG yourself before you report.')
    A('')
    A('## Register the design')
    A('')
    A('Append one entry to `%s/_requests/designs.js` (`window.EXTRA_DESIGNS`), keeping every entry already there:' % out_dir)
    A('')
    A('```js')
    A('{ "id": "{{ID}}", "name": "{{NAME}}", "fam": "one word", "dir": "{{ID}}-{{SLUG}}", "line": "one line on the look",')
    A('  "fonts": "Display · Body", "dark": ["#bg", "#surface", "#accent", "#text"], "light": ["#bg", "#surface", "#accent", "#text"], "status": "verified" }')
    A('```')
    A('')
    A('If you were started from a request file in `_requests/`, keep its progress fields up to date as the design-flow')
    A('skill describes (`started`, `eta`, `stage`, `percent`, `progress`).')
    A('')
    A('## Report back (short)')
    A('')
    A('Path to index.html. Three lines on the direction. The list of motion moments and interactive elements. Screenshot')
    A('paths. Console status. Anything you could not achieve.')
    return '\n'.join(lines) + '\n'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dir')
    ap.add_argument('--project', required=True, help='short project name, for example Sypris')
    ap.add_argument('--steps', required=True, help='"id:Label,..." the flow the room drives')
    ap.add_argument('--components', help='"id:Label[:hint],..." Pick per element rows; default: overall, chrome, one per step, motion, theme')
    ap.add_argument('--shots', help='"file:Label[:component],..." Compare steps; default: one dark shot per step plus light, 800 and 390 of the first')
    ap.add_argument('--langs', help='"en:EN,es:ES" when the designs have a language toggle')
    ap.add_argument('--designs', help='"d1:Name,..." designs to list up front as building stubs; each builder completes its entry in _requests/designs.js')
    ap.add_argument('--subtitle', help='header subtitle; {n} is the design count. Default "{n} designs"')
    ap.add_argument('--name', help='room title; default "<project> design room"')
    ap.add_argument('--ui-kit', default='', help='"kira" makes the brief require React + @ayahelix/kira builds')
    ap.add_argument('--port', type=int, help='vote server port; default is picked from the project name')
    ap.add_argument('--playwright', default=DEFAULT_PW, help='optional: package.json of a project that already has @playwright/test; the shared helper is the default')
    ap.add_argument('--force', action='store_true', help='rewrite room.js and BRIEF.md even when they exist')
    a = ap.parse_args()

    out = os.path.abspath(a.dir)
    steps = [[s[0], s[1]] for s in pairs(a.steps)]
    if not steps:
        sys.exit('--steps needs at least one "id:Label"')
    flow = [[sid, '%d %s' % (i, label)] for i, (sid, label) in enumerate(steps, 1)]
    comps = [[c[0], c[1], c[2] if len(c) > 2 else ''] for c in pairs(a.components, 3)] if a.components else default_components(steps)
    shots = [[s[0], s[1], s[2] if len(s) > 2 else s[0]] for s in pairs(a.shots, 3)] if a.shots else default_shots(steps)
    langs = [[l[0], l[1]] for l in pairs(a.langs)] if a.langs else []
    # stubs: no dir yet, so the room shows "building" without 404s; the builder's _requests/designs.js entry fills them in
    designs = [{'id': d[0], 'name': d[1], 'fam': '', 'dir': None, 'line': 'Building %s-%s' % (d[0], slug(d[1])), 'fonts': '',
                'dark': [], 'light': [], 'status': 'building'} for d in pairs(a.designs)] if a.designs else []
    cfg = {'project': a.project, 'name': a.name or '%s design room' % a.project, 'key': slug(a.project),
           'subtitle': a.subtitle or '{n} designs', 'flow': flow, 'shots': shots, 'components': comps, 'designs': designs}
    # each room gets its own vote-server port so two rooms on one machine never share votes
    cfg['api'] = 'http://127.0.0.1:%d' % (7340 + zlib.crc32(cfg['key'].encode()) % 600)
    if a.port:
        cfg['api'] = 'http://127.0.0.1:%d' % a.port
    if langs:
        cfg['langs'] = langs
    if designs:
        cfg['start'] = designs[0]['id']

    os.makedirs(os.path.join(out, '_vote'), exist_ok=True)
    os.makedirs(os.path.join(out, '_requests'), exist_ok=True)
    shutil.copy2(os.path.join(HERE, 'index.html'), os.path.join(out, 'index.html'))
    for f in ENGINE:
        shutil.copy2(os.path.join(HERE, '_vote', f), os.path.join(out, '_vote', f))
    for f in FROM_REQUESTS:
        src = os.path.join(REQUESTS, f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(out, '_vote', f))
        else:
            print('warning: %s not found next to the room template; the New design form needs it' % src, file=sys.stderr)

    room_js = os.path.join(out, 'room.js')
    if a.force or not os.path.exists(room_js):
        write_room_js(room_js, cfg)
    designs_path = os.path.join(out, '_requests', 'designs.js')
    if not os.path.exists(designs_path):
        with open(designs_path, 'w') as f:
            f.write(designs_js())
    brief_path = os.path.join(out, 'BRIEF.md')
    if a.force or not os.path.exists(brief_path):
        with open(brief_path, 'w') as f:
            f.write(brief(cfg, out, a.ui_kit.lower() == 'kira', a.playwright))

    print(os.path.join(out, 'index.html'))
    print('config: %s' % room_js)
    print('brief:  %s (fill in the TODO lines before builders start)' % brief_path)
    print('server: python3 %s &   (picks a free port itself if the default is busy)' % os.path.join(out, '_vote', 'server.py'))
    print('open:   open %s' % os.path.join(out, 'index.html'))


if __name__ == '__main__':
    main()
