# Fixture registry

One JSON file per visual output in `assets/fixtures/`. The Phase 0 menu is built
from these, so a fixture is always named by what it is, never as "visuals".

Adding hardware means adding a file. It never means changing the skill.

## Schema

```json
{
  "name":      "HyperCube",
  "kind":      "led",
  "transport": "sacn",
  "address":   "192.168.1.102",
  "port":      5568,
  "layout":    { "pixels": 224, "order": "rgb", "universes": [1, 2] },
  "health": {
    "method": "http",
    "url":    "http://192.168.1.102/json/info",
    "alive":  "$.leds.count > 0",
    "active": "$.live == true",
    "load":   "$.leds.pwr"
  },
  "fed_by":  { "app": "touchdesigner", "op": "/project1/cube" },
  "notes":   "WLED fork. udpn sync disabled deliberately."
}
```

| Field | Meaning |
|---|---|
| `transport` | `sacn`, `artnet`, `ddp`, `syphon`, `ndi`, `dmx-usb` |
| `health.alive` | reachable and sane |
| `health.active` | currently being driven - must change with the music |
| `health.load` | a number that moves with content, for proving liveness |
| `fed_by` | what to inspect upstream when the fixture is dark |

`active` and `load` matter more than `alive`. A fixture can answer on the
network while receiving nothing.

## Discovering new fixtures

Sweep the local subnet, then probe each responder:

- **WLED and forks** - `GET /json/info` returns `leds.count`, `name`, `product`,
  `arch`, `mac`. This identifies the fixture and its pixel count in one call.
- **Art-Net** - ArtPoll to UDP 6454, read the ArtPollReply.
- **sACN** - listen on 5568 for universe discovery.
- **Syphon / NDI** - enumerate local servers.

Espressif MAC prefixes (`ec:b5:fa`, `68:25:dd`, ...) are a strong hint that an
unidentified device is an ESP32 LED controller.

Offer to register anything found that is not already in the registry. Never
write a fixture file without asking - an unknown device on the network is not
necessarily the user's.

## Shared upstream

Fixtures fed by the same app share a path. If two or more are dark, inspect that
shared path before either fixture. For anything `fed_by` TouchDesigner the
shared path is audio -> TD, and the fixture is almost never the fault.
