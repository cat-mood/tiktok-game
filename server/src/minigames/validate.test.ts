import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { GAME_TYPES, TASK_DIFFICULTIES } from '@brainrot/shared'
import { PUZZLES, puzzlesFor } from './catalog.js'
import { answersMatch, normalizeText } from './validate.js'

describe('minigame validation', () => {
  it('ignores case and edge spaces but keeps inner spaces', () => {
    assert.equal(normalizeText('  сними видео  '), 'СНИМИ ВИДЕО')
    assert.equal(answersMatch('СНИМИ ВИДЕО', '  сними видео  '), true)
    assert.equal(answersMatch('СНИМИ ВИДЕО', 'СНИМИ  ВИДЕО'), false)
    assert.equal(answersMatch('10', 10), true)
    assert.equal(answersMatch('10', '10'), true)
  })

  it('requires exact card order and rejects extras', () => {
    const expected = ['a', 'b', 'c']
    assert.equal(answersMatch(expected, ['a', 'b', 'c']), true)
    assert.equal(answersMatch(expected, ['a', 'c', 'b']), false)
    assert.equal(answersMatch(expected, ['a', 'b', 'c', 'x1']), false)
    assert.equal(answersMatch(expected, ['a', 'b']), false)
    assert.equal(answersMatch(expected, 'a,b,c'), false)
  })

  it('has at least two puzzles for every development type and difficulty', () => {
    const ids = new Set<string>()
    for (const puzzle of PUZZLES) {
      assert.equal(ids.has(puzzle.id), false, `duplicate id ${puzzle.id}`)
      ids.add(puzzle.id)
    }
    for (const gameType of GAME_TYPES) {
      for (const difficulty of TASK_DIFFICULTIES) {
        const pool = puzzlesFor(gameType, difficulty)
        assert.ok(pool.length >= 2, `${gameType} ${difficulty} has ${pool.length}`)
      }
    }
  })
})
