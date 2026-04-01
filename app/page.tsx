'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { UpdateBanner } from '@/components/UpdateBanner'
import { useVersionUpgradeNotification } from '@/hooks/useVersionUpgradeNotification'

import {
  BUILT_IN_SONGS,
  isCorrectLearnNote,
  plainNote,
  loadRecordings,
  saveRecording,
  deleteRecording,
  type Instrument,
  type Mode,
  type RecordedNote,
  type Song,
} from '@/lib/piano'

type PlayingVoice = {
  stop: () => void
}

const KEYS = [
  { note: 'C4', type: 'white', left: 0 },
  { note: 'C#4', type: 'black', left: 14.3 },
  { note: 'D4', type: 'white', left: 14.3 },
  { note: 'D#4', type: 'black', left: 28.6 },
  { note: 'E4', type: 'white', left: 28.6 },
  { note: 'F4', type: 'white', left: 42.9 },
  { note: 'F#4', type: 'black', left: 57.1 },
  { note: 'G4', type: 'white', left: 57.2 },
  { note: 'G#4', type: 'black', left: 71.4 },
  { note: 'A4', type: 'white', left: 71.5 },
  { note: 'A#4', type: 'black', left: 85.7 },
  { note: 'B4', type: 'white', left: 85.8 },
] as const

const FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  'C#4': 277.18,
  D4: 293.66,
  'D#4': 311.13,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99,
  G4: 392,
  'G#4': 415.3,
  A4: 440,
  'A#4': 466.16,
  B4: 493.88,
}


export default function HomePage() {
  const versionStale = useVersionUpgradeNotification()
  const [instrument, setInstrument] = useState<Instrument>('grand-piano')
  const [mode, setMode] = useState<Mode>('free-play')
  const [songId, setSongId] = useState<string>(BUILT_IN_SONGS[0].id)
  const [stepIndex, setStepIndex] = useState(0)
  const [songComplete, setSongComplete] = useState(false)
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())
  const [portrait, setPortrait] = useState(false)
  const [wrongNotes, setWrongNotes] = useState<Set<string>>(new Set())
  const [uiHidden, setUiHidden] = useState(false)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [customSongs, setCustomSongs] = useState<Song[]>([])
  const recordingRef = useRef<RecordedNote[]>([])
  const recordStartRef = useRef<number>(0)
  const playbackTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const audioContextRef = useRef<AudioContext | null>(null)
  const voicesRef = useRef<Map<string, PlayingVoice[]>>(new Map())
  const pointerMapRef = useRef<Map<number, string>>(new Map())
  const wrongTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load custom songs from localStorage on mount
  useEffect(() => {
    setCustomSongs(loadRecordings())
  }, [])

  const allSongs = useMemo(() => [...BUILT_IN_SONGS, ...customSongs], [customSongs])
  const song = useMemo(() => allSongs.find((item) => item.id === songId) ?? BUILT_IN_SONGS[0], [allSongs, songId])
  const isLearning = (mode === 'learn' || mode === 'quiz') && !songComplete
  const nextRequired = isLearning ? song.notes[stepIndex] : null

  useEffect(() => {
    const media = window.matchMedia('(orientation: portrait)')
    const update = () => setPortrait(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    setUiHidden(false)
    idleTimerRef.current = setTimeout(() => setUiHidden(true), 5000)
  }, [])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdleTimer])

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext()
    }
    return audioContextRef.current
  }, [])

  const playErrorSfx = useCallback(() => {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.21)
  }, [getAudioContext])

  const playNote = useCallback((note: string) => {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const frequency = FREQUENCIES[note]

    const gain = ctx.createGain()
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()

    if (instrument === 'grand-piano') {
      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc2.detune.value = 6
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    } else {
      osc1.type = 'square'
      osc2.type = 'sine'
      osc2.detune.value = 12
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    }

    osc1.frequency.value = frequency
    osc2.frequency.value = frequency * 2

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)

    const stop = () => {
      const release = ctx.currentTime
      gain.gain.cancelScheduledValues(release)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), release)
      gain.gain.exponentialRampToValueAtTime(0.0001, release + 0.12)
      osc1.stop(release + 0.13)
      osc2.stop(release + 0.13)
    }

    const existing = voicesRef.current.get(note) ?? []
    voicesRef.current.set(note, [...existing, { stop }])
  }, [getAudioContext, instrument])

  const stopNote = useCallback((note: string) => {
    const voices = voicesRef.current.get(note)
    if (!voices || voices.length === 0) return
    const [voice, ...rest] = voices
    voice.stop()
    voicesRef.current.set(note, rest)
  }, [])

  const flashWrong = useCallback((note: string) => {
    const existing = wrongTimersRef.current.get(note)
    if (existing) clearTimeout(existing)
    setWrongNotes((prev) => new Set(prev).add(note))
    const timer = setTimeout(() => {
      setWrongNotes((prev) => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
      wrongTimersRef.current.delete(note)
    }, 400)
    wrongTimersRef.current.set(note, timer)
  }, [])

  // Recording controls
  const startRecording = useCallback(() => {
    recordingRef.current = []
    recordStartRef.current = Date.now()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    const recorded = recordingRef.current
    if (recorded.length < 2) return // need at least 2 notes

    const id = `recording-${Date.now()}`
    const notes = recorded.map((r) => plainNote(r.note))
    const newSong: Song = {
      id,
      label: `My Song ${customSongs.length + 1}`,
      notes,
      recording: recorded,
      custom: true,
    }
    saveRecording(newSong)
    setCustomSongs(loadRecordings())
    setSongId(id)
    setMode('free-play')
  }, [customSongs.length])

  const handleDeleteRecording = useCallback((id: string) => {
    deleteRecording(id)
    setCustomSongs(loadRecordings())
    if (songId === id) {
      setSongId(BUILT_IN_SONGS[0].id)
    }
  }, [songId])

  // Playback
  const stopPlayback = useCallback(() => {
    playbackTimersRef.current.forEach(clearTimeout)
    playbackTimersRef.current = []
    setIsPlaying(false)
    setActiveNotes(new Set())
  }, [])

  const startPlayback = useCallback(() => {
    const currentSong = allSongs.find((s) => s.id === songId)
    if (!currentSong?.recording) return

    stopPlayback()
    setIsPlaying(true)

    const timers: ReturnType<typeof setTimeout>[] = []
    currentSong.recording.forEach((entry) => {
      const timer = setTimeout(() => {
        playNote(entry.note)
        setActiveNotes((prev) => new Set(prev).add(entry.note))
        // Auto-release after 300ms
        const releaseTimer = setTimeout(() => {
          stopNote(entry.note)
          setActiveNotes((prev) => {
            const next = new Set(prev)
            next.delete(entry.note)
            return next
          })
        }, 300)
        timers.push(releaseTimer)
      }, entry.time)
      timers.push(timer)
    })

    // End playback after last note + 500ms
    const lastTime = currentSong.recording[currentSong.recording.length - 1].time
    const endTimer = setTimeout(() => {
      setIsPlaying(false)
      setActiveNotes(new Set())
    }, lastTime + 500)
    timers.push(endTimer)

    playbackTimersRef.current = timers
  }, [allSongs, songId, playNote, stopNote, stopPlayback])

  // Clean up playback timers on unmount
  useEffect(() => {
    return () => {
      playbackTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  const handleNoteDown = useCallback((note: string, pointerId: number) => {
    if (isPlaying) return // don't interfere with playback

    resetIdleTimer()
    void getAudioContext().resume()

    const existing = pointerMapRef.current.get(pointerId)
    if (existing) {
      stopNote(existing)
    }

    pointerMapRef.current.set(pointerId, note)
    setActiveNotes((prev) => new Set(prev).add(note))

    // Record the note if recording
    if (isRecording) {
      recordingRef.current.push({
        note,
        time: Date.now() - recordStartRef.current,
      })
    }

    if (mode === 'quiz' && nextRequired) {
      if (isCorrectLearnNote(note, nextRequired)) {
        playNote(note)
        const next = stepIndex + 1
        if (next >= song.notes.length) {
          setSongComplete(true)
        } else {
          setStepIndex(next)
        }
      } else {
        playErrorSfx()
        flashWrong(note)
      }
    } else {
      playNote(note)
      if (mode === 'learn' && nextRequired) {
        if (isCorrectLearnNote(note, nextRequired)) {
          const next = stepIndex + 1
          if (next >= song.notes.length) {
            setSongComplete(true)
          } else {
            setStepIndex(next)
          }
        }
      }
    }
  }, [isPlaying, isRecording, resetIdleTimer, getAudioContext, mode, nextRequired, playNote, playErrorSfx, flashWrong, song.notes.length, stepIndex, stopNote])

  const handlePointerRelease = useCallback((pointerId: number) => {
    const note = pointerMapRef.current.get(pointerId)
    if (!note) return

    pointerMapRef.current.delete(pointerId)
    setActiveNotes((prev) => {
      const next = new Set(prev)
      next.delete(note)
      return next
    })
    stopNote(note)
  }, [stopNote])

  const restartSong = useCallback(() => {
    setStepIndex(0)
    setSongComplete(false)
    setWrongNotes(new Set())
  }, [])

  useEffect(() => {
    restartSong()
  }, [songId, restartSong])

  const showSongControls = mode === 'learn' || mode === 'quiz'
  const currentSongHasRecording = song.recording != null

  const getWhiteKeyBg = (note: string, active: boolean) => {
    if (wrongNotes.has(note)) return '#fca5a5'
    if (active) return '#fdba74'
    if (mode === 'learn' && nextRequired === plainNote(note)) return '#bbf7d0'
    return '#f8fafc'
  }

  const getBlackKeyBg = (note: string, active: boolean) => {
    if (wrongNotes.has(note)) return '#ef4444'
    if (active) return '#fb7185'
    if (mode === 'learn' && nextRequired === plainNote(note)) return '#22c55e'
    return '#111827'
  }

  return (
    <main
      style={{ minHeight: '100dvh', background: '#0f172a', color: '#e2e8f0', padding: uiHidden ? 0 : 12 }}
      onPointerDown={uiHidden ? (e) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-piano-keyboard]')) {
          resetIdleTimer()
        }
      } : undefined}
    >
      {versionStale && <UpdateBanner />}
      {portrait ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '90dvh', textAlign: 'center' }}>
          <h1>Please rotate to landscape</h1>
          <p>Baby Piano is optimized for landscape on mobile and tablets.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: uiHidden ? 0 : 12, maxWidth: uiHidden ? undefined : 960, margin: '0 auto', height: uiHidden ? '100dvh' : undefined }}>
          {!uiHidden && (
            <>
              <h1 style={{ margin: 0, fontSize: 24 }}>Baby Piano</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
                  <option value="grand-piano">Grand Piano</option>
                  <option value="toy-xylophone">Toy Xylophone</option>
                </select>
                <button onClick={() => setMode('free-play')} style={{ fontWeight: mode === 'free-play' ? 700 : 400 }}>Free Play</button>
                <button onClick={() => setMode('learn')} style={{ fontWeight: mode === 'learn' ? 700 : 400 }}>Learn Mode</button>
                <button onClick={() => setMode('quiz')} style={{ fontWeight: mode === 'quiz' ? 700 : 400 }}>Quiz Mode</button>
                {showSongControls && (
                  <>
                    <select value={songId} onChange={(e) => setSongId(e.target.value)}>
                      <optgroup label="Built-in Songs">
                        {BUILT_IN_SONGS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </optgroup>
                      {customSongs.length > 0 && (
                        <optgroup label="My Recordings">
                          {customSongs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </optgroup>
                      )}
                    </select>
                    <button onClick={restartSong}>Restart Song</button>
                    {song.custom && (
                      <button
                        onClick={() => handleDeleteRecording(song.id)}
                        style={{ color: '#fca5a5', fontSize: 12 }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Recording & Playback controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {mode === 'free-play' && !isPlaying && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      background: isRecording ? '#ef4444' : '#1e293b',
                      color: '#e2e8f0',
                      border: isRecording ? '2px solid #f87171' : '1px solid #475569',
                      borderRadius: 20,
                      padding: '4px 14px',
                      fontSize: 14,
                      fontWeight: isRecording ? 700 : 400,
                      animation: isRecording ? 'pulse 1.5s infinite' : undefined,
                    }}
                  >
                    {isRecording ? '⏹ Stop & Save' : '⏺ Record'}
                  </button>
                )}
                {mode === 'free-play' && currentSongHasRecording && !isRecording && (
                  <button
                    onClick={isPlaying ? stopPlayback : startPlayback}
                    style={{
                      background: isPlaying ? '#f59e0b' : '#1e293b',
                      color: '#e2e8f0',
                      border: '1px solid #475569',
                      borderRadius: 20,
                      padding: '4px 14px',
                      fontSize: 14,
                    }}
                  >
                    {isPlaying ? '⏹ Stop' : '▶ Play Back'}
                  </button>
                )}
                {mode === 'free-play' && !isRecording && !isPlaying && customSongs.length > 0 && (
                  <select
                    value={songId}
                    onChange={(e) => setSongId(e.target.value)}
                    style={{ fontSize: 13 }}
                  >
                    <option value="">Select a recording...</option>
                    {customSongs.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                )}
                {isRecording && (
                  <span style={{ fontSize: 13, color: '#f87171' }}>
                    Recording... play some notes!
                  </span>
                )}
              </div>

              {showSongControls && (
                <div style={{ fontSize: 14 }}>
                  {songComplete
                    ? `Great job! You completed ${song.label}.`
                    : mode === 'quiz'
                      ? `Find the key: ${nextRequired}`
                      : `Next key: ${nextRequired}`}
                </div>
              )}
            </>
          )}

          <div data-piano-keyboard style={{ position: 'relative', height: uiHidden ? '100dvh' : '58dvh', maxHeight: uiHidden ? undefined : 380, minHeight: 220, userSelect: 'none', touchAction: 'none', flex: uiHidden ? 1 : undefined }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', borderRadius: uiHidden ? 0 : 10, overflow: 'hidden', border: uiHidden ? 'none' : '2px solid #cbd5e1' }}>
              {KEYS.filter((key) => key.type === 'white').map((key) => {
                const active = activeNotes.has(key.note)
                return (
                  <button
                    key={key.note}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      handleNoteDown(key.note, e.pointerId)
                    }}
                    onPointerUp={(e) => handlePointerRelease(e.pointerId)}
                    onPointerCancel={(e) => handlePointerRelease(e.pointerId)}
                    style={{
                      flex: 1,
                      border: '1px solid #94a3b8',
                      background: getWhiteKeyBg(key.note, active),
                      color: '#0f172a',
                      transition: wrongNotes.has(key.note) ? 'none' : 'background 0.3s',
                    }}
                  >
                    {mode !== 'quiz' ? plainNote(key.note) : ''}
                  </button>
                )
              })}
            </div>

            {KEYS.filter((key) => key.type === 'black').map((key) => {
              const active = activeNotes.has(key.note)
              return (
                <button
                  key={key.note}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    handleNoteDown(key.note, e.pointerId)
                  }}
                  onPointerUp={(e) => handlePointerRelease(e.pointerId)}
                  onPointerCancel={(e) => handlePointerRelease(e.pointerId)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${key.left}%`,
                    width: '8.5%',
                    height: '58%',
                    transform: 'translateX(-50%)',
                    border: '1px solid #0f172a',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    background: getBlackKeyBg(key.note, active),
                    color: '#f8fafc',
                    transition: wrongNotes.has(key.note) ? 'none' : 'background 0.3s',
                  }}
                >
                  {mode !== 'quiz' ? plainNote(key.note) : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </main>
  )
}
