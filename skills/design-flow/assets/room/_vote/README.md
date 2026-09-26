# Room engine files

Copied into `<room>/_vote/` by `make-room.py`. Do not edit them in a room; fix the template and run `make-room.py` again.

| File | Does |
| --- | --- |
| `hub-bridge.js` | Lets the room drive a framed design: theme, language and step over postMessage. Reads the step order, the form values to fill and the slow steps from the room's messages (they come from `room.js`). Every design includes it before `vote.js`. |
| `vote.js` | The yellow VOTE tab on every design. Loads `../room.js` for the components and the storage key. |
| `server.py` | Local vote server on the port in `room.js` `api` (else 7332): votes, notes, a small key-value store for pins and duels, and the request queue. Starting it twice is a no-op; if another program holds the port it moves to a free one and writes the new address into `room.js`. Without it the room still works and saves in the browser. |
| `request-form.js`, `requests_api.py` | Copied from `design-flow/assets/requests/`: the New design form and the request queue. |

Design hooks the bridge relies on: `[data-step="<id>"]` on each step root, `[data-action="continue"]`, `[data-action="back"]`, `[data-theme-toggle]`, `[data-lang-toggle]`, and `name="<field>"` on any form the room fills.
