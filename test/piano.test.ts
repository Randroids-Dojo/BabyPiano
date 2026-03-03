import { describe, expect, it } from 'vitest'

import { SONGS, isCorrectLearnNote, plainNote } from '@/lib/piano'

describe('piano domain data', () => {
  it('contains both required lullabies', () => {
    const names = SONGS.map((song) => song.label)
    expect(names).toContain('Twinkle Twinkle Little Star')
    expect(names).toContain('Mary Had a Little Lamb')
  })

  it('normalizes octave and accidental symbols in key names', () => {
    expect(plainNote('C4')).toBe('C')
    expect(plainNote('F#4')).toBe('F')
  })

  it('validates learn mode note matching against plain note names', () => {
    expect(isCorrectLearnNote('C4', 'C')).toBe(true)
    expect(isCorrectLearnNote('G#4', 'G')).toBe(true)
    expect(isCorrectLearnNote('D4', 'C')).toBe(false)
  })
})
