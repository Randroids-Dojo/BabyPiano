export type Instrument = 'grand-piano' | 'toy-xylophone'
export type Mode = 'free-play' | 'learn' | 'quiz'

export type RecordedNote = {
  note: string
  time: number
}

export type Song = {
  id: string
  label: string
  notes: string[]
  recording?: RecordedNote[]
  custom?: boolean
}

const STORAGE_KEY = 'babypiano-recordings'

export function loadRecordings(): Song[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecording(song: Song): void {
  const existing = loadRecordings()
  existing.push(song)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function deleteRecording(id: string): void {
  const existing = loadRecordings().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export const BUILT_IN_SONGS: Song[] = [
  {
    id: 'twinkle-twinkle',
    label: 'Twinkle Twinkle Little Star',
    notes: [
      'C', 'C', 'G', 'G', 'A', 'A', 'G',
      'F', 'F', 'E', 'E', 'D', 'D', 'C',
      'G', 'G', 'F', 'F', 'E', 'E', 'D',
      'G', 'G', 'F', 'F', 'E', 'E', 'D',
      'C', 'C', 'G', 'G', 'A', 'A', 'G',
      'F', 'F', 'E', 'E', 'D', 'D', 'C',
    ],
  },
  {
    id: 'mary-had-a-little-lamb',
    label: 'Mary Had a Little Lamb',
    notes: [
      'E', 'D', 'C', 'D',
      'E', 'E', 'E',
      'D', 'D', 'D',
      'E', 'G', 'G',
      'E', 'D', 'C', 'D',
      'E', 'E', 'E', 'E',
      'D', 'D', 'E', 'D',
      'C',
    ],
  },
]

export const plainNote = (note: string) => note.replace(/[0-9]/g, '')

export const isCorrectLearnNote = (note: string, expected: string) => {
  return plainNote(note) === expected
}
