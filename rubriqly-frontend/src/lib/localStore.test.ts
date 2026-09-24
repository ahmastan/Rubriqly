import { describe, expect, it } from 'vitest'
import { loadData, saveData, setStorageUser, updateData } from './localStore'

describe('localStore', () => {
  it('keeps each account’s drafts separate', () => {
    setStorageUser('usr_a')
    updateData((data) => {
      data.rubrics.push({ id: 'mine' } as never)
    })
    setStorageUser('usr_b')
    expect(loadData().rubrics).toEqual([])
    setStorageUser('usr_a')
    expect(loadData().rubrics).toHaveLength(1)
    expect(localStorage.getItem('rubriqly:v1:usr_a')).not.toBeNull()
  })

  it('gives drafts saved before accounts existed to the first account that signs in', () => {
    setStorageUser(null)
    const old = { assignments: [], drafts: [], checks: [], rubrics: [{ id: 'old' }] }
    localStorage.setItem('rubriqly:v1', JSON.stringify(old))

    setStorageUser('usr_first')
    expect(loadData().rubrics).toEqual([{ id: 'old' }])
    expect(localStorage.getItem('rubriqly:v1')).toBeNull()

    setStorageUser('usr_second')
    expect(loadData().rubrics).toEqual([])
  })

  it('stores nothing while signed out', () => {
    setStorageUser(null)
    expect(loadData().checks).toEqual([])
    expect(() => saveData(loadData())).toThrow(/Sign in/)
  })
})
