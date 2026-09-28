// setoutput — read or set the macOS default OUTPUT device by name.
//   setoutput get
//   setoutput set "<device name>"
// Exits: 0 ok · 1 not found / CoreAudio error · 2 usage
import Foundation
import CoreAudio

func devices() -> [AudioDeviceID] {
    var addr = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size) == noErr
    else { return [] }
    var ids = [AudioDeviceID](repeating: 0, count: Int(size) / MemoryLayout<AudioDeviceID>.size)
    guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &ids) == noErr
    else { return [] }
    return ids
}

func name(_ id: AudioDeviceID) -> String {
    var addr = AudioObjectPropertyAddress(
        mSelector: kAudioObjectPropertyName,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain)
    var cf: CFString = "" as CFString
    var size = UInt32(MemoryLayout<CFString>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &cf) == noErr else { return "" }
    return cf as String
}

func outputChannels(_ id: AudioDeviceID) -> Int {
    var addr = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyStreamConfiguration,
        mScope: kAudioDevicePropertyScopeOutput,
        mElement: kAudioObjectPropertyElementMain)
    var size: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(id, &addr, 0, nil, &size) == noErr, size > 0 else { return 0 }
    let buf = UnsafeMutableRawPointer.allocate(byteCount: Int(size), alignment: 16)
    defer { buf.deallocate() }
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, buf) == noErr else { return 0 }
    let list = buf.assumingMemoryBound(to: AudioBufferList.self)
    return UnsafeMutableAudioBufferListPointer(list).reduce(0) { $0 + Int($1.mNumberChannels) }
}

func currentDefault() -> AudioDeviceID {
    var addr = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDefaultOutputDevice,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain)
    var id: AudioDeviceID = 0
    var size = UInt32(MemoryLayout<AudioDeviceID>.size)
    AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &id)
    return id
}

func setDefault(_ id: AudioDeviceID, selector: AudioObjectPropertySelector) -> Bool {
    var addr = AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain)
    var v = id
    return AudioObjectSetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil,
                                      UInt32(MemoryLayout<AudioDeviceID>.size), &v) == noErr
}

let args = Array(CommandLine.arguments.dropFirst())
guard let cmd = args.first else {
    FileHandle.standardError.write("usage: setoutput get | set \"<name>\"\n".data(using: .utf8)!)
    exit(2)
}

switch cmd {
case "get":
    let d = currentDefault()
    print("\(name(d))")
case "set":
    guard args.count >= 2 else {
        FileHandle.standardError.write("usage: setoutput set \"<name>\"\n".data(using: .utf8)!); exit(2)
    }
    let want = args[1]
    let match = devices().first {
        let n = name($0)
        return (n == want || n.precomposedStringWithCanonicalMapping == want.precomposedStringWithCanonicalMapping)
            && outputChannels($0) > 0
    }
    guard let id = match else {
        FileHandle.standardError.write("no output device named \"\(want)\"\n".data(using: .utf8)!); exit(1)
    }
    let before = name(currentDefault())
    let ok  = setDefault(id, selector: kAudioHardwarePropertyDefaultOutputDevice)
    let ok2 = setDefault(id, selector: kAudioHardwarePropertyDefaultSystemOutputDevice)
    usleep(300_000)
    print("default output: \"\(before)\" -> \"\(name(currentDefault()))\"  (output:\(ok) system:\(ok2))")
    exit(name(currentDefault()) == name(id) ? 0 : 1)
default:
    FileHandle.standardError.write("usage: setoutput get | set \"<name>\"\n".data(using: .utf8)!); exit(2)
}
