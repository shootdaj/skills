# Ableton Live

## Reaching Live without MCP

`scripts/livecmd.py` speaks to the AbletonMCP remote script over a raw socket on
port 9877. It works in any harness and survives an MCP outage.

```bash
scripts/livecmd.py exec_python '{"code":"result = str(song.tempo)"}'
scripts/livecmd.py set_output_routing '{"track_index":17,"type_name":"Ext. Out","channel_name":"1/2"}'
```

`track_index` of `-1` means the master. The patched remote script also provides
`exec_python`, which runs on the main thread - assign to `result`, do not rely
on `print`.

Useful reads:

```python
song.master_track.output_routing_type.display_name
song.master_track.output_routing_channel.display_name
[c.display_name for c in song.master_track.available_output_routing_channels]
song.cue_out_routing_channel.display_name
t.input_routing_channel.display_name        # per track
t.current_monitoring_state                   # 0 In, 1 Auto, 2 Off
t.output_meter_left                          # proves signal, not config
song.is_playing
```

**`available_output_routing_channels` is the diagnostic.** If it returns only
`['1/2','1','2']` against a multi-channel device, the other channels are not
enabled in Output Config and no API call can route to them.

## Output Config - the GUI step

There is no API for enabling output channels. It has to be clicked.

Live's widgets are not accessible: `every UI element` on the Preferences window
returns `button button button static text`, and `System Events click at` fails
with **-25208**. Use `cliclick`, which is reliable.

The sequence, with coordinates read from a fresh screenshot each time - never
hard-code them, the window moves:

1. `osascript -e 'tell application "Live" to activate'`
2. `keystroke "," using command down` opens Preferences
3. Screenshot, locate **Audio > Output Config**, click it
4. Screenshot the dialog. Stereo pairs are a scrolling list; drag the scrollbar
   with `dd:` / `dm:` / `du:` to reach high channel numbers
5. Click the pair's label cell - it is the toggle. Orange means enabled
6. Click **OK**

Verify by reading `available_output_routing_channels` again, not by looking at
the screenshot. Sampling a pixel to confirm is unreliable - the cell border is a
different colour from the fill.

Screen coordinate maths on a Retina display: a `screencapture` image is in
pixels, `cliclick` takes points, and points are pixels / 2. If a screenshot was
rendered down for viewing, scale by the ratio first.

## Order of operations when a DAW has meters but no sound

1. Read `available_output_routing_channels`. Short list -> Output Config first.
2. Check the master's channel against the **aggregate member order**, not against
   what seems reasonable.
3. Check the source track's input channel - it shifts with the interface.
4. Check `song.is_playing` before concluding anything from a zero meter.
5. Probe the virtual device with `volumedetect` to find which stage is dead.
