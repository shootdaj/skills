# Known rig behaviour

Every entry here was measured, not assumed. Check a failure against this list
before theorising - most are a known one. Dates say when it was verified;
re-check anything that names a specific device, address or channel.

## CoreAudio

**A Multi-Output Device is always exactly 2 output channels**, whatever its
members. Verified 2026-09-25 with identical members: `stacked=1` -> 2 ch,
`stacked=0` -> 18 ch. Also 64+2 -> 2, 16+64 -> 2, and a single 64 ch member ->
2. It is a fixed stereo mirror, not min/max/sum. **If more than stereo is needed
downstream, use a plain aggregate, not a multi-output.**

**Aggregate member order sets the channel offsets.** An aggregate of BlackHole
64ch + a 6-channel interface puts BlackHole at 1-64 and the interface at 65-70.
Reverse the order and the interface becomes 1-6. This single fact decides
whether a DAW's master must go to `1/2` or `65/66`, and getting it wrong is
silent - meters move, nothing is audible.

**Removing an aggregate silently drops it from every app holding it.** The app
falls back to another device without saying so. Verified 2026-09-26: rebuilding
a multi-output left djay Pro pointing elsewhere and BlackHole 16ch measured
**-91 dB**, digital silence. **After any device rebuild, re-select the output in
every affected app and prove signal by probing, not by reading settings.**

**BlackHole adds zero latency.** `kLatency_Frame_Size = 0`, and the latency and
safety-offset properties all return 0 in its source. The widely repeated claim
that virtual drivers add 30-80 ms traces to an unmeasured feature request and is
contradicted by the code.

**Clock master matters.** BlackHole's own documentation says the hardware device
should be the primary/clock device in a multi-output. Using BlackHole as master
puts sample-rate conversion on the hardware leg.

**`system_profiler` cannot identify aggregates** - it reports them all as
`coreaudio_device_type_unknown`. Only the HAL `kAudioDevicePropertyTransportType`
returns `'grup'`. Any safety check must read the HAL directly.

## Ableton Live

**Live will not offer an output channel until it is enabled in Output Config.**
Until then `available_output_routing_channels` returns only `['1/2','1','2']`
regardless of a 70-channel device, and the master physically cannot be moved.
This is the highest-value thing to check when a DAW has meters but no sound.

**Live's widgets are invisible to AppleScript.** `every UI element` on the
Preferences window returns only `button button button static text`. `System
Events click at` fails with error **-25208**. `cliclick` on screen coordinates
works. See `ableton.md`.

**"Resampling" as a track input does not feed a monitored track.** Route a
return track to an external output instead when an internal bus must reach a
virtual device.

**Changing the audio device can reset routing.** Re-read master, return and
track routing after any device change rather than assuming it survived.

## djay Pro

**The Live input channel shifts with the interface.** With the interface
connected, an input aggregate of interface + BlackHole 16ch is 22 channels and
BlackHole's 1/2 lands at Live's **7/8**. Unplug the interface, the aggregate
collapses to 16 and it moves back to **1/2**. A track left on the wrong one is
silent with no error.

**djay's device list is not scriptable.** Its output device has to be set by
hand in Preferences > Devices.

## sACN / E1.31 and WLED fixtures

**WLED's UDP sync accepts takeover.** `udpn: {send, recv}` defaults to on;
`recv: true` means any device broadcasting WLED sync on port 21324 can drive the
fixture. Turn both off for a fixture that should only follow the rig.

**WLED disables gamma on realtime data by default**
(`arlsDisableGammaCorrection`), so the sender owns gamma. Apply it once, in
float, immediately before quantizing.

**WLED applies master brightness as an 8-bit multiply.** A `bri` of 160 costs
another x0.63 of resolution on top of everything else. Set `bri` to 255 and
scale in float upstream.

**E1.31 universe sync does not work with WLED** - it hard-filters on the data
vectors and drops sync packets at the parser. Leave the sync address at 0.

**Unicast beats multicast on WiFi.** Multicast has no ACKs and goes out at the
basic rate; 5% packet loss is common. WLED itself defaults multicast off.

**DDP is more efficient than E1.31** - one packet with a PUSH flag gives atomic
frames and removes the tearing race between universes. WLED binds port 4048
unconditionally.

## TouchDesigner

**`ratemode` has no "device" option** - only manual, auto, resample. `auto` can
still report the wrong rate against a 48 kHz device. Pin it manually to match.

**A GLSL TOP with no TOP input defaults to 8-bit fixed.** Set the pixel format
explicitly; the value is `rgba16float`, not `16bitfloat`.

**TouchDesigner silently ignores invalid menu values.** Setting a parameter to a
string that is not in its menu leaves the old value with no error. Three
separate bugs in one session came from this. **Always read the parameter back
and compare after writing it.**

**16-bit float removes the implicit 0-1 clamp** that 8-bit fixed provided. Values
above 1.0 will persist and compound in any feedback loop. Clamp explicitly.

**A value added inside a feedback loop settles at `value / blend`.** A 0.004
floor with a 0.12 blend becomes 0.033 - an 8x amplification. Add offsets after
the feedback tap, never inside it.

**`numpyArray(delayed=True)` returns the image current at the previous *call*,**
not the previous frame. Decimating calls stretches the readback delay.

**Pace senders on the frame counter, never a wall clock.** A wall-clock gate
against a 60 fps render locks to whatever multiple clears it and beats against
the animation. `if frame % n: return` is exact.

## Sampling and measurement

**Measure temporal behaviour across consecutive frames.** Sampling every 250 ms
measures the animation, not the flicker, and will point at the wrong cause.

**A camera cannot see flicker.** A 30 fps rolling-shutter webcam reported a rig
as fine while 60 Hz flicker was invisible to it. Cameras are for colour and
framing only.

**`-91 dB` from `volumedetect` is digital silence** and proves nothing upstream
is writing. It is the fastest way to find which stage of a chain is dead.

## Spatial mapping for LED fixtures

**A field feature shorter than one physical run cannot be represented** and
samples as noise. On a frame with 7 pixels per edge, keep the characteristic
wavelength at or above 7 px.

**Gamma belongs once, at the end, in float.** Compositing, decay and sub-pixel
weighting are physical light addition and are only correct in linear.
