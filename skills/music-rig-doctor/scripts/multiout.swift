// multiout — manage macOS Multi-Output Devices (stacked aggregates) via the CoreAudio HAL.
//
// Subcommands:
//   multiout list
//   multiout create <NewName> <Member1> <Member2> [...] [--master <Member>] [--drift <Member>]...
//   multiout remove <Name>
//
// Safety contract:
//   * `create` is purely additive. It only calls AudioHardwareCreateAggregateDevice with a
//     brand-new UID. It never writes a property on an existing device.
//   * `remove` refuses (exit 3) unless the target's transport type is
//     kAudioDeviceTransportTypeAggregate ('grup'), so hardware can never be destroyed.
//   * Nothing here touches the default input/output device or any nominal sample rate.
//
// Build: /usr/bin/swiftc -O -o multiout multiout.swift

import CoreAudio
import Foundation

// MARK: - Exit codes

let EXIT_OK: Int32 = 0
let EXIT_FAIL: Int32 = 1   // not found / CoreAudio error
let EXIT_USAGE: Int32 = 2  // bad arguments
let EXIT_REFUSED: Int32 = 3 // safety refusal

func die(_ msg: String, _ code: Int32) -> Never {
    FileHandle.standardError.write(Data(("error: " + msg + "\n").utf8))
    exit(code)
}

// MARK: - Property helpers

func address(_ selector: AudioObjectPropertySelector,
             _ scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal)
-> AudioObjectPropertyAddress {
    AudioObjectPropertyAddress(mSelector: selector,
                               mScope: scope,
                               mElement: kAudioObjectPropertyElementMain)
}

func allDeviceIDs() -> [AudioDeviceID] {
    var addr = address(kAudioHardwarePropertyDevices)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size) == noErr else {
        return []
    }
    let count = Int(size) / MemoryLayout<AudioDeviceID>.size
    var ids = [AudioDeviceID](repeating: 0, count: count)
    guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &ids) == noErr else {
        return []
    }
    return ids
}

func cfStringProperty(_ id: AudioObjectID, _ selector: AudioObjectPropertySelector) -> String? {
    var addr = address(selector)
    guard AudioObjectHasProperty(id, &addr) else { return nil }
    var out: CFString? = nil
    var size = UInt32(MemoryLayout<CFString?>.size)
    let status = withUnsafeMutablePointer(to: &out) { ptr -> OSStatus in
        AudioObjectGetPropertyData(id, &addr, 0, nil, &size, ptr)
    }
    guard status == noErr, let s = out else { return nil }
    return s as String
}

func deviceName(_ id: AudioDeviceID) -> String {
    cfStringProperty(id, kAudioObjectPropertyName) ?? "(unnamed \(id))"
}

func deviceUID(_ id: AudioDeviceID) -> String {
    cfStringProperty(id, kAudioDevicePropertyDeviceUID) ?? ""
}

func nominalSampleRate(_ id: AudioDeviceID) -> Double {
    var addr = address(kAudioDevicePropertyNominalSampleRate)
    guard AudioObjectHasProperty(id, &addr) else { return 0 }
    var rate: Double = 0
    var size = UInt32(MemoryLayout<Double>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &rate) == noErr else { return 0 }
    return rate
}

func channelCount(_ id: AudioDeviceID, scope: AudioObjectPropertyScope) -> Int {
    var addr = address(kAudioDevicePropertyStreamConfiguration, scope)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(id, &addr, 0, nil, &size) == noErr, size > 0 else { return 0 }
    let raw = UnsafeMutableRawPointer.allocate(byteCount: Int(size),
                                               alignment: MemoryLayout<AudioBufferList>.alignment)
    defer { raw.deallocate() }
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, raw) == noErr else { return 0 }
    let list = UnsafeMutableAudioBufferListPointer(raw.assumingMemoryBound(to: AudioBufferList.self))
    return list.reduce(0) { $0 + Int($1.mNumberChannels) }
}

func transportType(_ id: AudioDeviceID) -> UInt32 {
    var addr = address(kAudioDevicePropertyTransportType)
    guard AudioObjectHasProperty(id, &addr) else { return 0 }
    var value: UInt32 = 0
    var size = UInt32(MemoryLayout<UInt32>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &value) == noErr else { return 0 }
    return value
}

func fourCC(_ value: UInt32) -> String {
    let bytes = [UInt8((value >> 24) & 0xFF), UInt8((value >> 16) & 0xFF),
                 UInt8((value >> 8) & 0xFF), UInt8(value & 0xFF)]
    let s = String(bytes: bytes, encoding: .ascii) ?? "????"
    return s.allSatisfy { $0.isASCII && !$0.isNewline } ? s : "????"
}

func isAggregate(_ id: AudioDeviceID) -> Bool {
    transportType(id) == kAudioDeviceTransportTypeAggregate
}

/// The aggregate's composition dictionary, if it has one. Read-only.
func composition(_ id: AudioDeviceID) -> [String: Any]? {
    var addr = address(kAudioAggregateDevicePropertyComposition)
    guard AudioObjectHasProperty(id, &addr) else { return nil }
    var out: CFDictionary? = nil
    var size = UInt32(MemoryLayout<CFDictionary?>.size)
    let status = withUnsafeMutablePointer(to: &out) { ptr -> OSStatus in
        AudioObjectGetPropertyData(id, &addr, 0, nil, &size, ptr)
    }
    guard status == noErr, let dict = out as? [String: Any] else { return nil }
    return dict
}

func isStacked(_ id: AudioDeviceID) -> Bool {
    guard let comp = composition(id) else { return false }
    if let n = comp[kAudioAggregateDeviceIsStackedKey] as? NSNumber { return n.intValue != 0 }
    return false
}

// MARK: - Name matching (UTF-8 / Unicode safe)

/// Swift's `==` on String already compares by Unicode canonical equivalence, so a name typed
/// as NFD on the command line matches a device reporting NFC (and vice versa). The explicit
/// NFC pass below is a belt-and-braces fallback for compatibility-equivalence oddities.
func namesMatch(_ a: String, _ b: String) -> Bool {
    if a == b { return true }
    return a.precomposedStringWithCanonicalMapping == b.precomposedStringWithCanonicalMapping
}

/// Resolve a human-readable device name to exactly one device. Ambiguity is an error, never a guess.
func resolveDevice(named name: String) -> AudioDeviceID {
    let matches = allDeviceIDs().filter { namesMatch(deviceName($0), name) }
    switch matches.count {
    case 0:  die("no audio device named \"\(name)\"", EXIT_FAIL)
    case 1:  return matches[0]
    default: die("device name \"\(name)\" is ambiguous (\(matches.count) devices match); refusing to guess", EXIT_FAIL)
    }
}

// MARK: - list

func cmdList() {
    let ids = allDeviceIDs()
    let rows: [(String, String, String, String, String)] = ids.map { id in
        let agg = isAggregate(id)
        let kind: String
        if agg {
            kind = isStacked(id) ? "aggregate(stacked/multi-output)" : "aggregate"
        } else {
            kind = "device[\(fourCC(transportType(id)))]"
        }
        return (deviceName(id),
                deviceUID(id),
                String(channelCount(id, scope: kAudioObjectPropertyScopeOutput)),
                nominalSampleRate(id) > 0 ? String(Int(nominalSampleRate(id))) : "-",
                kind)
    }

    let header = ("NAME", "UID", "OUT", "RATE", "KIND")
    func width(_ pick: ((String, String, String, String, String)) -> String) -> Int {
        max(pick(header).count, rows.map { pick($0).count }.max() ?? 0)
    }
    let w0 = width { $0.0 }, w1 = width { $0.1 }, w2 = max(3, width { $0.2 }), w3 = max(4, width { $0.3 })

    func pad(_ s: String, _ n: Int) -> String {
        s + String(repeating: " ", count: max(0, n - s.count))
    }
    func padLeft(_ s: String, _ n: Int) -> String {
        String(repeating: " ", count: max(0, n - s.count)) + s
    }

    print("\(pad(header.0, w0))  \(pad(header.1, w1))  \(padLeft(header.2, w2))  \(padLeft(header.3, w3))  \(header.4)")
    print(String(repeating: "-", count: w0 + w1 + w2 + w3 + 8 + 5))
    for r in rows {
        print("\(pad(r.0, w0))  \(pad(r.1, w1))  \(padLeft(r.2, w2))  \(padLeft(r.3, w3))  \(r.4)")
    }
    print("\n\(rows.count) device(s). Output channel counts are the Output-scope stream configuration.")
}

// MARK: - create

func cmdCreate(_ argv: [String]) {
    var newName: String? = nil
    var memberNames: [String] = []
    var masterName: String? = nil
    var driftNames: [String] = []

    var i = 0
    while i < argv.count {
        let a = argv[i]
        switch a {
        case "--master":
            guard i + 1 < argv.count else { die("--master needs a member device name", EXIT_USAGE) }
            if masterName != nil { die("--master given more than once", EXIT_USAGE) }
            masterName = argv[i + 1]; i += 2
        case "--drift":
            guard i + 1 < argv.count else { die("--drift needs a member device name", EXIT_USAGE) }
            driftNames.append(argv[i + 1]); i += 2
        default:
            if a.hasPrefix("--") { die("unknown flag \(a)", EXIT_USAGE) }
            if newName == nil { newName = a } else { memberNames.append(a) }
            i += 1
        }
    }

    guard let name = newName, !name.isEmpty else { die("missing <NewName>", EXIT_USAGE) }
    guard !memberNames.isEmpty else { die("need at least one member device name", EXIT_USAGE) }

    // Refuse to reuse an existing device name — keeps `remove <Name>` unambiguous later.
    if allDeviceIDs().contains(where: { namesMatch(deviceName($0), name) }) {
        die("an audio device named \"\(name)\" already exists; refusing to create a duplicate", EXIT_REFUSED)
    }

    // Resolve every member to a UID up front. Nothing is created unless all of them resolve.
    var memberUIDs: [(name: String, uid: String)] = []
    var seenUIDs = Set<String>()
    for m in memberNames {
        let id = resolveDevice(named: m)
        let uid = deviceUID(id)
        if uid.isEmpty { die("device \"\(m)\" has no UID; cannot use it as a member", EXIT_FAIL) }
        if !seenUIDs.insert(uid).inserted { die("device \"\(m)\" listed twice", EXIT_USAGE) }
        memberUIDs.append((m, uid))
    }

    // Master defaults to the first member.
    let masterMemberName = masterName ?? memberUIDs[0].name
    guard let master = memberUIDs.first(where: { namesMatch($0.name, masterMemberName) }) else {
        die("--master \"\(masterMemberName)\" is not one of the listed member devices", EXIT_USAGE)
    }

    var driftUIDs = Set<String>()
    for d in driftNames {
        guard let hit = memberUIDs.first(where: { namesMatch($0.name, d) }) else {
            die("--drift \"\(d)\" is not one of the listed member devices", EXIT_USAGE)
        }
        driftUIDs.insert(hit.uid)
    }

    let subDevices: [[String: Any]] = memberUIDs.map { m in
        [kAudioSubDeviceUIDKey: m.uid,
         kAudioSubDeviceDriftCompensationKey: driftUIDs.contains(m.uid) ? 1 : 0]
    }

    // A fresh random UID guarantees we can never collide with (and therefore never mutate)
    // an existing or previously-persisted aggregate.
    let aggregateUID = "com.anshul.multiout." + UUID().uuidString
    if allDeviceIDs().contains(where: { deviceUID($0) == aggregateUID }) {
        die("generated UID already in use; re-run", EXIT_FAIL)
    }

    let description: [String: Any] = [
        kAudioAggregateDeviceNameKey: name,
        kAudioAggregateDeviceUIDKey: aggregateUID,
        kAudioAggregateDeviceSubDeviceListKey: subDevices,
        kAudioAggregateDeviceMasterSubDeviceKey: master.uid,  // clock source ("master")
        kAudioAggregateDeviceIsStackedKey: 1,                 // 1 = Multi-Output Device
        kAudioAggregateDeviceIsPrivateKey: 0,                 // visible in Audio MIDI Setup
    ]

    var newID: AudioDeviceID = 0
    let status = AudioHardwareCreateAggregateDevice(description as CFDictionary, &newID)
    guard status == noErr, newID != 0 else {
        die("AudioHardwareCreateAggregateDevice failed (status \(status) '\(fourCC(UInt32(bitPattern: status)))')", EXIT_FAIL)
    }

    // The HAL publishes sub-devices asynchronously; give it a beat before reading back.
    usleep(400_000)

    print("Created Multi-Output Device")
    print("  name:    \(deviceName(newID))")
    print("  UID:     \(deviceUID(newID))")
    print("  id:      \(newID)")
    print("  stacked: \(isStacked(newID) ? "yes" : "no")")
    print("  out ch:  \(channelCount(newID, scope: kAudioObjectPropertyScopeOutput))")
    print("  master:  \(master.name) (\(master.uid))")
    for m in memberUIDs {
        print("  member:  \(m.name)  drift=\(driftUIDs.contains(m.uid) ? "on" : "off")")
    }
}

// MARK: - remove

func cmdRemove(_ argv: [String]) {
    guard argv.count == 1, !argv[0].isEmpty else { die("usage: multiout remove <Name>", EXIT_USAGE) }
    let name = argv[0]

    let id = resolveDevice(named: name)

    // Safety gate: only 'grup' transport devices may be destroyed.
    let transport = transportType(id)
    guard transport == kAudioDeviceTransportTypeAggregate else {
        die("\"\(name)\" is NOT an aggregate device (transport '\(fourCC(transport))'). Refusing to destroy it.",
            EXIT_REFUSED)
    }

    let uid = deviceUID(id)
    let status = AudioHardwareDestroyAggregateDevice(id)
    guard status == noErr else {
        die("AudioHardwareDestroyAggregateDevice failed (status \(status) '\(fourCC(UInt32(bitPattern: status)))')", EXIT_FAIL)
    }

    usleep(400_000)
    if allDeviceIDs().contains(where: { namesMatch(deviceName($0), name) }) {
        die("destroy reported success but \"\(name)\" is still present", EXIT_FAIL)
    }
    print("Removed aggregate device \"\(name)\" (UID \(uid))")
}

// MARK: - main

let usage = """
multiout — manage macOS Multi-Output Devices (stacked aggregates)

  multiout list
      Print every audio device: name, UID, output channels, sample rate, aggregate/stacked.

  multiout create <NewName> <Member1> <Member2> [...] [--master <Member>] [--drift <Member>]...
      Create a Multi-Output Device from the named members. --master picks the clock device
      (default: first member). --drift enables drift compensation on that member; repeatable.

  multiout remove <Name>
      Destroy an aggregate device by name. Refuses (exit 3) if it is not an aggregate.

Exit codes: 0 ok, 1 failure, 2 usage, 3 safety refusal.
"""

let args = Array(CommandLine.arguments.dropFirst())
guard let sub = args.first else {
    print(usage)
    exit(EXIT_USAGE)
}
let rest = Array(args.dropFirst())

switch sub {
case "list":            cmdList()
case "create":          cmdCreate(rest)
case "remove":          cmdRemove(rest)
case "-h", "--help", "help": print(usage)
default:
    die("unknown subcommand \"\(sub)\"\n\n" + usage, EXIT_USAGE)
}
