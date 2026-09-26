# Vote kit

- `vote.js`: drop-in widget. Include as the last line before `</body>` of every variant:
  `<script src="../_vote/vote.js" data-project="my-page" data-design="d1" data-label="D1 Name"></script>`.
  It renders a yellow VOTE tab, lets the user pick the design overall and per component, saves to `localStorage` under `design-votes-<data-project>`; set the same `PROJECT` in `ballot.html` and to the vote server when it is running. Edit `COMPONENTS` inside it to match the page's content blocks.
- `server.py`: `python3 server.py &` serves on 127.0.0.1:7331. `votes.json` holds the latest pick per component, `votes.jsonl` the log. CORS is open for local `file://` pages.
- `ballot.html`: copy next to the variants, fill `DESIGNS`, open in the browser. Shows the live tally and links to every variant.

Copy this folder to `<designs>/_vote/` so the relative script path resolves from every `<designs>/<variant>/index.html`.
