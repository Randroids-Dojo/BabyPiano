import { describe, expect, it } from 'vitest'

import { BUILT_IN_SONGS, isCorrectLearnNote, plainNote } from '@/lib/piano'

describe('piano domain data', () => {
  it('contains both required lullabies', () => {
    const names = BUILT_IN_SONGS.map((song) => song.label)
    expect(names).toContain('Twinkle Twinkle Little Star')
    expect(names).toContain('Mary Had a Little Lamb')
  })

  it('normalizes octave numbers but preserves accidentals in key names', () => {
    expect(plainNote('C4')).toBe('C')
    expect(plainNote('F#4')).toBe('F#')
  })

  it('validates learn mode note matching against plain note names', () => {
    expect(isCorrectLearnNote('C4', 'C')).toBe(true)
    expect(isCorrectLearnNote('G#4', 'G')).toBe(false)
    expect(isCorrectLearnNote('D4', 'C')).toBe(false)
  })
})
